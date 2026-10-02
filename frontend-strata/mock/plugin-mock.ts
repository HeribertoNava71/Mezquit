// Modo demo sin backend (npm run dev:mock): el servidor de desarrollo de Vite
// responde /api/* y /sanctum/* con los escenarios de e2e/mocks, para recorrer
// todo el frontend en el navegador antes de que exista el backend.
//
// - Solo se activa con `vite --mode mock`. El build de producción no lo trae y
//   el código de la app no cambia: .env.mock deja VITE_API_URL vacío, así que
//   axios pide /api y /sanctum al mismo servidor de Vite.
// - Escenario activo: la cookie strata-mock-escenario (visitante si no hay).
//   ?escenario=<nombre> en cualquier URL lo cambia, y GET /__mock dice cuál
//   está activo y cuáles hay.
// - Capas, en este orden:
//   1. Sesión. POST /api/login, /api/register y /api/logout cambian de escenario:
//      un correo que empieza con «admin» entra como super admin, uno con
//      «sinempresa» como cuenta sin empresa y cualquier otro como RR. HH.; el
//      registro va a rh con empresa y a sin-org sin ella; salir, a visitante.
//   2. Candidato. /api/evaluar/* sale de candidato.json, salvo que el escenario
//      activo sea una variante candidato-*.
//   3. El escenario activo.
//   4. Rutas públicas (catálogo y leads), de visitante.json.
//   5. Escrituras de RR. HH. y super admin: éxito con la forma que esperan los
//      clientes de src/api. No se guardan.
//   6. Sin entrada: la cookie CSRF responde 204, /api/user 401 y lo demás 404,
//      con un aviso en la consola del servidor.
// - Cada respuesta tarda de 250 a 400 ms, para que se vean los estados de carga
//   (STRATA_MOCK_RETARDO: «0», «300» o «250-400», en el entorno o en .env.mock.local).
// - Al guardar un JSON de e2e/mocks, el escenario se vuelve a leer y la página se
//   recarga. Si el archivo quedó con errores, se conserva la versión anterior.
// El formato de los JSON está en mock/coincidencias.mjs.

import { readdir } from 'node:fs/promises'
import type { IncomingMessage, ServerResponse } from 'node:http'
import path from 'node:path'
import { loadEnv, type Connect, type Plugin } from 'vite'
import {
  crearBuscador,
  decodificarRuta,
  esApi,
  leerArchivoDeMocks,
  respuestaPorDefecto,
  type BuscadorDeMocks,
  type RespuestaDeMock,
} from './coincidencias.mjs'

/** Cookie con el escenario activo. */
export const COOKIE_ESCENARIO = 'strata-mock-escenario'
/** Escenario sin cookie: el visitante sin sesión. */
export const ESCENARIO_INICIAL = 'visitante'
/** GET: lista los escenarios y dice cuál está activo. */
export const RUTA_ESTADO = '/__mock'
/** Contraseña que el login rechaza con el 422 de visitante.json, para ver ese error. */
export const CONTRASENA_INCORRECTA = 'incorrecta'
/** Un correo de registro que empieza así responde el 422 de «correo ya registrado» de visitante.json. */
export const PREFIJO_CORREO_REPETIDO = 'repetido'

const ESCENARIO_CANDIDATO = 'candidato'
const ESCENARIO_RH = 'rh'
const ESCENARIO_ADMIN = 'admin'
const ESCENARIO_SIN_EMPRESA = 'sin-org'

/**
 * Escenarios de e2e/mocks en el orden del selector, con qué simula cada uno (la
 * tabla «Escenarios» del README). Uno nuevo va después, por nombre, descrito
 * con su comentario «//» hasta los dos puntos (describirEscenario).
 */
const DESCRIPCIONES: Record<string, string> = {
  visitante: 'Sin sesión: sitio público y catálogo',
  rh: 'RR. HH. con datos (Mariana Solís)',
  'rh-vacio': 'RR. HH. recién registrada, sin datos',
  'rh-error': 'RR. HH. con fallas del servidor (500)',
  'rh-sesion-vencida': 'Sesión vencida: lo que pide sesión da 401',
  admin: 'Super admin (Daniela Ortega)',
  'sin-org': 'Cuenta sin empresa (Paulina Cárdenas)',
  candidato: 'Invitación pendiente con 2 pruebas',
  'candidato-iniciada': 'Invitación iniciada: 5 de 12 respuestas',
  'candidato-completada': 'Invitación completada: bloqueo',
  'candidato-expirada': 'Invitación vencida: bloqueo',
  'candidato-404': 'Enlace con un token que no existe',
  'candidato-sin-red': 'Sin conexión: toda petición falla',
}

/** El nombre del archivo es el del escenario y viaja en una cookie: sin espacios ni símbolos. */
const NOMBRE_VALIDO = /^[A-Za-z0-9][\w-]*$/
/** Cuerpo máximo de una petición (las del frontend pesan unos cuantos KB). */
const LIMITE_CUERPO = 1024 * 1024
/** Id de una evaluación creada con un escenario que no define POST /api/assessments. */
const ID_EVALUACION_NUEVA = 900

// ── Escenarios ────────────────────────────────────────────────────────────

export interface Escenario {
  nombre: string
  /** Qué simula, para el selector (DESCRIPCIONES o el comentario «//» del JSON). */
  descripcion: string
  /** Archivo de e2e/mocks del que sale. */
  archivo: string
  buscar: BuscadorDeMocks
}

export type Escenarios = ReadonlyMap<string, Escenario>

export interface CargaDeEscenarios {
  escenarios: Map<string, Escenario>
  /** Archivos que no se pudieron usar, con el motivo. */
  errores: string[]
  avisos: string[]
}

const esObjeto = (valor: unknown): valor is Record<string, unknown> =>
  typeof valor === 'object' && valor !== null && !Array.isArray(valor)

const objeto = (valor: unknown): Record<string, unknown> => (esObjeto(valor) ? valor : {})

const texto = (valor: unknown): string => (typeof valor === 'string' ? valor : '')

/** «Escenario RR. HH.: Mariana Solís…» → «RR. HH.»; «Sesión vencida (D-07): …» → «Sesión vencida». */
export function describirEscenario(datos: unknown): string {
  const comentario = objeto(datos)['//']
  const primero = texto(Array.isArray(comentario) ? comentario[0] : comentario).trim()
  if (!primero) return ''
  const corte = primero.indexOf(':')
  let descripcion = (corte === -1 ? primero : primero.slice(0, corte))
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/^Escenario\s+/i, '')
    .trim()
  if (descripcion.length > 72) descripcion = `${descripcion.slice(0, 71).trimEnd()}…`
  return descripcion.charAt(0).toLocaleUpperCase('es-MX') + descripcion.slice(1)
}

function ordenar(nombres: string[]): string[] {
  const orden = Object.keys(DESCRIPCIONES)
  const posicion = (nombre: string) => {
    const indice = orden.indexOf(nombre)
    return indice === -1 ? orden.length : indice
  }
  return [...nombres].sort((a, b) => posicion(a) - posicion(b) || a.localeCompare(b))
}

/**
 * Lee los .json de la carpeta y revisa cada uno como `captura.mjs --validar`.
 * Un archivo con errores no se usa; anterior permite conservar su versión
 * previa (al recargar tras una edición a medias).
 */
export async function cargarEscenarios(carpeta: string, anterior?: Escenarios): Promise<CargaDeEscenarios> {
  const archivos = (await readdir(carpeta)).filter((archivo) => archivo.toLowerCase().endsWith('.json'))
  const leidos = new Map<string, Escenario>()
  const errores: string[] = []
  const avisos: string[] = []

  for (const archivo of archivos) {
    const nombre = archivo.slice(0, -'.json'.length)
    if (!NOMBRE_VALIDO.test(nombre)) {
      avisos.push(`${archivo}: el nombre solo admite letras, números, guion y guion bajo; no se usa.`)
      continue
    }
    try {
      const { datos, errores: suyos, avisos: suyosAvisos } = await leerArchivoDeMocks(path.join(carpeta, archivo))
      avisos.push(...suyosAvisos.map((aviso) => `${archivo}: ${aviso}`))
      if (suyos.length > 0) throw new Error(suyos.join(' '))
      leidos.set(nombre, {
        nombre,
        archivo,
        descripcion: DESCRIPCIONES[nombre] ?? (describirEscenario(datos) || nombre),
        buscar: crearBuscador(objeto(datos)),
      })
    } catch (error) {
      const previo = anterior?.get(nombre)
      if (previo) leidos.set(nombre, previo)
      errores.push(`${archivo}: ${(error as Error).message}${previo ? ' Se conserva la versión anterior.' : ''}`)
    }
  }

  const escenarios = new Map<string, Escenario>()
  for (const nombre of ordenar([...leidos.keys()])) escenarios.set(nombre, leidos.get(nombre) as Escenario)
  return { escenarios, errores, avisos }
}

// ── Capas ─────────────────────────────────────────────────────────────────

export interface PeticionDemo {
  metodo: string
  /** URL completa, con el origen del servidor y sin el parámetro escenario. */
  url: URL
  /** Escenario activo al llegar la petición. */
  escenario: string
  /** Cuerpo JSON ya analizado; undefined si no trae. */
  cuerpo?: unknown
}

export interface RespuestaDemo extends RespuestaDeMock {
  /** Escenario activo después de la petición: login, registro y salida lo cambian. */
  escenario: string
  /** Quién respondió, para la cabecera X-Strata-Mock-Fuente y los avisos. */
  fuente: string
  /** Sin entrada en ninguna capa: conviene avisar en la consola. */
  avisar?: boolean
}

/** A qué escenario entra un correo: «admin…» → admin, «…sinempresa…» → sin-org, cualquier otro → rh. */
export function escenarioDeCorreo(correo: string): string {
  const normalizado = correo.trim().toLowerCase()
  if (normalizado.includes('sinempresa')) return ESCENARIO_SIN_EMPRESA
  if (normalizado.startsWith('admin')) return ESCENARIO_ADMIN
  return ESCENARIO_RH
}

/** candidato y sus variantes (candidato-iniciada, candidato-404…). */
export const esEscenarioDelCandidato = (nombre: string) =>
  nombre === ESCENARIO_CANDIDATO || nombre.startsWith(`${ESCENARIO_CANDIDATO}-`)

const esRutaDelCandidato = (ruta: string) => ruta === '/api/evaluar' || ruta.startsWith('/api/evaluar/')

const esRutaPublica = (metodo: string, ruta: string) =>
  (metodo === 'GET' && (ruta === '/api/catalog' || ruta.startsWith('/api/catalog/'))) ||
  (metodo === 'POST' && ruta === '/api/leads')

function desdeEntrada(escenario: Escenario | undefined, metodo: string, url: URL): { respuesta: RespuestaDeMock; fuente: string } | null {
  const entrada = escenario?.buscar(metodo, url)
  if (!escenario || !entrada) return null
  return { respuesta: entrada.respuesta as RespuestaDeMock, fuente: `${escenario.archivo} "${entrada.clave}"` }
}

/** Usuario del escenario: el cuerpo de su GET /api/user con 200. */
function usuarioDe(escenario: Escenario | undefined): Record<string, unknown> | null {
  const entrada = escenario?.buscar('GET', new URL('http://demo.invalid/api/user'))
  if (!entrada) return null
  const respuesta = entrada.respuesta as RespuestaDeMock
  return (respuesta.status ?? 200) === 200 && esObjeto(respuesta.body) ? respuesta.body : null
}

type Errores = Record<string, string[]>

const CORREO = /^[^\s@]+@[^\s@]+$/
const ACEPTADO: unknown[] = [true, 1, '1', 'yes', 'on', 'true']
const vacio = (valor: unknown) => valor === undefined || valor === null || (typeof valor === 'string' && valor.trim() === '')

/** 422 con la forma de Laravel: { message, errors: { campo: [mensaje] } }. */
function errorDeValidacion(errores: Errores): RespuestaDeMock {
  const mensajes = Object.values(errores).flat()
  const resto = mensajes.length - 1
  const message = resto > 0 ? `${mensajes[0]} (and ${resto} more error${resto === 1 ? '' : 's'})` : mensajes[0]
  return { status: 422, body: { message, errors: errores } }
}

/** Reglas de LoginRequest, con los mensajes de Laravel en inglés (PB-35). */
function erroresDeAcceso(datos: Record<string, unknown>): Errores {
  const errores: Errores = {}
  const correo = texto(datos.email).trim()
  if (!correo) errores.email = ['The email field is required.']
  else if (!CORREO.test(correo)) errores.email = ['The email field must be a valid email address.']
  if (vacio(datos.password)) errores.password = ['The password field is required.']
  return errores
}

/** Reglas principales de RegisterRequest (2026-09-12-registro-login-crud-usuarios.md), en inglés (PB-35). */
function erroresDeRegistro(datos: Record<string, unknown>): Errores {
  const errores: Errores = {}
  if (vacio(datos.name)) errores.name = ['The name field is required.']
  if (vacio(datos.last_name)) errores.last_name = ['The last name field is required.']
  const correo = texto(datos.email).trim()
  if (!correo) errores.email = ['The email field is required.']
  else if (!CORREO.test(correo)) errores.email = ['The email field must be a valid email address.']
  const contrasena = texto(datos.password)
  if (!contrasena) errores.password = ['The password field is required.']
  else if (contrasena.length < 8) errores.password = ['The password field must be at least 8 characters.']
  const confirmacion = texto(datos.password_confirmation)
  if (!confirmacion) errores.password_confirmation = ['The password confirmation field is required.']
  else if (confirmacion !== contrasena) errores.password_confirmation = ['The password confirmation field must match password.']
  if (vacio(datos.privacy_accepted)) errores.privacy_accepted = ['The privacy accepted field is required.']
  else if (!ACEPTADO.includes(datos.privacy_accepted)) errores.privacy_accepted = ['The privacy accepted field must be accepted.']
  return errores
}

/** Responde con el usuario de destino y pasa a ese escenario. */
function entrar(escenarios: Escenarios, destino: string, status: number, activo: string, fuente: string): RespuestaDemo {
  const user = usuarioDe(escenarios.get(destino))
  if (!user) {
    return {
      status: 500,
      body: { message: `Modo demo: el escenario «${destino}» no tiene GET /api/user con un usuario.` },
      escenario: activo,
      fuente,
      avisar: true,
    }
  }
  return { status, body: { user }, escenario: destino, fuente }
}

/**
 * El error de visitante.json para esa petición (los 422 de login y registro), sin
 * cambiar de escenario. Si visitante.json no trae un error ahí, el respaldo.
 */
function errorDelVisitante(escenarios: Escenarios, url: URL, activo: string, respaldo: RespuestaDeMock): RespuestaDemo {
  const encontrada = desdeEntrada(escenarios.get(ESCENARIO_INICIAL), 'POST', url)
  if (encontrada && (encontrada.respuesta.status ?? 200) >= 400) {
    return { ...encontrada.respuesta, escenario: activo, fuente: encontrada.fuente }
  }
  return { ...respaldo, escenario: activo, fuente: 'modo demo: sesion' }
}

function responderSesion(escenarios: Escenarios, metodo: string, ruta: string, peticion: PeticionDemo): RespuestaDemo | null {
  if (metodo !== 'POST') return null
  const activo = peticion.escenario
  const datos = objeto(peticion.cuerpo)

  if (ruta === '/api/logout') return { status: 204, escenario: ESCENARIO_INICIAL, fuente: 'modo demo: salida' }

  if (ruta === '/api/login') {
    const errores = erroresDeAcceso(datos)
    if (Object.keys(errores).length > 0) return { ...errorDeValidacion(errores), escenario: activo, fuente: 'modo demo: login' }
    if (datos.password === CONTRASENA_INCORRECTA) {
      return errorDelVisitante(escenarios, peticion.url, activo, errorDeValidacion({ email: ['Credenciales incorrectas.'] }))
    }
    return entrar(escenarios, escenarioDeCorreo(texto(datos.email)), 200, activo, 'modo demo: login')
  }

  if (ruta === '/api/register') {
    const errores = erroresDeRegistro(datos)
    if (Object.keys(errores).length > 0) return { ...errorDeValidacion(errores), escenario: activo, fuente: 'modo demo: registro' }
    if (texto(datos.email).trim().toLowerCase().startsWith(PREFIJO_CORREO_REPETIDO)) {
      return errorDelVisitante(escenarios, peticion.url, activo, errorDeValidacion({ email: ['The email has already been taken.'] }))
    }
    const conEmpresa = texto(datos.company_name).trim() !== ''
    return entrar(escenarios, conEmpresa ? ESCENARIO_RH : ESCENARIO_SIN_EMPRESA, 201, activo, 'modo demo: registro')
  }
  return null
}

/**
 * POST /api/assessments con éxito: el id del escenario (o 900), pero el nombre y
 * los candidatos que se capturaron, con enlaces al portal del candidato de este
 * mismo servidor. Así la pantalla de enlaces muestra lo que se escribió.
 */
function ecoDeEvaluacion(base: RespuestaDeMock, cuerpo: unknown, origen: string): RespuestaDeMock {
  const status = base.status ?? 200
  if (base.abortar !== undefined || status < 200 || status > 299) return base
  const pedido = objeto(cuerpo)
  const cuerpoBase = objeto(base.body)
  const datos = objeto(cuerpoBase.data)
  const id = typeof datos.id === 'number' ? datos.id : ID_EVALUACION_NUEVA
  const nombre = texto(pedido.name).trim()
  const candidatos = Array.isArray(pedido.candidates) ? pedido.candidates.filter(esObjeto) : []
  return {
    ...base,
    body: {
      ...cuerpoBase,
      data: {
        ...datos,
        id,
        name: nombre || datos.name || 'Evaluación nueva',
        invitations: candidatos.map((candidato, indice) => ({
          id: id * 100 + indice + 1,
          candidate: texto(candidato.name),
          email: texto(candidato.email),
          status: 'pendiente',
          link: `${origen}/evaluar/demo-${id}-${indice + 1}`,
        })),
      },
    },
  }
}

interface ContextoDeEscritura {
  url: URL
  cuerpo: unknown
}

/** Escrituras de RR. HH. y super admin que el escenario activo no define. */
const ESCRITURAS: Record<string, (contexto: ContextoDeEscritura) => RespuestaDeMock> = {
  'POST /api/assessments': ({ url, cuerpo }) => ecoDeEvaluacion({ status: 201, body: { data: {} } }, cuerpo, url.origin),
  'POST /api/invitations/:id/resend': () => ({ status: 200, body: { ok: true } }),
  'POST /api/credit-requests': () => ({ status: 201, body: { message: 'Solicitud registrada. Un asesor la revisará.' } }),
  'POST /api/admin/credit-requests/:id/approve': () => ({ status: 200, body: { ok: true } }),
  'POST /api/admin/credit-requests/:id/reject': () => ({ status: 200, body: { ok: true } }),
  'PATCH /api/admin/users/:id': ({ url, cuerpo }) => ({
    status: 200,
    body: { data: { ...objeto(cuerpo), id: Number(url.pathname.split('/').pop()) } },
  }),
  'DELETE /api/admin/users/:id': () => ({ status: 204 }),
  'PUT /api/admin/me': () => ({ status: 200, body: { ok: true } }),
  'PUT /api/user/profile': ({ cuerpo }) => ({ status: 200, body: { data: objeto(cuerpo) } }),
  'PUT /api/user/password': () => ({ status: 200, body: { ok: true } }),
}
const buscarEscritura = crearBuscador(ESCRITURAS)

/** Responde una petición a /api o /sanctum con las capas del modo demo. */
export function responder(escenarios: Escenarios, peticion: PeticionDemo): RespuestaDemo {
  const metodo = peticion.metodo.toUpperCase()
  const { url } = peticion
  const ruta = decodificarRuta(url.pathname)
  const activo = escenarios.has(peticion.escenario) ? peticion.escenario : ESCENARIO_INICIAL
  const sinCambio = (respuesta: RespuestaDeMock, fuente: string): RespuestaDemo => ({ ...respuesta, escenario: activo, fuente })
  const porDefecto = (): RespuestaDemo => {
    const { avisar, ...respuesta } = respuestaPorDefecto(metodo, url.pathname)
    return { ...sinCambio(respuesta, 'modo demo: sin entrada'), avisar: Boolean(avisar) }
  }

  // 1. Sesión.
  const deSesion = responderSesion(escenarios, metodo, ruta, { ...peticion, escenario: activo })
  if (deSesion) return deSesion

  // 2. Portal del candidato: candidato.json, salvo con una variante activa.
  if (esRutaDelCandidato(ruta) && !esEscenarioDelCandidato(activo)) {
    const delCandidato = desdeEntrada(escenarios.get(ESCENARIO_CANDIDATO), metodo, url)
    return delCandidato ? sinCambio(delCandidato.respuesta, delCandidato.fuente) : porDefecto()
  }

  // 3. El escenario activo.
  const propia = desdeEntrada(escenarios.get(activo), metodo, url)
  if (propia) {
    const creaEvaluacion = metodo === 'POST' && ruta === '/api/assessments'
    return sinCambio(creaEvaluacion ? ecoDeEvaluacion(propia.respuesta, peticion.cuerpo, url.origin) : propia.respuesta, propia.fuente)
  }

  // 4. Catálogo y leads del visitante.
  if (esRutaPublica(metodo, ruta)) {
    const publica = desdeEntrada(escenarios.get(ESCENARIO_INICIAL), metodo, url)
    if (publica) return sinCambio(publica.respuesta, publica.fuente)
  }

  // 5. Escrituras con éxito.
  const escritura = buscarEscritura(metodo, url)
  if (escritura) {
    const responderEscritura = escritura.respuesta as (contexto: ContextoDeEscritura) => RespuestaDeMock
    return sinCambio(responderEscritura({ url, cuerpo: peticion.cuerpo }), `modo demo: escritura "${escritura.clave}"`)
  }

  // 6. Sin entrada.
  return porDefecto()
}

// ── Servidor ──────────────────────────────────────────────────────────────

export interface Retardo {
  min: number
  max: number
}

/** 250 a 400 ms: lo bastante para ver los estados de carga sin volver lenta la demo. */
export const RETARDO_POR_DEFECTO: Retardo = { min: 250, max: 400 }

/** «0», «300» o «250-400» → { min, max }; null si no se entiende. */
export function leerRetardo(valor: string): Retardo | null {
  const partes = /^\s*(\d+)\s*(?:-\s*(\d+)\s*)?$/.exec(valor)
  if (!partes) return null
  const min = Number(partes[1])
  const max = partes[2] === undefined ? min : Number(partes[2])
  return max >= min ? { min, max } : null
}

/** Lo mínimo del logger de Vite que usa el modo demo. */
export interface Registro {
  info(mensaje: string, opciones?: { timestamp?: boolean }): void
  warn(mensaje: string, opciones?: { timestamp?: boolean }): void
  error(mensaje: string, opciones?: { timestamp?: boolean }): void
}

export interface OpcionesModoDemo {
  /** Carpeta de los escenarios. */
  carpeta: string
  /** Retardo de cada respuesta, en ms o como rango. */
  retardo?: number | Retardo
  registro?: Registro
}

export interface EstadoDemo {
  activo: string
  inicial: string
  escenarios: { nombre: string; descripcion: string }[]
  retardo: Retardo
}

export interface ModoDemo {
  /** Escenarios cargados, en el orden del selector. */
  readonly escenarios: Escenarios
  /** Middleware de connect: /__mock, ?escenario= y las rutas de /api y /sanctum. */
  middleware: Connect.NextHandleFunction
  /** Vuelve a leer la carpeta. Un archivo con errores conserva su versión anterior. */
  recargar(): Promise<void>
}

function leerCookie(cabecera: string | undefined, nombre: string): string | undefined {
  for (const parte of (cabecera ?? '').split(';')) {
    const igual = parte.indexOf('=')
    if (igual !== -1 && parte.slice(0, igual).trim() === nombre) {
      try {
        return decodeURIComponent(parte.slice(igual + 1).trim())
      } catch {
        return undefined
      }
    }
  }
  return undefined
}

/** Cookie de sesión del navegador (sin fecha): al cerrar el navegador vuelve a visitante. */
const cookieDe = (escenario: string) => `${COOKIE_ESCENARIO}=${encodeURIComponent(escenario)}; Path=/; SameSite=Lax`

/** Las cabeceras solo admiten ASCII visible: lo demás va con %xx. */
const cabeceraSegura = (valor: string) => valor.replace(/[^\x20-\x7e]/g, (caracter) => encodeURIComponent(caracter))

async function leerCuerpo(req: IncomingMessage): Promise<unknown> {
  const partes: Buffer[] = []
  let total = 0
  for await (const parte of req as AsyncIterable<Buffer>) {
    total += parte.length
    if (total > LIMITE_CUERPO) throw new Error(`El cuerpo pasa de ${LIMITE_CUERPO} bytes.`)
    partes.push(parte)
  }
  const crudo = Buffer.concat(partes).toString('utf8')
  if (crudo === '') return undefined
  try {
    return JSON.parse(crudo)
  } catch {
    return crudo
  }
}

const esperar = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

function enviarJson(res: ServerResponse, status: number, cuerpo: unknown): void {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(cuerpo))
}

const consola: Registro = {
  info: (mensaje) => console.info(mensaje),
  warn: (mensaje) => console.warn(mensaje),
  error: (mensaje) => console.error(mensaje),
}

/** Carga los escenarios y arma el middleware del modo demo. */
export async function crearModoDemo(opciones: OpcionesModoDemo): Promise<ModoDemo> {
  const { carpeta, registro = consola } = opciones
  const retardo: Retardo =
    typeof opciones.retardo === 'number'
      ? { min: opciones.retardo, max: opciones.retardo }
      : (opciones.retardo ?? RETARDO_POR_DEFECTO)
  let escenarios: Escenarios = new Map()

  async function recargar(): Promise<void> {
    const carga = await cargarEscenarios(carpeta, escenarios)
    for (const aviso of carga.avisos) registro.warn(`[mock] aviso: ${aviso}`)
    for (const error of carga.errores) registro.error(`[mock] ${error}`, { timestamp: true })
    escenarios = carga.escenarios
    if (!escenarios.has(ESCENARIO_INICIAL)) {
      registro.error(`[mock] Falta ${ESCENARIO_INICIAL}.json en ${carpeta}: sin cookie, todo responde por defecto.`)
    }
  }
  await recargar()

  const avisarCambio = (de: string, a: string, motivo: string) => {
    if (de !== a) registro.info(`[mock] escenario: ${de} → ${a} (${motivo})`, { timestamp: true })
  }

  async function atender(req: Connect.IncomingMessage, res: ServerResponse, next: Connect.NextFunction): Promise<void> {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)
    const metodo = (req.method ?? 'GET').toUpperCase()
    const enCookie = leerCookie(req.headers.cookie, COOKIE_ESCENARIO)
    let activo = enCookie !== undefined && escenarios.has(enCookie) ? enCookie : ESCENARIO_INICIAL
    // Una cookie con un escenario que ya no existe vuelve a visitante.
    let guardar = enCookie !== undefined && enCookie !== activo

    // ?escenario=<nombre> en cualquier URL.
    const pedido = url.searchParams.get('escenario')
    if (pedido !== null) {
      url.searchParams.delete('escenario')
      if (escenarios.has(pedido)) {
        avisarCambio(activo, pedido, '?escenario=')
        activo = pedido
        guardar = true
      } else {
        registro.warn(`[mock] ?escenario=${pedido} no existe. Escenarios: ${[...escenarios.keys()].join(', ')}.`, { timestamp: true })
      }
      // Al navegar, la cookie queda guardada y la dirección sin el parámetro.
      const navega = (metodo === 'GET' || metodo === 'HEAD') && (req.headers.accept ?? '').includes('text/html')
      if (navega && !esApi(url.pathname) && url.pathname !== RUTA_ESTADO) {
        res.statusCode = 302
        if (guardar) res.setHeader('Set-Cookie', cookieDe(activo))
        res.setHeader('Location', `${url.pathname}${url.search}`)
        res.setHeader('Cache-Control', 'no-store')
        res.end()
        return
      }
    }

    if (url.pathname === RUTA_ESTADO) {
      if (guardar) res.setHeader('Set-Cookie', cookieDe(activo))
      const estado: EstadoDemo = {
        activo,
        inicial: ESCENARIO_INICIAL,
        escenarios: [...escenarios.values()].map(({ nombre, descripcion }) => ({ nombre, descripcion })),
        retardo,
      }
      enviarJson(res, 200, estado)
      return
    }

    if (!esApi(url.pathname)) {
      if (guardar) res.setHeader('Set-Cookie', cookieDe(activo))
      next()
      return
    }

    if (metodo === 'OPTIONS') {
      res.statusCode = 204
      res.end()
      return
    }

    const cuerpo = metodo === 'GET' || metodo === 'HEAD' ? undefined : await leerCuerpo(req)
    await esperar(retardo.min + Math.round(Math.random() * (retardo.max - retardo.min)))

    const respuesta = responder(escenarios, { metodo, url, escenario: activo, cuerpo })
    if (respuesta.escenario !== activo) {
      avisarCambio(activo, respuesta.escenario, `${metodo} ${url.pathname}`)
      guardar = true
    }
    if (respuesta.avisar) {
      registro.warn(`[mock] ${metodo} ${url.pathname}${url.search} sin entrada en «${activo}» → ${respuesta.status ?? 200}`, {
        timestamp: true,
      })
    }

    // Falla de red: se corta la conexión sin responder.
    if (respuesta.abortar !== undefined) {
      req.socket.destroy()
      return
    }

    const status = respuesta.status ?? 200
    const { body } = respuesta
    const sinCuerpo = status === 204 || status === 304 || body === undefined
    res.statusCode = status
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('X-Strata-Mock-Escenario', respuesta.escenario)
    res.setHeader('X-Strata-Mock-Fuente', cabeceraSegura(respuesta.fuente))
    if (guardar) res.setHeader('Set-Cookie', cookieDe(respuesta.escenario))
    if (!sinCuerpo) res.setHeader('Content-Type', 'application/json; charset=utf-8')
    for (const [nombre, valor] of Object.entries(respuesta.headers ?? {})) res.setHeader(nombre, valor)
    res.end(sinCuerpo ? undefined : typeof body === 'string' ? body : JSON.stringify(body))
  }

  return {
    get escenarios() {
      return escenarios
    },
    middleware(req, res, next) {
      atender(req, res, next).catch((error: unknown) => {
        registro.error(`[mock] ${req.method} ${req.url}: ${(error as Error).message}`, { timestamp: true })
        if (res.headersSent) res.destroy()
        else enviarJson(res, 500, { message: `Modo demo: ${(error as Error).message}` })
      })
    },
    recargar,
  }
}

// ── Plugin ────────────────────────────────────────────────────────────────

export interface OpcionesPluginMock {
  /** Carpeta de los escenarios. Por defecto, e2e/mocks de la raíz de Vite. */
  carpeta?: string
  /** Retardo en ms o como rango. Por defecto, STRATA_MOCK_RETARDO o 250-400 ms. */
  retardo?: number | Retardo
}

/**
 * Plugin de Vite del modo demo. Solo se aplica al servidor de desarrollo con
 * --mode mock (npm run dev:mock): ni el build ni `npm run dev` lo usan.
 */
export function pluginMock(opciones: OpcionesPluginMock = {}): Plugin {
  let carpeta = ''
  let retardo: number | Retardo = RETARDO_POR_DEFECTO

  return {
    name: 'strata:modo-demo',
    apply: (_config, { command, mode }) => command === 'serve' && mode === 'mock',

    configResolved(config) {
      carpeta = opciones.carpeta ?? path.join(config.root, 'e2e', 'mocks')
      if (opciones.retardo !== undefined) {
        retardo = opciones.retardo
        return
      }
      const valor = loadEnv(config.mode, config.envDir, 'STRATA_MOCK_').STRATA_MOCK_RETARDO
      if (valor === undefined || valor === '') return
      const leido = leerRetardo(valor)
      if (leido) retardo = leido
      else config.logger.warn(`[mock] STRATA_MOCK_RETARDO=${valor} no se entiende (usa «0», «300» o «250-400»); quedan 250-400 ms.`)
    },

    async configureServer(server) {
      const demo = await crearModoDemo({ carpeta, retardo, registro: server.config.logger })
      server.middlewares.use(demo.middleware)

      // Al guardar un JSON de la carpeta: se vuelve a leer y la página se recarga.
      const alCambiar = (archivo: string) => {
        if (!mismaRuta(path.dirname(archivo), carpeta) || !archivo.toLowerCase().endsWith('.json')) return
        void demo.recargar().then(() => {
          server.config.logger.info(`[mock] ${path.basename(archivo)} recargado.`, { timestamp: true })
          server.ws.send({ type: 'full-reload', path: '*' })
        })
      }
      server.watcher.add(carpeta)
      server.watcher.on('add', alCambiar)
      server.watcher.on('change', alCambiar)
      server.watcher.on('unlink', alCambiar)

      // Después de las URL de Vite: de dónde sale la API y cómo cambiar de escenario.
      const imprimirUrls = server.printUrls.bind(server)
      server.printUrls = () => {
        imprimirUrls()
        const nombres = [...demo.escenarios.keys()]
        const { min, max } = typeof retardo === 'number' ? { min: retardo, max: retardo } : retardo
        server.config.logger.info(
          `\n  Modo demo: la API sale de ${path.relative(server.config.root, carpeta) || carpeta}` +
            ` (${nombres.length} escenarios; ${min === max ? min : `${min}-${max}`} ms por respuesta).` +
            `\n  Cambia de escenario con ?escenario=<nombre> o con la pastilla «Modo demo», abajo a la izquierda.` +
            `\n  Escenarios: ${nombres.join(', ')}.\n`,
        )
      }
    },
  }
}

/** Misma ruta, sin importar separadores ni (en Windows) mayúsculas. */
function mismaRuta(a: string, b: string): boolean {
  const normalizar = (ruta: string) => {
    const absoluta = path.resolve(ruta)
    return process.platform === 'win32' ? absoluta.toLowerCase() : absoluta
  }
  return normalizar(a) === normalizar(b)
}

export default pluginMock
