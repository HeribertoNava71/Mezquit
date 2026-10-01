import { useId, type HTMLAttributes, type ReactNode, type Ref } from 'react'
import { cx } from './cx'
import { useControlled } from './useControlled'
import './SegmentedToggle.css'

export interface SegmentedToggleOption {
  value: string
  label: ReactNode
}

export interface SegmentedToggleProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /** Nombre del grupo para lectores de pantalla («Tipo de cliente»). */
  'aria-label': string
  /** Exactamente dos opciones. */
  options: readonly [SegmentedToggleOption, SegmentedToggleOption]
  /** Opción elegida (controlado). */
  value?: string
  /** Opción inicial (no controlado). Por defecto, la primera. */
  defaultValue?: string
  /** Recibe el value de la opción elegida. */
  onChange?: (value: string) => void
  /** name de los radios. Si se omite, se genera uno único. */
  name?: string
  ref?: Ref<HTMLDivElement>
}

/**
 * Selector de dos opciones con thumb deslizante (Strata.dc.html:136-140, :2018):
 * «Para mí» / «Para mi empresa». Es un radiogroup con radios nativos, así que
 * las flechas cambian la opción. El thumb se desliza en .36s.
 */
export function SegmentedToggle({
  options,
  value,
  defaultValue,
  onChange,
  name,
  className,
  ref,
  ...rest
}: SegmentedToggleProps) {
  const autoName = useId()
  const groupName = name ?? autoName
  const [current, setCurrent] = useControlled(value, defaultValue ?? options[0].value, onChange)
  const secondActive = current === options[1].value

  return (
    <div
      {...rest}
      ref={ref}
      role="radiogroup"
      className={cx('st-toggle', secondActive && 'st-toggle--second', className)}
    >
      <span className="st-toggle__thumb" aria-hidden="true" />
      {options.map((option) => (
        <label key={option.value} className="st-toggle__option">
          <input
            type="radio"
            className="st-toggle__input"
            name={groupName}
            value={option.value}
            checked={option.value === current}
            onChange={() => setCurrent(option.value)}
          />
          <span
            className="st-toggle__label"
            data-label={typeof option.label === 'string' ? option.label : undefined}
          >
            {option.label}
          </span>
        </label>
      ))}
    </div>
  )
}
