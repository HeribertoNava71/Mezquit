import type { HTMLAttributes, Ref } from 'react'
import { cx } from './cx'
import './LiveDot.css'

/** Color del punto. Es decorativo: siempre acompaña a un texto. */
export type LiveDotTone = 'sky' | 'sky-strong' | 'navy' | 'success' | 'neutral' | 'coral'

/** Diámetro en px (5, 6 o 7, como en el prototipo). */
export type LiveDotSize = 5 | 6 | 7

/**
 * live: late y se encoge (livePulse, 2 s). blink: solo parpadea (pulseDot, 1.8 s,
 * «Guardado automático»). none: punto fijo.
 */
export type LiveDotPulse = 'live' | 'blink' | 'none'

/**
 * Ritmo del pulso: fast 1.8 s, normal 2 s, slow 2.2 s. Sirve para que dos puntos
 * cercanos no latan al unísono (Strata.dc.html:130, 173 y 212).
 */
export type LiveDotTempo = 'fast' | 'normal' | 'slow'

export interface LiveDotProps extends HTMLAttributes<HTMLSpanElement> {
  /** Por defecto, sky (#38BDF8). */
  tone?: LiveDotTone
  /** Por defecto, 7. */
  size?: LiveDotSize
  /** Por defecto, live. Con movimiento reducido el punto queda fijo. */
  pulse?: LiveDotPulse
  /** Ritmo del pulso. Por defecto, el propio: 2 s en live y 1.8 s en blink. */
  tempo?: LiveDotTempo
  ref?: Ref<HTMLSpanElement>
}

/**
 * Punto de estado con pulso (Strata.dc.html:130, 173, 212 y 1155) o fijo (:67, :976 y :1422).
 * Es decorativo (aria-hidden): el texto que lo acompaña da el significado.
 */
export function LiveDot({ tone = 'sky', size = 7, pulse = 'live', tempo, className, ref, ...rest }: LiveDotProps) {
  return (
    <span
      ref={ref}
      aria-hidden="true"
      className={cx(
        'st-live-dot',
        `st-live-dot--${tone}`,
        `st-live-dot--size-${size}`,
        pulse !== 'none' && `st-live-dot--${pulse}`,
        pulse !== 'none' && tempo && `st-live-dot--tempo-${tempo}`,
        className,
      )}
      {...rest}
    />
  )
}
