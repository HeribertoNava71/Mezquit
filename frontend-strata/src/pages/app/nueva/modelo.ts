import { isAxiosError } from 'axios'
import type { CandidateInput, CreateAssessmentPayload } from '@/api/assessments'
import { formatearFecha, getErrorKind, type EstadoErrorKind } from '@/components/ui'

// ── Lógica pura del asistente de nueva evaluación (/app/evaluaciones/nueva) ──
// Pasos, validación por paso, lectura de la lista pegada, payload de
// POST /api/assessments y errores 422 por campo.
// Las reglas son las de StoreAssessmentRequest (2026-09-11-fase1-nucleo.md:1393-1405)
// y el consumo de créditos de AssessmentController (2026-09-12-fase2-panel-rh.md:412-459).

/** Pasos del asistente, en orden (StepPills). */
export const PASOS = ['Datos', 'Prueba', 'Candidatos', 'Confirmar'] as const

/** Índice de un paso (0 = Datos … 3 = Confirmar). */
export type IndicePaso = 0 | 1 | 2 | 3

// Literales (no IndicePaso) para que switch y Record los distingan.
export const PASO_DATOS = 0
export const PASO_PRUEBA = 1
export const PASO_CANDIDATOS = 2
export const PASO_CONFIRMAR = 3

/**
 * Prueba fija mientras no exista PB-04 (pruebas asignables): el asistente
 * envía test_ids [1] porque la demo es el primer test sembrado
 * (2026-09-11-fase1-nucleo.md:2561). Detalle: el texto del asistente anterior.
 */
export const PRUEBA_DISPONIBLE = {
  id: 1,
  nombre: 'Prueba de demostración',
  detalle: '12 reactivos · 3 escalas',
} as const

/** Longitudes máximas de StoreAssessmentRequest. */
export const LIMITES = {
  nombre: 255,
  puesto: 255,
  nombreCandidato: 255,
  correo: 255,
  telefono: 30,
} as const

/** Créditos que usa cada candidato (1 crédito = 1 candidato, T-11). */
export const CREDITOS_POR_CANDIDATO = 1

// ── Tipos ──────────────────────────────────────────────────────────────────

/** Paso 1: nombre de la evaluación (obligatorio) y puesto (opcional). */
export interface DatosEvaluacion {
  name: string
  position: string
}

export type CampoDatos = keyof DatosEvaluacion
export type ErroresDatos = Partial<Record<CampoDatos, string>>

/** Fila de candidato del paso 3. id es local: solo sirve para React y para los errores. */
export interface CandidatoBorrador {
  id: string
  name: string
  email: string
  phone: string
}

export type CampoCandidato = 'name' | 'email' | 'phone'
export type ErroresCandidato = Partial<Record<CampoCandidato, string>>

export interface ErroresCandidatos {
  /** Error de la lista completa (sin candidatos, o «candidates» del servidor). */
  general?: string
  /** Errores por fila, con el id local de la fila. */
  filas: Record<string, ErroresCandidato>
}

/** Errores 422 de POST /api/assessments, repartidos por paso y por campo. */
export interface ErroresServidor {
  datos: ErroresDatos
  /** test_ids o test_ids.N. */
  prueba?: string
  candidatos: ErroresCandidatos
  /** deadline. */
  fechaLimite?: string
  /** Mensajes de claves que la pantalla no reconoce. */
  otros: string[]
}

// ── Mensajes (es-MX, tuteo) ────────────────────────────────────────────────

export const MENSAJES = {
  nombreVacio: 'Escribe el nombre de la evaluación.',
  candidatoNombreVacio: 'Escribe el nombre del candidato.',
  correoVacio: 'Escribe el correo del candidato.',
  correoNoValido: 'Escribe un correo válido, como nombre@empresa.com.',
  sinCandidatos: 'Agrega al menos un candidato con nombre y correo.',
  fechaPasada: 'Elige una fecha posterior a hoy.',
  fechaNoValida: 'Elige una fecha válida.',
  listaVacia: 'Pega al menos una línea con «nombre, correo».',
} as const

/** «Usa N caracteres o menos.» */
export function mensajeMaximo(limite: number): string {
  return `Usa ${limite} caracteres o menos.`
}

// ── Correo ─────────────────────────────────────────────────────────────────

// Revisión en vivo, como el prototipo (Strata.dc.html:2003): algo@dominio.ext,
// sin espacios ni puntos seguidos en el dominio. La regla email de Laravel
// decide al final; si la rechaza, el 422 llega al campo.
const PATRON_CORREO = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)*\.[^\s@.]{2,}$/u

export function esCorreoValido(valor: string): boolean {
  return PATRON_CORREO.test(valor.trim())
}

// ── Paso 1 · Datos ─────────────────────────────────────────────────────────

export function validarDatos(datos: DatosEvaluacion): ErroresDatos {
  const errores: ErroresDatos = {}
  const nombre = datos.name.trim()
  if (!nombre) errores.name = MENSAJES.nombreVacio
  else if (nombre.length > LIMITES.nombre) errores.name = mensajeMaximo(LIMITES.nombre)
  if (datos.position.trim().length > LIMITES.puesto) errores.position = mensajeMaximo(LIMITES.puesto)
  return errores
}

// ── Paso 3 · Candidatos ────────────────────────────────────────────────────

/** Fila sin ningún dato: no cuenta como candidato y no se envía. */
export function filaVacia(fila: CandidatoBorrador): boolean {
  return !fila.name.trim() && !fila.email.trim() && !fila.phone.trim()
}

/** Filas que se envían (las que tienen algún dato), en su orden. */
export function candidatosConDatos(filas: readonly CandidatoBorrador[]): CandidatoBorrador[] {
  return filas.filter((fila) => !filaVacia(fila))
}

export function validarCandidato(fila: CandidatoBorrador): ErroresCandidato {
  const errores: ErroresCandidato = {}
  const nombre = fila.name.trim()
  const correo = fila.email.trim()
  if (!nombre) errores.name = MENSAJES.candidatoNombreVacio
  else if (nombre.length > LIMITES.nombreCandidato) errores.name = mensajeMaximo(LIMITES.nombreCandidato)
  if (!correo) errores.email = MENSAJES.correoVacio
  else if (correo.length > LIMITES.correo) errores.email = mensajeMaximo(LIMITES.correo)
  else if (!esCorreoValido(correo)) errores.email = MENSAJES.correoNoValido
  if (fila.phone.trim().length > LIMITES.telefono) errores.phone = mensajeMaximo(LIMITES.telefono)
  return errores
}

/** Valida las filas con datos; las vacías se ignoran. Exige al menos un candidato. */
export function validarCandidatos(filas: readonly CandidatoBorrador[]): ErroresCandidatos {
  const conDatos = candidatosConDatos(filas)
  const errores: ErroresCandidatos = { filas: {} }
  if (conDatos.length === 0) errores.general = MENSAJES.sinCandidatos
  for (const fila of conDatos) {
    const propios = validarCandidato(fila)
    if (Object.keys(propios).length > 0) errores.filas[fila.id] = propios
  }
  return errores
}

export function hayErroresCandidatos(errores: ErroresCandidatos): boolean {
  return Boolean(errores.general) || Object.keys(errores.filas).length > 0
}

/** Datos de un candidato leídos de una línea pegada. */
export interface LineaCandidato {
  name: string
  email: string
  phone: string
}

// Separadores de columnas: coma (formato del asistente anterior), punto y coma
// y tabulador (al pegar celdas de una hoja de cálculo).
const SEPARADOR_COLUMNAS = /[,;\t]/
// Un teléfono: dígitos con espacios, guiones, puntos, paréntesis o «+», y al menos 7 dígitos.
const PATRON_TELEFONO = /^\+?[\d\s().-]+$/

function pareceTelefono(valor: string): boolean {
  return PATRON_TELEFONO.test(valor) && valor.replace(/\D/g, '').length >= 7
}

/**
 * Lee la lista pegada: un candidato por línea con «nombre, correo» y, si
 * quieres, el teléfono (como el área de texto del asistente anterior,
 * 2026-09-11-fase1-nucleo.md:2573-2577). Cada línea con texto da un
 * candidato, aunque le falten datos: la validación de la fila lo marca.
 * - El correo es la columna que tiene «@», esté donde esté.
 * - El teléfono es la primera columna, fuera del nombre, que parece teléfono.
 * - Si ninguna columna tiene «@», se lee como antes: nombre y luego correo.
 * - El resto forma el nombre, sin perder texto.
 */
export function parsearLista(texto: string): LineaCandidato[] {
  return texto
    .split(/\r\n|\r|\n/)
    .map((linea) => linea.trim())
    .filter(Boolean)
    .map((linea) => {
      const columnas = linea
        .split(SEPARADOR_COLUMNAS)
        .map((columna) => columna.trim())
        .filter(Boolean)
      const indiceCorreo = columnas.findIndex((columna) => columna.includes('@'))
      if (indiceCorreo === -1) {
        const [nombre = '', correo = '', ...resto] = columnas
        const telefono = resto.find(pareceTelefono) ?? ''
        return { name: nombre, email: correo, phone: telefono }
      }
      const correo = columnas[indiceCorreo]
      const otras = columnas.filter((_, indice) => indice !== indiceCorreo)
      // El nombre va primero: la primera columna nunca se toma como teléfono.
      const indiceTelefono = otras.findIndex((columna, indice) => indice > 0 && pareceTelefono(columna))
      const telefono = indiceTelefono === -1 ? '' : otras[indiceTelefono]
      const nombre = otras.filter((_, indice) => indice !== indiceTelefono).join(', ')
      return { name: nombre, email: correo, phone: telefono }
    })
}

// ── Paso 4 · Fecha límite ──────────────────────────────────────────────────

function dosDigitos(n: number): string {
  return String(n).padStart(2, '0')
}

/** Fecha local AAAA-MM-DD (formato de <input type="date">). */
export function fechaLocalISO(fecha: Date): string {
  return `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`
}

const PATRON_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/

/** Date local de una fecha AAAA-MM-DD; null si no es una fecha real. */
export function leerFecha(iso: string): Date | null {
  const partes = PATRON_FECHA.exec(iso.trim())
  if (!partes) return null
  const [anio, mes, dia] = partes.slice(1).map(Number)
  // new Date('AAAA-MM-DD') sería medianoche UTC (el día anterior en México): se arma en hora local.
  const fecha = new Date(anio, mes - 1, dia)
  return fecha.getFullYear() === anio && fecha.getMonth() === mes - 1 && fecha.getDate() === dia ? fecha : null
}

/** Día siguiente a una fecha AAAA-MM-DD (el mínimo del selector). */
export function diaSiguiente(iso: string): string {
  const fecha = leerFecha(iso)
  if (!fecha) return ''
  return fechaLocalISO(new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + 1))
}

/**
 * Fecha límite opcional. El backend guarda la fecha como expires_at a las 00:00
 * de ese día y vence la invitación cuando esa hora ya pasó
 * (2026-09-11-fase1-nucleo.md:1456, :1677): con la fecha de hoy o una anterior,
 * los enlaces nacerían vencidos y los créditos se gastarían. Por eso se pide
 * una fecha posterior a hoy.
 */
export function validarFechaLimite(valor: string, hoyISO: string): string | undefined {
  if (!valor.trim()) return undefined
  if (!leerFecha(valor)) return MENSAJES.fechaNoValida
  return valor.trim() <= hoyISO ? MENSAJES.fechaPasada : undefined
}

const FORMATO_NUMERO = new Intl.NumberFormat('es-MX')

/**
 * «15 oct 2026», con el formato de fecha del sistema (el mismo de Candidatos y
 * Créditos). Si no es una fecha, la devuelve tal cual.
 */
export function formatoFecha(iso: string): string {
  return formatearFecha(iso)?.texto ?? iso
}

export function formatoNumero(valor: number): string {
  return FORMATO_NUMERO.format(valor)
}

/** «1 candidato», «3 candidatos». */
export function contarCandidatos(n: number): string {
  return `${formatoNumero(n)} ${n === 1 ? 'candidato' : 'candidatos'}`
}

/** «1 crédito», «3 créditos». */
export function contarCreditos(n: number): string {
  return `${formatoNumero(n)} ${n === 1 ? 'crédito' : 'créditos'}`
}

// ── Payload de POST /api/assessments ───────────────────────────────────────

export interface PayloadPreparado {
  payload: CreateAssessmentPayload
  /** id local de la fila de cada candidato enviado, por índice (para los 422 candidates.N.*). */
  filasEnviadas: string[]
}

/**
 * Payload del asistente anterior (2026-09-11-fase1-nucleo.md:2580-2590):
 * { name, position, test_ids: [1], candidates: [{ name, email }], deadline }.
 * Agrega phone al candidato solo si se capturó (StoreAssessmentRequest lo acepta:
 * candidates.*.phone nullable, máx. 30). Las filas vacías no se envían.
 */
export function construirPayload(
  datos: DatosEvaluacion,
  filas: readonly CandidatoBorrador[],
  fechaLimite: string,
): PayloadPreparado {
  const enviadas = candidatosConDatos(filas)
  const candidates = enviadas.map((fila): CandidateInput => {
    const candidato: CandidateInput = { name: fila.name.trim(), email: fila.email.trim() }
    const telefono = fila.phone.trim()
    if (telefono) candidato.phone = telefono
    return candidato
  })
  return {
    payload: {
      name: datos.name.trim(),
      position: datos.position.trim(),
      test_ids: [PRUEBA_DISPONIBLE.id],
      candidates,
      deadline: fechaLimite.trim() || null,
    },
    filasEnviadas: enviadas.map((fila) => fila.id),
  }
}

// ── Errores de POST /api/assessments ───────────────────────────────────────

export function erroresServidorVacios(): ErroresServidor {
  return { datos: {}, candidatos: { filas: {} }, otros: [] }
}

function primerMensaje(valor: unknown): string | undefined {
  if (typeof valor === 'string') return valor.trim() || undefined
  if (Array.isArray(valor)) return valor.map(primerMensaje).find(Boolean)
  return undefined
}

const CLAVE_CANDIDATO = /^candidates\.(\d+)\.(name|email|phone)$/
const CLAVE_PRUEBA = /^test_ids(\.\d+)?$/

/**
 * Reparte los errores de un 422 ({ errors: { campo: [mensajes] } }) entre los
 * pasos. candidates.N.campo usa el índice del payload enviado: filasEnviadas
 * dice a qué fila corresponde. El texto es el del servidor (el repo manda).
 */
export function mapearErrores422(errors: Record<string, unknown>, filasEnviadas: readonly string[]): ErroresServidor {
  const resultado = erroresServidorVacios()
  for (const [clave, valor] of Object.entries(errors)) {
    const mensaje = primerMensaje(valor)
    if (!mensaje) continue
    const candidato = CLAVE_CANDIDATO.exec(clave)
    if (clave === 'name' || clave === 'position') {
      resultado.datos[clave] ??= mensaje
    } else if (CLAVE_PRUEBA.test(clave)) {
      resultado.prueba ??= mensaje
    } else if (clave === 'deadline') {
      resultado.fechaLimite ??= mensaje
    } else if (clave === 'candidates' || /^candidates\.\d+$/.test(clave)) {
      resultado.candidatos.general ??= mensaje
    } else if (candidato && filasEnviadas[Number(candidato[1])] !== undefined) {
      const id = filasEnviadas[Number(candidato[1])]
      const campo = candidato[2] as CampoCandidato
      const fila = (resultado.candidatos.filas[id] ??= {})
      fila[campo] ??= mensaje
    } else {
      resultado.otros.push(mensaje)
    }
  }
  return resultado
}

/** Pasos que tienen errores del servidor, en orden. */
export function pasosConErroresServidor(errores: ErroresServidor): IndicePaso[] {
  const pasos: IndicePaso[] = []
  if (Object.keys(errores.datos).length > 0) pasos.push(PASO_DATOS)
  if (errores.prueba) pasos.push(PASO_PRUEBA)
  if (hayErroresCandidatos(errores.candidatos)) pasos.push(PASO_CANDIDATOS)
  if (errores.fechaLimite || errores.otros.length > 0) pasos.push(PASO_CONFIRMAR)
  return pasos
}

/** Lo que pasó al enviar, para decidir cómo mostrarlo. */
export type ErrorEnvio =
  /** 422 con errors: errores por campo. */
  | { tipo: 'campos'; errores: ErroresServidor }
  /** 422 sin errors (o con code insufficient_credits): saldo insuficiente (PB-25). */
  | { tipo: 'saldo'; mensaje: string }
  /** Red, sesión, permiso, conflicto o servidor. */
  | { tipo: 'general'; kind: EstadoErrorKind }

export const MENSAJE_SALDO_GENERICO = 'No te alcanzan los créditos para invitar a todos los candidatos.'
export const MENSAJE_REVISA_DATOS = 'Revisa los datos e inténtalo de nuevo.'

interface Respuesta422 {
  message?: unknown
  errors?: unknown
  code?: unknown
}

/**
 * Clasifica el error de POST /api/assessments:
 * - 422 con errors → por campo.
 * - 422 sin errors → saldo insuficiente, con el message del backend
 *   (2026-09-12-fase2-panel-rh.md:421; PB-25 propone code insufficient_credits).
 * - Lo demás → tipo de EstadoError (red, sesión, permiso, conflicto o servidor).
 */
export function clasificarErrorEnvio(error: unknown, filasEnviadas: readonly string[]): ErrorEnvio {
  if (isAxiosError(error) && error.response?.status === 422) {
    const datos = (error.response.data ?? {}) as Respuesta422
    const errores = datos.errors
    const mensaje = typeof datos.message === 'string' && datos.message.trim() ? datos.message.trim() : undefined
    const hayErrores = typeof errores === 'object' && errores !== null && Object.keys(errores).length > 0
    if (datos.code !== 'insufficient_credits' && hayErrores) {
      const mapeados = mapearErrores422(errores as Record<string, unknown>, filasEnviadas)
      // Claves sin texto: queda el message general para que el aviso no salga vacío.
      if (pasosConErroresServidor(mapeados).length === 0) mapeados.otros.push(mensaje ?? MENSAJE_REVISA_DATOS)
      return { tipo: 'campos', errores: mapeados }
    }
    return { tipo: 'saldo', mensaje: mensaje ?? MENSAJE_SALDO_GENERICO }
  }
  return { tipo: 'general', kind: getErrorKind(error) }
}

// Compartir el enlace (D-10: Correo, WhatsApp y Copiar): el mensaje y los
// tiles son los mismos del detalle de la evaluación (src/pages/app/invitaciones).
