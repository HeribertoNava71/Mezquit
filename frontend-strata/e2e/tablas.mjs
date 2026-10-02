// Barrido de anchos de las pantallas con tablas (Fase 8): en cada ancho, ni la
// página ni la tabla deben desplazarse de lado (D-23: solo la comparativa lo hace).
// Cuenta el desborde de la página (scrollWidth > innerWidth) y el de cada tabla
// (.st-table__scroll con scrollWidth > clientWidth).
//
// Uso, desde frontend-strata y con el sitio corriendo:
//   node e2e/tablas.mjs [--url http://localhost:5188] [--desde 600] [--hasta 1000] [--paso 1]
//
// Termina con código 1 si alguna tabla, salvo la comparativa, se desplaza de lado.

import { chromium } from '@playwright/test'
import { abrir, leerOpciones, nuevoContexto, URL_POR_DEFECTO } from './comun.mjs'

const opciones = leerOpciones(process.argv.slice(2), {
  url: { porDefecto: URL_POR_DEFECTO, convertir: (v) => String(v ?? '').replace(/\/+$/, '') },
  desde: { porDefecto: 600, convertir: Number },
  hasta: { porDefecto: 1000, convertir: Number },
  paso: { porDefecto: 1, convertir: Number },
})

const PANTALLAS = [
  { escenario: 'rh', ruta: '/app' },
  { escenario: 'rh', ruta: '/app/evaluaciones' },
  { escenario: 'rh', ruta: '/app/evaluaciones/13' },
  { escenario: 'rh', ruta: '/app/creditos' },
  { escenario: 'admin', ruta: '/admin/usuarios' },
  { escenario: 'admin', ruta: '/admin/creditos' },
  // La comparativa se desplaza de lado por diseño (D-23): se informa, no falla.
  { escenario: 'rh', ruta: '/app/evaluaciones/13/comparar', desplazable: true },
]

/** Espera tres cuadros: el ResizeObserver de la tabla y el render de React. */
const tresCuadros = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r)))))

let fallas = 0
const browser = await chromium.launch()
try {
  for (const pantalla of PANTALLAS) {
    const context = await nuevoContexto(browser, pantalla.escenario, { ancho: opciones.hasta, alto: 800 })
    const page = await context.newPage()
    await abrir(page, opciones.url, pantalla.ruta, { espera: 300 })
    const tramos = []
    for (let ancho = opciones.desde; ancho <= opciones.hasta; ancho += opciones.paso) {
      await page.setViewportSize({ width: ancho, height: 800 })
      await tresCuadros(page)
      const m = await page.evaluate(() => ({
        pagina: document.documentElement.scrollWidth - window.innerWidth,
        tabla: Math.max(0, ...[...document.querySelectorAll('.st-table__scroll')].map((s) => s.scrollWidth - s.clientWidth)),
      }))
      if (m.pagina <= 0 && m.tabla <= 0) continue
      const tipo = `${m.pagina > 0 ? 'página' : ''}${m.pagina > 0 && m.tabla > 0 ? ' y ' : ''}${m.tabla > 0 ? 'tabla' : ''}`
      const ultimo = tramos.at(-1)
      if (ultimo && ancho - ultimo.hasta <= opciones.paso && ultimo.tipo === tipo) {
        ultimo.hasta = ancho
        ultimo.maximo = Math.max(ultimo.maximo, m.pagina, m.tabla)
      } else tramos.push({ desde: ancho, hasta: ancho, tipo, maximo: Math.max(m.pagina, m.tabla) })
    }
    const texto = tramos.map((t) => `${t.desde}–${t.hasta} px (${t.tipo}, hasta ${t.maximo} px)`).join(', ')
    const falla = tramos.length > 0 && !pantalla.desplazable
    if (falla) fallas++
    console.log(`${falla ? 'FALLA' : 'ok   '} ${pantalla.escenario} ${pantalla.ruta}: ${texto || 'sin desplazamiento lateral'}${pantalla.desplazable && tramos.length ? ' (por diseño)' : ''}`)
    await context.close()
  }
} finally {
  await browser.close()
}
process.exit(fallas > 0 ? 1 : 0)
