import type { ReactNode, Ref } from 'react'
import { Card, type CardProps } from './Card'
import { cx } from './cx'
import { ProgressBar, type ProgressBarTone } from './ProgressBar'
import './StatCard.css'

/**
 * Tono del cuadro numérico del diseño inline (Strata.dc.html:1853-1858): navy (Disponibles),
 * sky (Enviadas), sky-soft (En uso) y neutral (Consumidas).
 */
export type StatCardTone = 'navy' | 'sky' | 'sky-soft' | 'neutral'

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
  /** Familia de la cifra: heading (Satoshi 800, por defecto) o mono (JetBrains Mono). */
  valueFont?: 'heading' | 'mono'
  /** Barra opcional bajo la cifra (Strata.dc.html:801-803). */
  progress?: StatCardProgress
  /**
   * stacked: rótulo, cifra grande, barra y ayuda (saldo, Strata.dc.html:792-805).
   * inline: cuadro numérico de 38 px con rótulo y ayuda al lado (resumen, :698-704).
   */
  layout?: 'stacked' | 'inline'
  /** Tono del cuadro numérico (solo en inline). Por defecto, navy. */
  tone?: StatCardTone
  ref?: Ref<HTMLElement>
}

/**
 * Tarjeta de estadística sobre vidrio (padding 16). La cifra usa números tabulares.
 * La barra es role="progressbar" si lleva label; si no, es decorativa.
 */
export function StatCard({
  label,
  value,
  unit,
  help,
  meta,
  valueFont = 'heading',
  progress,
  layout = 'stacked',
  tone = 'navy',
  className,
  ...rest
}: StatCardProps) {
  const valueClass = cx('st-stat__value', valueFont === 'mono' && 'st-stat__value--mono')

  if (layout === 'inline') {
    return (
      <Card padding="sm" className={cx('st-stat', 'st-stat--inline', className)} {...rest}>
        <span className={cx('st-stat__badge', `st-stat__badge--${tone}`, valueFont === 'mono' && 'st-stat__badge--mono')}>
          {value}
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
        <span className={valueClass}>{value}</span>
        {unit && <span className="st-stat__unit">{unit}</span>}
      </p>
      {progress && (
        <ProgressBar
          className="st-stat__bar"
          value={progress.value}
          max={progress.max}
          valueText={progress.valueText}
          tone={progress.tone ?? 'sky-strong'}
          track="divider"
          size={6}
          {...(progress.label ? { label: progress.label } : { decorative: true as const })}
        />
      )}
      {help && <p className="st-stat__help">{help}</p>}
    </Card>
  )
}
