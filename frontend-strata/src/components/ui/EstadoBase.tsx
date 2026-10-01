import type { HTMLAttributes, ReactNode, Ref } from 'react'
import { cx } from './cx'
import { hasContent } from './hasContent'
import './EstadoBase.css'

// Base interna de EstadoVacio y EstadoError: caja centrada con ícono, título,
// texto y acciones. La superficie (borde punteado o sólido) y el color del
// ícono los pone el .css de cada componente. No se exporta desde el barril.

/** sm: el estado del carrito vacío (Strata.dc.html:1263-1268). md: el de una sección o página. */
export type EstadoSize = 'sm' | 'md'

/**
 * Elemento del título. p por defecto; usa un encabezado (h2–h4) cuando el estado
 * ocupa el lugar del contenido de una página o sección, para que se pueda
 * encontrar al navegar por encabezados. El aspecto no cambia.
 */
export type EstadoTitleAs = 'p' | 'h2' | 'h3' | 'h4'

export interface EstadoBaseProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children'> {
  icon?: ReactNode
  title: ReactNode
  titleAs?: EstadoTitleAs
  description?: ReactNode
  actions?: ReactNode
  size?: EstadoSize
  ref?: Ref<HTMLDivElement>
}

export function EstadoBase({
  icon,
  title,
  titleAs: Titulo = 'p',
  description,
  actions,
  size = 'md',
  className,
  ...rest
}: EstadoBaseProps) {
  return (
    <div {...rest} className={cx('st-estado', `st-estado--${size}`, className)}>
      {hasContent(icon) && (
        <span className="st-estado__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <Titulo className="st-estado__title">{title}</Titulo>
      {hasContent(description) && <div className="st-estado__description">{description}</div>}
      {hasContent(actions) && <div className="st-estado__actions">{actions}</div>}
    </div>
  )
}
