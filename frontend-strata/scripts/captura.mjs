// Capturas de página completa con Playwright (Chromium), para comparar con el prototipo.
//
// Uso:
//   node scripts/captura.mjs <url> <nombre> [anchos=1440,360] [opciones]
//   node scripts/captura.mjs --validar [archivo.json | carpeta ...] [--probar "MÉTODO /ruta" ...]
//
// Ejemplos:
//   node scripts/captura.mjs http://localhost:5173/ inicio
//   node scripts/captura.mjs http://localhost:5173/app rh-resumen 1440,768,360 --mock e2e/mocks/rh.json
//   node scripts/captura.mjs --validar
//   node scripts/captura.mjs --validar e2e/mocks/rh.json --probar "GET /api/assessments/13/compare"
//
// Guarda .capturas/<nombre>-<ancho>.png dentro de frontend-strata/ (carpeta ignorada por git).
// Requiere el sitio corriendo (npm run dev) y Chromium (npx playwright install chromium).
// --validar no abre el navegador ni necesita el sitio.
//
// Escenarios listos en e2e/mocks/: visitante, rh, rh-vacio, rh-error, rh-sesion-vencida, admin,
// sin-org y candidato (más sus variantes). Las claves «//» de cada JSON dicen qué rutas capturar.
//
// Opciones:
//   --mock <archivo.json>  Responde /api/* y /sanctum/* sin backend. Formato:
//                            {
//                              "//": "Comentario: se ignora toda clave que empiece con //.",
//                              "GET /api/user": { "status": 200, "body": { "id": 1, "name": "Ana" } },
//                              "GET /api/credits": { "body": { "data": { "balance": 12 } } },
//                              "POST /api/leads": { "status": 422, "body": { "errors": {} } },
//                              "GET /api/assessments/13": { "body": { "data": { "id": 13 } } },
//                              "GET /api/assessments/:id": { "status": 404, "body": { "message": "" } },
//                              "GET /api/admin/users?page=2": { "body": { "data": { "items": [] } } },
//                              "GET /api/evaluar/*": { "abortar": "internetdisconnected" }
//                            }
//                          Clave: «MÉTODO /ruta», con ?consulta opcional.
//                            · :nombre ocupa un segmento completo: /api/assessments/:id no alcanza
//                              /api/assessments/13/compare. * es cualquier texto, barras incluidas.
//                            · ?a=1&b=2 pide esos parámetros, en cualquier orden; la petición puede
//                              traer otros. ?a=* pide que a exista, con cualquier valor.
//                            · Si coinciden varias claves, gana la más específica: ruta literal antes
//                              que patrón; entre patrones, menos *, menos :nombre y más texto literal;
//                              después, la consulta más exigente; al final, el orden del archivo.
//                          Respuesta: { status (200 por defecto), body, headers } o
//                          { abortar: true | "<código de route.abort()>" } para simular una falla
//                          de red (true equivale a "failed").
//                          Sin entrada: GET /sanctum/csrf-cookie → 204 (para que csrf() no falle),
//                          /api/user → 401 (sin sesión) y lo demás → 404. Cada caso se avisa en consola.
//                          El archivo se revisa al cargarlo, igual que con --validar.
//   --validar [rutas]      Revisa archivos .json o carpetas (por defecto, e2e/mocks) sin abrir el
//                          navegador: claves, métodos, status, headers, abortar y claves repetidas.
//                          Termina con código 1 si hay errores.
//   --probar "MÉTODO /ruta?consulta"
//                          Con --validar: dice qué entrada respondería esa petición en cada archivo.
//                          Se puede repetir.
//   --espera <ms>          Pausa extra tras cargar, antes de capturar (por defecto 700).
//   --alto <px>            Alto de la ventana (por defecto 900); la captura es de página completa.
//   --con-movimiento       No emula prefers-reduced-motion (por defecto se emula «reduce»
//                          para que las animaciones terminen al instante y la captura sea estable).
//   --clic <selector>      Antes de capturar, hace clic en el primer elemento visible que coincide
//                          (selector de Playwright: CSS, «text=…», «role=button[name="Menú"]»…).
//                          Se puede repetir; los clics van en orden. Si en un ancho el elemento no
//                          se ve (p. ej., el botón del menú móvil a 1440 px), avisa y captura sin él.
//   --ventana              Captura solo la ventana visible, no la página completa (útil con menús
//                          que miden el alto de la ventana, como el panel del menú móvil).
//
// Ejemplo con clic (menú móvil abierto a 360 px):
//   node scripts/captura.mjs http://localhost:5173/app rh-menu 360 --mock e2e/mocks/rh.json \
//     --clic ".st-mobile-menu__toggle" --ventana
//
// El formato y la coincidencia de los mocks viven en mock/coincidencias.mjs (los
// comparten este script, e2e/flujos/api.ts y el modo demo de npm run dev:mock).
// También se puede importar: crearBuscador y revisarMocks (de ese módulo) e instalarMocks.

import { chromium } from '@playwright/test'
import { mkdir, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  METODOS,
  crearBuscador,
  esApi,
  leerArchivoDeMocks,
  respuestaPorDefecto,
  revisarMocks,
} from '../mock/coincidencias.mjs'

export { crearBuscador, revisarMocks }

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SALIDA = path.join(RAIZ, '.capturas')
const MOCKS = path.join(RAIZ, 'e2e', 'mocks')
const USO = [
  'Uso: node scripts/captura.mjs <url> <nombre> [anchos=1440,360] [--mock archivo.json] [--espera ms] [--alto px] [--con-movimiento] [--clic selector ...] [--ventana]',
  '     node scripts/captura.mjs --validar [archivo.json | carpeta ...] [--probar "MÉTODO /ruta" ...]',
].join('\n')

function salirConError(mensaje) {
  console.error(mensaje)
  console.error(USO)
  process.exit(1)
}

function leerArgumentos(argv) {
  const posicionales = []
  const opciones = {
    mock: null,
    espera: 700,
    alto: 900,
    movimiento: false,
    validar: false,
    probar: [],
    clics: [],
    ventana: false,
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--mock') opciones.mock = argv[++i]
    else if (arg === '--espera') opciones.espera = Number(argv[++i])
    else if (arg === '--alto') opciones.alto = Number(argv[++i])
    else if (arg === '--con-movimiento') opciones.movimiento = true
    else if (arg === '--clic') opciones.clics.push(argv[++i])
    else if (arg === '--ventana') opciones.ventana = true
    else if (arg === '--validar') opciones.validar = true
    else if (arg === '--probar') opciones.probar.push(argv[++i])
    else if (arg === '--ayuda' || arg === '-h') {
      console.log(USO)
      process.exit(0)
    } else if (arg.startsWith('--')) salirConError(`Opción desconocida: ${arg}`)
    else posicionales.push(arg)
  }

  if (opciones.validar) {
    if (opciones.probar.some((peticion) => !peticion)) salirConError('--probar necesita una petición, p. ej. "GET /api/user".')
    if (opciones.mock === undefined) salirConError('--mock necesita la ruta de un archivo JSON.')
    if (opciones.clics.length > 0 || opciones.ventana) salirConError('--clic y --ventana no se usan con --validar.')
    return { ...opciones, rutas: opciones.mock ? [...posicionales, opciones.mock] : posicionales }
  }
  if (opciones.probar.length > 0) salirConError('--probar solo se usa con --validar.')
  if (opciones.clics.some((selector) => !selector || selector.startsWith('--'))) {
    salirConError('--clic necesita un selector, p. ej. --clic ".st-mobile-menu__toggle".')
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

function describirPeticion(buscar, peticion) {
  const [metodoTexto = '', ...resto] = peticion.trim().split(/\s+/)
  const metodo = metodoTexto.toUpperCase()
  const destino = resto.join(' ')
  if (!METODOS.includes(metodo) || !destino.startsWith('/')) return `«${peticion}»: escribe «MÉTODO /ruta».`

  const url = new URL(destino, 'http://localhost')
  if (!esApi(url.pathname)) return `${metodo} ${destino} → el script no la intercepta (solo /api y /sanctum).`
  const entrada = buscar(metodo, url)
  const respuesta = entrada ? entrada.respuesta : respuestaPorDefecto(metodo, url.pathname)
  const resultado = respuesta.abortar !== undefined
    ? `falla de red (${respuesta.abortar === true ? 'failed' : respuesta.abortar})`
    : String(respuesta.status ?? 200)
  return `${metodo} ${destino} → ${resultado} ${entrada ? `(«${entrada.clave}»)` : '(sin entrada: respuesta por defecto)'}`
}

async function listarArchivos(rutas) {
  const archivos = []
  for (const ruta of rutas) {
    const absoluta = path.resolve(process.cwd(), ruta)
    let info
    try {
      info = await stat(absoluta)
    } catch {
      salirConError(`No existe: ${absoluta}`)
    }
    if (info.isDirectory()) {
      const nombres = (await readdir(absoluta)).filter((nombre) => nombre.toLowerCase().endsWith('.json')).sort()
      archivos.push(...nombres.map((nombre) => path.join(absoluta, nombre)))
    } else {
      archivos.push(absoluta)
    }
  }
  return archivos
}

async function validar({ rutas, probar }) {
  const archivos = await listarArchivos(rutas.length > 0 ? rutas : [MOCKS])
  if (archivos.length === 0) salirConError('No hay archivos .json que revisar.')

  let conErrores = 0
  for (const archivo of archivos) {
    const nombre = path.relative(process.cwd(), archivo) || archivo
    let revision
    try {
      revision = await leerArchivoDeMocks(archivo)
    } catch (error) {
      console.error(`ERROR ${nombre}: ${error.message}`)
      conErrores++
      continue
    }

    const { datos, errores, avisos, resumen } = revision
    console.log(`${errores.length > 0 ? 'ERROR' : 'ok'} ${nombre}: ${resumen.entradas} entradas (${resumen.patrones} con patrón) y ${resumen.comentarios} comentarios`)
    for (const error of errores) console.log(`    error: ${error}`)
    for (const aviso of avisos) console.log(`    aviso: ${aviso}`)
    if (errores.length > 0) {
      conErrores++
      continue
    }
    if (probar.length > 0) {
      const buscar = crearBuscador(datos)
      for (const peticion of probar) console.log(`    ${describirPeticion(buscar, peticion)}`)
    }
  }

  if (conErrores > 0) {
    console.error(`${conErrores} de ${archivos.length} archivos con errores.`)
    process.exit(1)
  }
  console.log(`${archivos.length} archivos sin errores.`)
}

async function cargarMocks(archivo) {
  const ruta = path.resolve(process.cwd(), archivo)
  let revision
  try {
    revision = await leerArchivoDeMocks(ruta)
  } catch (error) {
    salirConError(`No se pudo leer el JSON de --mock (${ruta}): ${error.message}`)
  }
  const { datos, errores, avisos } = revision
  for (const aviso of avisos) console.warn(`[mock] aviso: ${aviso}`)
  if (errores.length > 0) salirConError(`El JSON de --mock tiene errores (${ruta}):\n  ${errores.join('\n  ')}`)
  return crearBuscador(datos)
}

/** Responde /api/* y /sanctum/* de un contexto (o una página) de Playwright con buscar. */
export async function instalarMocks(context, buscar) {
  await context.route((url) => esApi(url.pathname), async (route) => {
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

    const entrada = buscar(metodo, url)
    const respuesta = entrada ? entrada.respuesta : respuestaPorDefecto(metodo, url.pathname)
    if (!entrada && respuesta.avisar) console.warn(`[mock] ${metodo} ${url.pathname}${url.search} sin entrada → ${respuesta.status}`)

    if (respuesta.abortar !== undefined) {
      await route.abort(respuesta.abortar === true ? 'failed' : respuesta.abortar)
      return
    }

    const status = respuesta.status ?? 200
    const { body } = respuesta
    const sinCuerpo = status === 204 || status === 304 || body === undefined
    await route.fulfill({
      status,
      headers: { ...cors, ...(sinCuerpo ? {} : { 'content-type': 'application/json' }), ...(respuesta.headers ?? {}) },
      body: sinCuerpo ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
    })
  })
}

async function main() {
  const opciones = leerArgumentos(process.argv.slice(2))
  if (opciones.validar) {
    await validar(opciones)
    return
  }

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

      for (const selector of opciones.clics) {
        const objetivo = page.locator(selector).filter({ visible: true }).first()
        try {
          await objetivo.waitFor({ state: 'visible', timeout: 3_000 })
        } catch {
          console.warn(`[página ${ancho}px] --clic: «${selector}» no se ve en este ancho; se captura sin ese clic.`)
          continue
        }
        await objetivo.click()
        // Tras el clic, deja que React pinte y que las peticiones que dispare terminen.
        await page.waitForLoadState('networkidle').catch(() => {})
        if (opciones.espera > 0) await page.waitForTimeout(opciones.espera)
      }

      const archivo = path.join(SALIDA, `${opciones.nombre}-${ancho}.png`)
      await page.screenshot({ path: archivo, fullPage: !opciones.ventana })
      console.log(`Captura: ${path.relative(RAIZ, archivo)}`)
      await page.close()
    }
  } finally {
    await browser.close()
  }
}

// Solo corre como programa: importarlo (por ejemplo, desde una prueba) no abre el navegador.
const ejecutado = process.argv[1] ? path.resolve(process.argv[1]) : ''
const esteArchivo = fileURLToPath(import.meta.url)
if (process.platform === 'win32' ? ejecutado.toLowerCase() === esteArchivo.toLowerCase() : ejecutado === esteArchivo) {
  main().catch((error) => {
    console.error(error.message ?? error)
    process.exit(1)
  })
}
