import type { ButtonHTMLAttributes, MouseEvent, ReactNode, Ref } from 'react'
import { cx } from './cx'
import './IconButton.css'

/** sm: copiar, 24 px y radio 7 (Strata.dc.html:738). md: cerrar, 32 px y radio 9 (Strata.dc.html:1257). */
export type IconButtonSize = 'sm' | 'md'

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'children'> {
  /** Nombre accesible obligatorio: el botón solo muestra un ícono («Copiar código», «Cerrar»). */
  'aria-label': string
  /** Ícono (SVG con stroke o fill en currentColor). Se marca como decorativo. */
  children: ReactNode
  /** Por defecto, md. */
  size?: IconButtonSize
  /** Deshabilita con aria-disabled: sigue enfocable y no ejecuta onClick. */
  disabled?: boolean
  ref?: Ref<HTMLButtonElement>
}

/** Botón cuadrado de solo ícono: copiar en tablas y cerrar en modales y drawers. */
export function IconButton({
  size = 'md',
  disabled = false,
  type = 'button',
  className,
  children,
  onClick,
  ref,
  ...rest
}: IconButtonProps) {
  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (disabled) {
      event.preventDefault()
      event.stopPropagation()
      return
    }
    onClick?.(event)
  }

  return (
    <button
      {...rest}
      ref={ref}
      type={type}
      className={cx('st-icon-btn', `st-icon-btn--${size}`, disabled && 'st-icon-btn--disabled', className)}
      aria-disabled={disabled || undefined}
      onClick={handleClick}
    >
      <span className="st-icon-btn__icon" aria-hidden="true">
        {children}
      </span>
    </button>
  )
}
