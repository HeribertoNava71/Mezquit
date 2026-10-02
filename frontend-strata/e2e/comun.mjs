// Piezas comunes de los recorridos de QA de la Fase 8 (e2e/a11y.mjs y e2e/recorrido.mjs):
// escenarios con su mock, rutas por escenario, contextos de Playwright con los mocks
// instalados, espera de carga y registro de la consola.
//
// Los escenarios son los JSON de e2e/mocks (scripts/captura.mjs, --mock). Ninguna ruta
// necesita backend: /api/* y /sanctum/* se responden desde el mock.

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { crearBuscador, instalarMocks } from '../scripts/captura.mjs'

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const SALIDA = path.join(RAIZ, '.capturas')
export const URL_POR_DEFECTO = 'http://localhost:5188'

/** Tokens de las invitaciones de los mocks del candidato (claves «//» de cada JSON). */
const TOKEN_PENDIENTE = 'Lvpx1u6OcvNbil7ZnhYuLFbhCbZ1PGcQ42CVRM9p'

/**
 * Rutas del recorrido. `escenario` es el nombre del mock (e2e/mocks/<escenario>.json),
 * `destino` la ruta a la que se espera llegar si hay redirección y `extra` marca los
 * estados adicionales (vacío, error, 403, 409, 404) que no pide la lista mínima.
 */
export const RUTAS = [
  // Visitante
  { escenario: 'visitante', ruta: '/' },
  { escenario: 'visitante', ruta: '/pruebas' },
  { escenario: 'visitante', ruta: '/pruebas/adaptabilidad' },
  { escenario: 'visitante', ruta: '/pruebas/no-existe', extra: true },
  { escenario: 'visitante', ruta: '/como-funciona' },
  { escenario: 'visitante', ruta: '/precios' },
  { escenario: 'visitante', ruta: '/demo' },
  { escenario: 'visitante', ruta: '/ayuda' },
  { escenario: 'visitante', ruta: '/aviso-de-privacidad' },
  { escenario: 'visitante', ruta: '/terminos' },
  { escenario: 'visitante', ruta: '/login' },
  { escenario: 'visitante', ruta: '/registro' },
  { escenario: 'visitante', ruta: '/evaluar' },
  { escenario: 'visitante', ruta: '/esta-ruta-no-existe' },
  { escenario: 'visitante', ruta: '/app', destino: '/login', extra: true },
  // Candidato y sus variantes
  { escenario: 'candidato', ruta: `/evaluar/${TOKEN_PENDIENTE}` },
  { escenario: 'candidato-iniciada', ruta: '/evaluar/ZhHwe34SEscc4zaPFEK512IHnEygYZJa4TXXj92e' },
  { escenario: 'candidato-completada', ruta: '/evaluar/qjiK6mB4UN3VvExM1mez4KN5UAV7xJmbeUssAeME' },
  { escenario: 'candidato-expirada', ruta: '/evaluar/OgpzND7tD3NaZsGIjV5KPVCu8wMuqenvIJCL8pj8' },
  { escenario: 'candidato-404', ruta: '/evaluar/token-inexistente' },
  { escenario: 'candidato-sin-red', ruta: `/evaluar/${TOKEN_PENDIENTE}` },
  // RR. HH.
  { escenario: 'rh', ruta: '/app' },
  { escenario: 'rh', ruta: '/app/pruebas' },
  { escenario: 'rh', ruta: '/app/creditos' },
  { escenario: 'rh', ruta: '/app/evaluaciones' },
  { escenario: 'rh', ruta: '/app/evaluaciones/nueva' },
  { escenario: 'rh', ruta: '/app/evaluaciones/13' },
  { escenario: 'rh', ruta: '/app/evaluaciones/13/comparar' },
  { escenario: 'rh', ruta: '/app/candidatos/41/reporte' },
  { escenario: 'rh', ruta: '/perfil' },
  { escenario: 'rh', ruta: '/app/evaluaciones/17/comparar', extra: true },
  { escenario: 'rh', ruta: '/app/candidatos/24/reporte', extra: true },
  { escenario: 'rh', ruta: '/app/candidatos/44/reporte', extra: true },
  { escenario: 'rh', ruta: '/app/candidatos/50/reporte', extra: true },
  { escenario: 'rh', ruta: '/app/evaluaciones/999', extra: true },
  { escenario: 'rh-vacio', ruta: '/app', extra: true },
  { escenario: 'rh-vacio', ruta: '/app/evaluaciones', extra: true },
  { escenario: 'rh-vacio', ruta: '/app/creditos', extra: true },
  { escenario: 'rh-error', ruta: '/app', extra: true },
  { escenario: 'rh-error', ruta: '/app/evaluaciones', extra: true },
  { escenario: 'rh-error', ruta: '/app/creditos', extra: true },
  { escenario: 'rh-error', ruta: '/app/evaluaciones/13', extra: true },
  { escenario: 'rh-sesion-vencida', ruta: '/app', destino: '/login', extra: true },
  // Super admin
  { escenario: 'admin', ruta: '/admin/creditos' },
  { escenario: 'admin', ruta: '/admin/usuarios' },
  { escenario: 'admin', ruta: '/admin/usuarios/34' },
  { escenario: 'admin', ruta: '/admin/perfil' },
  // Sin organización
  { escenario: 'sin-org', ruta: '/perfil' },
  { escenario: 'sin-org', ruta: '/app', destino: '/perfil' },
]

/** Rutas filtradas por las opciones --solo-minimas, --escenario y --ruta. */
export function filtrarRutas({ minimas = false, escenario = null, ruta = null } = {}) {
  return RUTAS.filter(
    (r) => (!minimas || !r.extra) && (!escenario || r.escenario === escenario) && (!ruta || r.ruta === ruta),
  )
}

/** Nombre legible y apto para archivos: «rh__app_evaluaciones_13». */
export function nombreDeRuta({ escenario, ruta }) {
  const limpia = ruta === '/' ? 'inicio' : ruta.replace(/^\//, '').replace(/[^\w-]+/g, '_').slice(0, 48)
  return `${escenario}__${limpia}`
}

const cacheMocks = new Map()

/** Buscador de respuestas del mock de un escenario (cacheado). */
export async function buscadorDe(escenario) {
  if (!cacheMocks.has(escenario)) {
    const archivo = path.join(RAIZ, 'e2e', 'mocks', `${escenario}.json`)
    cacheMocks.set(escenario, crearBuscador(JSON.parse(await readFile(archivo, 'utf8'))))
  }
  return cacheMocks.get(escenario)
}

/**
 * Contexto de Playwright con el mock del escenario. Por defecto emula
 * prefers-reduced-motion: reduce, para que las entradas terminen al instante y
 * axe no mida colores a mitad de un fundido.
 */
export async function nuevoContexto(browser, escenario, { ancho = 1440, alto = 900, reducido = true } = {}) {
  const context = await browser.newContext({
    viewport: { width: ancho, height: alto },
    deviceScaleFactor: 1,
    locale: 'es-MX',
    reducedMotion: reducido ? 'reduce' : 'no-preference',
  })
  await instalarMocks(context, await buscadorDe(escenario))
  return context
}

/** Espera a que la ruta termine de cargar: red quieta, fuentes y sin estados de carga. */
export async function esperarCarga(page, { espera = 300 } = {}) {
  await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {})
  await page.evaluate(() => document.fonts.ready).catch(() => {})
  await page
    .waitForFunction(() => !document.querySelector('.st-carga, .st-cand-frame__estado'), null, { timeout: 8_000 })
    .catch(() => {})
  if (espera > 0) await page.waitForTimeout(espera)
}

/** Abre la ruta y espera la carga. Devuelve la ruta final (pathname). */
export async function abrir(page, url, ruta, opciones) {
  await page.goto(`${url}${ruta}`, { waitUntil: 'domcontentloaded', timeout: 45_000 })
  await esperarCarga(page, opciones)
  return new URL(page.url()).pathname
}

/**
 * Mensajes de consola esperados: los 401 de GET /api/user (visitante o sesión
 * vencida) y las respuestas de error que el mock da a propósito (404, 403, 409,
 * 422, 500) y las fallas de red de candidato-sin-red. Chromium los anota como
 * «Failed to load resource». Devuelve el motivo o null si el mensaje no es esperado.
 */
export function motivoEsperado(texto, url, escenario) {
  if (!texto.startsWith('Failed to load resource')) return null
  const codigo = texto.match(/status of (\d{3})/)?.[1]
  if (texto.includes('net::ERR_') && escenario === 'candidato-sin-red') return 'falla de red simulada (candidato-sin-red)'
  if (!codigo) return null
  const api = /\/(api|sanctum)\//.test(url)
  if (!api) return null
  if (codigo === '401') return `401 de ${new URL(url).pathname} (${escenario === 'rh-sesion-vencida' ? 'sesión vencida' : 'sin sesión'})`
  return `${codigo} de ${new URL(url).pathname} (respuesta del mock)`
}

/**
 * Registra console.error, console.warn y pageerror de la página. Los mensajes
 * esperados (motivoEsperado) se cuentan aparte.
 */
export function vigilarConsola(page, { escenario, etiqueta }, registro) {
  page.on('pageerror', (error) => registro.problemas.push({ etiqueta, tipo: 'pageerror', texto: error.message }))
  page.on('console', (mensaje) => {
    const tipo = mensaje.type()
    if (tipo !== 'error' && tipo !== 'warning') return
    const texto = mensaje.text()
    const url = mensaje.location()?.url ?? ''
    const motivo = motivoEsperado(texto, url, escenario)
    if (motivo) {
      registro.esperados.set(motivo, (registro.esperados.get(motivo) ?? 0) + 1)
      return
    }
    registro.problemas.push({ etiqueta, tipo: `console.${tipo}`, texto: `${texto}${url ? ` (${url})` : ''}` })
  })
}

/** Lee --opcion valor de argv. */
export function leerOpciones(argv, definicion) {
  const opciones = Object.fromEntries(Object.entries(definicion).map(([clave, { porDefecto }]) => [clave, porDefecto]))
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const clave = arg.replace(/^--/, '')
    const def = definicion[clave]
    if (!arg.startsWith('--') || !def) {
      console.error(`Opción desconocida: ${arg}\nOpciones: ${Object.keys(definicion).map((c) => `--${c}`).join(' ')}`)
      process.exit(1)
    }
    if (def.bandera) opciones[clave] = true
    else opciones[clave] = def.convertir ? def.convertir(argv[++i]) : argv[++i]
  }
  return opciones
}
