import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Al cambiar de ruta, sube el scroll al inicio.
 * Si la URL trae un hash (#seccion), hace scroll a ese elemento en su lugar.
 * Respeta prefers-reduced-motion usando scroll instantáneo.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1))
      if (el) {
        el.scrollIntoView({ block: 'start' })
        return
      }
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])

  return null
}
