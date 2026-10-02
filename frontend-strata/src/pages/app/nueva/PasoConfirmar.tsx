import { Button, Callout, Input } from '@/components/ui'
import { SITE } from '@/config/site'
import { BloqueCreditos } from './BloqueCreditos'
import { ID_CAMPO } from './estadoAsistente'
import {
  CREDITOS_POR_CANDIDATO,
  PASO_CANDIDATOS,
  PASO_DATOS,
  PRUEBA_DISPONIBLE,
  formatoNumero,
  type CandidatoBorrador,
  type DatosEvaluacion,
  type IndicePaso,
} from './modelo'
import type { EstadoSaldo } from './useSaldo'
import './PasoConfirmar.css'

export interface PasoConfirmarProps {
  datos: DatosEvaluacion
  /** Candidatos que se enviarán (filas con datos). */
  candidatos: CandidatoBorrador[]
  fechaLimite: string
  /** Primer día válido (mañana), para el selector. */
  fechaMinima: string
  errorFecha?: string
  saldo: EstadoSaldo
  onCambiarFecha: (valor: string) => void
  onEditar: (paso: IndicePaso) => void
  onCargarSaldo: () => void
}

const NOTA_FECHA_ID = 'nueva-evaluacion-fecha-nota'

/**
 * Paso 4 · Confirmar: fecha límite opcional, resumen con «Editar» por bloque,
 * créditos necesarios frente al saldo y aviso del correo automático (P-08).
 */
export function PasoConfirmar({
  datos,
  candidatos,
  fechaLimite,
  fechaMinima,
  errorFecha,
  saldo,
  onCambiarFecha,
  onEditar,
  onCargarSaldo,
}: PasoConfirmarProps) {
  const total = candidatos.length
  const puesto = datos.position.trim()

  return (
    <>
      <div className="st-nueva-confirmar__fecha">
        <Input
          id={ID_CAMPO.fecha}
          type="date"
          label="Fecha límite"
          hint="Opcional"
          min={fechaMinima || undefined}
          value={fechaLimite}
          error={errorFecha}
          aria-describedby={NOTA_FECHA_ID}
          onChange={(evento) => onCambiarFecha(evento.target.value)}
        />
        <p id={NOTA_FECHA_ID} className="st-nueva-confirmar__nota">
          Los enlaces dejan de funcionar al comenzar ese día. Sin fecha límite, no vencen.
        </p>
      </div>

      <section className="st-nueva-resumen">
        <h3 className="st-nueva-confirmar__subtitulo">Resumen</h3>
        <div className="st-nueva-resumen__caja">
          <div className="st-nueva-resumen__grupo">
            <dl className="st-nueva-resumen__datos">
              <div className="st-nueva-resumen__dato">
                <dt>Evaluación</dt>
                <dd>{datos.name.trim()}</dd>
              </div>
              <div className="st-nueva-resumen__dato">
                <dt>Puesto</dt>
                <dd className={puesto ? undefined : 'st-nueva-resumen__vacio'}>{puesto || 'Sin puesto'}</dd>
              </div>
            </dl>
            <Button variant="ghost" size="sm" aria-label="Editar datos de la evaluación" onClick={() => onEditar(PASO_DATOS)}>
              Editar
            </Button>
          </div>
          <div className="st-nueva-resumen__grupo">
            <dl className="st-nueva-resumen__datos">
              <div className="st-nueva-resumen__dato">
                <dt>Prueba</dt>
                <dd>
                  {PRUEBA_DISPONIBLE.nombre} <span className="st-nueva-resumen__detalle">· {PRUEBA_DISPONIBLE.detalle}</span>
                </dd>
              </div>
            </dl>
          </div>
          <div className="st-nueva-resumen__grupo">
            <dl className="st-nueva-resumen__datos">
              <div className="st-nueva-resumen__dato">
                <dt>
                  Candidatos <span className="st-nueva-resumen__detalle">({formatoNumero(total)})</span>
                </dt>
                <dd>
                  <ul className="st-nueva-resumen__candidatos">
                    {candidatos.map((candidato) => (
                      <li key={candidato.id} className="st-nueva-resumen__candidato">
                        <span className="st-nueva-resumen__nombre">{candidato.name.trim()}</span>
                        <span className="st-nueva-resumen__contacto">
                          {candidato.email.trim()}
                          {candidato.phone.trim() && ` · ${candidato.phone.trim()}`}
                        </span>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            </dl>
            <Button variant="ghost" size="sm" aria-label="Editar candidatos" onClick={() => onEditar(PASO_CANDIDATOS)}>
              Editar
            </Button>
          </div>
        </div>
      </section>

      <BloqueCreditos necesarios={total * CREDITOS_POR_CANDIDATO} saldo={saldo} onCargar={onCargarSaldo} />

      <Callout tone="info">
        Al crear la evaluación, {SITE.name} envía a cada candidato un correo con su enlace. Después podrás copiarlo o
        compartirlo por otro medio.
      </Callout>
    </>
  )
}
