import { isAxiosError } from 'axios'

/**
 * Tipo de error para EstadoError:
 * red (sin respuesta del servidor), permiso (403), no-encontrado (404),
 * conflicto (409), sesion (401 o 419) y servidor (500 y cualquier otro).
 */
export type EstadoErrorKind = 'red' | 'permiso' | 'no-encontrado' | 'conflicto' | 'sesion' | 'servidor'

export interface EstadoErrorTexto {
  title: string
  message: string
}

/** Textos por defecto de EstadoError (es-MX, tuteo). Cada pantalla puede sobrescribirlos. */
export const estadoErrorTextos: Record<EstadoErrorKind, EstadoErrorTexto> = {
  red: {
    title: 'No pudimos conectarnos',
    message: 'Revisa tu conexión a internet e inténtalo de nuevo.',
  },
  permiso: {
    title: 'No tienes acceso',
    message: 'Tu cuenta no tiene permiso para ver esta información.',
  },
  'no-encontrado': {
    title: 'No encontramos lo que buscas',
    message: 'Puede que el enlace esté incompleto o que este contenido ya no exista.',
  },
  conflicto: {
    title: 'No se pudo completar la acción',
    message: 'La información cambió desde que abriste esta página. Vuelve a cargarla para ver su estado actual.',
  },
  sesion: {
    title: 'Tu sesión expiró',
    message: 'Vuelve a entrar para continuar.',
  },
  servidor: {
    title: 'No pudimos cargar la información',
    message: 'Ocurrió un error de nuestro lado. Inténtalo de nuevo en unos minutos.',
  },
}

/** Tipo de error según el código HTTP. Sin código (sin respuesta) es «red». */
export function getErrorKindFromStatus(status: number | undefined): EstadoErrorKind {
  if (status === undefined || status === 0) return 'red'
  if (status === 401 || status === 419) return 'sesion'
  if (status === 403) return 'permiso'
  if (status === 404 || status === 410) return 'no-encontrado'
  if (status === 409) return 'conflicto'
  return 'servidor'
}

/**
 * Tipo de error a partir de lo que lanzó una llamada de src/api/*.
 * Un error de axios sin respuesta es «red»; lo que no viene de axios, «servidor».
 * Las peticiones canceladas (AbortController) no son errores: descártalas antes.
 *
 * @example
 * catch (error) { setErrorKind(getErrorKind(error)) }
 */
export function getErrorKind(error: unknown): EstadoErrorKind {
  if (isAxiosError(error)) return getErrorKindFromStatus(error.response?.status)
  return 'servidor'
}
