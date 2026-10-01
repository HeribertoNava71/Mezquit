import { useEffect, useEffectEvent, useRef, type RefObject } from 'react'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  'iframe',
  'audio[controls]',
  'video[controls]',
  'summary',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]',
].join(',')

/** Elementos alcanzables con Tab dentro de container, en orden del documento. */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((el) => {
    if (el.tabIndex < 0) return false
    if (el.matches(':disabled')) return false
    if (el.closest('[hidden], [inert]')) return false
    const style = window.getComputedStyle(el)
    return style.display !== 'none' && style.visibility !== 'hidden'
  })
}

export interface UseFocusTrapOptions {
  /** Activa la trampa (por ejemplo, el estado `open` del modal). Por defecto, true. */
  active?: boolean
  /** Se llama al pulsar Escape (si ningún control interno lo atendió antes). */
  onClose?: () => void
  /**
   * Qué recibe el foco al activarse: una ref, 'container' (el propio contenedor,
   * útil para que el lector de pantalla anuncie el título) o, por defecto,
   * el primer elemento enfocable.
   */
  initialFocus?: RefObject<HTMLElement | null> | 'container'
  /** Devuelve el foco al disparador al desactivarse o desmontarse. Por defecto, true. */
  returnFocus?: boolean
}

interface TrapEntry {
  id: symbol
  container: HTMLElement
}

// Pila de trampas activas: solo la de arriba atiende Tab, Escape y el foco
// (un modal abierto desde un drawer, por ejemplo).
const trapStack: TrapEntry[] = []

function addTrap(entry: TrapEntry): void {
  // Si se montan anidadas en el mismo render, el efecto del hijo corre primero:
  // la trampa que contiene a otra ya activa va debajo de ella.
  const index = trapStack.findIndex((trap) => entry.container.contains(trap.container))
  if (index === -1) trapStack.push(entry)
  else trapStack.splice(index, 0, entry)
}

function removeTrap(id: symbol): void {
  const index = trapStack.findIndex((trap) => trap.id === id)
  if (index !== -1) trapStack.splice(index, 1)
}

function isTopTrap(id: symbol): boolean {
  return trapStack[trapStack.length - 1]?.id === id
}

/**
 * Atrapa el foco dentro de un contenedor mientras `active` sea true:
 * Tab y Mayús+Tab circulan dentro, el foco que se escapa (clic fuera o
 * programático) regresa, Escape llama a `onClose` y, al desactivarse,
 * el foco vuelve al elemento que lo tenía antes (el disparador).
 *
 * @example
 * const panelRef = useFocusTrap<HTMLDivElement>({ active: open, onClose: cerrar })
 * return open ? <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="titulo">…</div> : null
 */
export function useFocusTrap<T extends HTMLElement = HTMLElement>(
  options: UseFocusTrapOptions = {},
): RefObject<T | null> {
  const { active = true, onClose, initialFocus, returnFocus = true } = options
  const containerRef = useRef<T | null>(null)

  // Lecturas siempre actualizadas sin reactivar el efecto.
  // Devuelve true si había onClose (solo entonces se consume la tecla Escape).
  const handleEscape = useEffectEvent((): boolean => {
    if (!onClose) return false
    onClose()
    return true
  })
  const readSettings = useEffectEvent(() => ({ initialFocus, returnFocus }))

  useEffect(() => {
    const container = containerRef.current
    if (!active || !container) return

    const id = Symbol('focus-trap')
    const { initialFocus: initial, returnFocus: shouldReturn } = readSettings()
    const previous = document.activeElement
    const trigger = previous instanceof HTMLElement && previous !== document.body ? previous : null
    addTrap({ id, container })

    if (!container.hasAttribute('tabindex')) container.setAttribute('tabindex', '-1')

    const focusFirst = () => {
      const [first] = getFocusableElements(container)
      const target = first ?? container
      target.focus()
    }

    if (isTopTrap(id)) {
      if (initial === 'container') {
        container.focus()
      } else if (initial?.current) {
        initial.current.focus()
      } else if (!container.contains(document.activeElement)) {
        focusFirst()
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (!isTopTrap(id) || event.defaultPrevented) return

      if (event.key === 'Escape') {
        // Con un IME (acentos, japonés), Escape cancela la composición: no cierra.
        if (event.isComposing) return
        if (handleEscape()) event.preventDefault()
        return
      }
      if (event.key !== 'Tab') return

      const items = getFocusableElements(container)
      if (items.length === 0) {
        event.preventDefault()
        container.focus()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const current = document.activeElement
      const inside = current instanceof Node && container.contains(current)

      if (event.shiftKey) {
        if (!inside || current === first || current === container) {
          event.preventDefault()
          last.focus()
        }
      } else if (!inside || current === last) {
        event.preventDefault()
        first.focus()
      }
    }

    const onFocusIn = (event: FocusEvent) => {
      if (!isTopTrap(id)) return
      const target = event.target
      if (target instanceof Node && container.contains(target)) return
      focusFirst()
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('focusin', onFocusIn)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('focusin', onFocusIn)
      removeTrap(id)
      if (shouldReturn && trigger && trigger.isConnected) trigger.focus()

      // Si queda otra trampa activa y el foco quedó fuera de ella, lo regresa.
      const top = trapStack[trapStack.length - 1]
      if (top && top.container.isConnected && !top.container.contains(document.activeElement)) {
        const [first] = getFocusableElements(top.container)
        const target = first ?? top.container
        target.focus()
      }
    }
  }, [active])

  return containerRef
}
