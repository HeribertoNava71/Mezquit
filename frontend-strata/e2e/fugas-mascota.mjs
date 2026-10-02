// Prueba de fugas de la mascota de la home (Fase 6). Criterios de salida en
// docs/rediseno/decisiones.md, «Fase 6», y en PROMPT_CLAUDE_CODE.md, «Mascota (inicio)».
//
// Uso, desde frontend-strata y con el sitio en modo desarrollo (window.__stGsap solo existe
// con import.meta.env.DEV, así que no sirve con vite preview):
//   npx vite --port 5186 --strictPort
//   node e2e/fugas-mascota.mjs [--url http://localhost:5186] [--ciclos 20] [--solo fugas|reducido|titular]
//
// Responde /api/* y /sanctum/* con e2e/mocks/visitante.json (sin backend) y usa el Chromium
// de Playwright. Son tres pruebas:
//
//  1. fugas. Entra y sale de «/» N veces (/pruebas → / → /pruebas) con los enlaces de la
//     barra, sin recargar la página. En los ciclos impares espera a que la mascota nade, la
//     hace correr (clic en el selector «Para mí / Para mi empresa») y brincar con su burbuja
//     (clic en ella) y sale; en los pares sale antes de que entre en escena (temporizador
//     de 6 s pendiente). Ya en /pruebas comprueba que no queda nada vivo:
//       - window.__stGsap.globalTimeline.getChildren(true, true, true) vacío;
//       - window.__stGsap.ticker._listeners con un solo callback (Timeline.updateRoot de GSAP);
//       - los listeners de window y document (CDP, DOMDebugger.getEventListeners), iguales a
//         los de antes de la primera visita;
//       - ningún temporizador de 1 s o más pendiente (setTimeout envuelto antes de cargar la app);
//       - ningún .st-mascota en el DOM.
//     Además, el número de animaciones vivas en la home no crece de un ciclo a otro.
//  2. reducido. Con prefers-reduced-motion la mascota no se monta, GSAP no se descarga y no
//     queda ninguna animación corriendo en la home. Si la preferencia se quita con la página
//     abierta, la mascota se monta y nada; si vuelve, se desmonta sin dejar nada vivo.
//  3. titular. A 360 × 800 y sin desplazar la página, la mascota da su vuelta: sobre el H1
//     (ampliado ±70/±50 px, como vigilarTitular) su opacidad baja a .26, y fuera vuelve a .8.
//
// En las tres, la consola no debe tener errores ni advertencias. El único error aceptado es el
// 401 de GET /api/user (visitante sin sesión), que Chromium anota como recurso fallido.
// Termina con código 1 si algo falla.

import { chromium } from '@playwright/test'
import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { crearBuscador, instalarMocks } from '../scripts/captura.mjs'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const MOCKS = path.join(RAIZ, 'e2e', 'mocks', 'visitante.json')
const SALIDA = path.join(RAIZ, '.capturas')
const PRUEBAS = ['fugas', 'reducido', 'titular']

/** Espera de entrada de la mascota (motor.ts, RETARDO_ENTRADA_MS) más la entrada (1.6–3.2 s). */
const HASTA_QUE_NADE_MS = 20_000
/** Opacidades de motor.ts (OPACIDAD_TITULAR y OPACIDAD_NADO). */
const OPACIDAD_TITULAR = 0.26
const OPACIDAD_NADO = 0.8
/** Tramo mínimo dentro o fuera del titular para exigir la opacidad final: 500 ms de medición + 700 ms de tween. */
const TRAMO_ESTABLE_MS = 1500

function leerArgumentos(argv) {
  const opciones = { url: 'http://localhost:5186', ciclos: 20, solo: null }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--url') opciones.url = String(argv[++i] ?? '').replace(/\/+$/, '')
    else if (arg === '--ciclos') opciones.ciclos = Number(argv[++i])
    else if (arg === '--solo') opciones.solo = argv[++i]
    else {
      console.error(`Opción desconocida: ${arg}\nUso: node e2e/fugas-mascota.mjs [--url URL] [--ciclos N] [--solo ${PRUEBAS.join('|')}]`)
      process.exit(1)
    }
  }
  if (!/^https?:\/\//.test(opciones.url)) throw new Error(`URL no válida: ${opciones.url}`)
  if (!Number.isInteger(opciones.ciclos) || opciones.ciclos < 1) throw new Error('--ciclos debe ser un entero de 1 o más.')
  if (opciones.solo && !PRUEBAS.includes(opciones.solo)) throw new Error(`--solo admite ${PRUEBAS.join(', ')}.`)
  return opciones
}

/**
 * Se inyecta antes de cargar la app: lleva la cuenta de los setTimeout de 1 s o más que siguen
 * pendientes (la entrada de 6 s, la burbuja de 5.4 s…). Los demás pasan sin cambios.
 */
function rastrearTemporizadores() {
  const pendientes = new Map()
  const programar = window.setTimeout
  const cancelar = window.clearTimeout
  window.setTimeout = function (callback, demora, ...args) {
    if (typeof callback !== 'function') return programar.call(window, callback, demora, ...args)
    const id = programar.call(
      window,
      function (...valores) {
        pendientes.delete(id)
        return callback.apply(this, valores)
      },
      demora,
      ...args,
    )
    if (Number(demora) >= 1000) pendientes.set(id, Number(demora))
    return id
  }
  window.clearTimeout = function (id) {
    pendientes.delete(id)
    return cancelar.call(window, id)
  }
  window.__stTemporizadoresLargos = () => [...pendientes.values()]
}

/** Errores y advertencias de consola, salvo el 401 esperado de GET /api/user. */
function vigilarConsola(page, etiqueta, registro) {
  page.on('pageerror', (error) => registro.problemas.push(`[${etiqueta}] excepción: ${error.message}`))
  page.on('console', (mensaje) => {
    const tipo = mensaje.type()
    if (tipo !== 'error' && tipo !== 'warning') return
    const texto = mensaje.text()
    const url = mensaje.location()?.url ?? ''
    if (tipo === 'error' && texto.startsWith('Failed to load resource') && texto.includes('401') && /\/api\/user(\?|$)/.test(url)) {
      registro.esperados++
      return
    }
    registro.problemas.push(`[${etiqueta}] console.${tipo}: ${texto}${url ? ` (${url})` : ''}`)
  })
}

async function nuevaPagina(browser, buscar, { ancho = 1440, alto = 900, reducido = false } = {}) {
  const context = await browser.newContext({
    viewport: { width: ancho, height: alto },
    deviceScaleFactor: 1,
    locale: 'es-MX',
    reducedMotion: reducido ? 'reduce' : 'no-preference',
  })
  await instalarMocks(context, buscar)
  await context.addInitScript(rastrearTemporizadores)
  const page = await context.newPage()
  const cdp = await context.newCDPSession(page)
  return { context, page, cdp }
}

/** Listeners de window y document por tipo, con CDP (DOMDebugger.getEventListeners). */
async function contarListeners(cdp) {
  const cuenta = {}
  for (const objetivo of ['window', 'document']) {
    const { result } = await cdp.send('Runtime.evaluate', { expression: objetivo })
    const { listeners } = await cdp.send('DOMDebugger.getEventListeners', { objectId: result.objectId })
    await cdp.send('Runtime.releaseObject', { objectId: result.objectId })
    for (const listener of listeners) {
      const clave = `${objetivo}.${listener.type}${listener.useCapture ? ' (captura)' : ''}`
      cuenta[clave] = (cuenta[clave] ?? 0) + 1
    }
  }
  return cuenta
}

function diferenciaDeListeners(antes, despues) {
  const claves = [...new Set([...Object.keys(antes), ...Object.keys(despues)])].sort()
  return claves.filter((clave) => (antes[clave] ?? 0) !== (despues[clave] ?? 0)).map((clave) => `${clave} ${antes[clave] ?? 0}→${despues[clave] ?? 0}`)
}

/** Estado de GSAP (null si el motor de la mascota aún no se descargó). */
function estadoGsap(page) {
  return page.evaluate(() => {
    const gsap = window.__stGsap
    if (!gsap) return null
    return { hijos: gsap.globalTimeline.getChildren(true, true, true).length, ticker: gsap.ticker._listeners?.length ?? null }
  })
}

function temporizadoresLargos(page) {
  return page.evaluate(() => window.__stTemporizadoresLargos?.() ?? [])
}

function hayMascota(page) {
  return page.evaluate(() => document.querySelector('.st-mascota') !== null)
}

async function esperarFase(page, fases, timeout) {
  const selector = fases.map((fase) => `.st-mascota__boton[data-fase="${fase}"]`).join(', ')
  await page.locator(selector).waitFor({ state: 'attached', timeout })
}

/** Revisa lo que debe quedar al salir de la home; devuelve los problemas encontrados. */
async function revisarLimpieza(page, cdp, base, { gsapCargado }) {
  const problemas = []
  const gsap = await estadoGsap(page)
  if (gsapCargado && !gsap) problemas.push('window.__stGsap no existe: ¿el sitio corre en modo desarrollo?')
  if (gsap && gsap.hijos !== 0) problemas.push(`globalTimeline con ${gsap.hijos} animaciones vivas`)
  if (gsap && gsap.ticker !== 1) problemas.push(`ticker con ${gsap.ticker} callbacks (se espera 1, el de GSAP)`)
  const listeners = diferenciaDeListeners(base.listeners, await contarListeners(cdp))
  if (listeners.length > 0) problemas.push(`listeners distintos a la línea base: ${listeners.join(', ')}`)
  const temporizadores = await temporizadoresLargos(page)
  if (temporizadores.length > base.temporizadores.length) problemas.push(`temporizadores pendientes: ${temporizadores.join(', ')} ms`)
  if (await hayMascota(page)) problemas.push('.st-mascota sigue en el DOM')
  return { problemas, gsap, listeners, temporizadores }
}

// ── 1. Fugas ────────────────────────────────────────────────────────────────

async function probarFugas(browser, buscar, { url, ciclos }, registro) {
  const { context, page, cdp } = await nuevaPagina(browser, buscar)
  vigilarConsola(page, 'fugas', registro)
  const fallos = []
  try {
    // Línea base en /pruebas, antes de la primera visita a la home.
    await page.goto(`${url}/pruebas`, { waitUntil: 'networkidle' })
    await page.getByRole('heading', { level: 1, name: 'Pruebas' }).waitFor()
    const base = { listeners: await contarListeners(cdp), temporizadores: await temporizadoresLargos(page) }
    const logo = page.getByRole('link', { name: 'Strata, inicio' })
    const tests = page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Tests', exact: true })
    const vivasEnHome = []

    for (let ciclo = 1; ciclo <= ciclos; ciclo++) {
      const completo = ciclo % 2 === 1
      await logo.click()
      await page.waitForURL(`${url}/`)
      await page.locator('.st-hero').waitFor()

      let enHome = ''
      if (completo) {
        await esperarFase(page, ['nado'], HASTA_QUE_NADE_MS)
        const gsap = await estadoGsap(page)
        vivasEnHome.push(gsap?.hijos ?? 0)
        const extra = diferenciaDeListeners(base.listeners, await contarListeners(cdp))
        enHome = `en la home: ${gsap?.hijos} animaciones, ticker ${gsap?.ticker}, listeners +[${extra.join(', ')}]`
        // Carrera hacia el selector (data-mascota-objetivo="selector").
        await page.locator('.st-toggle__option', { hasText: ciclo % 4 === 1 ? 'Para mi empresa' : 'Para mí' }).click()
        await esperarFase(page, ['carrera'], 3_000)
        // Brinco y burbuja. HTMLElement.click(): la mascota se mueve y nunca queda «estable» para Playwright.
        await esperarFase(page, ['regreso', 'nado'], 8_000)
        await page.evaluate(() => document.querySelector('.st-mascota__boton')?.click())
        await page.locator('.st-mascota__globo').waitFor({ timeout: 3_000 })
      } else {
        // Sale con la entrada pendiente (temporizador de 6 s y motor quizá sin iniciar).
        await page.locator('.st-mascota__boton').waitFor({ state: 'attached', timeout: 5_000 })
        await page.waitForTimeout(800)
        enHome = `en la home: fase ${await page.locator('.st-mascota__boton').getAttribute('data-fase')}`
      }

      await tests.click()
      await page.waitForURL(`${url}/pruebas`)
      await page.getByRole('heading', { level: 1, name: 'Pruebas' }).waitFor()
      await page.waitForTimeout(250)

      const revision = await revisarLimpieza(page, cdp, base, { gsapCargado: true })
      const estado = revision.problemas.length === 0 ? 'ok' : 'FALLA'
      console.log(
        `  ciclo ${String(ciclo).padStart(2)} (${completo ? 'nado, carrera y burbuja' : 'sale antes de entrar'}) · ${enHome} · al salir: ` +
          `${revision.gsap?.hijos ?? '—'} animaciones, ticker ${revision.gsap?.ticker ?? '—'} · ${estado}`,
      )
      for (const problema of revision.problemas) fallos.push(`ciclo ${ciclo}: ${problema}`)
    }

    if (vivasEnHome.length > 1 && Math.max(...vivasEnHome) > vivasEnHome[0]) {
      fallos.push(`las animaciones vivas en la home crecen entre ciclos: ${vivasEnHome.join(', ')}`)
    }
    console.log(`  animaciones vivas en la home por ciclo completo: ${vivasEnHome.join(', ')}`)
  } catch (error) {
    fallos.push(`la prueba no terminó: ${error.message.split('\n')[0]}`)
  } finally {
    await context.close()
  }
  return fallos
}

// ── 2. Movimiento reducido ─────────────────────────────────────────────────

async function probarReducido(browser, buscar, { url }, registro) {
  const { context, page, cdp } = await nuevaPagina(browser, buscar, { reducido: true })
  vigilarConsola(page, 'reducido', registro)
  const descargas = []
  page.on('request', (peticion) => {
    if (/mascota\/motor|\/gsap|MotionPath/i.test(peticion.url())) descargas.push(peticion.url())
  })
  const fallos = []
  try {
    await page.goto(`${url}/`, { waitUntil: 'networkidle' })
    await page.locator('.st-hero').waitFor()
    const base = { listeners: await contarListeners(cdp), temporizadores: await temporizadoresLargos(page) }
    // Más que la espera de entrada (6 s) y la entrada: si se montara, ya estaría nadando.
    await page.waitForTimeout(9_000)

    if (await hayMascota(page)) fallos.push('con movimiento reducido la mascota está montada')
    if (await estadoGsap(page)) fallos.push('con movimiento reducido se cargó GSAP (window.__stGsap existe)')
    if (descargas.length > 0) fallos.push(`con movimiento reducido se descargó el motor o GSAP: ${descargas.join(', ')}`)
    const animacionesCorriendo = () =>
      page.evaluate(() =>
        document
          .getAnimations()
          .filter((animacion) => animacion.playState === 'running')
          .map((animacion) => `${animacion.animationName ?? 'animación'} en ${animacion.effect?.target?.className ?? '?'}`),
      )
    const corriendo = await animacionesCorriendo()
    if (corriendo.length > 0) fallos.push(`animaciones corriendo con movimiento reducido: ${corriendo.join('; ')}`)
    console.log(
      `  quieta: mascota ${(await hayMascota(page)) ? 'montada' : 'sin montar'}, GSAP ${descargas.length ? 'descargado' : 'sin descargar'}, ` +
        `${corriendo.length} animaciones CSS corriendo`,
    )

    // La preferencia cambia con la página abierta.
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await esperarFase(page, ['nado'], HASTA_QUE_NADE_MS)
    const viva = await estadoGsap(page)
    const cssSinPreferencia = (await animacionesCorriendo()).length
    console.log(
      `  sin la preferencia: se monta y nada (${viva?.hijos} animaciones de GSAP, ticker ${viva?.ticker}; ` +
        `${cssSinPreferencia} animaciones CSS corriendo en la home)`,
    )
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.waitForTimeout(300)
    const revision = await revisarLimpieza(page, cdp, base, { gsapCargado: true })
    console.log(
      `  con la preferencia otra vez: ${revision.problemas.length === 0 ? 'se desmonta sin dejar nada vivo' : revision.problemas.join('; ')} ` +
        `(${revision.gsap?.hijos} animaciones, ticker ${revision.gsap?.ticker})`,
    )
    fallos.push(...revision.problemas.map((problema) => `al volver a pedir movimiento reducido: ${problema}`))
  } catch (error) {
    fallos.push(`la prueba no terminó: ${error.message.split('\n')[0]}`)
  } finally {
    await context.close()
  }
  return fallos
}

// ── 3. Opacidad sobre el titular ───────────────────────────────────────────

/** Una muestra: tiempo, opacidad de la salamandra, su centro y si cae sobre el H1 ampliado. */
function muestrear(page) {
  return page.evaluate(() => {
    const boton = document.querySelector('.st-mascota__boton')
    const cuerpo = document.querySelector('.st-mascota__cuerpo')
    const titular = document.querySelector('[data-mascota-titular]')
    if (!boton || !cuerpo || !titular) return null
    const b = boton.getBoundingClientRect()
    const t = titular.getBoundingClientRect()
    const x = b.left + b.width / 2
    const y = b.top + b.height / 2
    return {
      t: performance.now(),
      opacidad: Number(getComputedStyle(cuerpo).opacity),
      x: Math.round(x),
      y: Math.round(y),
      dentro: x > t.left - 70 && x < t.right + 70 && y > t.top - 50 && y < t.bottom + 50,
      fase: boton.dataset.fase,
    }
  })
}

async function probarTitular(browser, buscar, { url }, registro) {
  const { context, page } = await nuevaPagina(browser, buscar, { ancho: 360, alto: 800 })
  vigilarConsola(page, 'titular', registro)
  const fallos = []
  try {
    await page.goto(`${url}/`, { waitUntil: 'networkidle' })
    await esperarFase(page, ['nado'], HASTA_QUE_NADE_MS)
    // Una vuelta dura 42 s (motor.ts, DURACION_VUELTA_S): con 46 s pasa por el H1 y sale de él.
    const muestras = []
    let captura = false
    const fin = Date.now() + 46_000
    while (Date.now() < fin) {
      const muestra = await muestrear(page)
      if (muestra) muestras.push(muestra)
      if (!captura && muestra?.dentro && muestra.opacidad <= OPACIDAD_TITULAR + 0.01) {
        await mkdir(SALIDA, { recursive: true })
        await page.screenshot({ path: path.join(SALIDA, 'fugas-mascota-titular-360.png') })
        captura = true
      }
      await page.waitForTimeout(100)
    }

    // Tramos seguidos dentro o fuera del H1 ampliado y la opacidad al final de cada uno.
    const tramos = []
    for (const muestra of muestras) {
      const actual = tramos.at(-1)
      if (actual && actual.dentro === muestra.dentro) actual.fin = muestra
      else tramos.push({ dentro: muestra.dentro, inicio: muestra, fin: muestra })
    }
    const estables = tramos.filter((tramo) => tramo.fin.t - tramo.inicio.t >= TRAMO_ESTABLE_MS)
    for (const tramo of estables) {
      const duracion = ((tramo.fin.t - tramo.inicio.t) / 1000).toFixed(1)
      const opacidad = tramo.fin.opacidad.toFixed(2)
      console.log(`  ${tramo.dentro ? 'sobre el H1' : 'fuera del H1'} ${duracion} s, de (${tramo.inicio.x}, ${tramo.inicio.y}) a (${tramo.fin.x}, ${tramo.fin.y}): opacidad final ${opacidad}`)
      if (tramo.dentro && Math.abs(tramo.fin.opacidad - OPACIDAD_TITULAR) > 0.02) fallos.push(`sobre el H1 la opacidad quedó en ${opacidad} (se espera ${OPACIDAD_TITULAR})`)
      if (!tramo.dentro && Math.abs(tramo.fin.opacidad - OPACIDAD_NADO) > 0.02) fallos.push(`fuera del H1 la opacidad quedó en ${opacidad} (se espera ${OPACIDAD_NADO})`)
    }
    const indiceDentro = estables.findIndex((tramo) => tramo.dentro)
    if (indiceDentro === -1) fallos.push('la mascota no pasó sobre el H1 en una vuelta completa')
    else if (!estables.slice(indiceDentro + 1).some((tramo) => !tramo.dentro)) fallos.push('no se vio la vuelta a .8 después de pasar sobre el H1')
    if (captura) console.log('  captura sobre el H1: .capturas/fugas-mascota-titular-360.png')
  } catch (error) {
    fallos.push(`la prueba no terminó: ${error.message.split('\n')[0]}`)
  } finally {
    await context.close()
  }
  return fallos
}

// ── Principal ──────────────────────────────────────────────────────────────

async function main() {
  const opciones = leerArgumentos(process.argv.slice(2))
  const buscar = crearBuscador(JSON.parse(await readFile(MOCKS, 'utf8')))
  const browser = await chromium.launch()
  const registro = { problemas: [], esperados: 0 }
  const resultados = []
  const pruebas = {
    fugas: ['Fugas al entrar y salir de «/»', probarFugas],
    reducido: ['Movimiento reducido', probarReducido],
    titular: ['Opacidad sobre el H1', probarTitular],
  }
  try {
    for (const clave of PRUEBAS) {
      if (opciones.solo && opciones.solo !== clave) continue
      const [titulo, probar] = pruebas[clave]
      console.log(`\n${titulo}${clave === 'fugas' ? ` (${opciones.ciclos} ciclos)` : ''}`)
      const fallos = await probar(browser, buscar, opciones, registro)
      resultados.push([titulo, fallos])
    }
  } finally {
    await browser.close()
  }

  console.log('\nResumen')
  for (const [titulo, fallos] of resultados) {
    console.log(`  ${fallos.length === 0 ? 'ok   ' : 'FALLA'} ${titulo}`)
    for (const fallo of fallos) console.log(`        - ${fallo}`)
  }
  console.log(
    `  ${registro.problemas.length === 0 ? 'ok   ' : 'FALLA'} Consola sin errores ni advertencias` +
      (registro.esperados ? ` (${registro.esperados} × 401 esperado de GET /api/user)` : ''),
  )
  for (const problema of registro.problemas) console.log(`        - ${problema}`)

  const fallo = registro.problemas.length > 0 || resultados.some(([, fallos]) => fallos.length > 0)
  process.exit(fallo ? 1 : 0)
}

main().catch((error) => {
  console.error(error.message ?? error)
  process.exit(1)
})
