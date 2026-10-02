import { useEffect, useId, useRef, useState } from 'react'
import { Callout, VisuallyHidden, copyToClipboard, cx } from '@/components/ui'
import { IconoCopiar, IconoPalomita } from '@/components/ui/Iconos'
import { enlaceCorreo, enlaceWhatsApp, type InvitacionCompartible } from './mensaje'
import './CanalesEnvio.css'

export interface CanalesEnvioProps {
  /** Invitación con el enlace real (de POST /api/assessments o de GET /api/assessments/{id}). */
  invitacion: InvitacionCompartible
  /** Fecha límite AAAA-MM-DD para el mensaje. null o undefined: el mensaje no la menciona. */
  fechaLimite?: string | null
  /** Se copió el enlace: para el toast «Enlace copiado» (D-22). */
  onCopiado: () => void
  className?: string
}

/** Milisegundos que la palomita reemplaza al ícono de copiar. */
const CONFIRMACION_MS = 2000

/**
 * Tiles «Enviar por» del modal de invitación (Strata.dc.html:1355-1365) con el
 * enlace real (D-10, P-09): Correo abre un borrador mailto:, WhatsApp abre
 * wa.me con el mensaje y Copiar usa el portapapeles. No reemplazan al correo
 * automático: ese ya lo envió el backend. Los usan el modal «Enlace de
 * invitación» del detalle y la pantalla de enlaces del asistente.
 * Si el portapapeles falla, el aviso va aquí mismo, con ícono y texto (D-22):
 * el enlace está a la vista, arriba, para copiarlo a mano.
 */
export function CanalesEnvio({ invitacion, fechaLimite, onCopiado, className }: CanalesEnvioProps) {
  const tituloId = useId()
  const [copiado, setCopiado] = useState(false)
  // Fallas de copia: la clave del aviso cambia y se vuelve a anunciar en cada intento.
  const [fallas, setFallas] = useState(0)
  const temporizador = useRef<number | undefined>(undefined)
  const nombre = invitacion.candidate.trim() || invitacion.email.trim()

  useEffect(() => {
    const actual = temporizador
    return () => window.clearTimeout(actual.current)
  }, [])

  async function copiar() {
    if (!(await copyToClipboard(invitacion.link))) {
      setFallas((n) => n + 1)
      return
    }
    setFallas(0)
    onCopiado()
    setCopiado(true)
    window.clearTimeout(temporizador.current)
    temporizador.current = window.setTimeout(() => setCopiado(false), CONFIRMACION_MS)
  }

  return (
    <div className={cx('st-canales', className)}>
      <p id={tituloId} className="st-canales__titulo">
        Enviar por
      </p>
      {/* role="list": Safari quita la semántica de lista con list-style: none. */}
      <ul role="list" className="st-canales__lista" aria-labelledby={tituloId}>
        <li className="st-canales__item">
          <a className="st-canal" href={enlaceCorreo(invitacion, fechaLimite)}>
            <span className="st-canal__sigla" aria-hidden="true">
              @
            </span>
            {/* Los espacios van fuera de VisuallyHidden: algunos cálculos del nombre recortan los de adentro. */}
            <span className="st-canal__texto">
              <VisuallyHidden>Enviar por</VisuallyHidden> Correo <VisuallyHidden>a {nombre}</VisuallyHidden>
            </span>
          </a>
        </li>
        <li className="st-canales__item">
          <a className="st-canal" href={enlaceWhatsApp(invitacion, fechaLimite)} target="_blank" rel="noopener noreferrer">
            <span className="st-canal__sigla" aria-hidden="true">
              WA
            </span>
            <span className="st-canal__texto">
              <VisuallyHidden>Enviar por</VisuallyHidden> WhatsApp{' '}
              <VisuallyHidden>a {nombre} (se abre en otra pestaña)</VisuallyHidden>
            </span>
          </a>
        </li>
        <li className="st-canales__item">
          <button type="button" className="st-canal" onClick={copiar}>
            <span className="st-canal__sigla" aria-hidden="true">
              {copiado ? (
                <IconoPalomita width={12} height={12} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <IconoCopiar width={13} height={13} />
              )}
            </span>
            <span className="st-canal__texto">
              Copiar enlace <VisuallyHidden>de {nombre}</VisuallyHidden>
            </span>
          </button>
        </li>
      </ul>
      {fallas > 0 && (
        <Callout key={fallas} tone="error" live="alert" size="sm" className="st-canales__error">
          No pudimos copiar el enlace. Selecciónalo en el recuadro de arriba y cópialo con Ctrl+C (Cmd+C en Mac).
        </Callout>
      )}
    </div>
  )
}
