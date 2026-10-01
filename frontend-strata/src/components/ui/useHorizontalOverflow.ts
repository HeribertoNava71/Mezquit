import { useEffect, useState, type RefObject } from 'react'

/**
 * true si el contenido del elemento desborda a lo ancho (hay scroll horizontal).
 * Observa el contenedor y su primer hijo con ResizeObserver; sin ResizeObserver
 * (jsdom) devuelve false.
 *
 * Sirve para que una región con scroll sea enfocable solo cuando de verdad lo
 * necesita (WCAG 2.1.1: el teclado debe poder desplazarla).
 */
export function useHorizontalOverflow(ref: RefObject<HTMLElement | null>): boolean {
  const [overflowing, setOverflowing] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => {
      setOverflowing(element.scrollWidth > element.clientWidth + 1)
    })
    observer.observe(element)
    if (element.firstElementChild) observer.observe(element.firstElementChild)
    return () => observer.disconnect()
  }, [ref])

  return overflowing
}
