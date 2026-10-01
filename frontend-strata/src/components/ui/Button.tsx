import type {
  AnchorHTMLAttributes,
  AriaAttributes,
  ButtonHTMLAttributes,
  MouseEvent,
  MouseEventHandler,
  ReactNode,
  Ref,
} from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { cx } from './cx'
import { Spinner } from './Spinner'
import './Button.css'

/**
 * - primary: navy con texto blanco (D-19).
 * - secondary: blanco, borde #D6CFC2 y texto navy.
 * - neutral: como secondary, con texto gris («Cerrar», «Cancelar»; Strata.dc.html:1369, :1413).
 * - highlight: acción de tabla destacada, celeste (Strata.dc.html:854, :1880-1882).
 * - ghost: solo texto navy. Es el nombre que ya usaban las pantallas viejas; antes
 *   pintaba un borde y ahora sigue al «Link / ghost» del prototipo.
 * - ink: pastilla tinta del header público (Strata.dc.html:123).
 * - danger: acciones destructivas, con el rojo de error.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'neutral' | 'highlight' | 'ghost' | 'ink' | 'danger'

/**
 * - sm: acción de tabla, 12 px y unos 30 px de alto (Strata.dc.html:757).
 * - md: botón estándar, 13.5 px y 44 px de alto mínimo (objetivo táctil del candidato).
 * - lg: CTA del hero, 15 px, radio 16, 52 px y resorte al pasar el cursor (Strata.dc.html:145).
 */
export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonOwnProps {
  /** Estilo del botón. Por defecto, primary. */
  variant?: ButtonVariant
  /** Por defecto, md. */
  size?: ButtonSize
  /** Ocupa todo el ancho del contenedor (Strata.dc.html:671, :1313). */
  fullWidth?: boolean
  /** Muestra un spinner, marca aria-busy y bloquea la acción. */
  loading?: boolean
  /** Texto mientras carga («Enviando…»). Si se omite, se conserva el texto del botón. */
  loadingText?: ReactNode
  /** Ícono decorativo antes del texto. Mientras carga, el spinner ocupa su lugar. */
  iconLeft?: ReactNode
  /** Ícono decorativo después del texto (flecha de los CTA). */
  iconRight?: ReactNode
  /**
   * Deshabilita la acción con aria-disabled: el botón sigue siendo enfocable,
   * anuncia que no está disponible y no ejecuta onClick ni envía el formulario.
   * Acompáñalo de un texto visible que diga por qué (CA-6, regla 2) y enlázalo
   * con aria-describedby.
   */
  disabled?: boolean
  className?: string
  children?: ReactNode
}

/** Botón nativo (sin `to` ni `href`). type es «button» por defecto. */
export type ButtonAsButtonProps = ButtonOwnProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonOwnProps> & {
    to?: undefined
    href?: undefined
    ref?: Ref<HTMLButtonElement>
  }

/** Enlace interno del router (Link de react-router-dom). */
export type ButtonAsLinkProps = ButtonOwnProps &
  Omit<LinkProps, keyof ButtonOwnProps | 'to'> & {
    to: LinkProps['to']
    href?: undefined
    ref?: Ref<HTMLAnchorElement>
  }

/** Enlace externo o ancla (<a href>). */
export type ButtonAsAnchorProps = ButtonOwnProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonOwnProps | 'href'> & {
    href: string
    to?: undefined
    ref?: Ref<HTMLAnchorElement>
  }

export type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps | ButtonAsAnchorProps

/** Propiedades del DOM que quedan después de separar las propias. */
type RestProps = AriaAttributes & {
  to?: LinkProps['to']
  href?: string
  type?: string
  onClick?: MouseEventHandler<HTMLElement>
  ref?: Ref<HTMLElement>
  [attribute: string]: unknown
}

/** Props de Link que no existen en un <a> nativo (se quitan si el enlace queda deshabilitado). */
const LINK_ONLY_PROPS = new Set([
  'replace',
  'state',
  'preventScrollReset',
  'relative',
  'reloadDocument',
  'viewTransition',
  'discover',
])

function withoutLinkProps(props: AnchorHTMLAttributes<HTMLAnchorElement>): AnchorHTMLAttributes<HTMLAnchorElement> {
  return Object.fromEntries(Object.entries(props).filter(([key]) => !LINK_ONLY_PROPS.has(key)))
}

function isTrue(value: AriaAttributes['aria-disabled']): boolean {
  return value === true || value === 'true'
}

/**
 * Botón STRATA. Sin `to` ni `href` es un <button>; con `to`, un Link del router;
 * con `href`, un <a>. Conserva la API del Button anterior (variant, size, to,
 * href, type, disabled, loading y onClick).
 */
export function Button(props: ButtonProps) {
  const {
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    loading = false,
    loadingText,
    iconLeft,
    iconRight,
    disabled = false,
    className,
    children,
    ...rest
  } = props
  const { to, href, type, onClick, ref, ...dom } = rest as RestProps

  const inactive = disabled || loading || isTrue(dom['aria-disabled'])
  const classes = cx(
    'st-btn',
    `st-btn--${variant}`,
    `st-btn--${size}`,
    fullWidth && 'st-btn--full',
    loading && 'st-btn--loading',
    inactive && !loading && 'st-btn--disabled',
    className,
  )

  const label = loading && loadingText != null ? loadingText : children
  const content = (
    <>
      {loading ? (
        <Spinner size="sm" className="st-btn__spinner" />
      ) : (
        iconLeft != null && (
          <span className="st-btn__icon" aria-hidden="true">
            {iconLeft}
          </span>
        )
      )}
      {label != null && label !== false && <span className="st-btn__label">{label}</span>}
      {iconRight != null && (
        <span className="st-btn__icon" aria-hidden="true">
          {iconRight}
        </span>
      )}
    </>
  )

  function handleClick(event: MouseEvent<HTMLElement>) {
    if (inactive) {
      // Igual que un botón deshabilitado: no navega, no envía el formulario y no burbujea.
      event.preventDefault()
      event.stopPropagation()
      return
    }
    onClick?.(event)
  }

  const stateAttrs = {
    'aria-disabled': inactive || undefined,
    'aria-busy': loading || undefined,
  }

  if (to !== undefined || href !== undefined) {
    const anchorProps = dom as AnchorHTMLAttributes<HTMLAnchorElement>
    const anchorRef = ref as Ref<HTMLAnchorElement> | undefined

    if (inactive) {
      // Un enlace no se puede deshabilitar: se quita el destino y queda enfocable.
      return (
        <a
          {...withoutLinkProps(anchorProps)}
          ref={anchorRef}
          role="link"
          tabIndex={anchorProps.tabIndex ?? 0}
          className={classes}
          {...stateAttrs}
          onClick={handleClick}
        >
          {content}
        </a>
      )
    }

    if (to !== undefined) {
      return (
        <Link {...anchorProps} ref={anchorRef} to={to} className={classes} {...stateAttrs} onClick={handleClick}>
          {content}
        </Link>
      )
    }

    return (
      <a
        {...anchorProps}
        ref={anchorRef}
        href={href}
        type={type}
        className={classes}
        {...stateAttrs}
        onClick={handleClick}
      >
        {content}
      </a>
    )
  }

  return (
    <button
      {...(dom as ButtonHTMLAttributes<HTMLButtonElement>)}
      ref={ref as Ref<HTMLButtonElement> | undefined}
      type={(type as ButtonHTMLAttributes<HTMLButtonElement>['type']) ?? 'button'}
      className={classes}
      {...stateAttrs}
      onClick={handleClick}
    >
      {content}
    </button>
  )
}

export default Button
