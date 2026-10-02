import type { ReactNode } from 'react'
import { cx } from '@/components/ui'
import './EncabezadoSeccion.css'

export interface EncabezadoSeccionProps {
  /** id del H2, para el aria-labelledby de la sección que lo contiene. */
  id: string
  /** Eyebrow sobre el título (11 px, mayúsculas, celeste para texto). */
  eyebrow?: ReactNode
  /** Título de la sección (H2 de 30 px). */
  title: ReactNode
  /** Pieza junto al título, como una insignia (Tag). */
  aside?: ReactNode
  /** Entradilla bajo el título. */
  lede?: ReactNode
  className?: string
}

/**
 * Encabezado de una sección dentro de una página pública: eyebrow, H2 con una
 * insignia opcional y entradilla. Sigue al de «Cómo funciona» y al del catálogo
 * exprés de la home (Strata.dc.html:229-233, :265-269).
 */
export function EncabezadoSeccion({ id, eyebrow, title, aside, lede, className }: EncabezadoSeccionProps) {
  return (
    <div className={cx('st-seccion-head', className)}>
      {eyebrow && <p className="st-seccion-head__eyebrow">{eyebrow}</p>}
      <div className="st-seccion-head__fila">
        <h2 id={id} className="st-seccion-head__title">
          {title}
        </h2>
        {aside}
      </div>
      {lede && <p className="st-seccion-head__lede">{lede}</p>}
    </div>
  )
}

export default EncabezadoSeccion
