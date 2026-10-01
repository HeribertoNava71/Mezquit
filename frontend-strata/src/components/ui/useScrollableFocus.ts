import { useEffect, useRef, useState, type RefObject } from 'react'
import { getFocusableElements } from './useFocusTrap'

/**
 * Cuerpo con scroll de Modal y Drawer. Si el contenido desborda y no tiene
 * controles, devuelve true para darle tabIndex={0}: así se alcanza con Tab y se
 * recorre con las flechas (WCAG 2.1.1). Con controles dentro no hace falta,
 * porque al enfocarlos el cuerpo se desplaza solo. Mide al abrir, cuando cambia
 * el tamaño del cuerpo y cuando cambia su contenido. Uso interno.
 */
export function useScrollableFocus<T extends HTMLElement>(active: boolean): [RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null)
  const [focusable, setFocusable] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!active || !element) return

    const measure = () => {
      const overflows = element.scrollHeight > element.clientHeight + 1
      setFocusable(overflows && getFocusableElements(element).length === 0)
    }
    measure()

    const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    resize?.observe(element)
    const mutation = new MutationObserver(measure)
    mutation.observe(element, { childList: true, subtree: true, characterData: true })

    return () => {
      resize?.disconnect()
      mutation.disconnect()
      setFocusable(false)
    }
  }, [active])

  return [ref, focusable]
}
