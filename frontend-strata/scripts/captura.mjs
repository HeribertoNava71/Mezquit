// Capturas de página completa con Playwright (Chromium), para comparar con el prototipo.
//
// Uso:
//   node scripts/captura.mjs <url> <nombre> [anchos=1440,360] [opciones]
//
// Ejemplos:
//   node scripts/captura.mjs http://localhost:5173/ inicio
//   node scripts/captura.mjs http://localhost:5173/app rh-resumen 1440,768,360 --mock capturas/rh.json
//
// Guarda .capturas/<nombre>-<ancho>.png dentro de frontend-strata/ (carpeta ignorada por git).
// Requiere el sitio corriendo (npm run dev) y Chromium (npx playwright install chromium).
//
// Opciones:
//   --mock <archivo.json>  Responde /api/* y /sanctum/* sin backend. Formato:
//                            {
//                              "GET /api/user": { "status": 200, "body": { "id": 1, "name": "Ana" } },
//                              "GET /api/credits": { "body": { "balance": 12 } },
//                              "POST /api/leads": { "status": 422, "body": { "errors": {} } },
//                              "GET /api/assessments/*": { "body": [] }
//                            }
//                          Clave: «MÉTODO /ruta», con o sin ?query; * es comodín dentro de la ruta.
//                          status por defecto 200; headers opcional.
//                          Sin entrada: GET /sanctum/csrf-cookie → 204 (para que csrf() no falle),
//                          /api/user → 401 (sin sesión) y lo demás → 404. Cada caso se avisa en consola.
//   --espera <ms>          Pausa extra tras cargar, antes de capturar (por defecto 700).
//   --alto <px>            Alto de la ventana (por defecto 900); la captura es de página completa.
//   --con-movimiento       No emula prefers-reduced-motion (por defecto se emula «reduce»
//                          para que las animaciones terminen al instante y la captura sea estable).

import { chromium } from '@playwright/test'
import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SALIDA = path.join(RAIZ, '.capturas')
const USO = 'Uso: node scripts/captura.mjs <url> <nombre> [anchos=1440,360] [--mock archivo.json] [--espera ms] [--alto px] [--con-movimiento]'

function salirConError(mensaje) {
  console.error(mensaje)
  console.error(USO)
  process.exit(1)
}

function leerArgumentos(argv) {
  const posicionales = []
  const opciones = { mock: null, espera: 700, alto: 900, movimiento: false }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--mock') opciones.mock = argv[++i]
    else if (arg === '--espera') opciones.espera = Number(argv[++i])
    else if (arg === '--alto') opciones.alto = Number(argv[++i])
    else if (arg === '--con-movimiento') opciones.movimiento = true
    else if (arg === '--ayuda' || arg === '-h') {
      console.log(USO)
      process.exit(0)
    } else if (arg.startsWith('--')) salirConError(`Opción desconocida: ${arg}`)
    else posicionales.push(arg)
  }

  const [url, nombre, anchosTexto = '1440,360'] = posicionales
  if (!url || !nombre) salirConError('Faltan la URL o el nombre.')
  try {
    new URL(url)
  } catch {
    salirConError(`URL no válida: ${url}`)
  }
  if (!/^[\w.-]+$/.test(nombre)) salirConError('El nombre solo admite letras, números, punto, guion y guion bajo.')

  const anchos = anchosTexto.split(',').map((n) => Number(n.trim()))
  if (anchos.length === 0 || anchos.some((n) => !Number.isInteger(n) || n < 200 || n > 4000)) {
    salirConError(`Anchos no válidos: ${anchosTexto} (enteros entre 200 y 4000, separados por coma).`)
  }
  if (!Number.isFinite(opciones.espera) || opciones.espera < 0) salirConError('--espera debe ser un número de milisegundos.')
  if (!Number.isInteger(opciones.alto) || opciones.alto < 200) salirConError('--alto debe ser un entero de 200 o más.')
  if (opciones.mock === undefined) salirConError('--mock necesita la ruta de un archivo JSON.')

  return { url, nombre, anchos, ...opciones }
}

const escaparRegExp = (texto) => texto.replace(/[.+?^${}()|[\]\\]/g, '\\$&')

function crearBuscador(mocks) {
  const entradas = Object.entries(mocks).map(([clave, respuesta]) => {
    const [metodo = '', ...resto] = clave.trim().split(/\s+/)
    const ruta = resto.join(' ')
    if (!metodo || !ruta.startsWith('/')) throw new Error(`Clave de mock no válida: «${clave}». Usa «MÉTODO /ruta».`)
    const patron = ruta.includes('*')
      ? new RegExp(`^${ruta.split('*').map(escaparRegExp).join('.*')}$`)
      : null
    return { metodo: metodo.toUpperCase(), ruta, patron, respuesta }
  })

  return (metodo, ruta, rutaConQuery) =>
    entradas.find((e) => e.metodo === metodo && (e.ruta === rutaConQuery || e.ruta === ruta)) ??
    entradas.find((e) => e.metodo === metodo && e.patron && (e.patron.test(rutaConQuery) || e.patron.test(ruta)))
}

async function cargarMocks(archivo) {
  const ruta = path.resolve(process.cwd(), archivo)
  let datos
  try {
    datos = JSON.parse(await readFile(ruta, 'utf8'))
  } catch (error) {
    salirConError(`No se pudo leer el JSON de --mock (${ruta}): ${error.message}`)
  }
  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) salirConError('El JSON de --mock debe ser un objeto { "GET /api/…": { status, body } }.')
  return crearBuscador(datos)
}

async function instalarMocks(context, buscar) {
  const esApi = (url) => /^\/(api|sanctum)(\/|$)/.test(url.pathname)

  await context.route(esApi, async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const metodo = request.method().toUpperCase()
    const encabezados = await request.allHeaders()
    const cors = {
      'access-control-allow-origin': encabezados.origin ?? '*',
      'access-control-allow-credentials': 'true',
      'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'access-control-allow-headers': encabezados['access-control-request-headers'] ?? 'accept, content-type, x-xsrf-token, x-requested-with',
      vary: 'Origin',
    }

    if (metodo === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: cors })
      return
    }

    const entrada = buscar(metodo, url.pathname, url.pathname + url.search)
    let status
    let body
    let headers = {}

    if (entrada) {
      status = entrada.respuesta?.status ?? 200
      body = entrada.respuesta?.body
      headers = entrada.respuesta?.headers ?? {}
    } else if (metodo === 'GET' && url.pathname === '/sanctum/csrf-cookie') {
      status = 204
    } else if (url.pathname === '/api/user') {
      status = 401
      body = { message: 'Unauthenticated.' }
      console.warn(`[mock] ${metodo} ${url.pathname} sin entrada → 401`)
    } else {
      status = 404
      body = { message: 'Not Found' }
      console.warn(`[mock] ${metodo} ${url.pathname}${url.search} sin entrada → 404`)
    }

    const sinCuerpo = status === 204 || status === 304 || body === undefined
    await route.fulfill({
      status,
      headers: { ...cors, ...(sinCuerpo ? {} : { 'content-type': 'application/json' }), ...headers },
      body: sinCuerpo ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
    })
  })
}

async function main() {
  const opciones = leerArgumentos(process.argv.slice(2))
  const buscar = opciones.mock ? await cargarMocks(opciones.mock) : null
  await mkdir(SALIDA, { recursive: true })

  const browser = await chromium.launch()
  try {
    const context = await browser.newContext({
      deviceScaleFactor: 1,
      locale: 'es-MX',
      reducedMotion: opciones.movimiento ? 'no-preference' : 'reduce',
    })
    if (buscar) await instalarMocks(context, buscar)

    for (const ancho of opciones.anchos) {
      const page = await context.newPage()
      await page.setViewportSize({ width: ancho, height: opciones.alto })
      page.on('pageerror', (error) => console.warn(`[página ${ancho}px] ${error.message}`))
      try {
        await page.goto(opciones.url, { waitUntil: 'networkidle', timeout: 45_000 })
      } catch (error) {
        throw new Error(`No se pudo abrir ${opciones.url} (¿está corriendo npm run dev?): ${error.message}`)
      }
      await page.evaluate(() => document.fonts.ready)
      if (opciones.espera > 0) await page.waitForTimeout(opciones.espera)

      const archivo = path.join(SALIDA, `${opciones.nombre}-${ancho}.png`)
      await page.screenshot({ path: archivo, fullPage: true })
      console.log(`Captura: ${path.relative(RAIZ, archivo)}`)
      await page.close()
    }
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  console.error(error.message ?? error)
  process.exit(1)
})
