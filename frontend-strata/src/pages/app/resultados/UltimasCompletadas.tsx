import { useEffect, useRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  Button,
  Callout,
  DataTable,
  EstadoCarga,
  EstadoError,
  EstadoVacio,
  Fecha,
  Persona,
  type DataTableColumn,
  type EstadoErrorKind,
} from '@/components/ui'
import { IconoAgregar, IconoFlechaDerecha } from '@/components/ui/Iconos'
import { formatearNumero, type FilaCompletada } from './resultados'
import type { EstadoCompletadas } from './useResultados'
import './UltimasCompletadas.css'

export interface UltimasCompletadasProps {
  estado: EstadoCompletadas
  /** Evaluaciones de la organización. Con 0, el vacío invita a crear la primera; null mientras carga. */
  totalEvaluaciones: number | null
  /** Candidatos completados en todas las evaluaciones (la StatCard); null mientras carga. */
  totalCompletados: number | null
  /** Vuelve a pedir los detalles. */
  onReintentar: () => void
}

/** Asistente de evaluación: el destino de «Invitar candidatos» (D-10). */
const RUTA_INVITAR = '/app/evaluaciones/nueva'

/** «Creada el 16 sep 2026»: la fecha que ordena la tabla (PB-06). */
function FechaDeCreacion({ valor }: { valor: string | null }) {
  if (!valor?.trim()) return <>Sin fecha de creación</>
  return (
    <>
      Creada el <Fecha valor={valor} />
    </>
  )
}

/**
 * Columnas de la tabla de candidatos del prototipo (Strata.dc.html:823-857).
 * Sin estado (todas son completadas) y con la fecha de creación como segunda
 * línea de la evaluación, como el correo bajo el nombre del candidato: así la
 * tabla cabe a 768 px sin desplazamiento lateral.
 */
const COLUMNAS: DataTableColumn<FilaCompletada>[] = [
  {
    key: 'candidato',
    header: 'Candidato',
    rowHeader: true,
    render: (fila) => <Persona name={fila.candidato} detail={fila.correo} />,
  },
  {
    key: 'evaluacion',
    header: 'Evaluación',
    render: (fila) => (
      <>
        <p className="st-resultados-ultimas__evaluacion">{fila.evaluacion}</p>
        <p className="st-resultados-ultimas__creada">
          <FechaDeCreacion valor={fila.fechaEvaluacion} />
        </p>
      </>
    ),
  },
  {
    key: 'puesto',
    header: 'Puesto',
    render: (fila) => fila.puesto ?? <span className="st-resultados-ultimas__sin-dato">Sin puesto</span>,
  },
  {
    key: 'accion',
    header: 'Acción',
    align: 'end',
    cardLabel: false,
    // Ancho del botón chico más el padding de la celda, para que «Ver reporte» no se parta
    // en columnas angostas (el text-wrap: balance de .st-btn__label anula su nowrap).
    width: 128,
    // El nombre accesible empieza con el texto visible (WCAG 2.5.3) y dice de quién es el reporte.
    render: (fila) => (
      <Button
        size="sm"
        variant="highlight"
        to={`/app/candidatos/${fila.invitacionId}/reporte`}
        aria-label={`Ver reporte de ${fila.candidato}`}
      >
        Ver reporte
      </Button>
    ),
  },
]

function botonInvitar() {
  return (
    <Button variant="secondary" to={RUTA_INVITAR} iconLeft={<IconoAgregar />}>
      Invitar candidatos
    </Button>
  )
}

function evaluaciones(n: number): string {
  return `${formatearNumero(n)} ${n === 1 ? 'evaluación' : 'evaluaciones'}`
}

function mensajeDeFalla(tipo: EstadoErrorKind | null): string {
  return tipo === 'red' ? 'Revisa tu conexión e inténtalo de nuevo.' : 'Inténtalo de nuevo en unos momentos.'
}

/**
 * Situación de la tabla para mover el foco: tras un «Reintentar» que quita el
 * error o el aviso, el foco iría al <body>; se lleva a la tabla.
 */
type Situacion = 'cargando' | 'error' | 'parcial' | 'completa'

function situacionDe(estado: EstadoCompletadas): Situacion {
  if (estado.fase !== 'listo') return estado.fase
  return estado.fallidas > 0 ? 'parcial' : 'completa'
}

/**
 * «Últimas completadas» (mapa.md, sección 2, /app): DataTable con las
 * invitaciones completadas de las evaluaciones más recientes (agregación
 * limitada de PB-05) y el enlace «Ver reporte». Estados: carga, error con
 * «Reintentar», aviso si faltan evaluaciones y dos vacíos con CTA (sin
 * evaluaciones o sin completadas). Sin fecha de término por candidato (PB-06),
 * el orden sigue la fecha de creación de la evaluación y la tabla lo dice.
 */
export function UltimasCompletadas({ estado, totalEvaluaciones, totalCompletados, onReintentar }: UltimasCompletadasProps) {
  const tablaRef = useRef<HTMLDivElement>(null)
  const situacion = situacionDe(estado)
  const situacionPrevia = useRef(situacion)

  useEffect(() => {
    const antes = situacionPrevia.current
    situacionPrevia.current = situacion
    if (antes === situacion || (antes !== 'error' && antes !== 'parcial') || situacion === 'cargando') return
    const activo = document.activeElement
    if (!activo || activo === document.body) tablaRef.current?.focus()
  }, [situacion])

  const filas = estado.fase === 'listo' ? estado.filas : []

  let vacio: ReactNode
  if (estado.fase === 'cargando') {
    vacio = <EstadoCarga variant="bloque" label="Cargando las últimas completadas…" />
  } else if (estado.fase === 'error') {
    // Sesión vencida y permiso conservan su título propio de EstadoError.
    const generico = estado.tipo !== 'sesion' && estado.tipo !== 'permiso'
    vacio = (
      <EstadoError
        size="sm"
        kind={estado.tipo}
        title={generico ? 'No pudimos cargar las últimas completadas' : undefined}
        onRetry={onReintentar}
        retrying={estado.reintentando}
      />
    )
  } else if (totalEvaluaciones === 0) {
    vacio = (
      <EstadoVacio
        title="Aún no tienes evaluaciones"
        description="Invita a tus primeros candidatos. Cuando terminen, aquí verás el enlace a cada reporte."
        actions={botonInvitar()}
      />
    )
  } else {
    vacio = (
      <EstadoVacio
        title="Aún no hay evaluaciones completadas"
        description="Cuando un candidato termine su evaluación, aquí verás el enlace a su reporte."
        actions={botonInvitar()}
      />
    )
  }

  const mostradas = filas.length
  const total = Math.max(totalCompletados ?? 0, mostradas)
  const pie =
    mostradas > 0 ? (
      <>
        <p className="st-resultados-ultimas__nota">
          Mostrando {formatearNumero(mostradas)} de {formatearNumero(total)}{' '}
          {total === 1 ? 'candidato completado' : 'candidatos completados'}. El orden sigue la fecha de creación de
          cada evaluación; la fecha en que terminó cada candidato está en su reporte.
        </p>
        <Link className="st-resultados-ultimas__enlace" to="/app/evaluaciones">
          Ver todas las evaluaciones
          <IconoFlechaDerecha className="st-resultados-ultimas__flecha" />
        </Link>
      </>
    ) : undefined

  return (
    <div className="st-resultados-ultimas">
      {estado.fase === 'listo' && estado.fallidas > 0 && (
        <Callout
          tone="warning"
          live="status"
          className="st-resultados-ultimas__aviso"
          title="Faltan candidatos en «Últimas completadas»"
          actions={
            <Button
              size="sm"
              variant="secondary"
              onClick={onReintentar}
              loading={estado.reintentando}
              loadingText="Reintentando…"
            >
              Reintentar
            </Button>
          }
        >
          No pudimos cargar los candidatos de {evaluaciones(estado.fallidas)}. {mensajeDeFalla(estado.tipoFalla)}
        </Callout>
      )}
      <DataTable
        ref={tablaRef}
        tabIndex={-1}
        aria-busy={estado.fase === 'cargando' || undefined}
        title="Últimas completadas"
        subtitle="· por fecha de la evaluación"
        caption="Últimas completadas: candidatos que terminaron, por fecha de la evaluación"
        columns={COLUMNAS}
        rows={filas}
        getRowKey={(fila) => fila.invitacionId}
        empty={vacio}
        footer={pie}
        // Cuatro columnas caben desde 560 px: en modo tabla (más de 640 px) no hay desplazamiento lateral.
        minWidth={560}
      />
    </div>
  )
}
