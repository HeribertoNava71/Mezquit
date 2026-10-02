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
// También se puede importar: crearBuscador, instalarMocks y revisarMocks.

import { chromium } from '@playwright/test'
import { mkdir, readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SALIDA = path.join(RAIZ, '.capturas')
const MOCKS = path.join(RAIZ, 'e2e', 'mocks')
const USO = [
  'Uso: node scripts/captura.mjs <url> <nombre> [anchos=1440,360] [--mock archivo.json] [--espera ms] [--alto px] [--con-movimiento] [--clic selector ...] [--ventana]',
  '     node scripts/captura.mjs --validar [archivo.json | carpeta ...] [--probar "MÉTODO /ruta" ...]',
].join('\n')

// Métodos de las claves. OPTIONS no: la respuesta previa de CORS es automática.
const METODOS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD']
const CAMPOS = ['status', 'body', 'headers', 'abortar']
// Códigos que acepta route.abort() de Playwright.
const ERRORES_DE_RED = [
  'aborted', 'accessdenied', 'addressunreachable', 'blockedbyclient', 'blockedbyresponse',
  'connectionaborted', 'connectionclosed', 'connectionfailed', 'connectionrefused',
  'connectionreset', 'internetdisconnected', 'namenotresolved', 'timedout', 'failed',
]

const esApi = (pathname) => /^\/(api|sanctum)(\/|$)/.test(pathname)
const esComentario = (clave) => clave.trimStart().startsWith('//')
const esObjeto = (valor) => typeof valor === 'object' && valor !== null && !Array.isArray(valor)

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

const escaparRegExp = (texto) => texto.replace(/[.+?^${}()|[\]\\]/g, '\\$&')

// «MÉTODO /ruta?consulta» → { metodo, ruta, patron, consulta, prioridad, firma }.
function compilarClave(clave) {
  const [metodoTexto = '', ...resto] = clave.trim().split(/\s+/)
  const metodo = metodoTexto.toUpperCase()
  const destino = resto.join(' ')
  if (!METODOS.includes(metodo) || !destino.startsWith('/')) {
    throw new Error(`Clave no válida: «${clave}». Usa «MÉTODO /ruta», con MÉTODO en ${METODOS.join(', ')}.`)
  }
  const corte = destino.indexOf('?')
  const ruta = corte === -1 ? destino : destino.slice(0, corte)
  const consulta = corte === -1 ? [] : [...new URLSearchParams(destino.slice(corte + 1))]

  // En el split, las partes impares son * o :nombre (este, solo como segmento completo).
  let fuente = ''
  let literal = 0
  let comodines = 0
  let parametros = 0
  ruta.split(/(\*|(?<=\/):[A-Za-z_]\w*(?=\/|$))/).forEach((parte, i) => {
    if (i % 2 === 0) {
      fuente += escaparRegExp(parte)
      literal += parte.length
    } else if (parte === '*') {
      fuente += '.*'
      comodines++
    } else {
      fuente += '[^/]+'
      parametros++
    }
  })
  const esPatron = comodines + parametros > 0
  const exigencia = consulta.reduce((total, [, valor]) => total + (valor === '*' ? 1 : 2), 0)

  return {
    clave,
    metodo,
    ruta,
    patron: esPatron ? new RegExp(`^${fuente}$`) : null,
    consulta,
    // Menor es más específica; se compara elemento por elemento.
    prioridad: [esPatron ? 1 : 0, comodines, parametros, -literal, -exigencia],
    // La misma petición escrita de otra forma (por ejemplo, con la consulta en otro orden).
    firma: `${metodo} ${ruta}?${consulta.map(([nombre, valor]) => `${nombre}=${valor}`).sort().join('&')}`,
  }
}

function compararPrioridad(a, b) {
  for (let i = 0; i < a.prioridad.length; i++) {
    if (a.prioridad[i] !== b.prioridad[i]) return a.prioridad[i] - b.prioridad[i]
  }
  return a.indice - b.indice
}

function coincide(entrada, metodo, ruta, parametros) {
  if (entrada.metodo !== metodo) return false
  if (entrada.patron ? !entrada.patron.test(ruta) : entrada.ruta !== ruta) return false
  return entrada.consulta.every(([nombre, valor]) =>
    valor === '*' ? parametros.has(nombre) : parametros.getAll(nombre).includes(valor),
  )
}

function decodificarRuta(pathname) {
  try {
    return decodeURI(pathname)
  } catch {
    return pathname
  }
}

/** buscar(metodo, url) → la entrada más específica que responde esa petición, o undefined. */
export function crearBuscador(mocks) {
  const entradas = Object.entries(mocks)
    .filter(([clave]) => !esComentario(clave))
    .map(([clave, respuesta], indice) => ({ ...compilarClave(clave), respuesta, indice }))
    .sort(compararPrioridad)

  return (metodo, url) => {
    const ruta = decodificarRuta(url.pathname)
    return entradas.find((entrada) => coincide(entrada, metodo.toUpperCase(), ruta, url.searchParams))
  }
}

function respuestaPorDefecto(metodo, pathname) {
  if (metodo === 'GET' && pathname === '/sanctum/csrf-cookie') return { status: 204 }
  if (pathname === '/api/user') return { status: 401, body: { message: 'Unauthenticated.' }, avisar: true }
  return { status: 404, body: { message: 'Not Found' }, avisar: true }
}

function revisarRespuesta(clave, respuesta, errores, avisos) {
  const donde = `«${clave}»`
  if (!esObjeto(respuesta)) {
    errores.push(`${donde}: la respuesta debe ser un objeto { status, body, headers } o { abortar }.`)
    return
  }
  const desconocidos = Object.keys(respuesta).filter((campo) => !CAMPOS.includes(campo))
  if (desconocidos.length > 0) errores.push(`${donde}: campos desconocidos (${desconocidos.join(', ')}); los válidos son ${CAMPOS.join(', ')}.`)

  const { status, headers, abortar } = respuesta
  if (status !== undefined && !(Number.isInteger(status) && status >= 200 && status <= 599)) {
    errores.push(`${donde}: status debe ser un entero entre 200 y 599.`)
  }
  if (headers !== undefined && !(esObjeto(headers) && Object.values(headers).every((valor) => typeof valor === 'string'))) {
    errores.push(`${donde}: headers debe ser un objeto con valores de texto.`)
  }
  if (abortar !== undefined) {
    if (abortar !== true && !ERRORES_DE_RED.includes(abortar)) {
      errores.push(`${donde}: abortar debe ser true o uno de estos códigos: ${ERRORES_DE_RED.join(', ')}.`)
    }
    if (status !== undefined || headers !== undefined || 'body' in respuesta) avisos.push(`${donde}: con abortar se ignoran status, body y headers.`)
  } else if ((status === 204 || status === 304) && respuesta.body !== undefined) {
    avisos.push(`${donde}: un ${status} no lleva cuerpo; body se ignora.`)
  }
}

/**
 * Revisa un objeto de mocks. texto es el JSON original: sirve para encontrar claves
 * repetidas, que JSON.parse descarta en silencio (se queda con la última).
 */
export function revisarMocks(datos, texto = '') {
  const errores = []
  const avisos = []
  const resumen = { entradas: 0, patrones: 0, comentarios: 0 }
  if (!esObjeto(datos)) {
    errores.push('El JSON debe ser un objeto { "MÉTODO /ruta": { status, body } }.')
    return { errores, avisos, resumen }
  }

  const vistas = new Set()
  for (const [, clave] of texto.matchAll(/"((?:GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS) [^"\\]*|\/\/[^"\\]*)"\s*:/gi)) {
    if (vistas.has(clave)) (esComentario(clave) ? avisos : errores).push(`La clave «${clave}» está repetida; JSON.parse solo conserva la última.`)
    vistas.add(clave)
  }

  const firmas = new Map()
  for (const [clave, respuesta] of Object.entries(datos)) {
    if (esComentario(clave)) {
      resumen.comentarios++
      continue
    }
    let entrada
    try {
      entrada = compilarClave(clave)
    } catch (error) {
      errores.push(error.message)
      continue
    }
    resumen.entradas++
    if (entrada.patron) resumen.patrones++

    const prefijo = entrada.ruta.split(/[*:]/)[0]
    if (!esApi(prefijo) && !'/api/'.startsWith(prefijo) && !'/sanctum/'.startsWith(prefijo)) {
      avisos.push(`«${clave}»: el script solo responde /api y /sanctum; esta entrada nunca se usa.`)
    }
    const anterior = firmas.get(entrada.firma)
    if (anterior) errores.push(`«${clave}» repite la petición de «${anterior}».`)
    else firmas.set(entrada.firma, clave)

    revisarRespuesta(clave, respuesta, errores, avisos)
  }
  return { errores, avisos, resumen }
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
    let texto
    let datos
    try {
      texto = await readFile(archivo, 'utf8')
      datos = JSON.parse(texto)
    } catch (error) {
      console.error(`ERROR ${nombre}: ${error.message}`)
      conErrores++
      continue
    }

    const { errores, avisos, resumen } = revisarMocks(datos, texto)
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
  let texto
  let datos
  try {
    texto = await readFile(ruta, 'utf8')
    datos = JSON.parse(texto)
  } catch (error) {
    salirConError(`No se pudo leer el JSON de --mock (${ruta}): ${error.message}`)
  }
  const { errores, avisos } = revisarMocks(datos, texto)
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
