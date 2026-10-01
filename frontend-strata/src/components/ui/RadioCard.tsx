import { useId, type ChangeEvent, type InputHTMLAttributes, type ReactNode, type Ref } from 'react'
import { cx } from './cx'
import { hasContent } from './hasContent'
import { useRadioGroup, type RadioIndicator, type RadioSize } from './radioGroupContext'
import { joinIds } from './useFieldIds'
import './RadioCard.css'

export interface RadioCardProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size' | 'value' | 'children'> {
  /** Valor de la opción. */
  value: string
  /** Texto principal; es el nombre accesible del radio. */
  label: ReactNode
  /** Detalle bajo el texto (Strata.dc.html:1295, :1406); se anuncia como descripción. */
  description?: ReactNode
  /** Dato a la derecha: «{n} libres», la etiqueta mono del examen (Strata.dc.html:1180, :1349). Se anuncia como descripción. */
  aside?: ReactNode
  /** Por defecto, el del RadioGroup (o md). */
  size?: RadioSize
  /** Por defecto, el del RadioGroup (o radio). */
  indicator?: RadioIndicator
  /** Clase de la tarjeta. */
  className?: string
  ref?: Ref<HTMLInputElement>
}

/**
 * Opción en forma de tarjeta sobre un radio nativo. Dentro de un RadioGroup toma
 * name, valor elegido, tamaño y estado del grupo; fuera de él, usa name, checked y
 * onChange propios. Toda la tarjeta es clicable. Las opciones del examen usan size="lg".
 */
export function RadioCard({
  value,
  label,
  description,
  aside,
  size,
  indicator,
  className,
  name,
  checked,
  defaultChecked,
  disabled,
  required,
  onChange,
  ref,
  'aria-describedby': describedBy,
  ...rest
}: RadioCardProps) {
  const group = useRadioGroup()
  const baseId = useId()
  const labelId = `${baseId}-label`
  const descriptionId = `${baseId}-description`
  const asideId = `${baseId}-aside`

  const finalSize = size ?? group?.size ?? 'md'
  const finalIndicator = indicator ?? group?.indicator ?? 'radio'
  const isDisabled = Boolean(disabled) || Boolean(group?.disabled)
  const showDescription = hasContent(description)
  const showAside = hasContent(aside)

  // Controlado si el grupo (o la propia tarjeta) recibe value/checked.
  const checkedProps =
    group && group.value !== undefined
      ? { checked: group.value === value }
      : group
        ? { defaultChecked: group.defaultValue === value }
        : checked !== undefined
          ? { checked }
          : { defaultChecked }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange?.(event)
    if (group && event.target.checked) group.onChange(value, event)
  }

  return (
    <label
      className={cx(
        'st-radio-card',
        `st-radio-card--${finalSize}`,
        finalIndicator === 'none' && 'st-radio-card--plain',
        isDisabled && 'st-radio-card--disabled',
        group?.invalid && 'st-radio-card--invalid',
        className,
      )}
    >
      <input
        {...rest}
        {...checkedProps}
        ref={ref}
        type="radio"
        className="st-radio-card__input"
        name={group?.name ?? name}
        value={value}
        disabled={isDisabled}
        required={required ?? group?.required}
        onChange={handleChange}
        aria-labelledby={labelId}
        aria-describedby={joinIds(showDescription && descriptionId, showAside && asideId, describedBy)}
      />
      {finalIndicator === 'radio' && <span className="st-radio-card__radio" aria-hidden="true" />}
      <span className="st-radio-card__body">
        <span id={labelId} className="st-radio-card__label">
          {label}
        </span>
        {showDescription && (
          <span id={descriptionId} className="st-radio-card__description">
            {description}
          </span>
        )}
      </span>
      {showAside && (
        <span id={asideId} className="st-radio-card__aside">
          {aside}
        </span>
      )}
    </label>
  )
}
