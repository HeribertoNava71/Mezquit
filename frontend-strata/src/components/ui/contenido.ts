// Barril de contenido (tarjetas, tablas, badges y encabezados). Fase 1.
// Importa desde '@/components/ui'. Solo exportaciones con nombre; los nombres
// no se repiten en los otros barriles.
// «Badge (StatusBadge)» y «Tag (Pill)», como los nombra la auditoría: cada par
// es el mismo componente con los dos nombres.
export { Avatar } from './Avatar'
export type { AvatarProps, AvatarSize, AvatarTone } from './Avatar'
export { Badge, Badge as StatusBadge } from './Badge'
export type { BadgeProps, BadgeProps as StatusBadgeProps, BadgeSize, BadgeTone } from './Badge'
export { Card } from './Card'
export type { CardBorderTone, CardElement, CardHover, CardPadding, CardProps, CardVariant } from './Card'
export { CodeDisplay } from './CodeDisplay'
export type { CodeDisplayProps } from './CodeDisplay'
export { CopyField } from './CopyField'
export type { CopyFieldProps, CopyFieldTone, CopyFieldVariant } from './CopyField'
export { copyToClipboard } from './copyToClipboard'
export { DataTable } from './DataTable'
export type {
  DataTableAlign,
  DataTableColumn,
  DataTableDensity,
  DataTableProps,
  DataTableSort,
  DataTableSortDirection,
  DataTableVariant,
} from './DataTable'
export type { DataTableSortValue } from './dataTableSort'
export { DotSeparator } from './DotSeparator'
export type { DotSeparatorProps, DotSeparatorTone } from './DotSeparator'
export { getInitials } from './initials'
export { InvitationStatusBadge } from './InvitationStatusBadge'
export type { InvitationStatusBadgeProps } from './InvitationStatusBadge'
export { getInvitationStatusMeta, INVITATION_STATUSES, isInvitationStatus } from './invitationStatus'
export type { InvitationStatus, InvitationStatusMeta } from './invitationStatus'
export { LiveDot } from './LiveDot'
export type { LiveDotProps, LiveDotPulse, LiveDotSize, LiveDotTempo, LiveDotTone } from './LiveDot'
export { PageHeader } from './PageHeader'
export type { PageHeaderLevel, PageHeaderProps } from './PageHeader'
export { ProgressBar } from './ProgressBar'
export type { ProgressBarProps, ProgressBarSize, ProgressBarTone, ProgressBarTrack } from './ProgressBar'
export { StatCard } from './StatCard'
export type { StatCardProgress, StatCardProps, StatCardTone } from './StatCard'
export { StepPills } from './StepPills'
export type { StepPillsProps, StepPillsState, StepPillsStep } from './StepPills'
export { Tag, Tag as Pill } from './Tag'
export type { TagProps, TagProps as PillProps, TagSize, TagTone } from './Tag'
