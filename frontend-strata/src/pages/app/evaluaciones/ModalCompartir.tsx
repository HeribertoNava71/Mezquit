import type { InvitationRow } from '@/api/rh'
import { Button, CodeDisplay, CopyField, Fecha, Modal, formatearFecha, useToast } from '@/components/ui'
import { CanalesEnvio } from '../invitaciones/CanalesEnvio'
import { TOAST_ENLACE_COPIADO } from './mensajes'
import './ModalCompartir.css'

export interface ModalCompartirProps {
  /** Invitación que se comparte (GET /api/assessments/{id} → invitations[]). Con null, el modal está cerrado. */
  invitacion: InvitationRow | null
  /**
   * Fecha límite de la evaluación (AAAA-MM-DD). null: no tiene fecha límite.
   * undefined: no se pudo saber (falló GET /api/assessments) y el pie no la menciona.
   */
  fechaLimite?: string | null
  /** Cierra el modal (Escape, clic en el fondo o «Cerrar»). */
  onClose: () => void
}

/**
 * Modal «Enlace de invitación» (Strata.dc.html:1323-1374; mapa.md RH-8;
 * D-10, opción a). Tarjeta oscura con el enlace real en un CopyField y los
 * canales «Enviar por» (Correo, WhatsApp y Copiar enlace), los mismos de la
 * pantalla de enlaces del asistente. El pie recuerda que la invitación ya se
 * envió por correo y muestra la fecha límite real.
 * Sin el código grande (el token mide 40 caracteres; PB-11), sin «Test
 * vinculado» (el detalle no trae pruebas; PB-06) y sin «Registrar en
 * candidatos»: la invitación ya existe.
 */
export function ModalCompartir({ invitacion, fechaLimite, onClose }: ModalCompartirProps) {
  if (!invitacion) return null
  // key: al abrir otra invitación, el aviso de copia empieza de cero.
  return <ModalAbierto key={invitacion.id} invitacion={invitacion} fechaLimite={fechaLimite} onClose={onClose} />
}

interface ModalAbiertoProps extends Omit<ModalCompartirProps, 'invitacion'> {
  invitacion: InvitationRow
}

function ModalAbierto({ invitacion, fechaLimite, onClose }: ModalAbiertoProps) {
  const { toast } = useToast()
  const conFecha = formatearFecha(fechaLimite) !== null

  function confirmarCopia() {
    toast({ message: TOAST_ENLACE_COPIADO, tone: 'success' })
  }

  const nota =
    fechaLimite === undefined ? (
      'La invitación ya se envió por correo.'
    ) : (
      <>
        La invitación ya se envió por correo.{' '}
        {conFecha ? (
          <>
            Fecha límite: <Fecha valor={fechaLimite} />.
          </>
        ) : (
          'Sin fecha límite.'
        )}
      </>
    )

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title="Enlace de invitación"
      description={
        <>
          Es el enlace personal de <strong className="st-compartir__candidato">{invitacion.candidate}</strong> (
          {invitacion.email}). Compártelo por el canal que prefieras.
        </>
      }
      footerNote={nota}
      footer={
        <Button variant="neutral" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      <CodeDisplay label="Enlace personal">
        <CopyField value={invitacion.link} label="enlace de invitación" onCopied={confirmarCopia} />
      </CodeDisplay>
      <CanalesEnvio invitacion={invitacion} fechaLimite={fechaLimite} onCopiado={confirmarCopia} />
    </Modal>
  )
}
