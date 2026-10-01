import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function mediaQuery(): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null
  return window.matchMedia(QUERY)
}

function subscribe(onChange: () => void): () => void {
  const mql = mediaQuery()
  if (!mql) return () => {}
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

function getSnapshot(): boolean {
  return mediaQuery()?.matches ?? false
}

function getServerSnapshot(): boolean {
  return false
}

/**
 * Lectura puntual, fuera de React (por ejemplo, al crear tweens de GSAP).
 * Dentro de un componente usa useReducedMotion para reaccionar a los cambios.
 */
export function prefersReducedMotion(): boolean {
  return getSnapshot()
}

/**
 * true si el sistema pide reducir el movimiento (prefers-reduced-motion: reduce).
 * Se actualiza si el usuario cambia la preferencia con la página abierta.
 * La regla global de global.css ya anula animaciones y transiciones CSS;
 * este hook es para lo que se anima con JS (mascota, contadores, scroll).
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
