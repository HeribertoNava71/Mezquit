import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cx } from './cx'
import { IconoCheck, IconoError } from './Iconos'
import { useOverlayAbierto } from './overlayAbierto'
import { candidatas, elegirPosicion, type Caja, type PosicionToast } from './posicionToast'
import { getFocusableElements } from './useFocusTrap'
import { TOAST_DURATION, TOAST_MAX, ToastContext, type ToastApi, type ToastOptions, type ToastTone } from './useToast'
import { VisuallyHidden } from './VisuallyHidden'
import './Toast.css'

/** Distancia por defecto al borde de abajo (--space-26 en Toast.css; Strata.dc.html:1420). */
const MARGEN_TOAST = 26

/** Cajas visibles de los controles del panel, recortadas por sus contenedores con scroll. */
function cajasDeControles(panel: HTMLElement): Caja[] {
  const cajas: Caja[] = []
  for (const control of getFocusableElements(panel)) {
    const r = control.getBoundingClientRect()
    let caja: Caja = { left: r.left, top: r.top, right: r.right, bottom: r.bottom }
    for (let padre = control.parentElement; padre && padre !== panel.parentElement; padre = padre.parentElement) {
      const estilo = window.getComputedStyle(padre)
      if (estilo.overflowX === 'visible' && estilo.overflowY === 'visible') continue
      const borde = padre.getBoundingClientRect()
      caja = {
        left: Math.max(caja.left, borde.left),
        top: Math.max(caja.top, borde.top),
        right: Math.min(caja.right, borde.right),
        bottom: Math.min(caja.bottom, borde.bottom),
      }
    }
    if (caja.right > caja.left && caja.bottom > caja.top) cajas.push(caja)
  }
  return cajas
}

/** Lleva la región a la posición elegida; null la devuelve a la del CSS (abajo y al centro). */
function aplicarPosicion(region: HTMLElement, posicion: PosicionToast | null) {
  const estilo = region.style
  if (!posicion) {
    for (const propiedad of ['top', 'bottom', 'left', 'right']) estilo.removeProperty(propiedad)
    delete region.dataset.posicion
    return
  }
  estilo.top = posicion.lado === 'arriba' ? `${posicion.distancia}px` : 'auto'
  estilo.bottom = posicion.lado === 'abajo' ? `${posicion.distancia}px` : 'auto'
  estilo.left = `${posicion.izquierda}px`
  estilo.right = `${posicion.derecha}px`
  region.dataset.posicion = posicion.lado
}

const igual = (a: PosicionToast, b: PosicionToast) =>
  a.lado === b.lado && a.distancia === b.distancia && a.izquierda === b.izquierda && a.derecha === b.derecha

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
 * Con un Modal o un Drawer abierto, la región se mueve a donde tape menos de sus
 * controles: arriba, en el hueco junto al drawer o sobre el pie del panel
 * (posicionToast.ts, Fase 8). Va una vez, cerca de la raíz de la app; los
 * componentes usan useToast().
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

  // Con un overlay abierto, el toast no tapa sus controles (a 360 px el drawer
  // ocupa la pantalla y su botón «Cerrar» quedaba debajo del toast).
  const overlay = useOverlayAbierto()
  const regionRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const region = regionRef.current
    if (!region) return
    if (!overlay || items.length === 0) {
      aplicarPosicion(region, null)
      return
    }
    const panelOverlay = overlay
    const regionToasts = region
    function medir() {
      const pila = [...regionToasts.children].map((hijo) => hijo.getBoundingClientRect())
      if (pila.length === 0) return
      const ancho = Math.max(...pila.map((caja) => caja.width))
      const alto = Math.max(...pila.map((caja) => caja.bottom)) - Math.min(...pila.map((caja) => caja.top))
      const pie = panelOverlay.querySelector('[data-overlay-pie]')?.getBoundingClientRect() ?? null
      const datos = {
        ventana: { ancho: window.innerWidth, alto: window.innerHeight },
        toast: { ancho, alto },
        margen: MARGEN_TOAST,
        relleno: Number.parseFloat(window.getComputedStyle(regionToasts).paddingLeft) || 0,
        panel: panelOverlay.getBoundingClientRect(),
        pie,
        controles: cajasDeControles(panelOverlay),
      }
      const elegida = elegirPosicion(datos)
      aplicarPosicion(regionToasts, igual(elegida, candidatas(datos)[0]) ? null : elegida)
    }
    medir()
    window.addEventListener('resize', medir)
    // El cuerpo del overlay se desplaza con sus controles: captura, porque scroll no burbujea.
    document.addEventListener('scroll', medir, true)
    return () => {
      window.removeEventListener('resize', medir)
      document.removeEventListener('scroll', medir, true)
    }
  }, [overlay, items])

  return (
    <ToastContext.Provider value={api}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={regionRef}
            className="st-toaster"
            role="status"
            aria-live="polite"
            aria-atomic="false"
            aria-relevant="additions text"
          >
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
