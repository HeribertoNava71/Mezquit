import { useLayoutEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/** Tiempo máximo que se espera un ancla que todavía no está en el DOM (contenido que llega de la API). */
export const ESPERA_ANCLA_MS = 2000

/** Elemento al que apunta el hash. Prueba el id tal cual y decodificado (acentos, espacios). */
function buscarAncla(id: string): HTMLElement | null {
  const tal = document.getElementById(id)
  if (tal) return tal
  try {
    const decodificado = decodeURIComponent(id)
    return decodificado === id ? null : document.getElementById(decodificado)
  } catch {
    return null // secuencia % mal formada
  }
}

/**
 * Al cambiar de ruta, sube el scroll al inicio. Si la URL trae un hash
 * (#seccion), salta a ese elemento en su lugar.
 *
 * - Ruta nueva: salto instantáneo; la página nueva no «viaja» desde la
 *   posición de la anterior.
 * - Misma ruta con otro hash (enlace a una sección de la página): usa el
 *   scroll-behavior de html, suave salvo con prefers-reduced-motion (global.css).
 * - Si el ancla todavía no existe, la espera hasta ESPERA_ANCLA_MS.
 * - Solo reacciona a pathname y hash: cambiar la búsqueda (?page=2) no mueve el scroll.
 *
 * PageLayout ya lo monta. Un layout que no use PageLayout puede montarlo directamente.
 */
export function ScrollToTop() {
  const { pathname, hash } = useLocation()
  const rutaPrevia = useRef<string | null>(null)

  // useLayoutEffect: el salto ocurre antes de pintar la página nueva.
  useLayoutEffect(() => {
    const mismaRuta = rutaPrevia.current === pathname
    rutaPrevia.current = pathname
    const behavior: ScrollBehavior = mismaRuta ? 'auto' : 'instant'
    const id = hash.slice(1)

    const ancla = id ? buscarAncla(id) : null
    if (ancla) {
      ancla.scrollIntoView({ block: 'start', behavior })
      return
    }
    // Sin ancla, o con un ancla que aún no llega: la página nueva empieza arriba.
    // En la misma ruta, un ancla que no existe no mueve nada (como el navegador).
    if (!mismaRuta || !id) window.scrollTo({ top: 0, left: 0, behavior })
    if (!id) return

    const observador = new MutationObserver(() => {
      const tardia = buscarAncla(id)
      if (!tardia) return
      dejarDeEsperar()
      tardia.scrollIntoView({ block: 'start', behavior })
    })
    const limite = window.setTimeout(() => observador.disconnect(), ESPERA_ANCLA_MS)
    const dejarDeEsperar = () => {
      observador.disconnect()
      window.clearTimeout(limite)
    }
    observador.observe(document.body, { childList: true, subtree: true })
    return dejarDeEsperar
  }, [pathname, hash])

  return null
}

export default ScrollToTop
