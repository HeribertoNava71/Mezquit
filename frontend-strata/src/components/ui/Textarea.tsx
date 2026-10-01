import type { ReactNode, Ref, TextareaHTMLAttributes } from 'react'
import { cx } from './cx'
import { Field, type FieldSize } from './Field'
import { hasContent } from './hasContent'
import { IconoValido } from './Iconos'
import { isAriaInvalid, joinIds, useFieldIds } from './useFieldIds'
import './Textarea.css'

/** sm: radio 10. md: builder (Strata.dc.html:400, :477, :571). lg: candidato, radio 12 y borde 1.5 px. */
export type TextareaSize = FieldSize

/** default: General Sans. mono: JetBrains Mono (plantillas con variables). */
export type TextareaVariant = 'default' | 'mono'

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  /** Rótulo del campo. Obligatorio: es su nombre accesible (ocúltalo con hideLabel). */
  label: ReactNode
  /** Oculta el rótulo a la vista. */
  hideLabel?: boolean
  /** Ayuda junto al rótulo; se enlaza con aria-describedby. */
  hint?: ReactNode
  /** Error inline (D-22): borde y texto de error con ícono, aria-invalid y aria-describedby. */
  error?: ReactNode
  /** Dato confirmado: borde verde y check. Se ignora si hay error. */
  valid?: boolean
  /** Por defecto, md. */
  size?: TextareaSize
  /** mono: JetBrains Mono (plantillas con variables). Por defecto, default. */
  variant?: TextareaVariant
  /** Clase del contenedor (.st-field). Para la del <textarea>, usa textareaClassName. */
  className?: string
  textareaClassName?: string
  ref?: Ref<HTMLTextAreaElement>
}

/**
 * Área de texto STRATA: misma API que Input (rótulo, ayuda, error y válido),
 * sin ícono ni afijos. 3 filas y redimensionable en vertical (Strata.dc.html:400).
 */
export function Textarea({
  label,
  hideLabel = false,
  hint,
  error,
  valid = false,
  size = 'md',
  variant = 'default',
  className,
  textareaClassName,
  id,
  rows = 3,
  required,
  disabled,
  ref,
  'aria-describedby': describedBy,
  'aria-invalid': ariaInvalid,
  ...rest
}: TextareaProps) {
  const ids = useFieldIds(id)
  const showError = hasContent(error)
  const invalid = showError || isAriaInvalid(ariaInvalid)
  const showValid = valid && !invalid

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
      <div
        className={cx(
          'st-textarea',
          `st-textarea--${size}`,
          variant === 'mono' && 'st-textarea--mono',
          showValid && 'st-textarea--valid',
          invalid && 'st-textarea--invalid',
        )}
      >
        <textarea
          spellCheck={variant === 'mono' ? false : undefined}
          {...rest}
          ref={ref}
          id={ids.controlId}
          rows={rows}
          className={cx('st-textarea__field', textareaClassName)}
          required={required}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-describedby={joinIds(showError && ids.errorId, hasContent(hint) && ids.hintId, describedBy)}
        />
        {showValid && (
          <span className="st-textarea__check">
            <IconoValido />
          </span>
        )}
      </div>
    </Field>
  )
}
