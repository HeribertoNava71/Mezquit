import { Button, LiveDot, cx } from '@/components/ui'
import { IconoError, IconoExito } from '@/components/ui/Iconos'
import type { EstadoGuardado } from './useCandidateFlow'
import './IndicadorGuardado.css'

export interface IndicadorGuardadoProps {
  /** Estado real del guardado automático (useCandidateFlow). */
  estado: EstadoGuardado
  /** Vuelve a enviar las respuestas que no se guardaron. */
  onReintentar: () => void
}

/**
 * Indicador de guardado de la barra del examen (Strata.dc.html:1154-1157).
 * El prototipo solo dice «Guardado automático»; aquí refleja el estado real
 * de POST answers: Guardando…, Guardado o «No se pudo guardar» con
 * «Reintentar».
 *
 * Regiones vivas (WCAG 4.1.3, mensajes de estado):
 * - El estado va en una región role="status" montada desde el inicio, para
 *   que sus cambios se anuncien. «Guardando…» es solo visual (aria-hidden):
 *   mientras se guarda la región queda vacía y, al confirmarse, anuncia
 *   «Guardado» con cortesía, una vez por guardado y sin interrumpir la
 *   lectura de la pregunta.
 * - El error se monta aparte con role="alert" y su propia key: se anuncia
 *   cada vez que aparece. Mientras hay error, la región de estado se oculta.
 */
export function IndicadorGuardado({ estado, onReintentar }: IndicadorGuardadoProps) {
  const error = estado === 'error'

  return (
    <div className={cx('st-guardado', error && 'st-guardado--error')}>
      <p className="st-guardado__texto" role="status" hidden={error}>
        {estado === 'guardado' ? (
          <IconoExito className="st-guardado__icono" width={14} height={14} />
        ) : (
          <LiveDot tone="sky-strong" size={6} pulse="blink" />
        )}
        {estado === 'guardando' ? (
          <span aria-hidden="true">Guardando…</span>
        ) : estado === 'guardado' ? (
          'Guardado'
        ) : (
          'Guardado automático'
        )}
      </p>
      {error && (
        <>
          <p key="error" className="st-guardado__texto" role="alert">
            <IconoError className="st-guardado__icono" width={14} height={14} />
            No se pudo guardar
          </p>
          <Button variant="ghost" className="st-guardado__reintentar" onClick={onReintentar}>
            Reintentar
          </Button>
        </>
      )}
    </div>
  )
}

export default IndicadorGuardado
