import { useRef } from 'react'
import type { AssessmentSummary } from '@/api/rh'
import {
  Button,
  Callout,
  DataTable,
  EstadoCarga,
  EstadoError,
  EstadoVacio,
  Fecha,
  PageHeader,
  ProgressBar,
  VisuallyHidden,
  useFocoAlRecuperar,
  useToast,
  type DataTableColumn,
} from '@/components/ui'
import { IconoAgregar, IconoReintentar } from '@/components/ui/Iconos'
import { ConteosEstado } from './evaluaciones/ConteosEstado'
import { conteosDeResumen } from './evaluaciones/conteos'
import { textoErrorActualizar, textoErrorLista } from './evaluaciones/mensajes'
import { ResumenEstados } from './evaluaciones/ResumenEstados'
import { useEvaluaciones } from './evaluaciones/useEvaluaciones'
import './EvaluacionesPage.css'

const RUTA_NUEVA = '/app/evaluaciones/nueva'

function noNegativo(valor: number): number {
  return Number.isFinite(valor) && valor > 0 ? valor : 0
}

/** «1 de 3 completadas» (el mismo texto de la lista anterior). */
function textoAvance(completadas: number, total: number): string {
  return `${completadas} de ${total} ${total === 1 ? 'completada' : 'completadas'}`
}

function textoEvaluaciones(n: number): string {
  return `${n} ${n === 1 ? 'evaluación' : 'evaluaciones'}`
}

function textoInvitados(n: number): string {
  return `${n} ${n === 1 ? 'candidato invitado' : 'candidatos invitados'}`
}

function Avance({ evaluacion }: { evaluacion: AssessmentSummary }) {
  const total = noNegativo(evaluacion.counts.total)
  const completadas = Math.min(noNegativo(evaluacion.counts.completada), total)
  if (total === 0) return <span className="st-evaluaciones__tenue">Sin candidatos</span>
  // La barra es decorativa: el avance ya va en texto (design-tokens.md, regla 12).
  return (
    <div className="st-evaluaciones__avance">
      <span className="st-evaluaciones__avance-texto">{textoAvance(completadas, total)}</span>
      <ProgressBar value={completadas} max={total} decorative size={6} tone="sky-strong" track="divider" />
    </div>
  )
}

const COLUMNAS: ReadonlyArray<DataTableColumn<AssessmentSummary>> = [
  {
    key: 'evaluacion',
    header: 'Evaluación',
    rowHeader: true,
    render: (evaluacion) => (
      <div className="st-evaluaciones__evaluacion">
        <span className="st-evaluaciones__nombre">{evaluacion.name}</span>
        <span className="st-evaluaciones__puesto">{evaluacion.position || 'Sin puesto'}</span>
      </div>
    ),
  },
  {
    key: 'avance',
    header: 'Avance',
    render: (evaluacion) => <Avance evaluacion={evaluacion} />,
  },
  {
    key: 'estados',
    header: 'Por estado',
    render: (evaluacion) => <ConteosEstado conteo={conteosDeResumen(evaluacion.counts)} />,
  },
  {
    key: 'deadline',
    header: 'Fecha límite',
    render: (evaluacion) => (
      <Fecha className="st-evaluaciones__fecha" valor={evaluacion.deadline} vacio="Sin fecha límite" />
    ),
  },
  {
    key: 'created_at',
    header: 'Creada',
    render: (evaluacion) => <Fecha className="st-evaluaciones__fecha" valor={evaluacion.created_at} />,
  },
  {
    key: 'accion',
    header: 'Acción',
    align: 'end',
    cardLabel: false,
    render: (evaluacion) => (
      <Button variant="secondary" size="sm" to={`/app/evaluaciones/${evaluacion.id}`}>
        Ver detalle{' '}<VisuallyHidden>de {evaluacion.name}</VisuallyHidden>
      </Button>
    ),
  },
]

/**
 * /app/evaluaciones · «Candidatos» (mapa.md RH-6; brechas.md R-16, P-11, P-12, P-14).
 * Lenguaje del panel de candidatos del prototipo (Strata.dc.html:772-870):
 * PageHeader con el CTA «Invitar candidatos» (D-10), las tarjetas de candidatos
 * por estado (en lugar del saldo por prueba, P-12) y una DataTable de
 * evaluaciones con su avance, sus candidatos por estado y sus fechas. Los
 * candidatos se ven por evaluación, en su detalle: no hay lista plana (PB-05).
 * Sin «tiempo real»: «Actualizar» vuelve a pedir la lista (P-14).
 * Estados: carga, vacío con CTA y error con «Reintentar», distinto del vacío.
 */
export default function EvaluacionesPage() {
  const { carga, reintentando, actualizando, errorActualizar, reintentar, actualizar } = useEvaluaciones()
  const { toast } = useToast()
  // Tras un «Reintentar» que trae la lista, el foco pasa a la tabla (el botón ya no existe).
  const tablaRef = useRef<HTMLDivElement>(null)
  useFocoAlRecuperar(carga.fase === 'error', carga.fase === 'lista', tablaRef)

  async function alActualizar() {
    if (await actualizar()) toast({ message: 'Lista actualizada', tone: 'success' })
  }

  const evaluaciones = carga.fase === 'lista' ? carga.evaluaciones : null
  const hayEvaluaciones = evaluaciones !== null && evaluaciones.length > 0
  const invitados = evaluaciones?.reduce((suma, evaluacion) => suma + noNegativo(evaluacion.counts.total), 0) ?? 0

  const botonInvitar = (
    <Button to={RUTA_NUEVA} iconLeft={<IconoAgregar />}>
      Invitar candidatos
    </Button>
  )

  return (
    <div className="st-evaluaciones">
      <PageHeader
        eyebrow="Asignación y seguimiento"
        title="Candidatos"
        lede="Sigue el avance de cada evaluación. Entra a una para copiar enlaces, reenviar invitaciones o ver reportes."
        actions={botonInvitar}
      />

      {carga.fase === 'error' ? (
        <EstadoError
          kind={carga.error}
          titleAs="h2"
          {...textoErrorLista(carga.error)}
          onRetry={reintentar}
          retrying={reintentando}
        />
      ) : (
        <div className="st-evaluaciones__cuerpo">
          {/* Sin evaluaciones no hay nada que sumar: queda solo el vacío con su CTA. */}
          {(carga.fase === 'cargando' || hayEvaluaciones) && <ResumenEstados evaluaciones={evaluaciones} />}

          {errorActualizar && (
            <Callout
              tone="error"
              live="alert"
              title="No pudimos actualizar la lista"
              actions={
                <Button variant="secondary" size="sm" loading={actualizando} loadingText="Reintentando…" onClick={alActualizar}>
                  Reintentar
                </Button>
              }
            >
              {textoErrorActualizar(errorActualizar)}
            </Callout>
          )}

          <DataTable
            ref={tablaRef}
            tabIndex={-1}
            caption="Evaluaciones de tu empresa, con su avance y sus candidatos por estado"
            title="Tus evaluaciones"
            subtitle={hayEvaluaciones ? `· ${textoInvitados(invitados)}` : undefined}
            toolbar={
              evaluaciones && (
                <Button
                  variant="secondary"
                  size="sm"
                  iconLeft={<IconoReintentar />}
                  loading={actualizando}
                  loadingText="Actualizando…"
                  onClick={alActualizar}
                >
                  Actualizar
                </Button>
              )
            }
            columns={COLUMNAS}
            rows={evaluaciones ?? []}
            getRowKey={(evaluacion) => evaluacion.id}
            // Sin el mínimo de 900 px: con el avance en dos renglones, la tabla cabe sin
            // desplazamiento lateral desde unos 760 px; a 640 px o menos pasa a tarjetas.
            minWidth={0}
            empty={
              carga.fase === 'cargando' ? (
                <EstadoCarga variant="bloque" label="Cargando evaluaciones…" count={4} />
              ) : (
                <EstadoVacio
                  titleAs="h3"
                  title="Aún no tienes evaluaciones"
                  description="Crea la primera para invitar a tus candidatos: a cada uno le llega su enlace por correo."
                  actions={botonInvitar}
                />
              )
            }
            footer={hayEvaluaciones ? `Mostrando ${textoEvaluaciones(evaluaciones.length)}` : undefined}
          />
        </div>
      )}
    </div>
  )
}
