import type { HTMLAttributes } from 'react'
import { cx } from './cx'
import './VisuallyHidden.css'

type VisuallyHiddenTag = 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'legend'

export interface VisuallyHiddenProps extends HTMLAttributes<HTMLElement> {
  /** Elemento que se renderiza. Por defecto, span. */
  as?: VisuallyHiddenTag
  /** Se muestra cuando él o algo dentro recibe el foco (por ejemplo, un enlace de salto). */
  focusable?: boolean
}

/**
 * Contenido solo para lectores de pantalla: no se ve, pero se anuncia.
 * Úsalo para dar nombre a botones de ícono o completar un texto visual.
 */
export function VisuallyHidden({ as: Tag = 'span', focusable = false, className, ...props }: VisuallyHiddenProps) {
  return (
    <Tag
      className={cx('st-visually-hidden', focusable && 'st-visually-hidden--focusable', className)}
      {...props}
    />
  )
}
