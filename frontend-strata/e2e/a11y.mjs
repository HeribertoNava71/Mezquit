// Auditoría de accesibilidad con axe-core (Fase 8). Recorre todas las rutas de
// e2e/comun.mjs con su mock y corre axe con las reglas de WCAG 2.0 A y AA, 2.1 A y
// AA y 2.2 AA. Además abre la pastilla, el menú móvil, los modales, el drawer, los
// pasos del asistente, el examen y el fin del candidato, y vuelve a correr axe con
// cada uno abierto. En la home espera a la mascota (sin movimiento reducido) y
// analiza también el botón, la burbuja y el control para ocultarla.
//
// Uso, desde frontend-strata y con el sitio en modo desarrollo:
//   npx vite --port 5188 --strictPort
//   node e2e/a11y.mjs [--url http://localhost:5188] [--anchos 1440,360]
//                     [--solo-minimas] [--escenario rh] [--ruta /app] [--sin-estados] [--detalle]
//
// Guarda el detalle en .capturas/a11y.json. Termina con código 1 si hay
// violaciones serias o críticas.

import { chromium } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  SALIDA,
  URL_POR_DEFECTO,
  abrir,
  esperarCarga,
  filtrarRutas,
  leerOpciones,
  nombreDeRuta,
  nuevoContexto,
} from './comun.mjs'

const ETIQUETAS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const IMPACTOS = ['critical', 'serious', 'moderate', 'minor']

const opciones = leerOpciones(process.argv.slice(2), {
  url: { porDefecto: URL_POR_DEFECTO, convertir: (v) => String(v ?? '').replace(/\/+$/, '') },
  anchos: { porDefecto: [1440, 360], convertir: (v) => String(v).split(',').map(Number) },
  'solo-minimas': { porDefecto: false, bandera: true },
  escenario: { porDefecto: null },
  ruta: { porDefecto: null },
  'sin-estados': { porDefecto: false, bandera: true },
  detalle: { porDefecto: false, bandera: true },
})

// ── Estados con algo abierto ───────────────────────────────────────────────

const clic = (selector) => async (page) => {
  const objetivo = page.locator(selector).filter({ visible: true }).first()
  await objetivo.waitFor({ state: 'visible', timeout: 8_000 })
  await objetivo.click()
}
const esperar = (selector) => async (page) => {
  await page.locator(selector).filter({ visible: true }).first().waitFor({ state: 'visible', timeout: 8_000 })
}
const llenar = (selector, valor) => async (page) => {
  await page.locator(selector).filter({ visible: true }).first().fill(valor)
}

/** Responde el examen del candidato hasta el fin (primera opción de cada reactivo). */
async function responderHastaElFin(page) {
  for (let vuelta = 0; vuelta < 80; vuelta++) {
    if (await page.locator('.st-fin').count()) return
    const opcion = page.locator('.st-examen .st-radio-card').first()
    if (!(await opcion.count())) {
      await page.waitForTimeout(150)
      continue
    }
    const contador = await page.locator('.st-examen__contador').textContent().catch(() => '')
    await opcion.click()
    await page.locator('.st-examen__siguiente:not([disabled])').click()
    await page
      .waitForFunction(
        (previo) => document.querySelector('.st-fin') || document.querySelector('.st-examen__contador')?.textContent !== previo,
        contador,
        { timeout: 8_000 },
      )
      .catch(() => {})
  }
  throw new Error('el examen no llegó al fin en 80 vueltas')
}

/** Asistente de nueva evaluación: paso 1 lleno y «Siguiente». */
async function pasoDatos(page) {
  await page.getByLabel('Nombre de la evaluación').fill('Vendedores Q4')
  await page.getByLabel('Puesto').fill('Ejecutivo de ventas')
  await page.getByRole('button', { name: 'Siguiente' }).click()
  await page.locator('.st-radio-card').first().waitFor({ timeout: 8_000 })
}

/** Paso 2 (la prueba ya está elegida) y «Siguiente». */
async function pasoPrueba(page) {
  await page.getByRole('button', { name: 'Siguiente' }).click()
  await page.locator('input[type="email"]').first().waitFor({ timeout: 8_000 })
}

/** Paso 3 con un candidato y «Siguiente». */
async function pasoCandidatos(page) {
  // Los rótulos llevan el asterisco de obligatorio: se ubican por la fila del candidato.
  await page.locator('.st-nueva-fila input[type="text"]').first().fill('Ana López')
  await page.locator('.st-nueva-fila input[type="email"]').first().fill('ana@correo.com')
  await page.getByRole('button', { name: 'Siguiente' }).click()
  await page.getByLabel('Fecha límite').waitFor({ timeout: 8_000 })
}

/** Estados por ruta: nombre, anchos en los que aplica y pasos (funciones con la página). */
const ESTADOS = [
  { escenario: 'visitante', ruta: '/', nombre: 'menú móvil', anchos: [360], pasos: [clic('.st-mobile-menu__toggle'), esperar('.st-mobile-menu__panel')] },
  {
    escenario: 'visitante',
    ruta: '/',
    nombre: 'mascota y burbuja (sin movimiento reducido)',
    anchos: [1440, 360],
    movimiento: true,
    pasos: [
      async (page) => {
        await page.locator('.st-mascota__boton[data-fase="nado"]').waitFor({ state: 'attached', timeout: 25_000 })
        await page.evaluate(() => {
          window.__stGsap?.globalTimeline.pause()
        })
        await page.evaluate(() => document.querySelector('.st-mascota__boton')?.click())
        await page.locator('.st-mascota__globo').waitFor({ timeout: 3_000 })
      },
    ],
  },
  { escenario: 'visitante', ruta: '/login', nombre: 'error de credenciales', pasos: [llenar('input[type="email"]', 'ana@empresa.com'), llenar('input[type="password"]', 'secreto123'), clic('form button[type="submit"]'), esperar('.st-callout, [role="alert"]')] },
  { escenario: 'visitante', ruta: '/registro', nombre: 'errores de validación', pasos: [clic('form button[type="submit"]'), esperar('.st-field__error, [role="alert"]')] },
  // El mock de visitante responde 201 a POST /api/leads: el estado es el aviso de éxito.
  { escenario: 'visitante', ruta: '/demo', nombre: 'solicitud enviada', pasos: [clic('form button[type="submit"]'), esperar('.st-contacto__exito')] },
  { escenario: 'visitante', ruta: '/evaluar', nombre: 'error de código', pasos: [clic('form button[type="submit"]'), esperar('.st-field__error, [role="alert"]')] },
  { escenario: 'rh', ruta: '/app', nombre: 'menú de la pastilla', anchos: [1440], pasos: [clic('.st-user-menu__trigger'), esperar('[role="menu"]')] },
  { escenario: 'rh', ruta: '/app', nombre: 'menú móvil', anchos: [360], pasos: [clic('.st-mobile-menu__toggle'), esperar('.st-mobile-menu__panel')] },
  { escenario: 'rh', ruta: '/app/evaluaciones/13', nombre: 'modal «Enlace de invitación»', pasos: [clic('button:has-text("Compartir")'), esperar('[role="dialog"]')] },
  { escenario: 'rh', ruta: '/app/creditos', nombre: 'drawer «Solicitar créditos»', pasos: [clic('button:has-text("Solicitar créditos")'), esperar('[role="dialog"]')] },
  {
    escenario: 'rh',
    ruta: '/app/creditos',
    nombre: 'drawer enviado',
    pasos: [clic('button:has-text("Solicitar créditos")'), esperar('[role="dialog"]'), clic('[role="dialog"] button[type="submit"]'), esperar('[role="dialog"] .st-callout')],
  },
  { escenario: 'rh', ruta: '/app/evaluaciones/nueva', nombre: 'asistente, paso 2', pasos: [pasoDatos, esperar('.st-radio-card')] },
  { escenario: 'rh', ruta: '/app/evaluaciones/nueva', nombre: 'asistente, paso 3', pasos: [pasoDatos, pasoPrueba] },
  { escenario: 'rh', ruta: '/app/evaluaciones/nueva', nombre: 'asistente, paso 4', pasos: [pasoDatos, pasoPrueba, pasoCandidatos] },
  {
    escenario: 'rh',
    ruta: '/app/evaluaciones/nueva',
    nombre: 'asistente, enlaces',
    pasos: [pasoDatos, pasoPrueba, pasoCandidatos, clic('button[type="submit"]:has-text("Enviar")'), esperar('.st-nueva-enlaces')],
  },
  { escenario: 'admin', ruta: '/admin/creditos', nombre: 'confirmar aprobación', pasos: [clic('button:has-text("Aprobar")'), esperar('[role="alertdialog"], [role="dialog"]')] },
  { escenario: 'admin', ruta: '/admin/usuarios/34', nombre: 'confirmar eliminación', pasos: [clic('button:has-text("Eliminar")'), esperar('[role="alertdialog"], [role="dialog"]')] },
  {
    escenario: 'candidato',
    ruta: '/evaluar/Lvpx1u6OcvNbil7ZnhYuLFbhCbZ1PGcQ42CVRM9p',
    nombre: 'examen',
    pasos: [clic('.st-acceso__consent input[type="checkbox"], input[type="checkbox"]'), clic('.st-acceso__iniciar'), esperar('.st-examen .st-radio-card')],
  },
  {
    escenario: 'candidato',
    ruta: '/evaluar/Lvpx1u6OcvNbil7ZnhYuLFbhCbZ1PGcQ42CVRM9p',
    nombre: 'fin',
    pasos: [clic('input[type="checkbox"]'), clic('.st-acceso__iniciar'), esperar('.st-examen .st-radio-card'), responderHastaElFin, esperar('.st-fin')],
  },
  { escenario: 'candidato-iniciada', ruta: '/evaluar/ZhHwe34SEscc4zaPFEK512IHnEygYZJa4TXXj92e', nombre: 'examen retomado', pasos: [clic('.st-acceso__iniciar'), esperar('.st-examen .st-radio-card')] },
]

// ── Análisis ───────────────────────────────────────────────────────────────

/**
 * Corre axe. Además de las violaciones, guarda los nodos de color-contrast que axe
 * no pudo decidir («incomplete»: texto sobre vidrio, degradados o imágenes), para
 * revisarlos a mano (e2e/contraste.mjs).
 */
async function analizar(page) {
  const resultado = await new AxeBuilder({ page }).withTags(ETIQUETAS).analyze()
  const dudosos = resultado.incomplete
    .filter((v) => v.id === 'color-contrast')
    .flatMap((v) => v.nodes.map((n) => ({ target: n.target.join(' '), motivo: n.any?.[0]?.message ?? '', html: n.html.slice(0, 160) })))
  const violaciones = resultado.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    nodos: v.nodes.map((n) => ({ target: n.target.join(' '), resumen: n.failureSummary, html: n.html.slice(0, 220) })),
  }))
  violaciones.dudosos = dudosos
  return violaciones
}

function contarPorImpacto(violaciones) {
  const cuenta = Object.fromEntries(IMPACTOS.map((i) => [i, 0]))
  for (const v of violaciones) cuenta[v.impact] = (cuenta[v.impact] ?? 0) + v.nodos.length
  return cuenta
}

function linea(etiqueta, violaciones) {
  const c = contarPorImpacto(violaciones)
  const total = violaciones.reduce((t, v) => t + v.nodos.length, 0)
  const reglas = violaciones.map((v) => `${v.id}(${v.impact[0]}×${v.nodos.length})`).join(' ')
  return `  ${total === 0 ? 'ok   ' : 'FALLA'} ${etiqueta} · crít ${c.critical} · seria ${c.serious} · mod ${c.moderate} · menor ${c.minor}${reglas ? ` · ${reglas}` : ''}`
}

async function main() {
  const rutas = filtrarRutas({ minimas: opciones['solo-minimas'], escenario: opciones.escenario, ruta: opciones.ruta })
  const browser = await chromium.launch()
  const informe = []
  try {
    for (const ancho of opciones.anchos) {
      console.log(`\n── ${ancho} px ──`)
      for (const r of rutas) {
        const etiqueta = `${ancho}px ${r.escenario} ${r.ruta}`
        const context = await nuevoContexto(browser, r.escenario, { ancho })
        const page = await context.newPage()
        try {
          const final = await abrir(page, opciones.url, r.ruta, { espera: 400 })
          const violaciones = await analizar(page)
          informe.push({ ancho, escenario: r.escenario, ruta: r.ruta, final, estado: null, violaciones, contrasteDudoso: violaciones.dudosos })
          console.log(linea(`${etiqueta}${final !== r.ruta ? ` → ${final}` : ''}`, violaciones))
        } catch (error) {
          console.log(`  ERROR ${etiqueta}: ${error.message.split('\n')[0]}`)
          informe.push({ ancho, escenario: r.escenario, ruta: r.ruta, estado: null, error: error.message })
        } finally {
          await context.close()
        }

        if (opciones['sin-estados']) continue
        for (const estado of ESTADOS) {
          if (estado.escenario !== r.escenario || estado.ruta !== r.ruta) continue
          if (estado.anchos && !estado.anchos.includes(ancho)) continue
          const ctx = await nuevoContexto(browser, r.escenario, { ancho, reducido: !estado.movimiento })
          const pagina = await ctx.newPage()
          const etiquetaEstado = `${etiqueta} [${estado.nombre}]`
          try {
            await abrir(pagina, opciones.url, r.ruta, { espera: 300 })
            for (const paso of estado.pasos) await paso(pagina)
            await esperarCarga(pagina, { espera: 450 })
            const violaciones = await analizar(pagina)
            informe.push({ ancho, escenario: r.escenario, ruta: r.ruta, estado: estado.nombre, violaciones, contrasteDudoso: violaciones.dudosos })
            console.log(linea(etiquetaEstado, violaciones))
            if (opciones.detalle) await pagina.screenshot({ path: path.join(SALIDA, `a11y-${nombreDeRuta(r)}-${ancho}-${estado.nombre.replace(/\W+/g, '_')}.png`) })
          } catch (error) {
            console.log(`  ERROR ${etiquetaEstado}: ${error.message.split('\n')[0]}`)
            informe.push({ ancho, escenario: r.escenario, ruta: r.ruta, estado: estado.nombre, error: error.message })
          } finally {
            await ctx.close()
          }
        }
      }
    }
  } finally {
    await browser.close()
  }

  // Resumen por regla.
  const porRegla = new Map()
  for (const entrada of informe) {
    for (const v of entrada.violaciones ?? []) {
      const actual = porRegla.get(v.id) ?? { id: v.id, impact: v.impact, help: v.help, nodos: 0, pantallas: new Set(), ejemplos: [] }
      actual.nodos += v.nodos.length
      actual.pantallas.add(`${entrada.ancho} ${entrada.escenario} ${entrada.ruta}${entrada.estado ? ` [${entrada.estado}]` : ''}`)
      for (const nodo of v.nodos) if (actual.ejemplos.length < 4 && !actual.ejemplos.some((e) => e.target === nodo.target)) actual.ejemplos.push(nodo)
      porRegla.set(v.id, actual)
    }
  }
  const total = Object.fromEntries(IMPACTOS.map((i) => [i, 0]))
  for (const regla of porRegla.values()) total[regla.impact] += regla.nodos
  const errores = informe.filter((e) => e.error)

  console.log('\nResumen por regla')
  if (porRegla.size === 0) console.log('  sin violaciones')
  for (const regla of [...porRegla.values()].sort((a, b) => IMPACTOS.indexOf(a.impact) - IMPACTOS.indexOf(b.impact) || b.nodos - a.nodos)) {
    console.log(`  ${regla.impact.padEnd(8)} ${regla.id}: ${regla.nodos} nodos en ${regla.pantallas.size} pantallas · ${regla.help}`)
    if (opciones.detalle) {
      for (const e of regla.ejemplos) console.log(`           ${e.target}\n             ${e.resumen?.split('\n').slice(0, 3).join(' | ')}`)
    }
  }
  const dudosos = informe.reduce((t, e) => t + (e.contrasteDudoso?.length ?? 0), 0)
  console.log(`\nContraste que axe no pudo decidir (incomplete): ${dudosos} nodos; se revisan con e2e/contraste.mjs.`)
  console.log(
    `Total: ${informe.length} análisis · críticas ${total.critical} · serias ${total.serious} · moderadas ${total.moderate} · menores ${total.minor}` +
      (errores.length ? ` · ${errores.length} análisis no terminaron` : ''),
  )

  await mkdir(SALIDA, { recursive: true })
  const archivo = path.join(SALIDA, 'a11y.json')
  await writeFile(archivo, JSON.stringify(informe, null, 2))
  console.log(`Detalle: ${path.relative(process.cwd(), archivo)}`)
  process.exit(total.critical + total.serious > 0 || errores.length > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error(error.message ?? error)
  process.exit(1)
})
