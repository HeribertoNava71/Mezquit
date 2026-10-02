import { isAxiosError } from 'axios'

// Fallas de los envíos de /login (POST /api/login) y /registro
// (POST /api/register). Antes, el login decía «Correo o contraseña
// incorrectos.» ante cualquier error, aunque no hubiera conexión, y el
// registro solo distinguía el 422. Aquí se separan para mostrar el aviso que
// corresponde (R-34, D-22). Los contratos no cambian.

/** Forma de lo que lanzan los clientes de src/api: un error de axios o algo con su misma forma. */
interface ErrorConRespuesta {
  response?: {
    status?: number
    data?: { errors?: unknown }
  }
}

/**
 * - validacion: 422 (datos del formulario o credenciales).
 * - limite: 429, demasiados intentos seguidos.
 * - red: no hubo respuesta del servidor (sin conexión o servidor caído).
 * - servidor: cualquier otra respuesta (500, o un 419 que siguió fallando tras el reintento de axios.ts).
 */
export type FallaDeEnvio = 'validacion' | 'limite' | 'red' | 'servidor'

function respuestaDe(error: unknown): ErrorConRespuesta['response'] {
  if (typeof error !== 'object' || error === null) return undefined
  return (error as ErrorConRespuesta).response
}

/** Clasifica el error de un envío. */
export function tipoDeFalla(error: unknown): FallaDeEnvio {
  const status = respuestaDe(error)?.status
  if (status === 422) return 'validacion'
  if (status === 429) return 'limite'
  if (status === undefined && isAxiosError(error)) return 'red'
  return 'servidor'
}

/**
 * Primer mensaje de cada campo de un 422 de Laravel ({ errors: { campo: [mensaje, …] } }),
 * como hacía el registro. Devuelve null si la respuesta no trae ningún mensaje.
 */
export function erroresPorCampo(error: unknown): Record<string, string> | null {
  const errors = respuestaDe(error)?.data?.errors
  if (typeof errors !== 'object' || errors === null) return null
  const mensajes: Record<string, string> = {}
  for (const [campo, valor] of Object.entries(errors)) {
    const primero: unknown = Array.isArray(valor) ? valor[0] : valor
    if (typeof primero === 'string' && primero.trim() !== '') mensajes[campo] = primero
  }
  return Object.keys(mensajes).length > 0 ? mensajes : null
}
