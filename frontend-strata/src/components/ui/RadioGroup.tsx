import { useMemo, type ChangeEvent, type HTMLAttributes, type ReactNode, type Ref } from 'react'
import { cx } from './cx'
import { Field } from './Field'
import { hasContent } from './hasContent'
import { RadioGroupContext, type RadioGroupContextValue, type RadioIndicator, type RadioSize } from './radioGroupContext'
import { isAriaInvalid, joinIds, useFieldIds } from './useFieldIds'
import './RadioGroup.css'

export type { RadioIndicator, RadioSize } from './radioGroupContext'

export interface RadioGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /**
   * Rótulo del grupo («Test a aplicar»). Es su nombre accesible (aria-labelledby).
   * Si el grupo ya tiene un título visible (la pregunta del examen), puedes pasar
   * su id en aria-labelledby; ese id reemplaza al del rótulo.
   */
  label: ReactNode
  /** Oculta el rótulo a la vista (la pregunta del examen ya lo muestra como título). */
  hideLabel?: boolean
  /** Ayuda junto al rótulo; se enlaza con aria-describedby. */
  hint?: ReactNode
  /** Error inline (D-22) con ícono; marca aria-invalid en el grupo. */
  error?: ReactNode
  /** name de los radios. Si se omite, se genera uno único. */
  name?: string
  /** Valor elegido (controlado). */
  value?: string
  /** Valor inicial (no controlado). */
  defaultValue?: string
  /** Recibe el value de la opción elegida. */
  onChange?: (value: string, event: ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
  /** Obliga a elegir: required en los radios y aria-required en el grupo. */
  required?: boolean
  /** vertical (lista) u horizontal (fila que se ajusta). Por defecto, vertical. */
  orientation?: 'vertical' | 'horizontal'
  /** Tamaño de las opciones. Por defecto, md. */
  size?: RadioSize
  /** Con aro y punto (radio) o sin él (none). Por defecto, radio. */
  indicator?: RadioIndicator
  /** Las opciones: RadioCard. */
  children: ReactNode
  ref?: Ref<HTMLDivElement>
}

/**
 * Grupo de opciones excluyentes sobre radios nativos: Tab entra a la opción
 * elegida y las flechas cambian la selección. Sus hijos son RadioCard.
 */
export function RadioGroup({
  label,
  hideLabel = false,
  hint,
  error,
  name,
  value,
  defaultValue,
  onChange,
  disabled = false,
  required = false,
  orientation = 'vertical',
  size = 'md',
  indicator = 'radio',
  className,
  id,
  children,
  ref,
  'aria-describedby': describedBy,
  'aria-invalid': ariaInvalid,
  'aria-labelledby': labelledBy,
  ...rest
}: RadioGroupProps) {
  const ids = useFieldIds(id)
  const showError = hasContent(error)
  const invalid = showError || isAriaInvalid(ariaInvalid)
  const groupName = name ?? `${ids.controlId}-name`

  const context = useMemo<RadioGroupContextValue>(
    () => ({
      name: groupName,
      value,
      defaultValue,
      onChange: (next, event) => onChange?.(next, event),
      disabled,
      required,
      invalid,
      size,
      indicator,
    }),
    [groupName, value, defaultValue, onChange, disabled, required, invalid, size, indicator],
  )

  return (
    <Field
      label={label}
      labelId={ids.labelId}
      hideLabel={hideLabel}
      hint={hint}
      hintId={ids.hintId}
      error={error}
      errorId={ids.errorId}
      required={required}
      size={size === 'lg' ? 'lg' : 'md'}
      className={className}
    >
      <div
        {...rest}
        ref={ref}
        id={ids.controlId}
        role="radiogroup"
        aria-labelledby={labelledBy ?? ids.labelId}
        aria-describedby={joinIds(showError && ids.errorId, hasContent(hint) && ids.hintId, describedBy)}
        aria-required={required || undefined}
        aria-invalid={invalid || undefined}
        aria-disabled={disabled || undefined}
        className={cx(
          'st-radio-group',
          `st-radio-group--${orientation}`,
          `st-radio-group--${size}`,
          invalid && 'st-radio-group--invalid',
        )}
      >
        <RadioGroupContext.Provider value={context}>{children}</RadioGroupContext.Provider>
      </div>
    </Field>
  )
}
