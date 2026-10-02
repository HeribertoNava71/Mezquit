import { useId } from 'react'
import type { InvitationRow } from '@/api/rh'
import { Button, VisuallyHidden, cx } from '@/components/ui'
import { IconoError } from '@/components/ui/Iconos'
import './AccionesInvitacion.css'

/** Aviso inline de una fila. `intento` cambia en cada falla para que el lector lo repita. */
export interface AvisoFila {
  mensaje: string
  intento: number
}

export interface AccionesInvitacionProps {
  invitacion: InvitationRow
  /** POST /api/invitations/{id}/resend en curso para esta invitación. */
  reenviando: boolean
  /** Error del último reenvío o de la última copia (D-22: inline, con ícono y texto). */
  aviso: AvisoFila | null
  onCopiar: (invitacion: InvitationRow) => void
  onCompartir: (invitacion: InvitationRow) => void
  onReenviar: (invitacion: InvitationRow) => void
}

/**
 * Acciones de un candidato en el detalle de la evaluación (brechas.md R-21, S-09):
 * - «Ver reporte», solo si completó (→ /app/candidatos/:invitationId/reporte), en el
 *   tono destacado del prototipo para el resultado listo (Strata.dc.html:1880-1882).
 * - «Copiar enlace» (toast) y «Compartir» (modal «Enlace de invitación»), por separado.
 * - «Reenviar»: reenvía el correo de verdad; deshabilitado si ya completó.
 * Cada botón dice a quién se refiere para los lectores de pantalla. «Ver reporte»
 * va primero: así las otras tres quedan en el mismo lugar en todas las filas.
 */
export function AccionesInvitacion({
  invitacion,
  reenviando,
  aviso,
  onCopiar,
  onCompartir,
  onReenviar,
}: AccionesInvitacionProps) {
  const motivoId = useId()
  const avisoId = useId()
  const completada = invitacion.status === 'completada'
  const nombre = invitacion.candidate

  return (
    <div className="st-acciones-inv">
      <div className="st-acciones-inv__botones">
        {completada && (
          <Button variant="highlight" size="sm" to={`/app/candidatos/${invitacion.id}/reporte`}>
            Ver reporte{' '}<VisuallyHidden>de {nombre}</VisuallyHidden>
          </Button>
        )}
        <Button variant="secondary" size="sm" onClick={() => onCopiar(invitacion)}>
          Copiar enlace{' '}<VisuallyHidden>de {nombre}</VisuallyHidden>
        </Button>
        <Button variant="secondary" size="sm" aria-haspopup="dialog" onClick={() => onCompartir(invitacion)}>
          Compartir{' '}<VisuallyHidden>la invitación de {nombre}</VisuallyHidden>
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={completada}
          loading={reenviando}
          loadingText={
            <>
              Reenviando…{' '}<VisuallyHidden>la invitación a {nombre}</VisuallyHidden>
            </>
          }
          aria-describedby={cx(completada && motivoId, aviso && avisoId) || undefined}
          onClick={() => onReenviar(invitacion)}
        >
          Reenviar{' '}<VisuallyHidden>la invitación a {nombre}</VisuallyHidden>
        </Button>
      </div>
      {completada && (
        <VisuallyHidden id={motivoId}>Ya completó la evaluación: no hace falta reenviarle la invitación.</VisuallyHidden>
      )}
      {aviso && (
        <p key={aviso.intento} id={avisoId} className="st-acciones-inv__aviso" role="alert">
          <IconoError className="st-acciones-inv__icono" width={14} height={14} strokeWidth={1.9} />
          <span>{aviso.mensaje}</span>
        </p>
      )}
    </div>
  )
}
