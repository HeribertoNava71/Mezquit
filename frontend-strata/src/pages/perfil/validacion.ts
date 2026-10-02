// Reglas de los formularios de /perfil y /admin/perfil. Son las mismas del
// servidor, para avisar antes de enviar; el servidor sigue validando y sus
// errores 422 se muestran en cada campo:
// - PUT /api/user/profile: name y last_name obligatorios (máx. 255), phone hasta
//   30, birth_date anterior a hoy y position hasta 255
//   (2026-09-12-registro-login-crud-usuarios.md:515-521). last_name es
//   obligatorio aunque la columna admita null (PB-27).
// - PUT /api/user/password y PUT /api/admin/me: contraseña actual, nueva de 8
//   caracteres o más y confirmación igual a la nueva (:545-561, :687-696).

/** Errores por campo de un formulario: el mensaje de cada campo con error. */
export type Errores<V> = Partial<Record<keyof V & string, string>>

/** Largo mínimo de la contraseña nueva (min:8 en el servidor). */
export const MIN_CONTRASENA = 8

export const MENSAJES = {
  nombre: 'Escribe tu nombre.',
  apellido: 'Escribe tu apellido.',
  fechaNoValida: 'Escribe una fecha válida.',
  fechaNoAnterior: 'La fecha de nacimiento debe ser anterior a hoy.',
  correoVacio: 'Escribe tu correo electrónico.',
  correoNoValido: 'Escribe un correo válido, como nombre@empresa.com.',
  actualVacia: 'Escribe tu contraseña actual.',
  nuevaVacia: 'Escribe una contraseña nueva.',
  nuevaCorta: `Usa al menos ${MIN_CONTRASENA} caracteres.`,
  confirmacionVacia: 'Confirma tu nueva contraseña.',
  noCoinciden: 'Las contraseñas no coinciden.',
} as const

// ── Datos personales (PUT /api/user/profile) ─────────────────────────────────

/** Valores del formulario «Datos personales», como texto (vacío = sin dato). */
export interface ValoresDatos {
  name: string
  last_name: string
  phone: string
  birth_date: string
  position: string
}

const FECHA = /^\d{4}-\d{2}-\d{2}$/

/** Si el texto es una fecha AAAA-MM-DD que existe en el calendario. */
function esFechaValida(valor: string): boolean {
  if (!FECHA.test(valor)) return false
  const [anio, mes, dia] = valor.split('-').map(Number)
  const fecha = new Date(anio, mes - 1, dia)
  return fecha.getFullYear() === anio && fecha.getMonth() === mes - 1 && fecha.getDate() === dia
}

/**
 * Errores de «Datos personales» con los valores actuales. `hoy` es la fecha
 * local en AAAA-MM-DD: la de nacimiento debe ser anterior (before:today).
 */
export function reglasDatos(valores: ValoresDatos, hoy: string): Errores<ValoresDatos> {
  const errores: Errores<ValoresDatos> = {}
  if (!valores.name.trim()) errores.name = MENSAJES.nombre
  if (!valores.last_name.trim()) errores.last_name = MENSAJES.apellido
  const fecha = valores.birth_date.trim()
  if (fecha) {
    if (!esFechaValida(fecha)) errores.birth_date = MENSAJES.fechaNoValida
    else if (fecha >= hoy) errores.birth_date = MENSAJES.fechaNoAnterior
  }
  return errores
}

// ── Contraseñas (PUT /api/user/password y PUT /api/admin/me) ──────────────────

export interface ValoresContrasena {
  current_password: string
  password: string
  password_confirmation: string
}

export const CONTRASENAS_VACIAS: ValoresContrasena = {
  current_password: '',
  password: '',
  password_confirmation: '',
}

/** Errores de los tres campos de contraseña con los valores actuales. */
export function reglasContrasena(valores: ValoresContrasena): Errores<ValoresContrasena> {
  const errores: Errores<ValoresContrasena> = {}
  if (!valores.current_password) errores.current_password = MENSAJES.actualVacia
  if (!valores.password) errores.password = MENSAJES.nuevaVacia
  else if (valores.password.length < MIN_CONTRASENA) errores.password = MENSAJES.nuevaCorta
  if (!valores.password_confirmation) errores.password_confirmation = MENSAJES.confirmacionVacia
  else if (valores.password_confirmation !== valores.password) errores.password_confirmation = MENSAJES.noCoinciden
  return errores
}

/**
 * Validación inmediata de la confirmación: la diferencia se muestra mientras se
 * escribe, en cuanto la confirmación es tan larga como la nueva (antes sería
 * una confirmación a medias). También si cambia la nueva después de confirmar.
 */
export function confirmacionInmediata(campo: string, valores: ValoresContrasena): boolean {
  return (
    campo === 'password_confirmation' &&
    valores.password_confirmation !== '' &&
    valores.password_confirmation.length >= valores.password.length
  )
}

/** La nueva cumple el largo mínimo (estado válido del campo). */
export function nuevaEsValida(valores: ValoresContrasena): boolean {
  return valores.password.length >= MIN_CONTRASENA
}

/** La confirmación coincide con una nueva válida (estado válido del campo). */
export function confirmacionEsValida(valores: ValoresContrasena): boolean {
  return nuevaEsValida(valores) && valores.password_confirmation === valores.password
}

// ── Correo del operador (PUT /api/admin/me) ───────────────────────────────────

export interface ValoresCorreo {
  email: string
}

// Revisión básica en el cliente; la regla email y el unique los decide el servidor.
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function reglasCorreo(valores: ValoresCorreo): Errores<ValoresCorreo> {
  const correo = valores.email.trim()
  if (!correo) return { email: MENSAJES.correoVacio }
  if (!CORREO.test(correo)) return { email: MENSAJES.correoNoValido }
  return {}
}

// ── Fechas ────────────────────────────────────────────────────────────────────

function dosDigitos(n: number): string {
  return String(n).padStart(2, '0')
}

/** Fecha local en AAAA-MM-DD (el formato de <input type="date">). */
export function fechaLocal(fecha: Date): string {
  return `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`
}

/** Día anterior a una fecha AAAA-MM-DD: el máximo del selector de nacimiento. */
export function diaAnterior(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  return fechaLocal(new Date(anio, mes - 1, dia - 1))
}

const INICIO_ISO = /^(\d{4}-\d{2}-\d{2})/

/**
 * birth_date de GET /api/user/profile para el selector de fecha. El modelo la
 * convierte a fecha y Laravel la entrega en ISO 8601 («1990-05-15T00:00:00.000000Z»):
 * se toma el día. null o un formato desconocido dan «».
 */
export function fechaParaInput(valor: unknown): string {
  if (typeof valor !== 'string') return ''
  return INICIO_ISO.exec(valor.trim())?.[1] ?? ''
}

/**
 * birth_date para PUT /api/user/profile. Se envía lo que muestra el selector,
 * salvo un caso: si el servidor mandó una fecha que el selector no pudo mostrar
 * y el campo sigue vacío, se reenvía la original, como antes (no se borra un
 * dato que la persona nunca vio).
 */
export function fechaParaEnviar(valorDelCampo: string, original: unknown): string {
  if (valorDelCampo === '' && typeof original === 'string' && original.trim() !== '' && fechaParaInput(original) === '') {
    return original
  }
  return valorDelCampo
}
