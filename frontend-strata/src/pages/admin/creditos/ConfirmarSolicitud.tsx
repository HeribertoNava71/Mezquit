import { useRef } from 'react'
import type { PendingRequest } from '@/api/admin'
import { Button, Callout, Modal, type ButtonVariant } from '@/components/ui'
import { creditos, fechaDeSolicitud } from './formato'
import { puedeReintentarse, textoDeError, type AccionSolicitud, type DialogoSolicitud } from './solicitud'
import './ConfirmarSolicitud.css'

interface TextosAccion {
  titulo: (solicitud: PendingRequest) => string
  descripcion: (solicitud: PendingRequest) => string
  confirmar: string
  enviando: string
  variante: ButtonVariant
}

const TEXTOS: Record<AccionSolicitud, TextosAccion> = {
  aprobar: {
    titulo: (solicitud) => `¿Aprobar la solicitud de ${solicitud.organization}?`,
    descripcion: (solicitud) =>
      `Se suman ${creditos(solicitud.requested_amount)} al saldo de la empresa. Esta acción no se puede deshacer.`,
    confirmar: 'Aprobar solicitud',
    enviando: 'Aprobando…',
    variante: 'primary',
  },
  rechazar: {
    titulo: (solicitud) => `¿Rechazar la solicitud de ${solicitud.organization}?`,
    descripcion: () => 'La empresa no recibirá los créditos que pidió. Esta acción no se puede deshacer.',
    confirmar: 'Rechazar solicitud',
    enviando: 'Rechazando…',
    variante: 'danger',
  },
}

/** Datos de la solicitud para confirmar que es la correcta: cantidad, saldo, fecha y nota. */
function DatosSolicitud({ solicitud }: { solicitud: PendingRequest }) {
  const fecha = fechaDeSolicitud(solicitud.created_at)
  const nota = solicitud.note?.trim()
  return (
    <dl className="st-confirmar-solicitud__datos">
      <div className="st-confirmar-solicitud__dato">
        <dt>Solicita</dt>
        <dd className="st-confirmar-solicitud__cifra">{creditos(solicitud.requested_amount)}</dd>
      </div>
      <div className="st-confirmar-solicitud__dato">
        <dt>Saldo actual</dt>
        <dd className="st-confirmar-solicitud__cifra">{creditos(solicitud.organization_balance)}</dd>
      </div>
      <div className="st-confirmar-solicitud__dato">
        <dt>Fecha</dt>
        <dd>{fecha.iso ? <time dateTime={fecha.iso}>{fecha.texto}</time> : fecha.texto}</dd>
      </div>
      <div className="st-confirmar-solicitud__dato st-confirmar-solicitud__dato--nota">
        <dt>Nota</dt>
        <dd className={nota ? 'st-confirmar-solicitud__nota' : 'st-confirmar-solicitud__sin-nota'}>{nota || 'Sin nota'}</dd>
      </div>
    </dl>
  )
}

export interface ConfirmarSolicitudProps {
  /** Solicitud y acción por confirmar; null cierra el modal. */
  dialogo: DialogoSolicitud | null
  /** Aprueba o rechaza; tras una falla de red o del servidor, lo vuelve a intentar. */
  onConfirmar: () => void
  /** Cierra sin resolver. No se llama mientras la petición está en curso. */
  onCerrar: () => void
  /** Tras un 409, 404 o 403: cierra y vuelve a pedir la lista. */
  onActualizar: () => void
}

/**
 * Confirmación antes de aprobar o rechazar una solicitud, que no se deshace (S-15):
 * alertdialog con el foco inicial en «Cancelar», los datos de la solicitud y la
 * acción en el pie (primaria al aprobar, de peligro al rechazar).
 * - Mientras la petición está en curso, el botón muestra la carga y el modal no se cierra.
 * - Si falla, el error aparece aquí mismo con ícono y texto (D-22). Tras una falla
 *   de red o del servidor, el mismo botón reintenta; tras un 409 (alguien más ya
 *   la resolvió), un 404 o un 403, pasa a «Actualizar lista». El botón conserva el
 *   foco en los dos casos.
 */
export function ConfirmarSolicitud({ dialogo, onConfirmar, onCerrar, onActualizar }: ConfirmarSolicitudProps) {
  const cancelarRef = useRef<HTMLButtonElement>(null)
  const textos = TEXTOS[dialogo?.accion ?? 'aprobar']
  const enviando = dialogo?.enviando ?? false
  const error = dialogo?.error ?? null
  const yaNoPendiente = error !== null && !puedeReintentarse(error)
  const aviso = dialogo && error ? textoDeError(error, dialogo.accion) : null

  function cerrar() {
    if (!enviando) onCerrar()
  }

  return (
    <Modal
      open={dialogo !== null}
      onClose={cerrar}
      role="alertdialog"
      title={dialogo ? textos.titulo(dialogo.solicitud) : ''}
      description={dialogo ? textos.descripcion(dialogo.solicitud) : undefined}
      initialFocusRef={cancelarRef}
      closeOnScrim={!enviando}
      className="st-confirmar-solicitud"
      footer={
        <>
          <Button ref={cancelarRef} variant="neutral" disabled={enviando} onClick={cerrar}>
            {yaNoPendiente ? 'Cerrar' : 'Cancelar'}
          </Button>
          <Button
            variant={yaNoPendiente ? 'primary' : textos.variante}
            loading={enviando}
            loadingText={textos.enviando}
            onClick={yaNoPendiente ? onActualizar : onConfirmar}
          >
            {yaNoPendiente ? 'Actualizar lista' : textos.confirmar}
          </Button>
        </>
      }
    >
      {dialogo && <DatosSolicitud solicitud={dialogo.solicitud} />}
      {aviso && (
        <Callout tone="error" live="alert" title={aviso.titulo}>
          {aviso.texto}
        </Callout>
      )}
    </Modal>
  )
}

export default ConfirmarSolicitud
