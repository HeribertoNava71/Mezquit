import { Badge, type BadgeProps } from './Badge'
import { getInvitationStatusMeta } from './invitationStatus'

export interface InvitationStatusBadgeProps extends Omit<BadgeProps, 'tone' | 'children'> {
  /** Estado tal como llega del backend: pendiente, iniciada, completada o expirada. */
  status: string
}

/**
 * Badge de los cuatro estados de invitación del backend (R-22, S-17):
 * Pendiente, Iniciada, Completada y Expirada. Un estado desconocido se muestra
 * con su propio texto y tono neutro.
 */
export function InvitationStatusBadge({ status, ...rest }: InvitationStatusBadgeProps) {
  const { label, tone } = getInvitationStatusMeta(status)
  return (
    <Badge tone={tone} data-status={status} {...rest}>
      {label}
    </Badge>
  )
}
