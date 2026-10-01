import {
  useState,
  type ChangeEvent,
  type FocusEvent,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from 'react'
import { cx } from './cx'
import { Field } from './Field'
import { hasContent } from './hasContent'
import { IconoMas, IconoMenos } from './Iconos'
import { useControlled } from './useControlled'
import { isAriaInvalid, joinIds, useFieldIds } from './useFieldIds'
import { VisuallyHidden } from './VisuallyHidden'
import './Stepper.css'

/** sm: cantidad del catálogo, 30 × 34 px (Strata.dc.html:665-669). md: peso del builder, 32 × 38 px (:500-504). */
export type StepperSize = 'sm' | 'md'

export interface StepperProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'type' | 'size' | 'value' | 'defaultValue' | 'onChange' | 'min' | 'max' | 'step' | 'children'
  > {
  /** Rótulo («Cantidad», «Peso»). Nombra el input y el grupo; ocúltalo con hideLabel. */
  label: ReactNode
  hideLabel?: boolean
  /** Ayuda junto al rótulo; se enlaza con aria-describedby. */
  hint?: ReactNode
  /** Error inline (D-22) con ícono, aria-invalid y aria-describedby. */
  error?: ReactNode
  /** Valor (controlado). */
  value?: number
  /** Valor inicial (no controlado). Por defecto, min. */
  defaultValue?: number
  /** Recibe cada valor válido: los botones, las flechas y lo que se escribe dentro de los límites. */
  onChange?: (value: number) => void
  /** Por defecto, 0. */
  min?: number
  /** Sin límite si se omite. */
  max?: number
  /** Por defecto, 1. */
  step?: number
  /** Por defecto, md. */
  size?: StepperSize
  /** aria-label del botón −. Por defecto, «Disminuir». */
  decrementLabel?: string
  /** aria-label del botón +. Por defecto, «Aumentar». */
  incrementLabel?: string
  /** Clase del contenedor (.st-field). */
  className?: string
  ref?: Ref<HTMLInputElement>
}

function decimalsOf(step: number): number {
  const [, decimals = ''] = String(step).split('.')
  return decimals.length
}

/**
 * Cantidad con − y + y un input numérico (Strata.dc.html:500-504, 665-669).
 * Los botones se marcan con aria-disabled en los límites y conservan el foco;
 * lo escrito fuera de rango se ajusta al salir del campo o con Enter.
 */
export function Stepper({
  label,
  hideLabel = false,
  hint,
  error,
  value,
  defaultValue,
  onChange,
  min = 0,
  max,
  step = 1,
  size = 'md',
  decrementLabel = 'Disminuir',
  incrementLabel = 'Aumentar',
  className,
  id,
  disabled = false,
  readOnly = false,
  required,
  onBlur,
  onKeyDown,
  ref,
  'aria-describedby': describedBy,
  'aria-invalid': ariaInvalid,
  ...rest
}: StepperProps) {
  const ids = useFieldIds(id)
  const [current, setCurrent] = useControlled(value, defaultValue ?? min, onChange)
  const [draft, setDraft] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')

  const upper = max ?? Number.POSITIVE_INFINITY
  const precision = decimalsOf(step)
  const atMin = current <= min
  const atMax = current >= upper
  const locked = disabled || readOnly
  const showError = hasContent(error)
  const invalid = showError || isAriaInvalid(ariaInvalid)

  function clamp(next: number): number {
    return Math.min(upper, Math.max(min, Number(next.toFixed(precision))))
  }

  function commit(next: number): number {
    const clamped = clamp(next)
    setDraft(null)
    if (clamped !== current) setCurrent(clamped)
    return clamped
  }

  function stepBy(direction: 1 | -1) {
    if (locked || (direction < 0 ? atMin : atMax)) return
    setAnnouncement(String(commit(current + direction * step)))
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value
    setDraft(raw)
    const parsed = Number(raw)
    if (raw.trim() !== '' && Number.isFinite(parsed) && parsed >= min && parsed <= upper && parsed !== current) {
      setCurrent(parsed)
    }
  }

  function settleDraft() {
    if (draft === null) return
    const parsed = Number(draft)
    if (draft.trim() === '' || !Number.isFinite(parsed)) setDraft(null)
    else commit(parsed)
  }

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    settleDraft()
    onBlur?.(event)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') settleDraft()
    onKeyDown?.(event)
  }

  return (
    <Field
      label={label}
      htmlFor={ids.controlId}
      labelId={ids.labelId}
      hideLabel={hideLabel}
      hint={hint}
      hintId={ids.hintId}
      error={error}
      errorId={ids.errorId}
      required={required}
      className={className}
    >
      <div
        role="group"
        aria-labelledby={ids.labelId}
        className={cx(
          'st-stepper',
          `st-stepper--${size}`,
          invalid && 'st-stepper--invalid',
          disabled && 'st-stepper--disabled',
        )}
      >
        <button
          type="button"
          className="st-stepper__button st-stepper__button--decrement"
          aria-label={decrementLabel}
          aria-controls={ids.controlId}
          aria-disabled={locked || atMin || undefined}
          onClick={() => stepBy(-1)}
        >
          <IconoMenos />
        </button>
        <input
          inputMode={Number.isInteger(step) && Number.isInteger(min) ? 'numeric' : 'decimal'}
          {...rest}
          ref={ref}
          id={ids.controlId}
          type="number"
          className="st-stepper__input"
          value={draft ?? String(current)}
          min={min}
          max={Number.isFinite(upper) ? upper : undefined}
          step={step}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={joinIds(showError && ids.errorId, hasContent(hint) && ids.hintId, describedBy)}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          className="st-stepper__button st-stepper__button--increment"
          aria-label={incrementLabel}
          aria-controls={ids.controlId}
          aria-disabled={locked || atMax || undefined}
          onClick={() => stepBy(1)}
        >
          <IconoMas />
        </button>
        <VisuallyHidden aria-live="polite">{announcement}</VisuallyHidden>
      </div>
    </Field>
  )
}
