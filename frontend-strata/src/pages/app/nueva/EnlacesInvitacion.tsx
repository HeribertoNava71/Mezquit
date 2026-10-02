import type { InvitationLink } from '@/api/assessments'
import { CodeDisplay, CopyField } from '@/components/ui'
import { CanalesEnvio } from '../invitaciones/CanalesEnvio'
import './EnlacesInvitacion.css'

export interface EnlacesInvitacionProps {
  /** invitations de POST /api/assessments: id, candidate, email, status y link. */
  invitaciones: InvitationLink[]
  /** Fecha límite AAAA-MM-DD, o null. */
  fechaLimite: string | null
  /** Se copió un enlace (toast «Enlace copiado»). Si la copia falla, el aviso va junto a los tiles. */
  onCopiado: () => void
}

/**
 * Enlace de cada candidato (RH-8, R-19): la tarjeta oscura del modal «Enlace de
 * invitación generado» (Strata.dc.html:1333-1340; CodeDisplay alineado a la
 * izquierda) con el nombre, el correo y el enlace real en un CopyField, y debajo
 * los tiles «Enviar por», los mismos del detalle de la evaluación. Sin código
 * corto (PB-11): el token mide 40 caracteres.
 */
export function EnlacesInvitacion({ invitaciones, fechaLimite, onCopiado }: EnlacesInvitacionProps) {
  return (
    <ul className="st-nueva-enlaces">
      {invitaciones.map((invitacion) => {
        const nombre = (invitacion.candidate ?? '').trim() || invitacion.email
        const tituloId = `nueva-enlace-${invitacion.id}`
        return (
          <li key={invitacion.id} className="st-nueva-enlaces__item">
            <article className="st-nueva-enlace" aria-labelledby={tituloId}>
              <CodeDisplay align="start" label="Enlace de invitación">
                <h3 id={tituloId} className="st-nueva-enlace__nombre">
                  {nombre}
                </h3>
                <p className="st-nueva-enlace__correo">{invitacion.email}</p>
                <CopyField
                  className="st-nueva-enlace__copiar"
                  value={invitacion.link}
                  label={`enlace de ${nombre}`}
                  onCopied={onCopiado}
                />
              </CodeDisplay>
              <CanalesEnvio invitacion={invitacion} fechaLimite={fechaLimite} onCopiado={onCopiado} />
            </article>
          </li>
        )
      })}
    </ul>
  )
}
