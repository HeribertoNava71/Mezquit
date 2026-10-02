// Prueba de fugas de la mascota de la home (Fase 6; ampliada en la Fase 8). Criterios de
// salida en docs/rediseno/decisiones.md, «Fase 6», D-27 y D-28, y en PROMPT_CLAUDE_CODE.md,
// «Mascota (inicio)».
//
// Uso, desde frontend-strata y con el sitio en modo desarrollo (window.__stGsap solo existe
// con import.meta.env.DEV, así que no sirve con vite preview):
//   npx vite --port 5188 --strictPort
//   node e2e/fugas-mascota.mjs [--url http://localhost:5188] [--ciclos 20]
//                              [--solo fugas|reducido|titular|clics|ocultar]
//
// Responde /api/* y /sanctum/* con e2e/mocks/visitante.json (sin backend) y usa el Chromium
// de Playwright. Son cinco pruebas:
//
//  1. fugas. Entra y sale de «/» N veces, sin recargar la página, alternando el destino
//     entre /pruebas, /demo, /como-funciona, /precios (enlaces de la barra) y /ayuda
//     («Soporte» del pie), y vuelve con el logo. En los ciclos impares espera a que la
//     mascota nade, la hace correr (clic en el selector «Para mí / Para mi empresa») y
//     brincar con su burbuja (clic en ella) y sale; en los pares sale antes de que entre:
//     unos antes de que se descargue su chunk (D-28) y otros con la entrada pendiente.
//     Ya en el destino comprueba que no queda nada vivo:
//       - window.__stGsap.globalTimeline.getChildren(true, true, true) vacío;
//       - window.__stGsap.ticker._listeners con un solo callback (Timeline.updateRoot de GSAP);
//       - los listeners de window y document (CDP, DOMDebugger.getEventListeners), iguales a
//         los de ese destino antes de la primera visita a la home;
//       - ningún temporizador de 1 s o más pendiente (setTimeout envuelto antes de cargar la app);
//       - ningún .st-mascota en el DOM.
//     Además, el número de animaciones vivas en la home no crece de un ciclo a otro.
//  2. reducido. Con prefers-reduced-motion la mascota no se monta, ni su chunk ni GSAP se
//     descargan y no queda ninguna animación corriendo en la home. Si la preferencia se quita
//     con la página abierta, la mascota se monta y nada; si vuelve, se desmonta sin dejar nada.
//  3. titular. A 360 × 800 y sin desplazar la página, la mascota da su vuelta: sobre el H1
//     (ampliado ±70/±50 px, como vigilarTitular) su opacidad baja a .26, y fuera vuelve a .8.
//  4. clics (D-27). Con la mascota quieta (línea de tiempo de GSAP en pausa), recorre una
//     rejilla de puntos dentro del cuadro del botón: solo la zona sobre el cuerpo recibe el
//     puntero; en lo transparente, elementFromPoint da el contenido de abajo. Además hace un
//     clic real del ratón en un punto transparente y comprueba que llega al contenido.
//  5. ocultar (D-27, WCAG 2.2.2). «Ocultar mascota» de la burbuja la desmonta sin dejar
//     tweens, ticker, listeners ni timers, y lo guarda; al recargar no se monta ni se
//     descarga nada; «Mostrar mascota» del pie la trae de vuelta enseguida.
//
// En todas, la consola no debe tener errores ni advertencias. El único error aceptado es el
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
const PRUEBAS = ['fugas', 'reducido', 'titular', 'clics', 'ocultar']

/** Espera de entrada de la mascota (tiempos.ts: 6 s, con la descarga diferida dentro) más la entrada (1.6–3.2 s). */
const HASTA_QUE_NADE_MS = 20_000
/**
 * Peticiones de los chunks perezosos de la mascota: el componente (Mascota.tsx), el
 * motor y GSAP. MascotaDiferida.tsx, en el bundle de la home, no cuenta.
 */
const DESCARGA_MASCOTA = /\/mascota\/(motor|Mascota)\.tsx?(\?|$)|\/assets\/(motor|Mascota)-|\/gsap|MotionPath/
/** Clave de la preferencia «ocultar la mascota» (preferencia.ts). */
const CLAVE_OCULTA = 'strata:mascota-oculta'

/** Destinos de los ciclos de la prueba de fugas: cómo llegar y qué esperar. */
const DESTINOS = [
  { ruta: '/pruebas', enlace: (page) => navPrincipal(page).getByRole('link', { name: 'Tests', exact: true }) },
  { ruta: '/demo', enlace: (page) => navPrincipal(page).getByRole('link', { name: 'Para empresas', exact: true }) },
  { ruta: '/como-funciona', enlace: (page) => navPrincipal(page).getByRole('link', { name: 'Cómo funciona', exact: true }) },
  { ruta: '/precios', enlace: (page) => navPrincipal(page).getByRole('link', { name: 'Precios', exact: true }) },
  { ruta: '/ayuda', enlace: (page) => page.getByRole('contentinfo').getByRole('link', { name: 'Soporte', exact: true }) },
]

function navPrincipal(page) {
  return page.getByRole('navigation', { name: 'Navegación principal' })
}

/** Espera a que el destino termine de cargar (su H1 dentro de main). */
async function esperarDestino(page, url, ruta) {
  await page.waitForURL(`${url}${ruta}`)
  await page.locator('main h1').first().waitFor()
  await page.waitForLoadState('networkidle').catch(() => {})
}
/** Opacidades de motor.ts (OPACIDAD_TITULAR y OPACIDAD_NADO). */
const OPACIDAD_TITULAR = 0.26
const OPACIDAD_NADO = 0.8
/** Tramo mínimo dentro o fuera del titular para exigir la opacidad final: 500 ms de medición + 700 ms de tween. */
const TRAMO_ESTABLE_MS = 1500

function leerArgumentos(argv) {
  const opciones = { url: 'http://localhost:5188', ciclos: 20, solo: null }
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
    // Línea base de cada destino antes de la primera visita a la home (cada pantalla
    // puede tener sus propios listeners). Se recorren con la barra, sin recargar.
    await page.goto(`${url}/pruebas`, { waitUntil: 'networkidle' })
    await esperarDestino(page, url, '/pruebas')
    const bases = new Map()
    for (const destino of DESTINOS) {
      if (destino.ruta !== '/pruebas') {
        await destino.enlace(page).click()
        await esperarDestino(page, url, destino.ruta)
      }
      await page.waitForTimeout(250)
      bases.set(destino.ruta, { listeners: await contarListeners(cdp), temporizadores: await temporizadoresLargos(page) })
    }
    const logo = page.getByRole('link', { name: 'Strata, inicio' })
    const vivasEnHome = []

    for (let ciclo = 1; ciclo <= ciclos; ciclo++) {
      const completo = ciclo % 2 === 1
      const destino = DESTINOS[(ciclo - 1) % DESTINOS.length]
      await logo.click()
      await page.waitForURL(`${url}/`)
      await page.locator('.st-hero').waitFor()

      let enHome = ''
      if (completo) {
        await esperarFase(page, ['nado'], HASTA_QUE_NADE_MS)
        const gsap = await estadoGsap(page)
        vivasEnHome.push(gsap?.hijos ?? 0)
        enHome = `en la home: ${gsap?.hijos} animaciones, ticker ${gsap?.ticker}`
        // Carrera hacia el selector (data-mascota-objetivo="selector").
        await page.locator('.st-toggle__option', { hasText: ciclo % 4 === 1 ? 'Para mi empresa' : 'Para mí' }).click()
        await esperarFase(page, ['carrera'], 3_000)
        // Brinco y burbuja. HTMLElement.click(): la mascota se mueve y nunca queda «estable» para Playwright.
        await esperarFase(page, ['regreso', 'nado'], 8_000)
        await page.evaluate(() => document.querySelector('.st-mascota__boton')?.click())
        await page.locator('.st-mascota__globo').waitFor({ timeout: 3_000 })
      } else if (ciclo % 4 === 2) {
        // Sale antes de que se descargue la mascota (espera de 4.5 s de MascotaDiferida, D-28).
        await page.waitForTimeout(800)
        enHome = `en la home: ${(await hayMascota(page)) ? 'mascota montada' : 'sin descargar la mascota'}`
      } else {
        // Sale con la entrada pendiente (mascota montada y motor quizá sin iniciar).
        await page.locator('.st-mascota__boton').waitFor({ state: 'attached', timeout: 10_000 })
        await page.waitForTimeout(300)
        enHome = `en la home: fase ${await page.locator('.st-mascota__boton').getAttribute('data-fase')}`
      }

      await destino.enlace(page).click()
      await esperarDestino(page, url, destino.ruta)
      await page.waitForTimeout(250)

      const revision = await revisarLimpieza(page, cdp, bases.get(destino.ruta), { gsapCargado: ciclo > 1 || completo })
      const estado = revision.problemas.length === 0 ? 'ok' : 'FALLA'
      const tipo = completo ? 'nado, carrera y burbuja' : ciclo % 4 === 2 ? 'sale antes de la descarga' : 'sale antes de entrar'
      console.log(
        `  ciclo ${String(ciclo).padStart(2)} → ${destino.ruta.padEnd(14)} (${tipo}) · ${enHome} · al salir: ` +
          `${revision.gsap?.hijos ?? '—'} animaciones, ticker ${revision.gsap?.ticker ?? '—'} · ${estado}`,
      )
      for (const problema of revision.problemas) fallos.push(`ciclo ${ciclo} (${destino.ruta}): ${problema}`)
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
    if (DESCARGA_MASCOTA.test(peticion.url())) descargas.push(peticion.url())
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

// ── 4. Clics a través de la mascota (D-27) ────────────────────────────────

/**
 * Recorre una rejilla de puntos dentro del cuadro del botón (en sus coordenadas
 * propias, con su giro y su escala) y dice cuáles reciben el puntero.
 */
function sondearCuadro(page) {
  return page.evaluate(() => {
    const boton = document.querySelector('.st-mascota__boton')
    if (!boton) return null
    const ancho = boton.offsetWidth
    const alto = boton.offsetHeight
    const giro = new DOMMatrix(getComputedStyle(boton).transform)
    const matriz = new DOMMatrix().translate(ancho / 2, alto / 2).multiply(giro).translate(-ancho / 2, -alto / 2)
    const puntos = []
    for (let i = 0; i < 20; i++) {
      for (let j = 0; j < 20; j++) {
        const lx = ((i + 0.5) / 20) * ancho
        const ly = ((j + 0.5) / 20) * alto
        const p = matriz.transformPoint(new DOMPoint(lx, ly))
        if (p.x < 1 || p.y < 1 || p.x > innerWidth - 1 || p.y > innerHeight - 1) continue
        const encima = document.elementFromPoint(p.x, p.y)
        puntos.push({ lx, ly, ancho, alto, x: p.x, y: p.y, deLaMascota: Boolean(encima?.closest('.st-mascota')), debajo: encima?.tagName ?? null })
      }
    }
    return puntos
  })
}

async function probarClics(browser, buscar, { url }, registro) {
  const { context, page } = await nuevaPagina(browser, buscar)
  vigilarConsola(page, 'clics', registro)
  const fallos = []
  try {
    await page.goto(`${url}/`, { waitUntil: 'networkidle' })
    await esperarFase(page, ['nado'], HASTA_QUE_NADE_MS)
    // Quieta para medir: toda la línea de tiempo de GSAP en pausa.
    await page.evaluate(() => {
      window.__stGsap?.globalTimeline.pause()
    })
    await page.waitForTimeout(100)
    const puntos = await sondearCuadro(page)
    if (!puntos?.length) throw new Error('la mascota no está a la vista para sondearla')
    // La zona táctil (::before de Mascota.css): cápsula de 25–61 % del ancho y 3–69 % del
    // alto, con los extremos redondos. Se descartan los puntos a menos de 1.5 px del borde.
    const distanciaAZona = (p) => {
      const izquierda = 0.25 * p.ancho
      const derecha = 0.61 * p.ancho
      const arriba = 0.03 * p.alto
      const abajo = 0.69 * p.alto
      // Cápsula vertical (más alta que ancha): el segmento central engrosado por el radio.
      const radio = (derecha - izquierda) / 2
      const cx = (izquierda + derecha) / 2
      const y = Math.min(Math.max(p.ly, arriba + radio), abajo - radio)
      return Math.hypot(p.lx - cx, p.ly - y) - radio
    }
    const clasificados = puntos.map((p) => ({ ...p, distancia: distanciaAZona(p) }))
    const zona = clasificados.filter((p) => p.distancia < -1.5)
    const transparentes = clasificados.filter((p) => p.distancia > 1.5)
    const fueraQueBloquean = transparentes.filter((p) => p.deLaMascota)
    const zonaQueNoResponde = zona.filter((p) => !p.deLaMascota)
    console.log(
      `  cuadro del botón: ${puntos.length} puntos · zona táctil ${zona.length} (reciben el puntero ${zona.length - zonaQueNoResponde.length}) · ` +
        `fuera de la zona ${transparentes.length} (dejan pasar el clic ${transparentes.length - fueraQueBloquean.length})`,
    )
    if (fueraQueBloquean.length > 0) {
      fallos.push(`${fueraQueBloquean.length} puntos fuera de la zona táctil todavía reciben el puntero: ${fueraQueBloquean.map((p) => `(${Math.round(p.lx)}, ${Math.round(p.ly)})`).join(' ')}`)
    }
    if (zonaQueNoResponde.length > 0) fallos.push(`${zonaQueNoResponde.length} puntos de la zona táctil no reciben el puntero`)

    // Clic real del ratón en un punto transparente: llega al contenido de abajo.
    const objetivo = transparentes.find((p) => !p.deLaMascota && p.debajo)
    if (!objetivo) throw new Error('no hay un punto transparente sobre contenido para hacer clic')
    await page.evaluate(() => {
      window.__clicRecibido = null
      document.addEventListener(
        'click',
        (evento) => {
          const destino = evento.target instanceof Element ? evento.target : null
          window.__clicRecibido = destino ? (destino.closest('.st-mascota') ? 'mascota' : destino.tagName.toLowerCase()) : '?'
          evento.preventDefault()
        },
        { capture: true, once: true },
      )
    })
    await page.mouse.click(objetivo.x, objetivo.y)
    const recibido = await page.evaluate(() => window.__clicRecibido)
    console.log(`  clic real en (${Math.round(objetivo.x)}, ${Math.round(objetivo.y)}), fuera de la zona táctil: lo recibe <${recibido}>`)
    if (recibido === 'mascota' || !recibido) fallos.push(`el clic fuera de la zona táctil lo recibió ${recibido ?? 'nadie'}, no el contenido`)

    // Y un clic en la zona táctil la hace hablar.
    const centro = zona.find((p) => p.deLaMascota && p.distancia < -8)
    if (centro) {
      await page.mouse.click(centro.x, centro.y)
      await page.locator('.st-mascota__globo').waitFor({ timeout: 3_000 })
      console.log('  clic real en la zona táctil: muestra la burbuja')
    }
  } catch (error) {
    fallos.push(`la prueba no terminó: ${error.message.split('\n')[0]}`)
  } finally {
    await context.close()
  }
  return fallos
}

// ── 5. Ocultar y mostrar (D-27, WCAG 2.2.2) ───────────────────────────────

async function probarOcultar(browser, buscar, { url }, registro) {
  const { context, page } = await nuevaPagina(browser, buscar)
  vigilarConsola(page, 'ocultar', registro)
  const descargas = []
  page.on('request', (peticion) => {
    if (DESCARGA_MASCOTA.test(peticion.url())) descargas.push(peticion.url())
  })
  const fallos = []
  try {
    await page.goto(`${url}/`, { waitUntil: 'networkidle' })
    await esperarFase(page, ['nado'], HASTA_QUE_NADE_MS)

    // «Ocultar mascota» junto a la burbuja. La burbuja sigue a la mascota: para un clic
    // real del ratón, primero la línea de tiempo de GSAP en pausa (queda quieta).
    await page.evaluate(() => document.querySelector('.st-mascota__boton')?.click())
    const ocultar = page.locator('.st-mascota__ocultar')
    await ocultar.waitFor({ timeout: 3_000 })
    await page.evaluate(() => {
      window.__stGsap?.globalTimeline.pause()
    })
    await ocultar.click()
    await page.waitForTimeout(300)
    const gsap = await estadoGsap(page)
    const guardada = await page.evaluate((clave) => localStorage.getItem(clave), CLAVE_OCULTA)
    const enPie = await page.getByRole('contentinfo').getByRole('button', { name: 'Mostrar mascota' }).count()
    const temporizadores = await temporizadoresLargos(page)
    console.log(
      `  oculta desde la burbuja: mascota ${(await hayMascota(page)) ? 'montada' : 'desmontada'}, ${gsap?.hijos} animaciones, ticker ${gsap?.ticker}, ` +
        `temporizadores largos ${temporizadores.length}, localStorage «${guardada}», pie con «Mostrar mascota»: ${enPie ? 'sí' : 'no'}`,
    )
    if (await hayMascota(page)) fallos.push('la mascota sigue montada después de «Ocultar mascota»')
    if (gsap && gsap.hijos !== 0) fallos.push(`quedan ${gsap.hijos} animaciones vivas`)
    if (gsap && gsap.ticker !== 1) fallos.push(`el ticker tiene ${gsap.ticker} callbacks (se espera 1)`)
    if (temporizadores.length > 0) fallos.push(`quedan temporizadores pendientes: ${temporizadores.join(', ')} ms`)
    if (guardada !== '1') fallos.push('la preferencia no se guardó en localStorage')
    if (!enPie) fallos.push('el pie no ofrece «Mostrar mascota»')

    // Al recargar, oculta: no se monta ni se descarga nada.
    descargas.length = 0
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(9_000)
    console.log(`  al recargar: mascota ${(await hayMascota(page)) ? 'montada' : 'sin montar'}, descargas de la mascota o GSAP: ${descargas.length}`)
    if (await hayMascota(page)) fallos.push('al recargar, la mascota oculta se montó')
    if (descargas.length > 0) fallos.push(`al recargar se descargó: ${descargas.join(', ')}`)

    // «Mostrar mascota» del pie la trae de vuelta enseguida.
    const inicio = Date.now()
    await page.getByRole('contentinfo').getByRole('button', { name: 'Mostrar mascota' }).click()
    await esperarFase(page, ['nado'], 8_000)
    console.log(`  «Mostrar mascota»: nada otra vez a los ${((Date.now() - inicio) / 1000).toFixed(1)} s`)
    await page.evaluate((clave) => localStorage.removeItem(clave), CLAVE_OCULTA)
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
    clics: ['Clics a través de la mascota (D-27)', probarClics],
    ocultar: ['Ocultar y mostrar la mascota (D-27, WCAG 2.2.2)', probarOcultar],
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
