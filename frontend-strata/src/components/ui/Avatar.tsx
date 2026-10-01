import type { HTMLAttributes, Ref } from 'react'
import { cx } from './cx'
import { getInitials } from './initials'
import './Avatar.css'

/** navy: fondo navy con texto claro. sky: tinte celeste con texto #0369A1. */
export type AvatarTone = 'navy' | 'sky'

/** sm: 30 px (barra y marca de la empresa). md: 33 px (tabla de candidatos). */
export type AvatarSize = 'sm' | 'md'

export interface AvatarProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Nombre de la persona o de la organización. De aquí salen las iniciales. */
  name: string
  /** Iniciales explícitas (por ejemplo, una sola letra para la marca de la empresa). */
  initials?: string
  /** circle: pastilla de la barra (Strata.dc.html:69). square: tabla y marca (:838, :1001). Por defecto, circle. */
  shape?: 'circle' | 'square'
  /** navy: fondo navy con texto claro. sky: tinte celeste con texto #0369A1. Por defecto, navy. */
  tone?: AvatarTone
  /** sm: 30 px. md: 33 px. Por defecto, sm. */
  size?: AvatarSize
  /**
   * Decorativo (por defecto): se oculta a los lectores porque el nombre ya está al lado.
   * Con false se anuncia como imagen con el nombre completo.
   */
  decorative?: boolean
  ref?: Ref<HTMLSpanElement>
}

/**
 * Avatar de iniciales. Círculo navy de 30 px con texto #DBEAFE (barra superior) y
 * variante cuadrada (tabla de candidatos y marca de la empresa en el acceso).
 * Con una sola inicial usa Satoshi más grande, como la marca del acceso.
 */
export function Avatar({
  name,
  initials,
  shape = 'circle',
  tone = 'navy',
  size = 'sm',
  decorative = true,
  className,
  ref,
  ...rest
}: AvatarProps) {
  const letters = Array.from(initials ?? getInitials(name)).slice(0, 2)
  const a11y = decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': name }
  return (
    <span
      ref={ref}
      className={cx(
        'st-avatar',
        `st-avatar--${shape}`,
        `st-avatar--${tone}`,
        `st-avatar--${size}`,
        letters.length === 1 && 'st-avatar--single',
        className,
      )}
      {...a11y}
      {...rest}
    >
      {letters.join('')}
    </span>
  )
}
