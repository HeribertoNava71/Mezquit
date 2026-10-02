import type { InputHTMLAttributes, MouseEvent, ReactNode, Ref } from 'react'
import { cx } from './cx'
import { Field, type FieldSize } from './Field'
import { hasContent } from './hasContent'
import { IconoValido } from './Iconos'
import { isAriaInvalid, joinIds, useFieldIds } from './useFieldIds'
import './Input.css'

/**
 * - sm: compacto, radio 10 (rangos del builder, Strata.dc.html:559).
 * - md: builder y modales, radio 14 y fondo #FAF8F5 (Strata.dc.html:369, :1388).
 * - lg: candidato, radio 12, borde de 1.5 px y 14.5 px (Strata.dc.html:1044).
 */
export type InputSize = FieldSize

/**
 * - default: General Sans.
 * - mono: JetBrains Mono en peso 700, para cifras y rangos (Strata.dc.html:559).
 * - code: código de licencia, 20 px mono, centrado y en mayúsculas (Strata.dc.html:1111).
 *   Solo cambia cómo se ve: si el backend espera mayúsculas, normaliza el valor en onChange.
 * - token: enlace o código de invitación del candidato (/evaluar). Mismo aspecto que code,
 *   sin mayúsculas ni autocapitalización: el token distingue mayúsculas y minúsculas
 *   (mapa.md, CA-3). Tracking corto porque un enlace es largo.
 */
export type InputVariant = 'default' | 'mono' | 'code' | 'token'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  /** Rótulo del campo. Obligatorio: es su nombre accesible (ocúltalo con hideLabel). */
  label: ReactNode
  /** Oculta el rótulo a la vista (por ejemplo, el código de licencia bajo su H1). */
  hideLabel?: boolean
  /** Ayuda junto al rótulo; se enlaza con aria-describedby. */
  hint?: ReactNode
  /** Error inline (D-22): borde y texto de error con ícono, aria-invalid y aria-describedby. */
  error?: ReactNode
  /** Dato confirmado: borde verde y check animado (Strata.dc.html:1045-1049). Se ignora si hay error. */
  valid?: boolean
  /** Ícono decorativo a la izquierda (Strata.dc.html:1043). */
  icon?: ReactNode
  /** Texto fijo antes del valor, como el símbolo de moneda (Strata.dc.html:384-387). Se anuncia como descripción. */
  prefix?: ReactNode
  /** Texto fijo después del valor («min», «%»). Se anuncia como descripción. */
  suffix?: ReactNode
  /** Por defecto, md. La variante code usa su propio tamaño. */
  size?: InputSize
  /** Por defecto, default. */
  variant?: InputVariant
  /** Clase del contenedor (.st-field). Para la del <input>, usa inputClassName. */
  className?: string
  /** Clase del <input>. */
  inputClassName?: string
  ref?: Ref<HTMLInputElement>
}

const INTERACTIVE = 'a, button, input, select, textarea, [tabindex]'

/** Campo de texto STRATA con rótulo, ayuda, error y estado válido. */
export function Input({
  label,
  hideLabel = false,
  hint,
  error,
  valid = false,
  icon,
  prefix,
  suffix,
  size = 'md',
  variant = 'default',
  className,
  inputClassName,
  id,
  type = 'text',
  required,
  disabled,
  ref,
  'aria-describedby': describedBy,
  'aria-invalid': ariaInvalid,
  ...rest
}: InputProps) {
  const ids = useFieldIds(id)
  const showError = hasContent(error)
  const invalid = showError || isAriaInvalid(ariaInvalid)
  const showValid = valid && !invalid
  const showPrefix = hasContent(prefix)
  const showSuffix = hasContent(suffix)
  const prefixId = `${ids.controlId}-prefix`
  const suffixId = `${ids.controlId}-suffix`
  const isCode = variant === 'code'
  // code y token comparten el aspecto del input de código del candidato.
  const isCodeLike = isCode || variant === 'token'

  // Un clic en el ícono, el prefijo o el relleno lleva el foco al input.
  function focusField(event: MouseEvent<HTMLDivElement>) {
    const box = event.currentTarget
    const hit = (event.target as HTMLElement).closest(INTERACTIVE)
    if (disabled || (hit && box.contains(hit))) return
    event.preventDefault()
    box.querySelector('input')?.focus()
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
      size={isCodeLike ? 'lg' : size}
      className={className}
    >
      <div
        className={cx(
          'st-input',
          `st-input--${size}`,
          variant !== 'default' && `st-input--${variant}`,
          hasContent(icon) && 'st-input--has-icon',
          showPrefix && 'st-input--has-prefix',
          showSuffix && 'st-input--has-suffix',
          showValid && 'st-input--valid',
          invalid && 'st-input--invalid',
          disabled && 'st-input--disabled',
        )}
        onMouseDown={focusField}
      >
        {hasContent(icon) && (
          <span className="st-input__icon" aria-hidden="true">
            {icon}
          </span>
        )}
        {showPrefix && (
          <span id={prefixId} className="st-input__affix st-input__affix--prefix">
            {prefix}
          </span>
        )}
        <input
          autoComplete={isCodeLike ? 'off' : undefined}
          autoCapitalize={isCode ? 'characters' : isCodeLike ? 'none' : undefined}
          autoCorrect={isCodeLike ? 'off' : undefined}
          spellCheck={isCodeLike || variant === 'mono' ? false : undefined}
          {...rest}
          ref={ref}
          id={ids.controlId}
          type={type}
          className={cx('st-input__field', inputClassName)}
          required={required}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-describedby={joinIds(
            showError && ids.errorId,
            hasContent(hint) && ids.hintId,
            showPrefix && prefixId,
            showSuffix && suffixId,
            describedBy,
          )}
        />
        {showSuffix && (
          <span id={suffixId} className="st-input__affix st-input__affix--suffix">
            {suffix}
          </span>
        )}
        {showValid && (
          <span className="st-input__check">
            <IconoValido />
          </span>
        )}
      </div>
    </Field>
  )
}
