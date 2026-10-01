import type { HTMLAttributes, ReactNode, Ref } from 'react'
import { cx } from './cx'
import { LiveDot } from './LiveDot'
import './Tag.css'

/**
 * sky, coral y navy: tags de tarjeta (Strata.dc.html:240-243, 2058-2060).
 * neutral: etiqueta de tipo (:460). surface: pastilla blanca del hero (:129).
 * outline: «{n} en saldo» (:638). success-on-dark: insignia «verificada» sobre tinta (:1015).
 */
export type TagTone = 'sky' | 'coral' | 'navy' | 'neutral' | 'surface' | 'outline' | 'success-on-dark'

/**
 * xs: 10 px (chip de código del saldo, Strata.dc.html:795). sm: 10.5 px (chips mono, «en saldo»).
 * md: 11 px (tag de tarjeta). lg: 11.5 px (eyebrow del hero e insignia verificada).
 * xl: 12 px (insignia coral, :266-269).
 */
export type TagSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  /** Por defecto, sky. */
  tone?: TagTone
  /** Por defecto, md. */
  size?: TagSize
  /** pill (999 px) o square (6 px, etiquetas y códigos). Por defecto, pill. */
  shape?: 'pill' | 'square'
  /** Texto en JetBrains Mono (códigos, ITEM-1, pesos). */
  mono?: boolean
  /** Punto del color del tono antes del texto. */
  dot?: boolean
  /** Punto con pulso (livePulse); implica dot. Con movimiento reducido queda fijo. */
  live?: boolean
  /** Ícono decorativo antes del texto (en lugar del punto). */
  icon?: ReactNode
  /** Borde del tono (insignia coral, Strata.dc.html:266). surface, outline y success-on-dark siempre lo llevan. */
  bordered?: boolean
  children?: ReactNode
  ref?: Ref<HTMLSpanElement>
}

/** Tag o pastilla informativa (el Pill de la auditoría). No es interactiva. */
export function Tag({
  tone = 'sky',
  size = 'md',
  shape = 'pill',
  mono = false,
  dot = false,
  live = false,
  icon,
  bordered = false,
  className,
  children,
  ref,
  ...rest
}: TagProps) {
  const hasIcon = Boolean(icon)
  const showDot = !hasIcon && (dot || live)
  return (
    <span
      ref={ref}
      className={cx(
        'st-tag',
        `st-tag--${tone}`,
        `st-tag--${size}`,
        shape === 'square' && 'st-tag--square',
        mono && 'st-tag--mono',
        bordered && 'st-tag--bordered',
        (showDot || hasIcon) && 'st-tag--lead',
        className,
      )}
      {...rest}
    >
      {hasIcon ? (
        <span className="st-tag__icon" aria-hidden="true">
          {icon}
        </span>
      ) : (
        showDot && <LiveDot className="st-tag__dot" pulse={live ? 'live' : 'none'} />
      )}
      {children}
    </span>
  )
}
