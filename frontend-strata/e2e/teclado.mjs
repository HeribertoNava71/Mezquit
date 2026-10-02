// Recorridos de teclado de la Fase 8: menú de la pastilla, menú móvil, filtros,
// tablas ordenables, asistente, examen del candidato, modal y drawer. Solo teclas
// (Tab, Mayús+Tab, Enter, Espacio, Escape y flechas) y, en cada paso, que el foco
// esté donde debe y que se vea (contorno o anillo de foco).
//
// Uso, desde frontend-strata y con el sitio en modo desarrollo:
//   npx vite --port 5188 --strictPort
//   node e2e/teclado.mjs [--url http://localhost:5188] [--solo pastilla]
//
// Termina con código 1 si algún paso falla.

import { chromium } from '@playwright/test'
import { abrir, leerOpciones, nuevoContexto, URL_POR_DEFECTO } from './comun.mjs'

const opciones = leerOpciones(process.argv.slice(2), {
  url: { porDefecto: URL_POR_DEFECTO, convertir: (v) => String(v ?? '').replace(/\/+$/, '') },
  solo: { porDefecto: null },
})

/** Descripción del elemento con foco y si su indicador se ve. */
function foco(page) {
  return page.evaluate(() => {
    const el = document.activeElement
    if (!el || el === document.body) return { nombre: '(body)', visible: false, rol: null }
    const idEtiqueta = el.getAttribute('aria-labelledby')?.split(' ')[0]
    const etiqueta = el.labels?.[0]?.textContent || (idEtiqueta ? document.getElementById(idEtiqueta)?.textContent : '')
    const nombre = (el.getAttribute('aria-label') || etiqueta || el.textContent || el.getAttribute('name') || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 48)
    // El indicador puede ir en el elemento, en su anillo (box-shadow) o en el contenedor
    // que lo dibuja con :has(:focus-visible) (RadioCard, Checkbox, Stepper).
    const visibleEn = (n) => {
      if (!n || n === document.body) return false
      const e = getComputedStyle(n)
      const contorno = e.outlineStyle !== 'none' && parseFloat(e.outlineWidth) > 0 && e.outlineColor !== 'rgba(0, 0, 0, 0)'
      const anillo = e.boxShadow !== 'none' && /rgb\(2, 132, 199\)|rgb\(56, 189, 248\)|rgb\(179, 38, 30\)/.test(e.boxShadow)
      return contorno || anillo
    }
    let visible = el.matches(':focus-visible') && (visibleEn(el) || visibleEn(el.parentElement) || visibleEn(el.parentElement?.parentElement))
    // Contenedores que solo reciben el foco para que el lector anuncie (títulos, main, regiones): no exigen anillo.
    if (!visible && el.getAttribute('tabindex') === '-1') visible = null
    return { nombre, visible, rol: el.getAttribute('role') ?? el.tagName.toLowerCase(), enTh: Boolean(el.closest('th')) }
  })
}

class Recorrido {
  constructor(nombre) {
    this.nombre = nombre
    this.fallos = []
    this.pasos = 0
  }
  esperar(condicion, descripcion) {
    this.pasos++
    if (!condicion) this.fallos.push(descripcion)
  }
}

async function tecla(page, combinacion, veces = 1) {
  for (let i = 0; i < veces; i++) await page.keyboard.press(combinacion)
  await page.waitForTimeout(60)
}

/** Tab hasta que el foco cumpla la condición (máx. n pulsaciones). */
async function tabularHasta(page, condicion, maximo = 40, atras = false) {
  for (let i = 0; i < maximo; i++) {
    await tecla(page, atras ? 'Shift+Tab' : 'Tab')
    const actual = await foco(page)
    if (condicion(actual)) return actual
  }
  return null
}

// ── Recorridos ─────────────────────────────────────────────────────────────

const RECORRIDOS = {
  async pastilla(browser, r) {
    const ctx = await nuevoContexto(browser, 'rh', { ancho: 1440 })
    const page = await ctx.newPage()
    await abrir(page, opciones.url, '/app', { espera: 300 })
    const disparador = await tabularHasta(page, (f) => /menú de cuenta/i.test(f.nombre))
    r.esperar(disparador?.visible, 'Tab llega a la pastilla con foco visible')
    await tecla(page, 'Enter')
    let f = await foco(page)
    r.esperar(f.rol === 'menuitem' && /Mi perfil/.test(f.nombre), `Enter abre y enfoca «Mi perfil» (foco en ${f.nombre})`)
    r.esperar(f.visible, 'la opción enfocada se ve')
    await tecla(page, 'ArrowDown')
    f = await foco(page)
    r.esperar(f.rol === 'menuitem' && !/Mi perfil/.test(f.nombre), `↓ pasa a la siguiente opción (${f.nombre})`)
    await tecla(page, 'End')
    f = await foco(page)
    r.esperar(/Salir/.test(f.nombre), `Fin va a «Salir» (${f.nombre})`)
    await tecla(page, 'Home')
    f = await foco(page)
    r.esperar(/Mi perfil/.test(f.nombre), `Inicio vuelve a «Mi perfil» (${f.nombre})`)
    await tecla(page, 'Escape')
    f = await foco(page)
    r.esperar(/menú de cuenta/i.test(f.nombre) && !(await page.locator('[role="menu"]').count()), 'Escape cierra y devuelve el foco a la pastilla')
    await tecla(page, 'ArrowUp')
    f = await foco(page)
    r.esperar(/Salir/.test(f.nombre), `↑ en la pastilla abre en la última opción (${f.nombre})`)
    await tecla(page, 'Tab')
    r.esperar(!(await page.locator('[role="menu"]').count()), 'Tab cierra el menú y sigue el orden de la página')
    await tecla(page, 'Shift+Tab')
    await tecla(page, ' ')
    f = await foco(page)
    r.esperar(f.rol === 'menuitem', 'Espacio también abre el menú')
    await ctx.close()
  },

  async movil(browser, r) {
    const ctx = await nuevoContexto(browser, 'rh', { ancho: 360, alto: 760 })
    const page = await ctx.newPage()
    await abrir(page, opciones.url, '/app', { espera: 300 })
    const boton = await tabularHasta(page, (f) => f.nombre === 'Menú')
    r.esperar(boton?.visible, 'Tab llega al botón «Menú» con foco visible')
    await tecla(page, 'Enter')
    r.esperar((await page.locator('.st-mobile-menu__panel').count()) === 1, 'Enter abre el panel')
    // La trampa: 25 Tab no sacan el foco del menú.
    let fuera = false
    for (let i = 0; i < 25; i++) {
      await tecla(page, 'Tab')
      if (!(await page.evaluate(() => Boolean(document.activeElement?.closest('.st-mobile-menu'))))) fuera = true
    }
    r.esperar(!fuera, 'Tab circula dentro del menú abierto')
    await tecla(page, 'Shift+Tab', 3)
    r.esperar(await page.evaluate(() => Boolean(document.activeElement?.closest('.st-mobile-menu'))), 'Mayús+Tab también circula dentro')
    const enlace = await foco(page)
    r.esperar(enlace.visible !== false, `el elemento del menú enfocado se ve (${enlace.nombre})`)
    await tecla(page, 'Escape')
    const f = await foco(page)
    r.esperar(f.nombre === 'Menú' && !(await page.locator('.st-mobile-menu__panel').count()), 'Escape cierra y devuelve el foco al botón')
    await ctx.close()
  },

  async filtros(browser, r) {
    const ctx = await nuevoContexto(browser, 'rh', { ancho: 1440 })
    const page = await ctx.newPage()
    await abrir(page, opciones.url, '/app/evaluaciones/13', { espera: 300 })
    const filtro = await tabularHasta(page, (f) => /^Completad/.test(f.nombre), 60)
    r.esperar(filtro?.visible, `Tab llega a un filtro por estado con foco visible (${filtro?.nombre})`)
    const filasAntes = await page.locator('.st-table__row').count()
    await tecla(page, 'Enter')
    const presionado = await page.evaluate(() => document.activeElement?.getAttribute('aria-pressed'))
    const filasDespues = await page.locator('.st-table__row').count()
    r.esperar(presionado === 'true' && filasDespues <= filasAntes, `Enter aplica el filtro (aria-pressed ${presionado}; filas ${filasAntes} → ${filasDespues})`)
    await tecla(page, 'Shift+Tab')
    await tecla(page, ' ')
    const otro = await page.evaluate(() => document.activeElement?.getAttribute('aria-pressed'))
    r.esperar(otro === 'true', 'Espacio aplica otro filtro')
    await ctx.close()
  },

  async orden(browser, r) {
    const ctx = await nuevoContexto(browser, 'admin', { ancho: 1440 })
    const page = await ctx.newPage()
    await abrir(page, opciones.url, '/app/evaluaciones/13/comparar', { espera: 300 })
    const boton = await tabularHasta(page, (f) => f.enTh && f.rol === 'button', 80)
    r.esperar(boton?.visible, `Tab llega a un encabezado ordenable con foco visible (${boton?.nombre})`)
    await tecla(page, 'Enter')
    const orden1 = await page.evaluate(() => document.activeElement?.closest('th')?.getAttribute('aria-sort'))
    await tecla(page, ' ')
    const orden2 = await page.evaluate(() => document.activeElement?.closest('th')?.getAttribute('aria-sort'))
    r.esperar(Boolean(orden1) && Boolean(orden2) && orden1 !== orden2, `Enter y Espacio ordenan y cambian el sentido (${orden1} → ${orden2})`)
    await ctx.close()
  },

  async asistente(browser, r) {
    const ctx = await nuevoContexto(browser, 'rh', { ancho: 1440 })
    const page = await ctx.newPage()
    await abrir(page, opciones.url, '/app/evaluaciones/nueva', { espera: 300 })
    const nombre = await tabularHasta(page, (f) => f.rol === 'input' && /Nombre de la evaluación/.test(f.nombre), 60)
    r.esperar(nombre?.visible, 'Tab llega al nombre de la evaluación con foco visible')
    await page.keyboard.type('Vendedores Q4')
    await tecla(page, 'Tab')
    await page.keyboard.type('Ejecutivo de ventas')
    await tecla(page, 'Enter')
    await page.locator('.st-radio-card').first().waitFor({ timeout: 5_000 })
    let f = await foco(page)
    r.esperar(/Prueba/.test(f.nombre) || f.visible === null, `Enter pasa al paso 2 y el foco va a su título (${f.nombre})`)
    const radio = await tabularHasta(page, (x) => x.rol === 'input' || x.rol === 'radio', 10)
    r.esperar(radio?.visible, 'la prueba elegida (RadioCard) recibe el foco y se ve')
    await tecla(page, 'Enter')
    await page.locator('.st-nueva-fila input').first().waitFor({ timeout: 5_000 })
    // Enviar el paso 3 sin candidatos: aviso con ícono y texto, y el foco al primer campo.
    const siguiente = await tabularHasta(page, (x) => /Siguiente/.test(x.nombre), 30)
    r.esperar(siguiente?.visible, 'Tab llega a «Siguiente» con foco visible')
    await tecla(page, 'Enter')
    f = await foco(page)
    const aviso = await page.locator('[role="alert"]').filter({ hasText: 'Agrega al menos un candidato' }).count()
    r.esperar(aviso > 0 && /Nombre/.test(f.nombre), `sin candidatos, el aviso se anuncia y el foco va al primer campo (${f.nombre})`)
    await ctx.close()
  },

  async examen(browser, r) {
    const ctx = await nuevoContexto(browser, 'candidato', { ancho: 1440 })
    const page = await ctx.newPage()
    await abrir(page, opciones.url, '/evaluar/Lvpx1u6OcvNbil7ZnhYuLFbhCbZ1PGcQ42CVRM9p', { espera: 300 })
    const casilla = await tabularHasta(page, (f) => f.rol === 'input' && /Acepto/.test(f.nombre), 30)
    r.esperar(casilla?.visible, 'Tab llega al consentimiento con foco visible')
    await tecla(page, ' ')
    r.esperar(await page.locator('input[type="checkbox"]').isChecked(), 'Espacio marca el consentimiento')
    const iniciar = await tabularHasta(page, (f) => /Iniciar evaluación/.test(f.nombre), 10)
    r.esperar(iniciar?.visible, 'Tab llega a «Iniciar evaluación» con foco visible')
    await tecla(page, 'Enter')
    await page.locator('.st-examen .st-radio-card').first().waitFor({ timeout: 8_000 })
    let f = await foco(page)
    r.esperar(f.visible === null || /Pregunta|afirmación/i.test(f.nombre) || f.rol === 'h2', `el foco va a la pregunta (${f.nombre})`)
    const opcion = await tabularHasta(page, (x) => x.rol === 'input', 10)
    r.esperar(opcion?.visible, 'Tab llega a las opciones y el foco se ve')
    await tecla(page, 'ArrowDown')
    const marcada = await page.evaluate(() => document.activeElement?.checked)
    r.esperar(marcada === true, '↓ elige la opción siguiente')
    // «Anterior» va antes (deshabilitado con aria-disabled en la primera pregunta: sigue enfocable).
    f = await tabularHasta(page, (x) => /Siguiente/.test(x.nombre), 4)
    r.esperar(Boolean(f?.visible), `Tab llega a «Siguiente» con foco visible (${f?.nombre})`)
    const antes = await page.locator('.st-examen__contador').textContent()
    await tecla(page, 'Enter')
    await page.waitForFunction((t) => document.querySelector('.st-examen__contador')?.textContent !== t, antes, { timeout: 5_000 }).catch(() => {})
    const despues = await page.locator('.st-examen__contador').textContent()
    r.esperar(antes !== despues, `Enter avanza a la siguiente pregunta (${antes} → ${despues})`)
    await ctx.close()
  },

  async modal(browser, r) {
    const ctx = await nuevoContexto(browser, 'rh', { ancho: 1440 })
    const page = await ctx.newPage()
    await abrir(page, opciones.url, '/app/evaluaciones/13', { espera: 300 })
    const compartir = await tabularHasta(page, (f) => /^Compartir/.test(f.nombre), 80)
    r.esperar(compartir?.visible, 'Tab llega a «Compartir» con foco visible')
    await tecla(page, 'Enter')
    await page.locator('[role="dialog"]').waitFor({ timeout: 3_000 })
    r.esperar(await page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]'))), 'el foco entra al modal')
    let fuera = false
    for (let i = 0; i < 15; i++) {
      await tecla(page, i % 3 === 2 ? 'Shift+Tab' : 'Tab')
      if (!(await page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]'))))) fuera = true
    }
    r.esperar(!fuera, 'Tab y Mayús+Tab no salen del modal')
    await tecla(page, 'Escape')
    const f = await foco(page)
    r.esperar(!(await page.locator('[role="dialog"]').count()) && /^Compartir/.test(f.nombre), `Escape cierra y devuelve el foco a «Compartir» (${f.nombre})`)
    await ctx.close()
  },

  async drawer(browser, r) {
    const ctx = await nuevoContexto(browser, 'rh', { ancho: 1440 })
    const page = await ctx.newPage()
    await abrir(page, opciones.url, '/app/creditos', { espera: 300 })
    const boton = await tabularHasta(page, (f) => /Solicitar créditos/.test(f.nombre), 40)
    r.esperar(boton?.visible, 'Tab llega a «Solicitar créditos» con foco visible')
    await tecla(page, 'Enter')
    await page.locator('[role="dialog"]').waitFor({ timeout: 3_000 })
    let f = await foco(page)
    r.esperar(/cantidad|crédito/i.test(f.nombre) || f.rol === 'spinbutton' || f.rol === 'input', `el foco va a la cantidad (${f.nombre})`)
    const antes = await page.evaluate(() => document.activeElement?.value)
    await tecla(page, 'ArrowUp')
    const despues = await page.evaluate(() => document.activeElement?.value)
    r.esperar(Number(despues) === Number(antes) + 1, `↑ suma un crédito (${antes} → ${despues})`)
    let fuera = false
    for (let i = 0; i < 12; i++) {
      await tecla(page, 'Tab')
      if (!(await page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]'))))) fuera = true
    }
    r.esperar(!fuera, 'Tab no sale del drawer')
    await tecla(page, 'Escape')
    f = await foco(page)
    r.esperar(!(await page.locator('[role="dialog"]').count()) && /Solicitar créditos/.test(f.nombre), `Escape cierra y devuelve el foco (${f.nombre})`)
    await ctx.close()
  },
}

async function main() {
  const browser = await chromium.launch()
  let total = 0
  try {
    for (const [nombre, recorrer] of Object.entries(RECORRIDOS)) {
      if (opciones.solo && opciones.solo !== nombre) continue
      const r = new Recorrido(nombre)
      try {
        await recorrer(browser, r)
      } catch (error) {
        r.fallos.push(`no terminó: ${error.message.split('\n')[0]}`)
      }
      total += r.fallos.length
      console.log(`${r.fallos.length === 0 ? 'ok   ' : 'FALLA'} ${nombre}: ${r.pasos - r.fallos.length} de ${r.pasos} pasos`)
      for (const fallo of r.fallos) console.log(`        - ${fallo}`)
    }
  } finally {
    await browser.close()
  }
  process.exit(total > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error(error.message ?? error)
  process.exit(1)
})
