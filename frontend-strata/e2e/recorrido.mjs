// Recorrido de QA de la Fase 8: desborde horizontal, consola y movimiento en todas
// las rutas de e2e/comun.mjs con su mock.
//
// Uso, desde frontend-strata y con el sitio en modo desarrollo:
//   npx vite --port 5188 --strictPort
//   node e2e/recorrido.mjs [--url http://localhost:5188] [--anchos 360,768,1440]
//                          [--modos desborde,consola,movimiento] [--solo-minimas]
//                          [--escenario rh] [--ruta /app] [--abrir-menus]
//
// Modos:
//  - desborde: en cada ancho, document.documentElement.scrollWidth <= innerWidth.
//    Si no, lista los elementos que salen por la derecha. Con --abrir-menus también
//    abre el menú móvil (por debajo del corte) y la pastilla (por encima).
//  - consola: console.error, console.warn y pageerror, sin movimiento reducido (con la
//    mascota y las entradas en marcha). Los 401 y las respuestas de error que el
//    mock da a propósito se cuentan aparte, como esperados.
//  - movimiento: con prefers-reduced-motion no queda ninguna animación corriendo
//    (document.getAnimations()) ni se monta la mascota; sin la preferencia, la
//    entrada de pantalla dura 0.5 s, las tarjetas se escalonan de 55 en 55 ms y los
//    botones y enlaces cambian de estado en 0.18 s.
//
// Termina con código 1 si algo falla.

import { chromium } from '@playwright/test'
import { abrir, filtrarRutas, leerOpciones, nuevoContexto, URL_POR_DEFECTO, vigilarConsola } from './comun.mjs'

const opciones = leerOpciones(process.argv.slice(2), {
  url: { porDefecto: URL_POR_DEFECTO, convertir: (v) => String(v ?? '').replace(/\/+$/, '') },
  anchos: { porDefecto: [360, 768, 1440], convertir: (v) => String(v).split(',').map(Number) },
  modos: { porDefecto: ['desborde', 'consola', 'movimiento'], convertir: (v) => String(v).split(',') },
  'solo-minimas': { porDefecto: false, bandera: true },
  escenario: { porDefecto: null },
  ruta: { porDefecto: null },
  'abrir-menus': { porDefecto: false, bandera: true },
})

/** Ancho de página y los elementos visibles que salen por la derecha (los más externos). */
function medirDesborde(page) {
  return page.evaluate(() => {
    const ancho = window.innerWidth
    const raiz = document.documentElement
    const fuera = []
    if (raiz.scrollWidth > ancho) {
      for (const el of document.body.querySelectorAll('*')) {
        const caja = el.getBoundingClientRect()
        if (caja.width === 0 || caja.right <= ancho + 0.5) continue
        const estilo = getComputedStyle(el)
        if (estilo.position === 'fixed' || estilo.visibility === 'hidden') continue
        // Solo cuenta si ningún ancestro recorta el desborde.
        let recortado = false
        for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
          const o = getComputedStyle(p)
          if (/(hidden|auto|scroll|clip)/.test(o.overflowX) || o.position === 'fixed') {
            recortado = true
            break
          }
        }
        if (recortado) continue
        // El más externo: si el padre también sale, se queda el padre.
        const padre = el.parentElement?.getBoundingClientRect()
        if (padre && padre.right > ancho + 0.5) continue
        const clase = typeof el.className === 'string' && el.className ? `.${el.className.trim().split(/\s+/).join('.')}` : ''
        fuera.push(`${el.tagName.toLowerCase()}${clase} (+${Math.round(caja.right - ancho)} px)`)
      }
    }
    return { scrollWidth: raiz.scrollWidth, innerWidth: ancho, fuera: fuera.slice(0, 6) }
  })
}

/** Animaciones corriendo y si la mascota está montada. */
function medirAnimaciones(page) {
  return page.evaluate(() => ({
    corriendo: document
      .getAnimations()
      .filter((a) => a.playState === 'running')
      .map((a) => `${a.animationName ?? a.constructor.name} en ${a.effect?.target?.className || a.effect?.target?.tagName || '?'}`),
    mascota: Boolean(document.querySelector('.st-mascota')),
  }))
}

/** Duraciones del brief medidas en la página, sin movimiento reducido. */
function medirDuraciones(page) {
  return page.evaluate(() => {
    const ruta = document.querySelector('.st-route, .st-auth-frame, .st-cand-frame, .st-examen, .st-fin')
    const entrada = ruta ? getComputedStyle(ruta) : null
    const tarjetas = [...document.querySelectorAll('.st-card--enter')].slice(0, 4).map((t) => getComputedStyle(t).animationDelay)
    const control = document.querySelector('main .st-btn, main a[href]')
    const transicion = control ? getComputedStyle(control).transitionDuration.split(',').map((d) => d.trim()) : []
    return {
      entrada: entrada ? `${entrada.animationName} ${entrada.animationDuration}` : null,
      escalonado: tarjetas,
      transicion: [...new Set(transicion)],
    }
  })
}

async function main() {
  const rutas = filtrarRutas({ minimas: opciones['solo-minimas'], escenario: opciones.escenario, ruta: opciones.ruta })
  const browser = await chromium.launch()
  const fallos = []
  const registro = { problemas: [], esperados: new Map() }
  try {
    // ── Desborde horizontal ────────────────────────────────────────────────
    if (opciones.modos.includes('desborde')) {
      console.log('\nDesborde horizontal (scrollWidth <= innerWidth)')
      for (const ancho of opciones.anchos) {
        let bien = 0
        for (const r of rutas) {
          const context = await nuevoContexto(browser, r.escenario, { ancho, alto: 800 })
          const page = await context.newPage()
          try {
            await abrir(page, opciones.url, r.ruta, { espera: 250 })
            const medidas = [['', await medirDesborde(page)]]
            if (opciones['abrir-menus']) {
              const movil = page.locator('.st-mobile-menu__toggle').filter({ visible: true }).first()
              const pastilla = page.locator('.st-user-menu__trigger').filter({ visible: true }).first()
              if (await movil.count()) {
                await movil.click()
                medidas.push([' [menú móvil]', await medirDesborde(page)])
              } else if (await pastilla.count()) {
                await pastilla.click()
                medidas.push([' [pastilla]', await medirDesborde(page)])
              }
            }
            for (const [estado, m] of medidas) {
              if (m.scrollWidth > m.innerWidth) {
                fallos.push(`desborde ${ancho}px ${r.escenario} ${r.ruta}${estado}: ${m.scrollWidth} > ${m.innerWidth} · ${m.fuera.join(', ')}`)
                console.log(`  FALLA ${ancho}px ${r.escenario} ${r.ruta}${estado}: scrollWidth ${m.scrollWidth} > ${m.innerWidth} · ${m.fuera.join(', ')}`)
              } else bien++
            }
          } catch (error) {
            fallos.push(`desborde ${ancho}px ${r.escenario} ${r.ruta}: ${error.message.split('\n')[0]}`)
          } finally {
            await context.close()
          }
        }
        console.log(`  ${ancho} px: ${bien} mediciones sin desborde`)
      }
    }

    // ── Consola ─────────────────────────────────────────────────────────────
    if (opciones.modos.includes('consola')) {
      console.log('\nConsola (sin movimiento reducido)')
      for (const ancho of [1440, 360].filter((a) => opciones.anchos.includes(a) || opciones.anchos.length === 1)) {
        for (const r of rutas) {
          const context = await nuevoContexto(browser, r.escenario, { ancho, reducido: false })
          const page = await context.newPage()
          vigilarConsola(page, { escenario: r.escenario, etiqueta: `${ancho}px ${r.escenario} ${r.ruta}` }, registro)
          try {
            await abrir(page, opciones.url, r.ruta, { espera: r.ruta === '/' ? 9_000 : 600 })
          } catch (error) {
            fallos.push(`consola ${ancho}px ${r.escenario} ${r.ruta}: ${error.message.split('\n')[0]}`)
          } finally {
            await context.close()
          }
        }
      }
      for (const problema of registro.problemas) {
        fallos.push(`consola ${problema.etiqueta}: ${problema.tipo} ${problema.texto}`)
        console.log(`  FALLA ${problema.etiqueta}: ${problema.tipo} ${problema.texto}`)
      }
      console.log(`  ${registro.problemas.length} mensajes inesperados.`)
      console.log('  Esperados (respuestas de error de los mocks):')
      for (const [motivo, veces] of [...registro.esperados].sort()) console.log(`    ${veces} × ${motivo}`)
    }

    // ── Movimiento ──────────────────────────────────────────────────────────
    if (opciones.modos.includes('movimiento')) {
      console.log('\nMovimiento')
      let quietas = 0
      for (const r of rutas) {
        const context = await nuevoContexto(browser, r.escenario, { ancho: 1440, reducido: true })
        const page = await context.newPage()
        try {
          await abrir(page, opciones.url, r.ruta, { espera: r.ruta === '/' ? 7_000 : 400 })
          const { corriendo, mascota } = await medirAnimaciones(page)
          if (corriendo.length > 0 || mascota) {
            const detalle = [...corriendo, ...(mascota ? ['mascota montada'] : [])].join('; ')
            fallos.push(`movimiento reducido ${r.escenario} ${r.ruta}: ${detalle}`)
            console.log(`  FALLA reducido ${r.escenario} ${r.ruta}: ${detalle}`)
          } else quietas++
        } finally {
          await context.close()
        }
      }
      console.log(`  Con prefers-reduced-motion: ${quietas} de ${rutas.length} rutas sin animaciones corriendo ni mascota.`)

      const muestras = new Map()
      for (const r of rutas) {
        const context = await nuevoContexto(browser, r.escenario, { ancho: 1440, reducido: false })
        const page = await context.newPage()
        try {
          await page.goto(`${opciones.url}${r.ruta}`, { waitUntil: 'domcontentloaded' })
          await page.waitForLoadState('networkidle').catch(() => {})
          const d = await medirDuraciones(page)
          const clave = JSON.stringify(d)
          muestras.set(clave, [...(muestras.get(clave) ?? []), `${r.escenario} ${r.ruta}`])
          // Cada grupo de tarjetas se escalona por su cuenta (el reporte tiene uno por prueba):
          // todo retardo es un múltiplo de 55 ms.
          const escalonOk = d.escalonado.every((retardo) => {
            const pasos = parseFloat(retardo) / 0.055
            return Math.abs(pasos - Math.round(pasos)) < 0.01
          })
          const entradaOk = !d.entrada || /0\.5s/.test(d.entrada)
          const transicionOk = d.transicion.length === 0 || d.transicion.includes('0.18s')
          if (!escalonOk || !entradaOk || !transicionOk) {
            fallos.push(`movimiento ${r.escenario} ${r.ruta}: ${clave}`)
            console.log(`  FALLA ${r.escenario} ${r.ruta}: ${clave}`)
          }
        } finally {
          await context.close()
        }
      }
      console.log('  Sin la preferencia (entrada · escalonado · transición):')
      for (const [clave, lista] of muestras) console.log(`    ${clave} → ${lista.length} rutas (p. ej., ${lista[0]})`)
    }
  } finally {
    await browser.close()
  }

  console.log(`\n${fallos.length === 0 ? 'ok' : `FALLA: ${fallos.length} problemas`}`)
  process.exit(fallos.length > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error(error.message ?? error)
  process.exit(1)
})
