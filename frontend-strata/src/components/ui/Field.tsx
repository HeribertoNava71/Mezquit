import type { ReactNode } from 'react'
import { cx } from './cx'
import { hasContent } from './hasContent'
import { IconoError } from './Iconos'
import './VisuallyHidden.css'
import './Field.css'

/**
 * Tamaño del campo; cambia el estilo del rótulo.
 * - sm y md: rótulo de 11.5 px en peso 700 y color secundario (builder y modales, Strata.dc.html:368).
 * - lg: rótulo del candidato, en peso 600, color #3D3A33 y tracking .01em (Strata.dc.html:1039).
 */
export type FieldSize = 'sm' | 'md' | 'lg'

export interface FieldProps {
  /** Rótulo visible. Obligatorio aunque se oculte: es el nombre accesible del control. */
  label: ReactNode
  /** id del control. Con htmlFor el rótulo es un <label>; sin él, un <span> para aria-labelledby. */
  htmlFor?: string
  /** id del rótulo (para aria-labelledby en grupos como RadioGroup). */
  labelId?: string
  /** Oculta el rótulo a la vista y lo deja para lectores de pantalla. */
  hideLabel?: boolean
  /** Ayuda junto al rótulo (Strata.dc.html:1055). Pásale su id al control en aria-describedby. */
  hint?: ReactNode
  hintId?: string
  /** Error inline con ícono y texto (D-22). Se anuncia con role="alert". */
  error?: ReactNode
  errorId?: string
  /** Muestra un asterisco decorativo; el control lleva required o aria-required. */
  required?: boolean
  /** Por defecto, md. */
  size?: FieldSize
  className?: string
  /** El control. */
  children: ReactNode
}

/**
 * Estructura común de un campo: rótulo, ayuda, control y error.
 * Input, Textarea, Select, RadioGroup y Stepper ya lo usan; sirve también para
 * envolver un control propio (el control se encarga de su aria-describedby).
 */
export function Field({
  label,
  htmlFor,
  labelId,
  hideLabel = false,
  hint,
  hintId,
  error,
  errorId,
  required = false,
  size = 'md',
  className,
  children,
}: FieldProps) {
  const showHint = hasContent(hint)
  const labelClass = cx('st-field__label', hideLabel && 'st-visually-hidden')
  const labelContent = (
    <>
      {label}
      {required && (
        <span className="st-field__required" aria-hidden="true">
          *
        </span>
      )}
    </>
  )
  const labelNode = htmlFor ? (
    <label id={labelId} htmlFor={htmlFor} className={labelClass}>
      {labelContent}
    </label>
  ) : (
    <span id={labelId} className={labelClass}>
      {labelContent}
    </span>
  )

  return (
    <div className={cx('st-field', `st-field--${size}`, className)}>
      {hideLabel && !showHint ? (
        labelNode
      ) : (
        <div className="st-field__header">
          {labelNode}
          {showHint && (
            <span id={hintId} className="st-field__hint">
              {hint}
            </span>
          )}
        </div>
      )}
      {children}
      {hasContent(error) && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  )
}

export interface FieldErrorProps {
  id?: string
  className?: string
  children: ReactNode
}

/** Mensaje de error inline: ícono más texto en rojo de error (D-22). */
export function FieldError({ id, className, children }: FieldErrorProps) {
  return (
    <p id={id} className={cx('st-field__error', className)} role="alert">
      <IconoError className="st-field__error-icon" width={14} height={14} strokeWidth={1.9} />
      <span>{children}</span>
    </p>
  )
}
