import type { CSSProperties, ElementType, HTMLAttributes, Ref } from 'react'
import { cx } from './cx'
import { useReducedMotion } from './useReducedMotion'
import './Card.css'

/**
 * glass: vidrio (radio 24, blur 14). secondary: blanco .85 con borde #EFE9DF (radio 18).
 * white: blanca con borde frío (reporte y pregunta). dark: tinta #0F172A.
 * dashed: punteada (vista previa, estado vacío). step: paso translúcido (radio 22).
 */
export type CardVariant = 'glass' | 'secondary' | 'white' | 'dark' | 'dashed' | 'step'

/** none: sin padding (contenedor de tabla o lista, recorta el contenido). sm: 16 px. md: 24 px. lg: 34 px. */
export type CardPadding = 'none' | 'sm' | 'md' | 'lg'

/**
 * lift: sube y gana sombra (tarjetas de la home y pasos, Strata.dc.html:239 y 273).
 * outline: borde frío y sube 2 px (tarjeta del catálogo, :630).
 */
export type CardHover = 'lift' | 'outline'

/**
 * Borde de la tarjeta blanca. cool: #E2E8F0 (reporte y pregunta, Strata.dc.html:888 y 1170).
 * warm: #E5E0D8 (tarjeta del acceso del candidato, :1011).
 */
export type CardBorderTone = 'cool' | 'warm'

/** Elementos que puede renderizar la tarjeta. */
export type CardElement = 'div' | 'section' | 'article' | 'aside' | 'li' | 'figure' | 'form' | 'header' | 'footer'

export interface CardProps extends HTMLAttributes<HTMLElement> {
  /** Elemento HTML. Por defecto, div. */
  as?: CardElement
  /** Superficie. Por defecto, glass. */
  variant?: CardVariant
  /** Borde de la variante white. Por defecto, cool. Las demás variantes lo ignoran. */
  borderTone?: CardBorderTone
  /** Padding interno. Por defecto, md (24 px; 20 px a 640 px o menos). */
  padding?: CardPadding
  /** Efecto al pasar el puntero (solo en dispositivos con hover). Sin valor, la tarjeta no reacciona. */
  hover?: CardHover
  /**
   * Índice en una grilla para la entrada escalonada (riseIn, 55 ms entre tarjetas).
   * Sin índice no se anima. Con movimiento reducido no se anima.
   */
  staggerIndex?: number
  ref?: Ref<HTMLElement>
}

/** Tarjeta base de STRATA (Strata.dc.html:169, 239, 273, 419, 509, 511, 630, 698, 708, 888, 1011, 1170, 1210, 1264, 1270, 1333). */
export function Card({
  as = 'div',
  variant = 'glass',
  borderTone = 'cool',
  padding = 'md',
  hover,
  staggerIndex,
  className,
  style,
  ref,
  ...rest
}: CardProps) {
  const reduceMotion = useReducedMotion()
  const Tag = as as ElementType
  const animate = staggerIndex !== undefined && !reduceMotion
  const animationStyle = animate ? ({ '--i': Math.max(0, staggerIndex) } as CSSProperties) : undefined
  return (
    <Tag
      ref={ref}
      className={cx(
        'st-card',
        `st-card--${variant}`,
        variant === 'white' && borderTone === 'warm' && 'st-card--border-warm',
        `st-card--pad-${padding}`,
        hover && `st-card--hover-${hover}`,
        animate && 'st-card--enter',
        variant === 'dark' && 'st-on-dark',
        className,
      )}
      style={animationStyle ? { ...animationStyle, ...style } : style}
      {...rest}
    />
  )
}
