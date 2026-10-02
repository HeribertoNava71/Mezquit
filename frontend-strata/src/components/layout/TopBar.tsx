import type { HTMLAttributes, ReactNode, Ref } from 'react'
import { cx } from '@/components/ui'
import type { CorteBarra } from './topbar/cortes'
import './TopBar.css'

/** default: sticky y translúcida. home: dentro del contenido de la home, sin sticky ni fondo. */
export type TopBarVariant = 'default' | 'home'

export interface TopBarProps extends HTMLAttributes<HTMLElement> {
  /** Fila de la barra: marca, navegación (.st-topbar__nav) y acciones (.st-topbar__actions). */
  children: ReactNode
  /** Contenido debajo de la fila, dentro de la barra (por ejemplo, el panel del menú móvil). */
  below?: ReactNode
  /** Clase extra para la fila interna de 1200 px (.st-topbar__inner). */
  innerClassName?: string
  /**
   * - default: sticky, rgba(250,248,245,.78) con blur de 16 px y z-index 30
   *   (Strata.dc.html:53; PROMPT_CLAUDE_CODE.md:94-95).
   * - home: va dentro del contenido de la home y se desplaza con él (D-06; :110).
   * Por defecto, default.
   */
  variant?: TopBarVariant
  /**
   * Ancho desde el que la barra muestra su diseño de escritorio; por debajo, todo
   * pasa al menú móvil (topbar/cortes.ts). Pasa el mismo corte a su MobileMenu.
   * Por defecto, base (768 px).
   */
  corte?: CorteBarra
  ref?: Ref<HTMLElement>
}

/**
 * Marco común de las tres barras superiores (pública, RR. HH. y super admin):
 * un <header> (landmark banner) con la fila centrada a 1200 px. La navegación
 * por rol, la pastilla y el menú móvil los pone cada barra dentro.
 * Pásala a PageLayout por la prop topbar, para que quede como hija directa del
 * lienzo y el sticky funcione.
 */
export function TopBar({
  children,
  below,
  innerClassName,
  variant = 'default',
  corte = 'base',
  className,
  ref,
  ...rest
}: TopBarProps) {
  return (
    <header
      ref={ref}
      className={cx('st-topbar', variant === 'home' && 'st-topbar--home', corte !== 'base' && `st-topbar--corte-${corte}`, className)}
      {...rest}
    >
      <div className={cx('st-topbar__inner', innerClassName)}>{children}</div>
      {below}
    </header>
  )
}

export default TopBar
