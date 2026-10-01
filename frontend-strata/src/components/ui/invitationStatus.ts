import type { BadgeTone } from './Badge'

/** Estados de una invitación según el backend (campo status de la invitación). */
export type InvitationStatus = 'pendiente' | 'iniciada' | 'completada' | 'expirada'

/** Los cuatro estados en orden de avance, para filtros y leyendas (mapa.md RH-7). */
export const INVITATION_STATUSES: readonly InvitationStatus[] = ['pendiente', 'iniciada', 'completada', 'expirada']

export interface InvitationStatusMeta {
  /** Texto visible del estado. */
  label: string
  /** Tono del badge. */
  tone: BadgeTone
}

/*
 * Tonos de la paleta del prototipo, por equivalencia con los estados de candidato
 * (Strata.dc.html:1866-1870):
 * - pendiente  → neutral, como «Código enviado».
 * - iniciada   → sky, como «En proceso».
 * - completada → navy, como «Completado».
 * - expirada   → coral: no existe en el prototipo; se toma el tinte coral de su
 *   insignia (Strata.dc.html:266-268). Estado terminal, distinto de los demás.
 */
const META: Record<InvitationStatus, InvitationStatusMeta> = {
  pendiente: { label: 'Pendiente', tone: 'neutral' },
  iniciada: { label: 'Iniciada', tone: 'sky' },
  completada: { label: 'Completada', tone: 'navy' },
  expirada: { label: 'Expirada', tone: 'coral' },
}

/** true si el texto es uno de los cuatro estados conocidos. */
export function isInvitationStatus(value: string): value is InvitationStatus {
  return Object.hasOwn(META, value)
}

/**
 * Texto y tono de un estado. Si el backend envía un estado desconocido, se muestra
 * tal cual (con mayúscula inicial) y en tono neutro, para no perder el dato.
 */
export function getInvitationStatusMeta(status: string): InvitationStatusMeta {
  if (isInvitationStatus(status)) return META[status]
  const text = status.trim()
  return {
    label: text ? text.charAt(0).toLocaleUpperCase('es-MX') + text.slice(1) : 'Sin estado',
    tone: 'neutral',
  }
}
