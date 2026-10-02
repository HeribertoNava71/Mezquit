import type { ReactNode, Ref } from 'react'
import { Card, type CardProps } from './Card'
import { cx } from './cx'
import { ProgressBar, type ProgressBarTone } from './ProgressBar'
import { VisuallyHidden } from './VisuallyHidden'
import './StatCard.css'

/**
 * Cifra en carga: una barra del color de la cifra que late como el punto de
 * «Guardado automático» (quieta con movimiento reducido) y «Cargando…» para
 * lectores. Rótulo y ayuda ya se ven: la rejilla no salta al llegar los datos.
 */
function CifraEnCarga() {
  return (
    <>
      <span className="st-stat__esqueleto" aria-hidden="true" />
      <VisuallyHidden>Cargando…</VisuallyHidden>
    </>
  )
}

/**
 * Tono del cuadro numérico del diseño inline (Strata.dc.html:1853-1858): navy (Disponibles),
 * sky (Enviadas), sky-soft (En uso) y neutral (Consumidas).
 */
export type StatCardTone = 'navy' | 'sky' | 'sky-soft' | 'neutral'

/** Familia de la cifra: text (General Sans), heading (Satoshi) o mono (JetBrains Mono). */
export type StatCardValueFont = 'text' | 'heading' | 'mono'

export interface StatCardProgress {
  /** Valor de la barra. */
  value: number
  /** Máximo. Por defecto, 100. */
  max?: number
  /**
   * Nombre de la barra para lectores. Si se omite, la barra es decorativa: úsalo
   * solo cuando la cifra y la unidad ya dicen lo mismo en texto.
   */
  label?: string
  /** Texto del valor para lectores, por ejemplo «12 de 30 libres». */
  valueText?: string
  /** Por defecto, sky-strong (#0EA5E9), como el saldo del prototipo. */
  tone?: ProgressBarTone
}

export interface StatCardProps extends Omit<CardProps, 'children' | 'padding' | 'title'> {
  /** Rótulo de la cifra (12 px, secundario). */
  label: ReactNode
  /** Cifra principal. */
  value: ReactNode
  /** Texto pegado a la cifra, por ejemplo «de 30 libres». */
  unit?: ReactNode
  /** Ayuda bajo la cifra o la barra (10.5 px, terciario). */
  help?: ReactNode
  /** Elemento de la esquina superior derecha, por ejemplo un Tag mono con el código. */
  meta?: ReactNode
  /**
   * Familia de la cifra: text (General Sans, por defecto, como el saldo y el resumen
   * del prototipo), heading (Satoshi, cifras de marca como el precio de la home) o
   * mono (JetBrains Mono).
   */
  valueFont?: StatCardValueFont
  /** Barra opcional bajo la cifra (Strata.dc.html:801-803). */
  progress?: StatCardProgress
  /**
   * stacked: rótulo, cifra grande, barra y ayuda (saldo, Strata.dc.html:792-805).
   * inline: cuadro numérico de 38 px con rótulo y ayuda al lado (resumen, :698-704).
   */
  layout?: 'stacked' | 'inline'
  /** Tono del cuadro numérico (solo en inline). Por defecto, navy. */
  tone?: StatCardTone
  /**
   * La cifra todavía no llega: en su lugar va un esqueleto que late (y
   * «Cargando…» para lectores); la unidad se oculta y la barra queda vacía.
   * Marca aria-busy en el contenedor que agrupa las tarjetas.
   */
  loading?: boolean
  ref?: Ref<HTMLElement>
}

/**
 * Tarjeta de estadística sobre vidrio (padding 16). La cifra usa números
 * proporcionales, como el prototipo. La barra es role="progressbar" si lleva
 * label; si no, es decorativa.
 */
export function StatCard({
  label,
  value,
  unit,
  help,
  meta,
  valueFont = 'text',
  progress,
  layout = 'stacked',
  tone = 'navy',
  loading = false,
  className,
  ...rest
}: StatCardProps) {
  const valueClass = cx('st-stat__value', valueFont !== 'text' && `st-stat__value--${valueFont}`)
  const cifra = loading ? <CifraEnCarga /> : value

  if (layout === 'inline') {
    return (
      <Card padding="sm" className={cx('st-stat', 'st-stat--inline', className)} {...rest}>
        <span className={cx('st-stat__badge', `st-stat__badge--${tone}`, valueFont !== 'text' && `st-stat__badge--${valueFont}`)}>
          {cifra}
        </span>
        <div className="st-stat__body">
          <p className="st-stat__label">{label}</p>
          {help && <p className="st-stat__help">{help}</p>}
        </div>
        {meta && <div className="st-stat__meta">{meta}</div>}
      </Card>
    )
  }

  return (
    <Card padding="sm" className={cx('st-stat', 'st-stat--stacked', className)} {...rest}>
      <div className="st-stat__head">
        <p className="st-stat__label">{label}</p>
        {meta && <div className="st-stat__meta">{meta}</div>}
      </div>
      <p className="st-stat__figure">
        <span className={valueClass}>{cifra}</span>
        {unit && !loading && <span className="st-stat__unit">{unit}</span>}
      </p>
      {progress && (
        <ProgressBar
          className="st-stat__bar"
          value={loading ? 0 : progress.value}
          max={progress.max}
          valueText={progress.valueText}
          tone={progress.tone ?? 'sky-strong'}
          track="divider"
          size={6}
          {...(progress.label && !loading ? { label: progress.label } : { decorative: true as const })}
        />
      )}
      {help && <p className="st-stat__help">{help}</p>}
    </Card>
  )
}
