import type { ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { cx } from '@/components/ui'
import type { EnlaceNav } from './navegacion'
import './NavLinks.css'

export interface EnlaceNavegacionProps {
  enlace: EnlaceNav
  className?: string
  onClick?: () => void
  /** Contenido propio. Por defecto, enlace.label. */
  children?: ReactNode
}

/**
 * Enlace de barra con aria-current="page" cuando está activo. Usa NavLink, que
 * marca la ruta y sus subrutas (o solo la exacta con `end`). Si el enlace trae
 * su propia regla (`coincide`, como «Resultados»), aria-current sale de ella.
 * El estilo activo se engancha de [aria-current='page'].
 */
export function EnlaceNavegacion({ enlace, className, onClick, children }: EnlaceNavegacionProps) {
  const { pathname } = useLocation()
  const contenido = children ?? enlace.label

  if (enlace.coincide) {
    const activo = enlace.coincide(pathname)
    return (
      <Link to={enlace.to} className={className} aria-current={activo ? 'page' : undefined} onClick={onClick}>
        {contenido}
      </Link>
    )
  }

  return (
    <NavLink to={enlace.to} end={enlace.end} className={className} onClick={onClick}>
      {contenido}
    </NavLink>
  )
}

export interface NavLinksProps {
  /** Nombre de la navegación: «Navegación principal», «Panel de RR. HH.» u «Operación». */
  label: string
  enlaces: readonly EnlaceNav[]
  className?: string
}

/**
 * Navegación de texto de la barra en escritorio (Strata.dc.html:60-64): activo
 * en tinta, 600 y con subrayado coral de 2 px; inactivo en #6B6558 y 500
 * (:1770-1774; estilos en TopBar.css). Por debajo de 768 px se oculta y sus
 * enlaces pasan al menú móvil.
 */
export function NavLinks({ label, enlaces, className }: NavLinksProps) {
  return (
    <nav aria-label={label} className={cx('st-nav-links', className)}>
      <ul className="st-topbar__nav st-nav-links__list">
        {enlaces.map((enlace) => (
          <li key={enlace.to} className="st-nav-links__item">
            <EnlaceNavegacion enlace={enlace} className="st-topbar__link" />
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default NavLinks
