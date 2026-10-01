import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cx } from './cx'
import { IconoCheck, IconoError } from './Iconos'
import { TOAST_DURATION, TOAST_MAX, ToastContext, type ToastApi, type ToastOptions, type ToastTone } from './useToast'
import { VisuallyHidden } from './VisuallyHidden'
import './Toast.css'

interface ToastItem {
  id: number
  message: ReactNode
  tone: ToastTone
  duration: number
}

export interface ToastProviderProps {
  children?: ReactNode
  /** Máximo de toasts visibles a la vez; el más antiguo sale primero. Por defecto, 3. */
  max?: number
  /** Duración por defecto en milisegundos. Por defecto, 2600. */
  duration?: number
}

function normalizarDuracion(valor: number | undefined, porDefecto: number): number {
  if (valor === Infinity) return Infinity
  return typeof valor === 'number' && Number.isFinite(valor) && valor > 0 ? valor : porDefecto
}

/**
 * Proveedor de toasts (Strata.dc.html:1420-1425): caja tinta con punto celeste,
 * centrada abajo. Monta una sola región role="status" (aria-live polite) en el body,
 * que existe desde el inicio para que los lectores de pantalla anuncien cada toast.
 * Va una vez, cerca de la raíz de la app; los componentes usan useToast().
 */
export function ToastProvider({ children, max = TOAST_MAX, duration = TOAST_DURATION }: ToastProviderProps) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(0)
  const limite = Math.max(1, Math.floor(max))

  const dismiss = useCallback((id: number) => {
    setItems((actuales) => actuales.filter((item) => item.id !== id))
  }, [])

  const toast = useCallback(
    ({ message, tone = 'info', duration: propia }: ToastOptions) => {
      nextId.current += 1
      const item: ToastItem = { id: nextId.current, message, tone, duration: normalizarDuracion(propia, duration) }
      setItems((actuales) => {
        // Un texto igual al que ya se ve lo reemplaza: se anuncia de nuevo sin apilar copias.
        const resto =
          typeof message === 'string'
            ? actuales.filter((actual) => actual.message !== message || actual.tone !== tone)
            : actuales
        return [...resto, item].slice(-limite)
      })
      return item.id
    },
    [duration, limite],
  )

  const api = useMemo<ToastApi>(() => ({ toast, dismiss }), [toast, dismiss])

  return (
    <ToastContext.Provider value={api}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div className="st-toaster" role="status" aria-live="polite" aria-atomic="false" aria-relevant="additions text">
            {items.map((item) => (
              <ToastMensaje key={item.id} item={item} onDismiss={dismiss} />
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  )
}

interface ToastMensajeProps {
  item: ToastItem
  onDismiss: (id: number) => void
}

/** Un toast. Se cierra solo al terminar su duración; el puntero encima la pausa. */
function ToastMensaje({ item, onDismiss }: ToastMensajeProps) {
  const [pausado, setPausado] = useState(false)
  const restante = useRef(item.duration)

  useEffect(() => {
    if (pausado || !Number.isFinite(restante.current)) return
    const inicio = Date.now()
    const timer = window.setTimeout(() => onDismiss(item.id), Math.max(0, restante.current))
    return () => {
      window.clearTimeout(timer)
      restante.current -= Date.now() - inicio
    }
  }, [pausado, item.id, onDismiss])

  return (
    <div
      className={cx('st-toast', `st-toast--${item.tone}`)}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
    >
      {item.tone === 'info' && <span className="st-toast__dot" aria-hidden="true" />}
      {item.tone === 'success' && <IconoCheck className="st-toast__icon" />}
      {item.tone === 'error' && <IconoError className="st-toast__icon" />}
      <span className="st-toast__message">
        {item.tone === 'error' && <VisuallyHidden>Error: </VisuallyHidden>}
        {item.message}
      </span>
    </div>
  )
}
