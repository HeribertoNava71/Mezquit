import type { HTMLAttributes, ReactNode, Ref } from 'react'
import { cx } from './cx'
import { EstadoBase, type EstadoSize, type EstadoTitleAs } from './EstadoBase'
import './EstadoVacio.css'

export interface EstadoVacioProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children'> {
  /** Título breve: «Aún no hay movimientos». */
  title: ReactNode
  /** Elemento del título: p (por defecto) o h2–h4 si el vacío ocupa toda una sección. */
  titleAs?: EstadoTitleAs
  /** Texto de apoyo: qué hacer para llenar este espacio. */
  description?: ReactNode
  /** Ícono decorativo en una caja celeste (opcional; el carrito del prototipo no lleva). */
  icon?: ReactNode
  /** Acciones para salir del vacío (p. ej., un botón «Invitar candidatos»). Se llama actions, como en PageHeader y Callout. */
  actions?: ReactNode
  /** sm: compacto, como el carrito vacío. md: para una sección o página. Por defecto, md. */
  size?: EstadoSize
  /** Para mover el foco al estado (con tabIndex={-1}) cuando reemplaza al contenido. */
  ref?: Ref<HTMLDivElement>
}

/**
 * Estado vacío con el patrón del carrito vacío (Strata.dc.html:1263-1268):
 * caja blanca con borde punteado, título y texto centrados, y una acción opcional.
 * Siempre distinto de EstadoError: un vacío no es una falla.
 * Si aparece tras filtrar o buscar, pásale role="status" para que se anuncie.
 *
 * @example
 * <EstadoVacio title="Aún no tienes evaluaciones" description="Crea la primera para invitar candidatos." actions={botonCrear} />
 * <EstadoVacio size="sm" role="status" title="Ningún candidato en este estado" />
 */
export function EstadoVacio({ title, titleAs, description, icon, actions, size = 'md', className, ...rest }: EstadoVacioProps) {
  return (
    <EstadoBase
      {...rest}
      className={cx('st-estado-vacio', className)}
      size={size}
      icon={icon}
      title={title}
      titleAs={titleAs}
      description={description}
      actions={actions}
    />
  )
}
