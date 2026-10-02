// Medición de las barras superiores (Fase 8): desde qué ancho caben en una fila.
// Por debajo de ese ancho, cada barra pasa al menú móvil; el corte vive en
// topbar/cortes.ts (MobileMenu) y en las reglas por corte de TopBar.css.
//
// Uso, desde frontend-strata y con el sitio corriendo:
//   npx vite --port 5188 --strictPort
//   node e2e/barras.mjs [--url http://localhost:5188] [--desde 700] [--hasta 1100] [--paso 2]
//
// Barras medidas:
//  - pública sin sesión (Tests · Para empresas · Cómo funciona · Precios, «Tengo un
//    código», «Entrar» y «Crear cuenta») en /pruebas y en la home;
//  - pública con sesión (pastilla con el nombre) en /perfil, con el nombre del mock
//    y con uno de 30 caracteres;
//  - RR. HH. con una organización de 30 caracteres en la pastilla, en /app;
//  - super admin con su contador de pendientes, en /admin/creditos.
// Para cada una dice el ancho mínimo desde el que la fila no se parte (con el
// diseño de escritorio forzado) y, con el CSS actual, hasta qué ancho se ve el
// menú móvil y si en algún ancho del rango la barra se parte o desborda.
// Termina con código 1 si alguna se parte o desborda.

import { chromium } from '@playwright/test'
import { abrir, buscadorDe, leerOpciones, nuevoContexto, URL_POR_DEFECTO } from './comun.mjs'

const opciones = leerOpciones(process.argv.slice(2), {
  url: { porDefecto: URL_POR_DEFECTO, convertir: (v) => String(v ?? '').replace(/\/+$/, '') },
  desde: { porDefecto: 700, convertir: Number },
  hasta: { porDefecto: 1100, convertir: Number },
  paso: { porDefecto: 2, convertir: Number },
})

/** Organización de 30 caracteres para la pastilla de RR. HH. */
const ORGANIZACION_30 = 'Comercializadora del Río Claro'
/** Nombre y apellido que suman 30 caracteres para la pastilla de la barra pública. */
const PERSONA_30 = { name: 'María Fernanda', last_name: 'Villaseñor Ruiz' }

const conOrganizacion = (cuerpo) => ({
  ...cuerpo,
  data: { ...cuerpo.data, organization: { ...(cuerpo.data?.organization ?? {}), name: ORGANIZACION_30 } },
})
const conPersona = (cuerpo) => ({ ...cuerpo, ...PERSONA_30 })

const BARRAS = [
  { nombre: 'pública sin sesión', escenario: 'visitante', ruta: '/pruebas' },
  { nombre: 'pública de la home', escenario: 'visitante', ruta: '/' },
  { nombre: 'pública con sesión', escenario: 'rh', ruta: '/perfil' },
  { nombre: 'pública con sesión (nombre de 30 caracteres)', escenario: 'rh', ruta: '/perfil', cambios: { '/api/user': conPersona } },
  { nombre: 'RR. HH. (organización de 30 caracteres)', escenario: 'rh', ruta: '/app', cambios: { '/api/user/profile': conOrganizacion } },
  { nombre: 'super admin', escenario: 'admin', ruta: '/admin/creditos' },
]

/** Filas de la barra: posiciones verticales distintas de los hijos visibles de la fila. */
function medirFila(page) {
  return page.evaluate(() => {
    const fila = document.querySelector('.st-topbar__inner')
    if (!fila) return null
    const hijos = [...fila.children].filter((h) => h.getBoundingClientRect().width > 0 && getComputedStyle(h).display !== 'none')
    const centros = []
    for (const hijo of hijos) {
      const caja = hijo.getBoundingClientRect()
      const centro = caja.top + caja.height / 2
      if (!centros.some((c) => Math.abs(c - centro) < 12)) centros.push(centro)
    }
    // También cuenta una navegación partida en dos renglones dentro de su lista.
    const enlaces = [...fila.querySelectorAll('.st-topbar__link')].filter((a) => a.getBoundingClientRect().width > 0)
    const filasNav = new Set(enlaces.map((a) => Math.round(a.getBoundingClientRect().top / 8))).size
    const menuMovil = [...fila.querySelectorAll('.st-mobile-menu')].some((m) => getComputedStyle(m).display !== 'none')
    return {
      filas: Math.max(centros.length, filasNav),
      desborde: document.documentElement.scrollWidth > window.innerWidth,
      menuMovil,
    }
  })
}

async function esperarPastilla(page) {
  await page.waitForFunction(() => !document.querySelector('.st-user-menu__label--loading'), null, { timeout: 5_000 }).catch(() => {})
}

async function main() {
  const browser = await chromium.launch()
  const resultados = []
  try {
    for (const barra of BARRAS) {
      const context = await nuevoContexto(browser, barra.escenario, { ancho: opciones.hasta, alto: 700 })
      // Respuestas del mock con un nombre más largo (estas rutas ganan: se registran después).
      const buscar = await buscadorDe(barra.escenario)
      for (const [ruta, cambiar] of Object.entries(barra.cambios ?? {})) {
        await context.route(
          (url) => url.pathname === ruta,
          async (route) => {
            if (route.request().method() !== 'GET') return route.fallback()
            const entrada = buscar('GET', new URL(route.request().url()))
            const cuerpo = cambiar(structuredClone(entrada?.respuesta.body ?? {}))
            const origen = (await route.request().allHeaders()).origin ?? '*'
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              headers: { 'access-control-allow-origin': origen, 'access-control-allow-credentials': 'true' },
              body: JSON.stringify(cuerpo),
            })
          },
        )
      }
      const page = await context.newPage()
      await abrir(page, opciones.url, barra.ruta, { espera: 300 })
      await esperarPastilla(page)

      // 1. Diseño de escritorio forzado: el ancho mínimo en el que todo cabe en una fila.
      const estilo = await page.addStyleTag({
        content:
          '.st-nav-links, .st-user-menu, .st-public-bar__code, .st-public-bar__session { display: flex !important; } .st-mobile-menu { display: none !important; }',
      })
      let minimo = null
      for (let ancho = opciones.hasta; ancho >= opciones.desde; ancho -= opciones.paso) {
        await page.setViewportSize({ width: ancho, height: 700 })
        const m = await medirFila(page)
        if (m && m.filas === 1 && !m.desborde) minimo = ancho
        else break
      }
      await estilo.evaluate((nodo) => nodo.remove())

      // 2. CSS actual: hasta dónde se ve el menú móvil y dónde la barra se parte o desborda.
      const partida = []
      let movilHasta = null
      for (let ancho = opciones.desde; ancho <= opciones.hasta; ancho += opciones.paso) {
        await page.setViewportSize({ width: ancho, height: 700 })
        const m = await medirFila(page)
        if (!m) continue
        if (m.menuMovil) movilHasta = ancho
        if (m.filas > 1 || m.desborde) partida.push(ancho)
      }
      resultados.push({ ...barra, minimo, partida, movilHasta })
      await context.close()
    }
  } finally {
    await browser.close()
  }

  let falla = false
  for (const r of resultados) {
    const tramos = []
    for (const ancho of r.partida) {
      const ultimo = tramos.at(-1)
      if (ultimo && ancho - ultimo[1] <= opciones.paso) ultimo[1] = ancho
      else tramos.push([ancho, ancho])
    }
    const textoPartida = tramos.length ? tramos.map(([a, b]) => (a === b ? `${a}` : `${a}–${b}`)).join(', ') + ' px' : 'ninguno'
    console.log(
      `${r.nombre}: cabe en una fila desde ${r.minimo ?? `más de ${opciones.hasta}`} px · ` +
        `menú móvil hasta ${r.movilHasta ?? `menos de ${opciones.desde}`} px · partida o con desborde: ${textoPartida}`,
    )
    if (tramos.length) falla = true
  }
  process.exit(falla ? 1 : 0)
}

main().catch((error) => {
  console.error(error.message ?? error)
  process.exit(1)
})
