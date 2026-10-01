import type { ReactNode, Ref, SelectHTMLAttributes } from 'react'
import { cx } from './cx'
import { Field, type FieldSize } from './Field'
import { hasContent } from './hasContent'
import { IconoChevron } from './Iconos'
import { isAriaInvalid, joinIds, useFieldIds } from './useFieldIds'
import './Select.css'

/** sm, md y lg: mismas medidas que Input. */
export type SelectSize = FieldSize

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /** Rótulo del campo. Obligatorio: es su nombre accesible (ocúltalo con hideLabel). */
  label: ReactNode
  /** Oculta el rótulo a la vista. */
  hideLabel?: boolean
  /** Ayuda junto al rótulo; se enlaza con aria-describedby. */
  hint?: ReactNode
  /** Error inline (D-22): borde y texto de error con ícono, aria-invalid y aria-describedby. */
  error?: ReactNode
  /** Opciones como datos. También puedes pasar <option> como children (van después). */
  options?: ReadonlyArray<SelectOption>
  /**
   * Primera opción vacía («Elige un sector»), con value="". Se pinta como placeholder
   * mientras esté elegida; si el campo es required, no se puede volver a elegir.
   * Sin value ni defaultValue, el select arranca en ella.
   */
  placeholder?: string
  /** Por defecto, md. */
  size?: SelectSize
  /** Clase del contenedor (.st-field). Para la del <select>, usa selectClassName. */
  className?: string
  selectClassName?: string
  ref?: Ref<HTMLSelectElement>
}

/** Select nativo con el estilo de los campos STRATA y flecha propia. */
export function Select({
  label,
  hideLabel = false,
  hint,
  error,
  options,
  placeholder,
  size = 'md',
  className,
  selectClassName,
  id,
  required,
  disabled,
  children,
  ref,
  'aria-describedby': describedBy,
  'aria-invalid': ariaInvalid,
  ...rest
}: SelectProps) {
  const ids = useFieldIds(id)
  const showError = hasContent(error)
  const invalid = showError || isAriaInvalid(ariaInvalid)
  // Sin value ni defaultValue, el navegador elegiría la primera opción habilitada
  // (con required, la vacía está deshabilitada): se arranca en el placeholder.
  const startOnPlaceholder = placeholder !== undefined && rest.value === undefined && rest.defaultValue === undefined

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
      size={size}
      className={className}
    >
      <div className={cx('st-select', `st-select--${size}`, invalid && 'st-select--invalid')}>
        <select
          {...(startOnPlaceholder ? { defaultValue: '' } : null)}
          {...rest}
          ref={ref}
          id={ids.controlId}
          className={cx('st-select__field', selectClassName)}
          required={required}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-describedby={joinIds(showError && ids.errorId, hasContent(hint) && ids.hintId, describedBy)}
        >
          {placeholder !== undefined && (
            <option value="" disabled={required}>
              {placeholder}
            </option>
          )}
          {options?.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
          {children}
        </select>
        <IconoChevron className="st-select__chevron" />
      </div>
    </Field>
  )
}
