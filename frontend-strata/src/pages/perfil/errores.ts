import { isAxiosError } from 'axios'
import { getErrorKind } from '@/components/ui'

// Errores al guardar en /perfil y /admin/perfil (D-22: inline, con ícono y texto).

/**
 * Errores por campo de un 422 de Laravel: `{ errors: { campo: ["mensaje", …] } }`.
 * Devuelve el primer mensaje de cada campo, o null si la respuesta no es un 422
 * con errores (por ejemplo, el 422 de PUT /api/admin/me sin `errors`, PB-24).
 */
export function erroresPorCampo(error: unknown): Record<string, string> | null {
  if (!isAxiosError(error) || error.response?.status !== 422) return null
  const datos: unknown = error.response.data
  if (typeof datos !== 'object' || datos === null) return null
  const errores = (datos as { errors?: unknown }).errors
  if (typeof errores !== 'object' || errores === null) return null

  const campos: Record<string, string> = {}
  for (const [campo, mensajes] of Object.entries(errores)) {
    const lista: unknown[] = Array.isArray(mensajes) ? mensajes : [mensajes]
    const primero = lista.find((mensaje): mensaje is string => typeof mensaje === 'string' && mensaje.trim() !== '')
    if (primero) campos[campo] = primero
  }
  return Object.keys(campos).length > 0 ? campos : null
}

/** Si el error es un 422 (con o sin errores por campo). */
export function esValidacion(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 422
}

/** Título del aviso de error al guardar. */
export const TITULO_ERROR_AL_GUARDAR = 'No pudimos guardar tus cambios'

/**
 * Texto del aviso de error al guardar cuando no se puede mostrar junto a un campo.
 * `mensaje422` es el texto para un 422 sin errores por campo.
 */
export function mensajeAlGuardar(error: unknown, mensaje422 = 'Revisa los datos e inténtalo de nuevo.'): string {
  if (esValidacion(error)) return mensaje422
  switch (getErrorKind(error)) {
    case 'red':
      return 'Revisa tu conexión a internet e inténtalo de nuevo.'
    case 'sesion':
      return 'Tu sesión expiró. Vuelve a entrar para continuar.'
    case 'permiso':
      return 'Tu cuenta no tiene permiso para hacer este cambio.'
    default:
      return 'Ocurrió un error de nuestro lado. Inténtalo de nuevo en unos minutos.'
  }
}
