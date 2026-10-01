import type { HTMLAttributes, ReactNode, Ref } from 'react'
import { cx } from './cx'
import { hasContent } from './hasContent'
import { IconoAdvertencia, IconoCheck, IconoError, IconoExito, IconoInfo } from './Iconos'
import './Callout.css'

/**
 * info: celeste (Strata.dc.html:1217-1220). success, error y warning: estados (D-22).
 * neutral: caja beige de interpretación (:946-953). dark: banner tinta (:876-885).
 */
export type CalloutTone = 'info' | 'success' | 'error' | 'warning' | 'neutral' | 'dark'

/** alert: se anuncia al aparecer (errores). status: anuncia sus cambios con cortesía. */
export type CalloutLive = 'alert' | 'status'

/** md: el callout de las pantallas. sm: el compacto del builder (Strata.dc.html:572-575). */
export type CalloutSize = 'md' | 'sm'

export interface CalloutProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Tono. Por defecto, info. */
  tone?: CalloutTone
  /** Título en negritas sobre el texto. */
  title?: ReactNode
  /** Ícono propio. Sin definir usa el del tono; null lo quita. */
  icon?: ReactNode
  /** Acciones a la derecha (enlaces o botones); bajan de línea si no caben. */
  actions?: ReactNode
  /**
   * Región viva: 'alert' (role="alert") para un error que aparece tras una acción;
   * 'status' (role="status") para un estado que cambia. Sin definir, es contenido estático.
   */
  live?: CalloutLive
  /** Tamaño. Por defecto, md. */
  size?: CalloutSize
  /** Para mover el foco al aviso, por ejemplo tras un envío fallido (con tabIndex={-1}). */
  ref?: Ref<HTMLDivElement>
}

const ICONOS: Record<CalloutTone, ReactNode> = {
  info: <IconoInfo />,
  success: <IconoExito />,
  error: <IconoError />,
  warning: <IconoAdvertencia />,
  neutral: null,
  dark: <IconoCheck />,
}

/**
 * Aviso en línea con ícono, título, texto y acciones. Los errores de un formulario
 * o de una sección van aquí, con ícono y texto (D-22), no en un toast.
 *
 * @example
 * <Callout tone="error" live="alert" title="No pudimos enviar la solicitud">
 *   Revisa tu conexión e inténtalo de nuevo.
 * </Callout>
 */
export function Callout({
  tone = 'info',
  title,
  icon,
  actions,
  live,
  size = 'md',
  className,
  children,
  role,
  ...rest
}: CalloutProps) {
  const glifo = icon === undefined ? ICONOS[tone] : icon

  return (
    <div
      {...rest}
      role={live ?? role}
      className={cx(
        'st-callout',
        `st-callout--${tone}`,
        size === 'sm' && 'st-callout--sm',
        tone === 'dark' && 'st-on-dark',
        className,
      )}
    >
      {hasContent(glifo) && (
        <span className="st-callout__icon" aria-hidden="true">
          {glifo}
        </span>
      )}
      <div className="st-callout__content">
        {hasContent(title) && <p className="st-callout__title">{title}</p>}
        {hasContent(children) && <div className="st-callout__text">{children}</div>}
      </div>
      {hasContent(actions) && <div className="st-callout__actions">{actions}</div>}
    </div>
  )
}
