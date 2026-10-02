import { getErrorKind, type EstadoErrorKind } from '@/components/ui'

// Textos de error de Candidatos (lista y detalle de evaluaciones). Los errores
// van inline o en EstadoError, siempre con ícono y texto (D-22); el toast solo
// confirma. Los títulos que no se definen aquí salen de estadoErrorTextos.

export interface TextoError {
  title?: string
  message?: string
}

/** El error se arregla volviendo a intentar: red, servidor, sesión o conflicto. Un 403 o un 404, no. */
export function admiteReintento(kind: EstadoErrorKind): boolean {
  return kind !== 'permiso' && kind !== 'no-encontrado'
}

/** Falla de GET /api/assessments (lista de evaluaciones). */
export function textoErrorLista(kind: EstadoErrorKind): TextoError {
  switch (kind) {
    case 'red':
    case 'sesion':
      return {}
    case 'permiso':
      return {
        title: 'No pudimos cargar tus evaluaciones',
        message: 'Tu cuenta no tiene permiso para ver las evaluaciones de esta empresa.',
      }
    default:
      return {
        title: 'No pudimos cargar tus evaluaciones',
        message: 'Ocurrió un error de nuestro lado. Inténtalo de nuevo en unos minutos.',
      }
  }
}

/**
 * Falla de GET /api/assessments/{id}. El 403 dice que la evaluación es de otra
 * organización (brechas.md R-27); el 404, que no existe.
 */
export function textoErrorDetalle(kind: EstadoErrorKind): TextoError {
  switch (kind) {
    case 'permiso':
      return {
        title: 'No tienes acceso a esta evaluación',
        message: 'Pertenece a otra empresa. Revisa que hayas entrado con la cuenta correcta.',
      }
    case 'no-encontrado':
      return {
        title: 'No encontramos esta evaluación',
        message: 'Puede que el enlace esté incompleto o que la evaluación ya no exista.',
      }
    case 'red':
    case 'sesion':
      return {}
    default:
      return {
        title: 'No pudimos cargar la evaluación',
        message: 'Ocurrió un error de nuestro lado. Inténtalo de nuevo en unos minutos.',
      }
  }
}

/** Aviso inline cuando «Actualizar» falla: la información anterior sigue visible. */
export function textoErrorActualizar(kind: EstadoErrorKind): string {
  switch (kind) {
    case 'red':
      return 'Revisa tu conexión a internet e inténtalo de nuevo. Lo que ves es la última información que cargamos.'
    case 'sesion':
      return 'Tu sesión expiró. Vuelve a entrar para ver la información más reciente.'
    default:
      return 'Ocurrió un error de nuestro lado. Lo que ves es la última información que cargamos.'
  }
}

/**
 * Falla de POST /api/invitations/{id}/resend, inline en la fila. El 409 llega
 * cuando la invitación ya se completó (2026-09-12-fase2-panel-rh.md:634).
 */
export function mensajeErrorReenvio(error: unknown): string {
  switch (getErrorKind(error)) {
    case 'conflicto':
      return 'Esta invitación ya se completó y no se puede reenviar. Actualiza la lista para ver su estado.'
    case 'permiso':
      return 'No tienes acceso a esta invitación.'
    case 'no-encontrado':
      return 'Ya no encontramos esta invitación. Actualiza la lista.'
    case 'sesion':
      return 'Tu sesión expiró. Vuelve a entrar para reenviar la invitación.'
    case 'red':
      return 'No pudimos conectarnos. Revisa tu conexión e inténtalo de nuevo.'
    default:
      return 'No pudimos reenviar la invitación. Inténtalo de nuevo en unos minutos.'
  }
}

/** Toast al copiar un enlace (D-22: el toast solo confirma). */
export const TOAST_ENLACE_COPIADO = 'Enlace copiado'

/** El portapapeles no respondió: se ofrece copiarlo a mano desde «Compartir». */
export const MENSAJE_ERROR_COPIA =
  'No pudimos copiar el enlace. Ábrelo con «Compartir» para seleccionarlo y copiarlo a mano.'
