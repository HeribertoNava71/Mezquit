import { isAxiosError } from 'axios'
import { getErrorKind } from '@/components/ui'

// Errores de PATCH y DELETE /api/admin/users/{id}, para mostrarlos en línea
// con ícono y texto (D-22). Los textos van en español aunque el servidor
// responda en otro idioma; solo los mensajes por campo del 422 salen del servidor.

/** Código HTTP de un error de axios; undefined si no hubo respuesta o no es de axios. */
export function estadoHttp(error: unknown): number | undefined {
  return isAxiosError(error) ? error.response?.status : undefined
}

/** Error que se muestra en línea. definitivo: repetir la acción no lo resuelve. */
export interface ErrorDeAccion {
  mensaje: string
  definitivo: boolean
}

const SIN_RED = 'No pudimos conectarnos. Revisa tu conexión e inténtalo de nuevo.'
const SESION = 'Tu sesión expiró. Vuelve a entrar para continuar.'
const YA_NO_EXISTE = 'Este usuario ya no existe. Puede que alguien más lo haya eliminado.'

/**
 * Por qué falló DELETE /api/admin/users/{id}. El 409 es el de
 * Admin\UserController::destroy: nadie puede eliminar su propia cuenta.
 */
export function errorAlEliminar(error: unknown): ErrorDeAccion {
  const estado = estadoHttp(error)
  if (estado === 409) return { mensaje: 'No puedes eliminar tu propia cuenta.', definitivo: true }
  if (estado === 404) return { mensaje: YA_NO_EXISTE, definitivo: true }
  if (estado === 403) return { mensaje: 'Tu cuenta no tiene permiso para eliminar usuarios.', definitivo: true }
  const tipo = getErrorKind(error)
  if (tipo === 'red') return { mensaje: SIN_RED, definitivo: false }
  if (tipo === 'sesion') return { mensaje: SESION, definitivo: true }
  return { mensaje: 'No pudimos eliminar al usuario. Inténtalo de nuevo en unos minutos.', definitivo: false }
}

/** Por qué falló PATCH /api/admin/users/{id}, salvo los errores por campo del 422. */
export function errorAlGuardar(error: unknown): ErrorDeAccion {
  const estado = estadoHttp(error)
  if (estado === 404) return { mensaje: YA_NO_EXISTE, definitivo: true }
  if (estado === 403) return { mensaje: 'Tu cuenta no tiene permiso para editar usuarios.', definitivo: true }
  if (estado === 422) return { mensaje: 'Revisa los datos e inténtalo de nuevo.', definitivo: false }
  const tipo = getErrorKind(error)
  if (tipo === 'red') return { mensaje: SIN_RED, definitivo: false }
  if (tipo === 'sesion') return { mensaje: SESION, definitivo: true }
  return { mensaje: 'No pudimos guardar los cambios. Inténtalo de nuevo en unos minutos.', definitivo: false }
}

/**
 * Errores por campo de un 422 de Laravel ({ message, errors: { campo: [mensajes] } }):
 * el primer mensaje de cada campo. null si el error no es un 422 con errors.
 */
export function erroresDeCampos(error: unknown): Record<string, string> | null {
  if (estadoHttp(error) !== 422 || !isAxiosError(error)) return null
  const errores: unknown = (error.response?.data as { errors?: unknown } | undefined)?.errors
  if (!errores || typeof errores !== 'object') return null
  const porCampo: Record<string, string> = {}
  for (const [campo, mensajes] of Object.entries(errores as Record<string, unknown>)) {
    const primero = Array.isArray(mensajes) ? mensajes[0] : mensajes
    if (typeof primero === 'string' && primero.trim()) porCampo[campo] = primero
  }
  return Object.keys(porCampo).length > 0 ? porCampo : null
}
