import type { HTMLAttributes, Ref } from 'react'
import { cx } from './cx'
import './ProgressBar.css'

/**
 * Color del relleno. sky: examen y demo (#38BDF8). sky-strong: saldo y nivel medio (#0EA5E9).
 * navy: nivel alto. neutral: sin dato o rango bajo (#A8A296).
 */
export type ProgressBarTone = 'sky' | 'sky-strong' | 'navy' | 'neutral'

/** Alto en px: 4 (examen), 5 (demo), 6 (saldo), 7 (simulador sobre oscuro, Strata.dc.html:584) u 8 (dimensión del reporte). */
export type ProgressBarSize = 4 | 5 | 6 | 7 | 8

/** Pista: muted #F0EDE5 (demo y reporte), divider #EDE9E0 (examen y saldo) u on-dark (sobre tinta). */
export type ProgressBarTrack = 'muted' | 'divider' | 'on-dark'

/**
 * Nombre accesible: label, aria-labelledby o, si el valor ya está escrito al lado,
 * decorative (la barra se oculta a los lectores y no lleva role).
 */
type ProgressBarName =
  | { label: string; 'aria-labelledby'?: undefined; decorative?: false }
  | { label?: undefined; 'aria-labelledby': string; decorative?: false }
  | { label?: undefined; 'aria-labelledby'?: undefined; decorative: true }

interface ProgressBarBaseProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'aria-labelledby'> {
  /** Valor actual. Se limita entre 0 y max. */
  value: number
  /** Valor máximo. Por defecto, 100. */
  max?: number
  /** Texto del valor para lectores, por ejemplo «Pregunta 3 de 12». Por defecto, el porcentaje. */
  valueText?: string
  /** Alto en px. Por defecto, 6. */
  size?: ProgressBarSize
  /** Color del relleno. Por defecto, sky. */
  tone?: ProgressBarTone
  /** Pista. Por defecto, muted. */
  track?: ProgressBarTrack
  /** Sin esquinas redondeadas: barra pegada al borde, como la del examen (Strata.dc.html:1159). */
  flush?: boolean
  ref?: Ref<HTMLDivElement>
}

export type ProgressBarProps = ProgressBarBaseProps & ProgressBarName

/**
 * Barra de progreso (Strata.dc.html:177-179, 584, 801-803, 940-942 y 1159-1161).
 * Anima el avance en .35 s con transform (sin animación con movimiento reducido).
 * El valor siempre debe leerse también en texto (regla 12 de design-tokens.md).
 */
export function ProgressBar({
  value,
  max = 100,
  valueText,
  size = 6,
  tone = 'sky',
  track = 'muted',
  flush = false,
  label,
  decorative,
  className,
  ref,
  ...rest
}: ProgressBarProps) {
  const safeMax = Number.isFinite(max) && max > 0 ? max : 100
  const safeValue = Number.isFinite(value) ? Math.min(Math.max(value, 0), safeMax) : 0
  const percent = (safeValue / safeMax) * 100

  const a11y = decorative
    ? { 'aria-hidden': true as const }
    : {
        role: 'progressbar',
        'aria-label': label,
        'aria-valuemin': 0,
        'aria-valuemax': safeMax,
        'aria-valuenow': safeValue,
        'aria-valuetext': valueText,
      }

  return (
    <div
      ref={ref}
      className={cx(
        'st-progress',
        `st-progress--size-${size}`,
        `st-progress--${tone}`,
        `st-progress--track-${track}`,
        flush && 'st-progress--flush',
        className,
      )}
      {...a11y}
      {...rest}
    >
      <div className="st-progress__fill" style={{ transform: `translateX(${percent - 100}%)` }} />
    </div>
  )
}
