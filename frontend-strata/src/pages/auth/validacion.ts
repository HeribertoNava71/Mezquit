// Validación en el cliente de /login y /registro. No agrega reglas: repite las
// que ya existían (el required y el type="email" del login, que antes revisaba
// el navegador) o las que exige el backend (same:password de la confirmación),
// para mostrarlas inline con ícono y texto (D-22). El servidor sigue validando
// todo y sus 422 se muestran por campo.

/**
 * Patrón que usa el navegador para validar type="email" (HTML Living Standard,
 * «valid e-mail address»): el formulario rechaza lo mismo que antes rechazaba
 * la burbuja del navegador.
 */
const PATRON_CORREO =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

/** true si el texto es un correo con el formato que acepta type="email" (sin espacios alrededor). */
export function correoValido(valor: string): boolean {
  return PATRON_CORREO.test(valor.trim())
}

export const MENSAJES_ACCESO = {
  correoVacio: 'Escribe tu correo electrónico.',
  correoInvalido: 'Escribe un correo válido, como nombre@empresa.com.',
  contrasenaVacia: 'Escribe tu contraseña.',
} as const

export interface ErroresDeAcceso {
  email?: string
  password?: string
}

/**
 * Campos del login: correo obligatorio y con formato de correo, y contraseña
 * obligatoria (antes, required y type="email" con la validación del navegador).
 * Devuelve un objeto vacío si los dos están bien.
 */
export function validarAcceso(email: string, password: string): ErroresDeAcceso {
  const errores: ErroresDeAcceso = {}
  if (email.trim() === '') errores.email = MENSAJES_ACCESO.correoVacio
  else if (!correoValido(email)) errores.email = MENSAJES_ACCESO.correoInvalido
  if (password === '') errores.password = MENSAJES_ACCESO.contrasenaVacia
  return errores
}

/** Error inline de «Confirmar contraseña» cuando no coincide. */
export const MENSAJE_NO_COINCIDEN = 'Las contraseñas no coinciden.'

/**
 * Estado en vivo de «Confirmar contraseña» frente a «Contraseña»:
 * - neutro: vacía, o todavía se escribe el principio de la contraseña.
 * - coincide: son iguales (estado válido del Input).
 * - no-coincide: son distintas (estado de error del Input).
 */
export type EstadoConfirmacion = 'neutro' | 'coincide' | 'no-coincide'

/**
 * Valida la confirmación mientras se escribe, sin regañar antes de tiempo:
 * marca «coincide» en cuanto las dos son iguales y «no-coincide» en cuanto la
 * confirmación se aparta de la contraseña. Mientras sea el principio de la
 * contraseña queda neutra, salvo que la persona ya haya salido del campo o
 * intentado enviar (terminada).
 */
export function estadoConfirmacion(password: string, confirmacion: string, terminada: boolean): EstadoConfirmacion {
  if (confirmacion === '') return 'neutro'
  if (confirmacion === password) return 'coincide'
  if (!terminada && password.startsWith(confirmacion)) return 'neutro'
  return 'no-coincide'
}
