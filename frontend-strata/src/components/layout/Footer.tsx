import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cx } from '@/components/ui'
import { hasContent } from '@/components/ui/hasContent'
import { SITE } from '@/config/site'
import { Pendiente } from '@/pages/publicas/Pendiente'
import { esCorreoReal } from '@/pages/publicas/marcadores'
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
  /**
   * Control extra al final de la lista de enlaces (default y home). En la home,
   * el botón para ocultar o mostrar la mascota (WCAG 2.2.2; D-27).
   */
  trailing?: ReactNode
  className?: string
}

/**
 * Pie de página de Strata. Conserva los cinco enlaces del pie actual con el
 * layout del pie del prototipo, el lema según D-18 y el titular legal pendiente.
 * Mientras SITE.email sea «[PENDIENTE]», Contacto y Soporte muestran el marcador
 * sin enlace: un mailto a una dirección que no existe no lleva a ningún lado
 * (el mismo criterio de /ayuda, /demo y /perfil).
 */
export function Footer({ variant = 'default', children, trailing, className }: FooterProps) {
  const correo = esCorreoReal(SITE.email) ? SITE.email.trim() : null

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
            <span className="st-footer__contacto">
              Soporte:{' '}
              {correo ? (
                <a href={`mailto:${correo}`} className="st-footer__link">
                  {correo}
                </a>
              ) : (
                <Pendiente>{SITE.email}</Pendiente>
              )}
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
              {correo ? (
                <a href={`mailto:${correo}`} className="st-footer__link">
                  Contacto
                </a>
              ) : (
                <span className="st-footer__contacto">
                  Contacto: <Pendiente>{SITE.email}</Pendiente>
                </span>
              )}
            </li>
            {home && (
              <li>
                <Link to="/login" className="st-footer__link st-footer__link--internal">
                  Acceso interno
                </Link>
              </li>
            )}
            {hasContent(trailing) && <li>{trailing}</li>}
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
