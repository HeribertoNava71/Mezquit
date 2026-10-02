import { useState, type ReactNode } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { cx } from '@/components/ui'
import './RouteTransition.css'

export interface RouteTransitionProps {
  /** Contenido de la pantalla. Por defecto, el <Outlet /> de las rutas hijas. */
  children?: ReactNode
  /** Clase extra para el envoltorio (.st-route). */
  className?: string
}

function Pantalla({ children, className }: RouteTransitionProps) {
  const { hash } = useLocation()
  // Se decide una sola vez por pantalla. Si llega con #ancla, solo funde: sin
  // el transform de la entrada, el salto de ScrollToTop cae en su lugar.
  // Un cambio de hash posterior no cambia la clase, así que no reinicia la animación.
  const [conAncla] = useState(() => hash.length > 1)
  return (
    <div className={cx('st-route', conAncla && 'st-route--anchor', className)}>
      {children ?? <Outlet />}
    </div>
  )
}

/**
 * Entrada de pantalla al cambiar de ruta: fundido y elevación de 14 px en
 * 0.5 s con cubic-bezier(.22,.61,.36,1) (Strata.dc.html:31; PROMPT_CLAUDE_CODE.md:104).
 * Sin animación con prefers-reduced-motion.
 *
 * La clave es location.pathname: la pantalla se vuelve a montar (y a animar)
 * solo cuando cambia la ruta, no con ?búsqueda ni con #ancla.
 *
 * Va dentro de PageLayout, nunca alrededor: mientras dura la animación, el
 * transform cambiaría la referencia de lo que tenga position: fixed (halos).
 */
export function RouteTransition(props: RouteTransitionProps) {
  const { pathname } = useLocation()
  return <Pantalla key={pathname} {...props} />
}

export default RouteTransition
