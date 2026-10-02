import type { PendingRequest } from '@/api/admin'
import type { EstadoErrorKind } from '@/components/ui'

// Resolver una solicitud de créditos: la acción, el estado del modal de
// confirmación y los textos de cada error (D-22: los errores van en línea,
// con ícono y texto; el toast solo confirma).

/** Aprobar suma los créditos al saldo; rechazar cierra la solicitud. Ninguna se deshace (S-15). */
export type AccionSolicitud = 'aprobar' | 'rechazar'

/** Lo que muestra el modal de confirmación. */
export interface DialogoSolicitud {
  accion: AccionSolicitud
  solicitud: PendingRequest
  /** POST approve o reject en curso. */
  enviando: boolean
  /** Tipo del último error de ese POST; null si no hubo. */
  error: EstadoErrorKind | null
}

/**
 * Tras una falla de red, del servidor o de sesión, la solicitud sigue pendiente
 * y se puede volver a intentar. Con 409 (ya resuelta), 404 o 403 no: toca
 * actualizar la lista.
 */
export function puedeReintentarse(tipo: EstadoErrorKind): boolean {
  return tipo !== 'conflicto' && tipo !== 'no-encontrado' && tipo !== 'permiso'
}

/** Título y texto del error en el modal, según el tipo y la acción. */
export function textoDeError(tipo: EstadoErrorKind, accion: AccionSolicitud): { titulo: string; texto: string } {
  switch (tipo) {
    case 'red':
      return {
        titulo: 'No pudimos conectarnos',
        texto: 'Revisa tu conexión e inténtalo de nuevo. La solicitud sigue pendiente.',
      }
    case 'conflicto':
      return {
        titulo: 'Esta solicitud ya no está pendiente',
        texto: 'Alguien más la aprobó o la rechazó mientras la revisabas. Actualiza la lista para ver las que siguen pendientes.',
      }
    case 'no-encontrado':
      return {
        titulo: 'Esta solicitud ya no existe',
        texto: 'Actualiza la lista para ver las que siguen pendientes.',
      }
    case 'permiso':
      return {
        titulo: 'Tu cuenta no puede resolver solicitudes',
        texto: 'Hace falta un acceso de operación. Actualiza la lista o vuelve a entrar.',
      }
    case 'sesion':
      return {
        titulo: 'Tu sesión expiró',
        texto: 'Vuelve a entrar para continuar. La solicitud sigue pendiente.',
      }
    default:
      return {
        titulo: `No pudimos ${accion} la solicitud`,
        texto: 'Ocurrió un error de nuestro lado. Inténtalo de nuevo en unos minutos; la solicitud sigue pendiente.',
      }
  }
}
