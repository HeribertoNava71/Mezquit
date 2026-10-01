import { createContext, useContext, type ReactNode } from 'react'

/**
 * info: punto celeste, el look del prototipo (por defecto).
 * success: palomita verde. error: ícono de alerta y «Error:» para lectores de pantalla.
 * El toast es para confirmar acciones (D-22); los errores van inline, junto a su campo
 * o sección. Usa error solo cuando no hay dónde mostrarlo (p. ej., falló el portapapeles).
 */
export type ToastTone = 'info' | 'success' | 'error'

export interface ToastOptions {
  /** Texto breve: «Enlace copiado», «Solicitud registrada». */
  message: ReactNode
  /** Tono. Por defecto, info. */
  tone?: ToastTone
  /**
   * Milisegundos visible. Por defecto, 2600 (como el prototipo). Se pausa con el
   * puntero encima. Infinity lo deja hasta que llames a dismiss(id).
   */
  duration?: number
}

export interface ToastApi {
  /** Muestra un toast y devuelve su id. Un mensaje igual al visible lo reemplaza. */
  toast: (options: ToastOptions) => number
  /** Cierra un toast por su id. */
  dismiss: (id: number) => void
}

/** Duración por defecto, en milisegundos (Strata.dc.html:1547). */
export const TOAST_DURATION = 2600

/** Máximo de toasts apilados; al llegar uno más, se quita el más antiguo. */
export const TOAST_MAX = 3

export const ToastContext = createContext<ToastApi | null>(null)

/**
 * Acceso a los toasts. Requiere <ToastProvider> más arriba en el árbol.
 *
 * @example
 * const { toast } = useToast()
 * toast({ message: 'Enlace copiado', tone: 'success' })
 */
export function useToast(): ToastApi {
  const api = useContext(ToastContext)
  if (!api) throw new Error('useToast necesita un <ToastProvider> más arriba en el árbol.')
  return api
}
