import { useId, type HTMLAttributes, type ReactNode, type RefObject } from 'react'
import { cx } from './cx'
import { hasContent } from './hasContent'
import { OverlayClose, OverlayDialog } from './OverlayDialog'
import { useScrollableFocus } from './useScrollableFocus'
import './Drawer.css'

export interface DrawerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'role'> {
  /** Abre el panel. Cerrado no renderiza nada. */
  open: boolean
  /**
   * Se llama con Escape, con el clic en el fondo (si closeOnScrim) y con la X.
   * Mientras se envía un formulario, puedes ignorar la llamada para no cerrar a medias.
   */
  onClose: () => void
  /** Título visible (h2). Da nombre al diálogo con aria-labelledby. */
  title: ReactNode
  /** Subtítulo bajo el título. Describe el diálogo con aria-describedby. */
  description?: ReactNode
  /** Contenido del pie blanco (p. ej., el botón principal a todo el ancho). */
  footer?: ReactNode
  /** Nota centrada bajo el pie (p. ej., una aclaración con ícono). */
  footerNote?: ReactNode
  /** Elemento que recibe el foco al abrir. Por defecto, el primero enfocable (la X si está visible). */
  initialFocusRef?: RefObject<HTMLElement | null>
  /** Cierra con un clic en el fondo. Por defecto, true. */
  closeOnScrim?: boolean
  /** Muestra la X en la cabecera. Por defecto, true, como en el prototipo. */
  showClose?: boolean
  /** Nombre accesible de la X. Por defecto, «Cerrar». */
  closeLabel?: string
}

/**
 * Panel lateral derecho de 408 px (Strata.dc.html:1247-1321): cabecera blanca con
 * título, subtítulo y X; cuerpo beige con scroll; pie blanco. Entra con slideIn
 * de .26s. A pantalla completa en móvil. Misma semántica que Modal: role="dialog",
 * aria-modal, foco atrapado, Escape, scroll del body bloqueado y foco devuelto.
 *
 * Con un formulario, el <form> va en el cuerpo y el botón del pie se asocia con
 * el atributo form (el pie queda fuera del <form>).
 *
 * @example
 * <Drawer
 *   open={abierto}
 *   onClose={cerrar}
 *   title="Solicitar créditos"
 *   description="Un asesor revisará tu solicitud."
 *   footer={<Button type="submit" form="solicitar-creditos" fullWidth>Enviar solicitud</Button>}
 * >
 *   <form id="solicitar-creditos" onSubmit={enviar}>…</form>
 * </Drawer>
 */
export function Drawer({
  open,
  onClose,
  title,
  description,
  footer,
  footerNote,
  initialFocusRef,
  closeOnScrim = true,
  showClose = true,
  closeLabel = 'Cerrar',
  className,
  children,
  'aria-describedby': ariaDescribedBy,
  ...rest
}: DrawerProps) {
  const titleId = useId()
  const descriptionId = useId()
  const hasDescription = hasContent(description)
  const hasFooter = hasContent(footer) || hasContent(footerNote)
  // Un cuerpo largo sin controles se vuelve enfocable para recorrerlo con el teclado.
  const [bodyRef, bodyFocusable] = useScrollableFocus<HTMLDivElement>(open)

  return (
    <OverlayDialog
      {...rest}
      open={open}
      onClose={onClose}
      closeOnScrim={closeOnScrim}
      initialFocusRef={initialFocusRef}
      placement="end"
      labelledBy={titleId}
      describedBy={cx(hasDescription && descriptionId, ariaDescribedBy) || undefined}
      className={cx('st-drawer', className)}
    >
      <div className="st-drawer__header">
        <div className="st-drawer__heading">
          <h2 id={titleId} className="st-drawer__title">
            {title}
          </h2>
          {hasDescription && (
            <p id={descriptionId} className="st-drawer__description">
              {description}
            </p>
          )}
        </div>
        {showClose && <OverlayClose label={closeLabel} onClick={onClose} />}
      </div>

      <div ref={bodyRef} className="st-drawer__body" tabIndex={bodyFocusable ? 0 : undefined}>
        {children}
      </div>

      {hasFooter && (
        <div className="st-drawer__footer" data-overlay-pie="">
          {hasContent(footer) && footer}
          {hasContent(footerNote) && <p className="st-drawer__note">{footerNote}</p>}
        </div>
      )}
    </OverlayDialog>
  )
}
