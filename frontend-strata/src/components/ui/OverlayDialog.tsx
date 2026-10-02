import { useEffect, type HTMLAttributes, type MouseEvent, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { cx } from './cx'
import { IconButton } from './IconButton'
import { IconoCerrar } from './Iconos'
import { registrarOverlay } from './overlayAbierto'
import { useFocusTrap } from './useFocusTrap'
import { useScrollLock } from './useScrollLock'
import './OverlayDialog.css'

// Base interna de Modal y Drawer: portal en el body, fondo (scrim), panel con
// role="dialog" y aria-modal, foco atrapado, Escape, bloqueo del scroll y
// devolución del foco al disparador. Mientras está abierto, registra su panel
// para que el toast no tape sus controles (overlayAbierto.ts, Fase 8). No se
// exporta desde el barril.

/** dialog: diálogo común. alertdialog: pide confirmar algo que no se deshace. */
export type OverlayRole = 'dialog' | 'alertdialog'

export interface OverlayDialogProps extends Omit<HTMLAttributes<HTMLDivElement>, 'role'> {
  open: boolean
  onClose: () => void
  closeOnScrim: boolean
  initialFocusRef?: RefObject<HTMLElement | null>
  /** center: modal centrado. end: panel pegado a la derecha (drawer). */
  placement: 'center' | 'end'
  /** Rol del panel. Por defecto, dialog. */
  role?: OverlayRole
  /** id del título visible (aria-labelledby). */
  labelledBy: string
  /** ids de la descripción (aria-describedby). */
  describedBy?: string
  children: ReactNode
}

// Evita que el clic en el fondo saque el foco del diálogo antes de cerrarlo.
const conservarFoco = (event: MouseEvent) => event.preventDefault()

export function OverlayDialog({
  open,
  onClose,
  closeOnScrim,
  initialFocusRef,
  placement,
  role = 'dialog',
  labelledBy,
  describedBy,
  className,
  children,
  ...rest
}: OverlayDialogProps) {
  const panelRef = useFocusTrap<HTMLDivElement>({ active: open, onClose, initialFocus: initialFocusRef })
  useScrollLock(open)

  useEffect(() => {
    const panel = panelRef.current
    if (!open || !panel) return
    return registrarOverlay(panel)
  }, [open, panelRef])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className={cx('st-overlay', `st-overlay--${placement}`)}>
      <div
        className="st-overlay__scrim"
        aria-hidden="true"
        onMouseDown={conservarFoco}
        onClick={closeOnScrim ? onClose : undefined}
      />
      <div
        {...rest}
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        className={cx('st-overlay__panel', className)}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}

export interface OverlayCloseProps {
  /** Nombre accesible del botón. */
  label: string
  onClick: () => void
  className?: string
}

/**
 * Botón «X» de 32 px de la cabecera (Strata.dc.html:1257-1259). Es el IconButton
 * md de los controles, el mismo botón de cerrar del prototipo; aquí solo se
 * empuja a la derecha de la cabecera.
 */
export function OverlayClose({ label, onClick, className }: OverlayCloseProps) {
  return (
    <IconButton aria-label={label} size="md" className={cx('st-overlay__close', className)} onClick={onClick}>
      <IconoCerrar />
    </IconButton>
  )
}
