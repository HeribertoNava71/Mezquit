import type { HTMLAttributes, Ref } from 'react'
import { cx } from './cx'
import './DotSeparator.css'

/**
 * default: #C9C2B4 entre metadatos de tarjeta (Strata.dc.html:247, 635).
 * soft: #D2CBBD en los enlaces del acceso (:1127). on-dark: #475569 sobre tinta (:1023).
 */
export type DotSeparatorTone = 'default' | 'soft' | 'on-dark'

export interface DotSeparatorProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Por defecto, default. */
  tone?: DotSeparatorTone
  ref?: Ref<HTMLSpanElement>
}

/**
 * Punto de 3 px entre metadatos («15 min · 48 reactivos»). Es decorativo
 * (aria-hidden): cada dato va en su propio elemento y los lectores los leen por separado.
 */
export function DotSeparator({ tone = 'default', className, ref, ...rest }: DotSeparatorProps) {
  return (
    <span
      ref={ref}
      aria-hidden="true"
      className={cx('st-dot-sep', tone !== 'default' && `st-dot-sep--${tone}`, className)}
      {...rest}
    />
  )
}
