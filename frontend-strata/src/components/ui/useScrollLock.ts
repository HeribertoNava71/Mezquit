import { useEffect } from 'react'

// Contador compartido: con overlays anidados (un modal abierto desde un drawer)
// el scroll se libera solo cuando se cierra el último.
let locks = 0
let saved: { overflow: string; paddingRight: string } | null = null

function lock(): void {
  locks += 1
  if (locks > 1) return

  const { body, documentElement } = document
  saved = { overflow: body.style.overflow, paddingRight: body.style.paddingRight }

  // Compensa el ancho de la barra de desplazamiento para que la página no salte.
  const gap = window.innerWidth - documentElement.clientWidth
  if (gap > 0) {
    const current = Number.parseFloat(window.getComputedStyle(body).paddingRight) || 0
    body.style.paddingRight = `${current + gap}px`
  }
  body.style.overflow = 'hidden'
}

function unlock(): void {
  locks = Math.max(0, locks - 1)
  if (locks > 0 || !saved) return

  document.body.style.overflow = saved.overflow
  document.body.style.paddingRight = saved.paddingRight
  saved = null
}

/**
 * Bloquea el scroll del body mientras `active` sea true (modales y drawer).
 * Admite bloqueos anidados y restaura los estilos originales al terminar.
 */
export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return
    lock()
    return unlock
  }, [active])
}
