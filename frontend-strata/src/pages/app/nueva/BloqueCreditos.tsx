import { Button, Callout, EstadoCarga, EstadoError, EstadoVacio, VisuallyHidden } from '@/components/ui'
import { RUTA_SOLICITAR_CREDITOS } from '../creditos/solicitud'
import { contarCreditos, formatoNumero } from './modelo'
import type { EstadoSaldo } from './useSaldo'
import './BloqueCreditos.css'

export interface BloqueCreditosProps {
  /** Créditos que usará la evaluación: 1 por candidato. */
  necesarios: number
  saldo: EstadoSaldo
  /** Vuelve a pedir el saldo (Reintentar o «Actualizar saldo»). */
  onCargar: () => void
}

/**
 * «Solicitar créditos» abre Créditos con el drawer de solicitud ya abierto
 * (?solicitar=1), en otra pestaña: así no se pierde lo que llevas en el
 * asistente mientras pides créditos (D-09, R-20).
 */
export function EnlaceSolicitarCreditos({ variant = 'ghost' }: { variant?: 'ghost' | 'secondary' }) {
  return (
    <Button variant={variant} size="sm" to={RUTA_SOLICITAR_CREDITOS} target="_blank" rel="noopener noreferrer">
      Solicitar créditos <VisuallyHidden>(se abre en otra pestaña)</VisuallyHidden>
    </Button>
  )
}

/**
 * Créditos necesarios frente al saldo (GET /api/credits; S-11): carga, error con
 * «Reintentar» (no impide enviar: el backend vuelve a revisar el saldo), sin
 * créditos (vacío), saldo insuficiente con enlace a Créditos, o lo que quedará.
 */
export function BloqueCreditos({ necesarios, saldo, onCargar }: BloqueCreditosProps) {
  const cargando = saldo.estado === 'cargando' || saldo.estado === 'inactivo'
  const actualizar = (
    <Button variant="ghost" size="sm" onClick={onCargar}>
      Actualizar saldo
    </Button>
  )

  let detalle = null
  if (saldo.estado === 'error') {
    detalle = (
      <EstadoError
        size="sm"
        kind={saldo.kind}
        title="No pudimos consultar tu saldo"
        message="Puedes crear la evaluación de todos modos: si no te alcanzan los créditos, te lo diremos al enviar."
        onRetry={onCargar}
      />
    )
  } else if (saldo.estado === 'listo' && saldo.valor <= 0) {
    detalle = (
      <EstadoVacio
        size="sm"
        title="Aún no tienes créditos"
        description="Solicita créditos para enviar las invitaciones: cada candidato usa 1."
        actions={
          <>
            <EnlaceSolicitarCreditos variant="secondary" />
            {actualizar}
          </>
        }
      />
    )
  } else if (saldo.estado === 'listo' && saldo.valor < necesarios) {
    detalle = (
      <Callout
        tone="warning"
        title="No te alcanzan los créditos"
        actions={
          <>
            <EnlaceSolicitarCreditos />
            {actualizar}
          </>
        }
      >
        Necesitas {contarCreditos(necesarios)} y tienes {formatoNumero(saldo.valor)}. Solicita más o quita candidatos.
      </Callout>
    )
  } else if (saldo.estado === 'listo') {
    detalle = <p className="st-nueva-creditos__resto">Después de enviar te quedarán {contarCreditos(saldo.valor - necesarios)}.</p>
  }

  return (
    // Sección sin nombre accesible: el h3 la ubica al navegar por encabezados y no suma un landmark.
    <section className="st-nueva-creditos">
      <h3 className="st-nueva-creditos__titulo">Créditos</h3>
      <dl className="st-nueva-creditos__cifras">
        <div className="st-nueva-creditos__cifra">
          <dt className="st-nueva-creditos__rotulo">Necesitas</dt>
          <dd className="st-nueva-creditos__dato">
            <span className="st-nueva-creditos__valor">{formatoNumero(necesarios)}</span>
            <span className="st-nueva-creditos__unidad">1 por candidato</span>
          </dd>
        </div>
        <div className="st-nueva-creditos__cifra">
          <dt className="st-nueva-creditos__rotulo">Tu saldo</dt>
          <dd className="st-nueva-creditos__dato">
            {saldo.estado === 'listo' ? (
              <>
                <span className="st-nueva-creditos__valor">{formatoNumero(saldo.valor)}</span>
                <span className="st-nueva-creditos__unidad">{saldo.valor === 1 ? 'crédito' : 'créditos'}</span>
              </>
            ) : cargando ? (
              <EstadoCarga label="Consultando tu saldo…" />
            ) : (
              <span className="st-nueva-creditos__unidad">Sin dato</span>
            )}
          </dd>
        </div>
      </dl>
      {detalle}
    </section>
  )
}
