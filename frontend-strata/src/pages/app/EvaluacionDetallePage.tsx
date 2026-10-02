import { useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { resendInvitation, type InvitationRow } from '@/api/rh'
import {
  Button,
  Callout,
  Card,
  DataTable,
  DotSeparator,
  EstadoCarga,
  EstadoError,
  EstadoVacio,
  Fecha,
  INVITATION_STATUSES,
  InvitationStatusBadge,
  PageHeader,
  Persona,
  SegmentedFilter,
  VisuallyHidden,
  copyToClipboard,
  getInvitationStatusMeta,
  isInvitationStatus,
  useFocoAlRecuperar,
  useToast,
  type DataTableColumn,
  type InvitationStatus,
  type SegmentedFilterOption,
} from '@/components/ui'
import { IconoAgregar, IconoReintentar, IconoVolver } from '@/components/ui/Iconos'
import { AccionesInvitacion, type AvisoFila } from './evaluaciones/AccionesInvitacion'
import { contarInvitaciones, textoCandidatos } from './evaluaciones/conteos'
import {
  MENSAJE_ERROR_COPIA,
  TOAST_ENLACE_COPIADO,
  admiteReintento,
  mensajeErrorReenvio,
  textoErrorActualizar,
  textoErrorDetalle,
} from './evaluaciones/mensajes'
import { ModalCompartir } from './evaluaciones/ModalCompartir'
import { idDeEvaluacion, useEvaluacion, type FechasEvaluacion } from './evaluaciones/useEvaluacion'
import './EvaluacionDetallePage.css'

const RUTA_LISTA = '/app/evaluaciones'
const RUTA_NUEVA = '/app/evaluaciones/nueva'

/** Filtro de la tabla: todos o uno de los cuatro estados del backend (RH-7). */
type Filtro = 'todos' | InvitationStatus

function esFiltro(valor: string): valor is Filtro {
  return valor === 'todos' || isInvitationStatus(valor)
}

/** Aviso de una fila y la acción que lo produjo (una copia correcta solo borra el de copia). */
type AvisoConTipo = AvisoFila & { tipo: 'copia' | 'reenvio' }

/**
 * /app/evaluaciones/:id · detalle de una evaluación con sus candidatos
 * (mapa.md RH-6, RH-7 y RH-8; brechas.md R-21, R-22, R-27, P-09, P-13, P-14 y S-09).
 * La URL y los contratos no cambian. Otro id vuelve a montar la pantalla.
 */
export default function EvaluacionDetallePage() {
  const { id } = useParams()
  return <DetalleEvaluacion key={id ?? ''} idTexto={id} />
}

function VolverACandidatos() {
  return (
    <Button variant="ghost" size="sm" to={RUTA_LISTA} iconLeft={<IconoVolver />} className="st-evaluacion__volver">
      Volver a candidatos
    </Button>
  )
}

/** Puesto, creación y fecha límite. Las fechas salen de GET /api/assessments y solo se muestran si llegaron. */
function MetaEvaluacion({ puesto, fechas }: { puesto: string | null; fechas: FechasEvaluacion }) {
  return (
    <span className="st-evaluacion__meta">
      <span>{puesto || 'Sin puesto'}</span>
      {fechas.estado === 'lista' && fechas.creada && (
        <>
          <DotSeparator />
          <span>
            Creada el <Fecha valor={fechas.creada} />
          </span>
        </>
      )}
      {fechas.estado === 'lista' && (
        <>
          <DotSeparator />
          <span>
            {fechas.fechaLimite ? (
              <>
                Fecha límite: <Fecha valor={fechas.fechaLimite} />
              </>
            ) : (
              'Sin fecha límite'
            )}
          </span>
        </>
      )}
    </span>
  )
}

function textoInvitados(n: number): string {
  return `${n} ${n === 1 ? 'candidato invitado' : 'candidatos invitados'}`
}

function DetalleEvaluacion({ idTexto }: { idTexto: string | undefined }) {
  const id = idDeEvaluacion(idTexto)
  const { carga, fechas, reintentando, actualizando, errorActualizar, reintentar, actualizar } = useEvaluacion(id)
  const { toast } = useToast()
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [compartida, setCompartida] = useState<InvitationRow | null>(null)
  const [reenviando, setReenviando] = useState<ReadonlySet<number>>(() => new Set())
  const [avisos, setAvisos] = useState<Readonly<Record<number, AvisoConTipo>>>({})
  // Candado contra el doble envío (dos clics antes de pintar) y contador de avisos.
  const enCurso = useRef(new Set<number>())
  const intentos = useRef(0)
  // Tras un «Reintentar» que trae la evaluación, el foco pasa a la tabla (el botón ya no existe).
  const tablaRef = useRef<HTMLDivElement>(null)
  useFocoAlRecuperar(carga.fase === 'error', carga.fase === 'lista', tablaRef)

  function ponerAviso(invitacionId: number, tipo: AvisoConTipo['tipo'], mensaje: string) {
    intentos.current += 1
    const intento = intentos.current
    setAvisos((actuales) => ({ ...actuales, [invitacionId]: { tipo, mensaje, intento } }))
  }

  function quitarAviso(invitacionId: number, tipo?: AvisoConTipo['tipo']) {
    setAvisos((actuales) => {
      const aviso = actuales[invitacionId]
      if (!aviso || (tipo && aviso.tipo !== tipo)) return actuales
      const resto = { ...actuales }
      delete resto[invitacionId]
      return resto
    })
  }

  async function copiarEnlace(invitacion: InvitationRow) {
    if (await copyToClipboard(invitacion.link)) {
      quitarAviso(invitacion.id, 'copia')
      toast({ message: TOAST_ENLACE_COPIADO, tone: 'success' })
    } else {
      ponerAviso(invitacion.id, 'copia', MENSAJE_ERROR_COPIA)
    }
  }

  // POST /api/invitations/{id}/resend: reenvía el correo de verdad (S-09). Éxito
  // con toast; cualquier error (409, 401, 403, 404, 500 o red) queda inline en la fila.
  async function reenviar(invitacion: InvitationRow) {
    if (invitacion.status === 'completada' || enCurso.current.has(invitacion.id)) return
    enCurso.current.add(invitacion.id)
    setReenviando((actuales) => new Set(actuales).add(invitacion.id))
    quitarAviso(invitacion.id)
    try {
      await resendInvitation(invitacion.id)
      toast({ message: `Invitación reenviada a ${invitacion.email}`, tone: 'success' })
    } catch (error) {
      ponerAviso(invitacion.id, 'reenvio', mensajeErrorReenvio(error))
    } finally {
      enCurso.current.delete(invitacion.id)
      setReenviando((actuales) => {
        const siguientes = new Set(actuales)
        siguientes.delete(invitacion.id)
        return siguientes
      })
    }
  }

  async function alActualizar() {
    if (await actualizar()) {
      // Los avisos eran del estado anterior (por ejemplo, un 409 de quien ya completó).
      setAvisos({})
      toast({ message: 'Evaluación actualizada', tone: 'success' })
    }
  }

  if (carga.fase === 'cargando') {
    return (
      <div className="st-evaluacion">
        <VolverACandidatos />
        <VisuallyHidden as="h1">Detalle de la evaluación</VisuallyHidden>
        <Card variant="glass" className="st-evaluacion__carga">
          <EstadoCarga variant="bloque" label="Cargando evaluación…" count={5} />
        </Card>
      </div>
    )
  }

  if (carga.fase === 'error') {
    const kind = carga.error
    const reintentable = admiteReintento(kind)
    return (
      <div className="st-evaluacion">
        <VolverACandidatos />
        <VisuallyHidden as="h1">Detalle de la evaluación</VisuallyHidden>
        <EstadoError
          kind={kind}
          titleAs="h2"
          {...textoErrorDetalle(kind)}
          onRetry={reintentable ? reintentar : undefined}
          retrying={reintentando}
          actions={
            !reintentable && (
              <Button variant="secondary" to={RUTA_LISTA}>
                Ver mis evaluaciones
              </Button>
            )
          }
        />
      </div>
    )
  }

  const { evaluacion } = carga
  const invitaciones = evaluacion.invitations
  const total = invitaciones.length
  const conteo = contarInvitaciones(invitaciones)
  const visibles = filtro === 'todos' ? invitaciones : invitaciones.filter((invitacion) => invitacion.status === filtro)

  const opciones: SegmentedFilterOption[] = [
    { value: 'todos', label: 'Todos', count: total },
    ...INVITATION_STATUSES.map((estado) => ({
      value: estado,
      label: getInvitationStatusMeta(estado).label,
      count: conteo[estado],
    })),
  ]

  const columnas: ReadonlyArray<DataTableColumn<InvitationRow>> = [
    {
      key: 'candidato',
      header: 'Candidato',
      rowHeader: true,
      render: (invitacion) => <Persona name={invitacion.candidate} detail={invitacion.email} />,
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (invitacion) => <InvitationStatusBadge status={invitacion.status} />,
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'end',
      cardLabel: false,
      render: (invitacion) => (
        <AccionesInvitacion
          invitacion={invitacion}
          reenviando={reenviando.has(invitacion.id)}
          aviso={avisos[invitacion.id] ?? null}
          onCopiar={copiarEnlace}
          onCompartir={setCompartida}
          onReenviar={reenviar}
        />
      ),
    },
  ]

  const vacio =
    total === 0 ? (
      <EstadoVacio
        titleAs="h3"
        title="Esta evaluación no tiene candidatos"
        description="Para invitar candidatos, crea una evaluación nueva."
        actions={
          <Button to={RUTA_NUEVA} iconLeft={<IconoAgregar />}>
            Invitar candidatos
          </Button>
        }
      />
    ) : (
      <EstadoVacio
        size="sm"
        role="status"
        title="Ningún candidato en este estado"
        description="Elige otro estado o mira a todos los candidatos de la evaluación."
        actions={
          <Button variant="secondary" size="sm" onClick={() => setFiltro('todos')}>
            Ver todos
          </Button>
        }
      />
    )

  return (
    <div className="st-evaluacion">
      <VolverACandidatos />
      <PageHeader
        eyebrow="Evaluación"
        title={evaluacion.name}
        lede={<MetaEvaluacion puesto={evaluacion.position} fechas={fechas} />}
        actions={
          <>
            {/* Único acceso a la comparativa y a su CSV (brechas.md R-21). */}
            <Button variant="secondary" to={`/app/evaluaciones/${evaluacion.id}/comparar`}>
              Comparar candidatos
            </Button>
            <Button to={RUTA_NUEVA} iconLeft={<IconoAgregar />}>
              Invitar candidatos
            </Button>
          </>
        }
      />

      <div className="st-evaluacion__cuerpo">
        {errorActualizar && (
          <Callout
            tone="error"
            live="alert"
            title="No pudimos actualizar la evaluación"
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
          caption={`Candidatos de la evaluación ${evaluacion.name}`}
          title="Candidatos"
          subtitle={`· ${textoInvitados(total)}`}
          toolbar={
            <>
              {total > 0 && (
                <SegmentedFilter
                  aria-label="Filtrar candidatos por estado"
                  size="sm"
                  options={opciones}
                  value={filtro}
                  onChange={(valor) => setFiltro(esFiltro(valor) ? valor : 'todos')}
                />
              )}
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
            </>
          }
          columns={columnas}
          rows={visibles}
          getRowKey={(invitacion) => invitacion.id}
          // Tres columnas caben sin los 900 px de mínimo: entre 641 y 900 px los
          // botones bajan de fila en lugar de quedar ocultos tras el scroll lateral.
          minWidth={0}
          empty={vacio}
          footer={
            total > 0 && (
              <>
                <span>
                  Mostrando {visibles.length} de {textoCandidatos(total)}
                </span>
                {/* No se pueden sumar candidatos a una evaluación existente (PB-13). */}
                <span>Para sumar candidatos, crea una evaluación nueva.</span>
              </>
            )
          }
        />
      </div>

      <ModalCompartir
        invitacion={compartida}
        fechaLimite={fechas.estado === 'lista' ? fechas.fechaLimite : undefined}
        onClose={() => setCompartida(null)}
      />
    </div>
  )
}
