import { useId, type HTMLAttributes, type ReactNode, type RefObject } from 'react'
import { cx } from './cx'
import { hasContent } from './hasContent'
import { OverlayClose, OverlayDialog, type OverlayRole } from './OverlayDialog'
import { useScrollableFocus } from './useScrollableFocus'
import './Modal.css'

/** md: 520 px (modal «Asignar test por email»). lg: 540 px (modal «Enlace de invitación»). */
export type ModalSize = 'md' | 'lg'

/** dialog: diálogo común. alertdialog: confirma una acción que no se deshace. */
export type ModalRole = OverlayRole

export interface ModalProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'role'> {
  /** Abre el modal. Cerrado no renderiza nada (el prototipo no tiene animación de salida). */
  open: boolean
  /**
   * Se llama con Escape, con el clic en el fondo (si closeOnScrim) y con la X (si showClose).
   * Mientras una acción está en curso, puedes ignorar la llamada para no cerrar a medias.
   */
  onClose: () => void
  /** Título visible (h2). Da nombre al diálogo con aria-labelledby. */
  title: ReactNode
  /** Texto bajo el título. Describe el diálogo con aria-describedby. */
  description?: ReactNode
  /** Ancho: md (520 px, por defecto) o lg (540 px). Nunca más ancho que la ventana. */
  size?: ModalSize
  /** Acciones del pie (botones), alineadas a la derecha. Incluye siempre una para cerrar o cancelar. */
  footer?: ReactNode
  /** Nota del pie, a la izquierda de las acciones (p. ej., la fecha límite). */
  footerNote?: ReactNode
  /** Elemento que recibe el foco al abrir. Por defecto, el primero enfocable del modal. */
  initialFocusRef?: RefObject<HTMLElement | null>
  /** Cierra con un clic en el fondo. Por defecto, true. */
  closeOnScrim?: boolean
  /**
   * alertdialog para confirmar algo que no se deshace (eliminar un usuario, aprobar o
   * rechazar una solicitud); lleva el foco inicial a la acción menos destructiva con
   * initialFocusRef. Por defecto, dialog.
   */
  role?: ModalRole
  /** Muestra la X en la cabecera. Por defecto, false: el prototipo cierra desde el pie. */
  showClose?: boolean
  /** Nombre accesible de la X. Por defecto, «Cerrar». */
  closeLabel?: string
}

/**
 * Diálogo modal (Strata.dc.html:1323-1418): fondo tinta al 42 %, panel blanco
 * de radio 20 con cabecera, cuerpo con scroll y pie beige; entra con fadeUp de
 * .22s, la animación de los dos modales del prototipo (:1327, :1380).
 * Accesible: role="dialog" (o alertdialog), aria-modal, aria-labelledby, foco
 * atrapado, Escape cierra, bloquea el scroll del body y devuelve el foco al disparador.
 *
 * @example
 * <Modal
 *   open={abierto}
 *   onClose={cerrar}
 *   role="alertdialog"
 *   title="Rechazar solicitud"
 *   description="La empresa no recibirá los créditos."
 *   initialFocusRef={cancelarRef}
 *   footer={acciones} // «Cancelar» y «Rechazar»
 * >
 *   …
 * </Modal>
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  footer,
  footerNote,
  initialFocusRef,
  closeOnScrim = true,
  role = 'dialog',
  showClose = false,
  closeLabel = 'Cerrar',
  className,
  children,
  'aria-describedby': ariaDescribedBy,
  ...rest
}: ModalProps) {
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
      placement="center"
      role={role}
      labelledBy={titleId}
      describedBy={cx(hasDescription && descriptionId, ariaDescribedBy) || undefined}
      className={cx('st-modal', `st-modal--${size}`, className)}
    >
      <div className="st-modal__header">
        <div className="st-modal__heading">
          <h2 id={titleId} className="st-modal__title">
            {title}
          </h2>
          {hasDescription && (
            <p id={descriptionId} className="st-modal__description">
              {description}
            </p>
          )}
        </div>
        {showClose && <OverlayClose label={closeLabel} onClick={onClose} />}
      </div>

      <div ref={bodyRef} className="st-modal__body" tabIndex={bodyFocusable ? 0 : undefined}>
        {children}
      </div>

      {hasFooter && (
        <div className="st-modal__footer">
          {hasContent(footerNote) && <p className="st-modal__note">{footerNote}</p>}
          {hasContent(footer) && <div className="st-modal__actions">{footer}</div>}
        </div>
      )}
    </OverlayDialog>
  )
}
