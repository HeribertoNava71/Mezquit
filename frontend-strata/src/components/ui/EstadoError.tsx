import type { HTMLAttributes, ReactNode, Ref } from 'react'
import { Button } from './Button'
import { cx } from './cx'
import { hasContent } from './hasContent'
import { EstadoBase, type EstadoSize, type EstadoTitleAs } from './EstadoBase'
import { estadoErrorTextos, type EstadoErrorKind } from './errorKind'
import {
  IconoAdvertencia,
  IconoBuscar,
  IconoCandado,
  IconoError,
  IconoReintentar,
  IconoReloj,
  IconoSinRed,
} from './Iconos'
import './EstadoError.css'

export interface EstadoErrorProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children'> {
  /** Tipo de error; elige el ícono y los textos por defecto. Por defecto, servidor. Usa getErrorKind(error). */
  kind?: EstadoErrorKind
  /** Título. Por defecto, el del tipo (p. ej., «No pudimos conectarnos»). */
  title?: ReactNode
  /** Elemento del título: p (por defecto) o h2–h4 si el error ocupa el lugar de la página. */
  titleAs?: EstadoTitleAs
  /** Mensaje. Por defecto, el del tipo. */
  message?: ReactNode
  /** Muestra el botón «Reintentar» y lo llama al pulsarlo. */
  onRetry?: () => void
  /** Texto del botón. Por defecto, «Reintentar». */
  retryLabel?: string
  /** Reintento en curso: el botón dice «Reintentando…» y no responde, sin perder el foco. */
  retrying?: boolean
  /**
   * Acciones extra junto a «Reintentar» (p. ej., un enlace «Volver al catálogo» o «Entrar»).
   * Se llama actions, como en PageHeader y Callout.
   */
  actions?: ReactNode
  /** Ícono propio. Sin definir usa el del tipo; null lo quita. */
  icon?: ReactNode
  /** sm: compacto (dentro de un drawer o una tarjeta). md: sección o página. Por defecto, md. */
  size?: EstadoSize
  /** Para mover el foco al estado (con tabIndex={-1}) cuando reemplaza al contenido. */
  ref?: Ref<HTMLDivElement>
}

const ICONOS: Record<EstadoErrorKind, ReactNode> = {
  red: <IconoSinRed />,
  permiso: <IconoCandado />,
  'no-encontrado': <IconoBuscar />,
  conflicto: <IconoAdvertencia />,
  sesion: <IconoReloj />,
  servidor: <IconoError />,
}

/**
 * Estado de error con role="alert": ícono, título, mensaje y «Reintentar».
 * Reemplaza al contenido que no se pudo cargar; siempre distinto del estado vacío.
 * El prototipo no diseña errores: usa la receta de EstadoVacio con borde sólido
 * y el rojo de error del repo (#B3261E) en el ícono.
 *
 * @example
 * <EstadoError kind={getErrorKind(error)} onRetry={cargar} />
 * <EstadoError kind="no-encontrado" title="Prueba no encontrada" actions={<Link to="/pruebas">Volver al catálogo</Link>} />
 */
export function EstadoError({
  kind = 'servidor',
  title,
  titleAs,
  message,
  onRetry,
  retryLabel = 'Reintentar',
  retrying = false,
  actions,
  icon,
  size = 'md',
  className,
  ...rest
}: EstadoErrorProps) {
  const textos = estadoErrorTextos[kind]

  // Botón secundario del sistema (Strata.dc.html:1224). Con retrying usa loading:
  // spinner, aria-busy y aria-disabled, sin perder el foco ni repetir la llamada.
  const boton = onRetry && (
    <Button
      variant="secondary"
      className="st-estado-error__retry"
      iconLeft={<IconoReintentar />}
      loading={retrying}
      loadingText="Reintentando…"
      onClick={onRetry}
    >
      {retryLabel}
    </Button>
  )

  return (
    <EstadoBase
      {...rest}
      role="alert"
      className={cx('st-estado-error', className)}
      size={size}
      icon={icon === undefined ? ICONOS[kind] : icon}
      title={title ?? textos.title}
      titleAs={titleAs}
      description={message ?? textos.message}
      actions={
        (boton || hasContent(actions)) && (
          <>
            {boton}
            {actions}
          </>
        )
      }
    />
  )
}
