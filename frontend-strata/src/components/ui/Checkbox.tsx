import { useId, type InputHTMLAttributes, type ReactNode, type Ref } from 'react'
import { cx } from './cx'
import { FieldError } from './Field'
import { hasContent } from './hasContent'
import { IconoPalomita } from './Iconos'
import { isAriaInvalid, joinIds, useFieldIds } from './useFieldIds'
import './Checkbox.css'

/**
 * - default: casilla con su texto en línea.
 * - consent: tarjeta clicable del aviso de privacidad (Strata.dc.html:1068-1073); admite
 *   un enlace dentro, que abre el aviso sin marcar la casilla.
 */
export type CheckboxVariant = 'default' | 'consent'

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Texto de la casilla; puede incluir un enlace (aviso de privacidad). Es su nombre accesible. */
  label: ReactNode
  /** Texto de apoyo bajo el rótulo; se enlaza con aria-describedby. */
  description?: ReactNode
  /** Error inline (D-22) con ícono, aria-invalid y aria-describedby. */
  error?: ReactNode
  /** Por defecto, default. */
  variant?: CheckboxVariant
  /** Clase del contenedor. */
  className?: string
  ref?: Ref<HTMLInputElement>
}

/**
 * Casilla STRATA sobre un checkbox nativo (Espacio la marca y la desmarca).
 * No se marca por defecto: el consentimiento siempre empieza sin marcar (T-11);
 * úsala controlada con checked y onChange, o no controlada con defaultChecked.
 */
export function Checkbox({
  label,
  description,
  error,
  variant = 'default',
  className,
  id,
  disabled,
  ref,
  'aria-describedby': describedBy,
  'aria-invalid': ariaInvalid,
  ...rest
}: CheckboxProps) {
  const ids = useFieldIds(id)
  const descriptionId = useId()
  const showError = hasContent(error)
  const invalid = showError || isAriaInvalid(ariaInvalid)
  const showDescription = hasContent(description)

  return (
    <div className={cx('st-checkbox-field', className)}>
      <label
        className={cx(
          'st-checkbox',
          `st-checkbox--${variant}`,
          invalid && 'st-checkbox--invalid',
          disabled && 'st-checkbox--disabled',
        )}
      >
        <span className="st-checkbox__control">
          <input
            {...rest}
            ref={ref}
            id={ids.controlId}
            type="checkbox"
            className="st-checkbox__input"
            disabled={disabled}
            aria-labelledby={ids.labelId}
            aria-invalid={invalid || undefined}
            aria-describedby={joinIds(showError && ids.errorId, showDescription && descriptionId, describedBy)}
          />
          <span className="st-checkbox__box" aria-hidden="true">
            <IconoPalomita />
          </span>
        </span>
        <span className="st-checkbox__text">
          <span id={ids.labelId} className="st-checkbox__label">
            {label}
          </span>
          {showDescription && (
            <span id={descriptionId} className="st-checkbox__description">
              {description}
            </span>
          )}
        </span>
      </label>
      {showError && <FieldError id={ids.errorId}>{error}</FieldError>}
    </div>
  )
}
