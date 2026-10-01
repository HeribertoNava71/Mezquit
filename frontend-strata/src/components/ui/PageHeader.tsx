import type { ElementType, HTMLAttributes, ReactNode, Ref } from 'react'
import { cx } from './cx'
import './PageHeader.css'

/** Nivel del título: h1 por defecto. */
export type PageHeaderLevel = 1 | 2 | 3 | 4 | 5 | 6

export interface PageHeaderProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Título de la página (H1 de 46 px, -.03em y text-wrap balance). */
  title: ReactNode
  /** Nivel semántico del título. No cambia el tamaño. Por defecto, 1. */
  level?: PageHeaderLevel
  /** Eyebrow sobre el título: 11 px, 700, mayúsculas, .13em, celeste para texto. */
  eyebrow?: ReactNode
  /** Pastilla de estado junto al eyebrow (por ejemplo, un Badge size="sm"). */
  status?: ReactNode
  /** Entradilla bajo el título: 17 px, texto secundario. */
  lede?: ReactNode
  /** Acciones a la derecha (botones). A 640 px o menos pasan debajo. */
  actions?: ReactNode
  /** Elemento contenedor. Por defecto, header. */
  as?: 'header' | 'div'
  ref?: Ref<HTMLElement>
}

/**
 * Encabezado de página: eyebrow, H1, entradilla y acciones
 * (Strata.dc.html:333-349, 606-618, 684-694 y 775-788).
 * Deja 22 px debajo, como el prototipo; cámbialo con className si hace falta.
 */
export function PageHeader({
  title,
  level = 1,
  eyebrow,
  status,
  lede,
  actions,
  as = 'header',
  className,
  ref,
  ...rest
}: PageHeaderProps) {
  const Wrapper = as as ElementType
  const Heading = `h${level}` as const
  return (
    <Wrapper ref={ref} className={cx('st-page-header', className)} {...rest}>
      <div className="st-page-header__main">
        {(eyebrow || status) && (
          <div className={cx('st-page-header__kicker', Boolean(status) && 'st-page-header__kicker--with-status')}>
            {eyebrow && <p className="st-page-header__eyebrow">{eyebrow}</p>}
            {status}
          </div>
        )}
        <Heading className="st-page-header__title">{title}</Heading>
        {lede && <p className="st-page-header__lede">{lede}</p>}
      </div>
      {actions && <div className="st-page-header__actions">{actions}</div>}
    </Wrapper>
  )
}
