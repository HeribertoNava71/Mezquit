import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cx } from '@/components/ui'
import { hasContent } from '@/components/ui/hasContent'
import { SITE } from '@/config/site'
import { Marca } from './Marca'
import './Footer.css'

const YEAR = new Date().getFullYear()

/** Los cinco enlaces del pie actual (mapa.md, V-7). /terminos solo se enlaza desde aquí. */
const ENLACES = [
  { to: '/aviso-de-privacidad', label: 'Aviso de privacidad' },
  { to: '/terminos', label: 'Términos y condiciones' },
  // «Soporte» es la etiqueta del prototipo; lleva a la página de Ayuda.
  { to: '/ayuda', label: 'Soporte' },
  { to: '/evaluar', label: '¿Te invitaron a una evaluación?' },
] as const

/** default: pie de las pantallas. home: pie de la home (Fase 6). compact: flujo del candidato (Fase 3). */
export type FooterVariant = 'default' | 'home' | 'compact'

export interface FooterProps {
  /**
   * - default: pie del shell, centrado a 1200 px con borde superior (Strata.dc.html:1230-1243).
   * - home: el mismo pie dentro del contenido de la home, con «Acceso interno» → /login (:312-324).
   * - compact: fila centrada de enlaces del acceso del candidato: Aviso de privacidad
   *   y Soporte con SITE.email (:1122-1132).
   * Por defecto, default.
   */
  variant?: FooterVariant
  /** Elemento extra al inicio de la fila de enlaces (por ejemplo, «Ingresar mi código manualmente»). */
  children?: ReactNode
  className?: string
}

/**
 * Pie de página de Strata. Conserva los cinco enlaces del pie actual con el
 * layout del pie del prototipo, el lema según D-18 y el titular legal pendiente.
 */
export function Footer({ variant = 'default', children, className }: FooterProps) {
  if (variant === 'compact') {
    return (
      <footer className={cx('st-footer', 'st-footer--compact', className)}>
        <ul className="st-footer__row">
          {hasContent(children) && <li className="st-footer__item">{children}</li>}
          <li className="st-footer__item">
            <Link to="/aviso-de-privacidad" className="st-footer__link">
              Aviso de privacidad
            </Link>
          </li>
          <li className="st-footer__item">
            <span>
              Soporte:{' '}
              <a href={`mailto:${SITE.email}`} className="st-footer__link">
                {SITE.email}
              </a>
            </span>
          </li>
        </ul>
      </footer>
    )
  }

  const home = variant === 'home'
  return (
    <footer className={cx('st-footer', home && 'st-footer--home', className)}>
      <Marca size="sm" />
      <p className="st-footer__claim">{SITE.claim}</p>
      <div className="st-footer__end">
        <nav className="st-footer__nav" aria-label="Pie de página">
          <ul className="st-footer__links">
            {hasContent(children) && <li>{children}</li>}
            {ENLACES.map(({ to, label }) => (
              <li key={to}>
                <Link to={to} className="st-footer__link">
                  {label}
                </Link>
              </li>
            ))}
            <li>
              <a href={`mailto:${SITE.email}`} className="st-footer__link">
                Contacto
              </a>
            </li>
            {home && (
              <li>
                <Link to="/login" className="st-footer__link st-footer__link--internal">
                  Acceso interno
                </Link>
              </li>
            )}
          </ul>
        </nav>
        <p className="st-footer__legal">
          © {YEAR} {SITE.legalName}
        </p>
      </div>
    </footer>
  )
}

export default Footer
