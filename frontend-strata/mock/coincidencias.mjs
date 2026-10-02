// Formato y coincidencia de los mocks de e2e/mocks: el mismo buscador para las
// capturas (scripts/captura.mjs), las pruebas de extremo a extremo
// (e2e/flujos/api.ts) y el modo demo sin backend (mock/plugin-mock.ts).
//
// Cada archivo es un objeto { "MÉTODO /ruta?consulta": respuesta }:
//   {
//     "//": "Comentario: se ignora toda clave que empiece con //.",
//     "GET /api/user": { "status": 200, "body": { "id": 1, "name": "Ana" } },
//     "GET /api/credits": { "body": { "data": { "balance": 12 } } },
//     "POST /api/leads": { "status": 422, "body": { "errors": {} } },
//     "GET /api/assessments/13": { "body": { "data": { "id": 13 } } },
//     "GET /api/assessments/:id": { "status": 404, "body": { "message": "" } },
//     "GET /api/admin/users?page=2": { "body": { "data": { "items": [] } } },
//     "GET /api/evaluar/*": { "abortar": "internetdisconnected" }
//   }
//
// Clave: «MÉTODO /ruta», con ?consulta opcional.
//   · :nombre ocupa un segmento completo: /api/assessments/:id no alcanza
//     /api/assessments/13/compare. * es cualquier texto, barras incluidas.
//   · ?a=1&b=2 pide esos parámetros, en cualquier orden; la petición puede
//     traer otros. ?a=* pide que a exista, con cualquier valor.
//   · Si coinciden varias claves, gana la más específica: ruta literal antes
//     que patrón; entre patrones, menos *, menos :nombre y más texto literal;
//     después, la consulta más exigente; al final, el orden del archivo.
// Respuesta: { status (200 por defecto), body, headers } o { abortar: true |
// "<código de route.abort()>" } para simular una falla de red (true equivale a
// "failed"). Sin entrada: GET /sanctum/csrf-cookie → 204, /api/user → 401 (sin
// sesión) y lo demás → 404 (respuestaPorDefecto).

import { readFile } from 'node:fs/promises'

/** Métodos de las claves. OPTIONS no: la respuesta previa de CORS es automática. */
export const METODOS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD']
const CAMPOS = ['status', 'body', 'headers', 'abortar']
/** Códigos que acepta route.abort() de Playwright (el valor de «abortar»). */
export const ERRORES_DE_RED = [
  'aborted', 'accessdenied', 'addressunreachable', 'blockedbyclient', 'blockedbyresponse',
  'connectionaborted', 'connectionclosed', 'connectionfailed', 'connectionrefused',
  'connectionreset', 'internetdisconnected', 'namenotresolved', 'timedout', 'failed',
]

/** /api y /sanctum, con sus subrutas: lo único que responden los mocks. */
export const esApi = (pathname) => /^\/(api|sanctum)(\/|$)/.test(pathname)
/** Las claves que empiezan con // son comentarios. */
export const esComentario = (clave) => clave.trimStart().startsWith('//')
const esObjeto = (valor) => typeof valor === 'object' && valor !== null && !Array.isArray(valor)

const escaparRegExp = (texto) => texto.replace(/[.+?^${}()|[\]\\]/g, '\\$&')

/** «MÉTODO /ruta?consulta» → { metodo, ruta, patron, consulta, prioridad, firma }. Lanza si la clave no es válida. */
export function compilarClave(clave) {
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

/** pathname con los %xx decodificados (como se escriben las claves); si no se puede, tal cual. */
export function decodificarRuta(pathname) {
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

/** Respuesta de una petición sin entrada. avisar: conviene decirlo en la consola. */
export function respuestaPorDefecto(metodo, pathname) {
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

/**
 * Lee, analiza y revisa un archivo de mocks. Lanza el error de lectura o de
 * JSON.parse tal cual; los problemas del contenido van en errores y avisos.
 */
export async function leerArchivoDeMocks(ruta) {
  const texto = await readFile(ruta, 'utf8')
  const datos = JSON.parse(texto)
  return { datos, texto, ...revisarMocks(datos, texto) }
}
