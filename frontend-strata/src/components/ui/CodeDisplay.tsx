import type { HTMLAttributes, ReactNode, Ref } from 'react'
import { cx } from './cx'
import './CodeDisplay.css'

export interface CodeDisplayProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Rótulo en mayúsculas sobre el código (10.5 px, #7DA2D9). */
  label?: ReactNode
  /**
   * Código grande en JetBrains Mono de 30 px (.16em). Opcional: el token de
   * invitación mide 40 caracteres y no cabe; se usa cuando exista un código corto (PB-11).
   */
  code?: string
  /** Contenido bajo el código: un CopyField con el enlace, canales para compartir, notas. */
  children?: ReactNode
  /** Alineación del texto. Por defecto, center, como el prototipo. */
  align?: 'center' | 'start'
  ref?: Ref<HTMLDivElement>
}

/**
 * Superficie oscura con el código o el enlace de una invitación (Strata.dc.html:1333-1340).
 * Activa el foco celeste claro para lo que lleve dentro (st-on-dark).
 */
export function CodeDisplay({ label, code, children, align = 'center', className, ref, ...rest }: CodeDisplayProps) {
  return (
    <div
      ref={ref}
      className={cx('st-code-display', align === 'start' && 'st-code-display--start', 'st-on-dark', className)}
      {...rest}
    >
      {label && <p className="st-code-display__label">{label}</p>}
      {code && <p className="st-code-display__code">{code}</p>}
      {children && <div className="st-code-display__body">{children}</div>}
    </div>
  )
}
