import type { HTMLAttributes, Ref } from 'react'
import { cx } from './cx'
import { VisuallyHidden } from './VisuallyHidden'
import './Spinner.css'

/** sm: 14 px (dentro de Button). md: 18 px. lg: 28 px (estados de carga). */
export type SpinnerSize = 'sm' | 'md' | 'lg'

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  /** Por defecto, md. */
  size?: SpinnerSize
  /**
   * Texto para lectores de pantalla («Cargando resultados»). Con label, el spinner
   * es un role="status". Sin label es decorativo (aria-hidden), como dentro de
   * Button, donde aria-busy ya comunica la carga.
   */
  label?: string
  ref?: Ref<HTMLSpanElement>
}

/**
 * Indicador de carga circular. Toma el color del texto (currentColor).
 * Con prefers-reduced-motion la regla global lo deja quieto; el texto explica el estado.
 */
export function Spinner({ size = 'md', label, className, ref, ...rest }: SpinnerProps) {
  const classes = cx('st-spinner', `st-spinner--${size}`, className)

  if (label) {
    return (
      <span ref={ref} role="status" className={classes} {...rest}>
        <span className="st-spinner__ring" aria-hidden="true" />
        <VisuallyHidden>{label}</VisuallyHidden>
      </span>
    )
  }

  return (
    <span ref={ref} className={classes} aria-hidden="true" {...rest}>
      <span className="st-spinner__ring" />
    </span>
  )
}
