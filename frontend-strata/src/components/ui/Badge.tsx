import type { HTMLAttributes, ReactNode, Ref } from 'react'
import { cx } from './cx'
import './Badge.css'

/**
 * Tono del badge. Sale de la paleta del prototipo; los de estado (success, error,
 * warning), de los tokens. slate es un neutro frío, distinto del neutral cálido
 * (Fase 8: «Ajuste» en Créditos).
 */
export type BadgeTone = 'navy' | 'sky' | 'coral' | 'neutral' | 'slate' | 'success' | 'error' | 'warning'

/** md: badge de tabla (11.5 px). sm: pastilla compacta de encabezado (10.5 px, como «Borrador · v0.4»). */
export type BadgeSize = 'sm' | 'md'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Tono del fondo, del texto y del punto. Por defecto, neutral. */
  tone?: BadgeTone
  /** Tamaño. Por defecto, md. */
  size?: BadgeSize
  /** Texto del estado. Es obligatorio: el color nunca es lo único que lo distingue. */
  children: ReactNode
  ref?: Ref<HTMLSpanElement>
}

/**
 * Badge de estado (el StatusBadge de la auditoría): pastilla con punto y texto.
 * Strata.dc.html:751-753 y 847-849; tonos en :1831-1836 y :1866-1870.
 */
export function Badge({ tone = 'neutral', size = 'md', className, children, ref, ...rest }: BadgeProps) {
  return (
    <span ref={ref} className={cx('st-badge', `st-badge--${tone}`, size === 'sm' && 'st-badge--sm', className)} {...rest}>
      <span className="st-badge__dot" aria-hidden="true" />
      {children}
    </span>
  )
}
