import { Badge, cx, getInvitationStatusMeta } from '@/components/ui'
import { estadosConInvitaciones, textoConteo, type ConteoPorEstado } from './conteos'
import './ConteosEstado.css'

export interface ConteosEstadoProps {
  /** Invitaciones por estado. */
  conteo: ConteoPorEstado
  /** Texto si no hay invitaciones. Por defecto, «Sin candidatos». */
  vacio?: string
  className?: string
}

/**
 * Candidatos por estado en badges con punto y texto («2 pendientes»,
 * «1 completada»), con los tonos de InvitationStatusBadge (RH-7). Solo los
 * estados que tienen candidatos, siempre en orden de avance.
 */
export function ConteosEstado({ conteo, vacio = 'Sin candidatos', className }: ConteosEstadoProps) {
  const estados = estadosConInvitaciones(conteo)
  if (estados.length === 0) return <span className={cx('st-conteos__vacio', className)}>{vacio}</span>
  return (
    <ul role="list" className={cx('st-conteos', className)}>
      {estados.map((estado) => (
        <li key={estado} className="st-conteos__item">
          <Badge tone={getInvitationStatusMeta(estado).tone} data-status={estado}>
            {textoConteo(estado, conteo[estado])}
          </Badge>
        </li>
      ))}
    </ul>
  )
}
