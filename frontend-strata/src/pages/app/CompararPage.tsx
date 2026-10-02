import { useEffect, useState, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { compareAssessment, type CompareData, type CompareRow } from '@/api/rh'
import {
  Button,
  DataTable,
  EstadoCarga,
  EstadoError,
  EstadoVacio,
  getErrorKind,
  PageHeader,
  type DataTableColumn,
  type DataTableSort,
  type EstadoErrorKind,
} from '@/components/ui'
import { CeldaPuntaje } from './comparar/CeldaPuntaje'
import {
  anchoMinimoDeTabla,
  descargarArchivo,
  generarCsv,
  nombreDelCsv,
  ordenarFilas,
  TIPO_CSV,
  type OrdenComparativa,
} from './comparar/comparativa'
import { IconoDescargar, IconoVolver } from './comparar/iconos'
import './CompararPage.css'

/** Lo último que respondió GET /api/assessments/{id}/compare, con la evaluación y el intento que lo pidieron. */
interface Respuesta {
  id: string | undefined
  intento: number
  resultado: { tipo: 'datos'; datos: CompareData } | { tipo: 'error'; error: EstadoErrorKind }
}

type Vista =
  | { fase: 'cargando' }
  | { fase: 'error'; tipo: EstadoErrorKind; reintentando: boolean }
  | { fase: 'lista'; datos: CompareData }

/** Las columnas de escala llevan prefijo para no chocar con la del candidato. */
const PREFIJO_ESCALA = 'escala:'

const TITULO_POR_DEFECTO = 'Comparar candidatos'

/** Textos propios por tipo de error; los demás usan los de EstadoError. 403 y 404 tienen el suyo (R-27). */
const TEXTOS_ERROR: Partial<Record<EstadoErrorKind, { title: string; message: string }>> = {
  permiso: {
    title: 'No tienes acceso a esta evaluación',
    message: 'Pertenece a otra empresa o tu cuenta ya no puede verla.',
  },
  'no-encontrado': {
    title: 'No encontramos esta evaluación',
    message: 'Puede que el enlace esté incompleto o que la evaluación ya no exista.',
  },
  servidor: {
    title: 'No pudimos cargar la comparativa',
    message: 'Ocurrió un error de nuestro lado. Inténtalo de nuevo en unos minutos.',
  },
}

/** Volver a pedir sirve ante una falla de red o del servidor; ante 403, 404 o sesión vencida, no. */
function esReintentable(tipo: EstadoErrorKind): boolean {
  return tipo === 'red' || tipo === 'servidor' || tipo === 'conflicto'
}

/** Listas siempre presentes aunque la respuesta llegue incompleta; sin evaluación, es un error. */
function normalizar(datos: CompareData): CompareData {
  if (!datos || typeof datos !== 'object' || !datos.assessment) throw new Error('Respuesta de la comparativa sin evaluación')
  return {
    ...datos,
    scales: Array.isArray(datos.scales) ? datos.scales : [],
    rows: Array.isArray(datos.rows) ? datos.rows.map((fila) => ({ ...fila, scores: fila.scores ?? {} })) : [],
  }
}

/** Estado visible a partir de la última respuesta: otra evaluación o un reintento en curso. */
function vistaDe(respuesta: Respuesta | null, id: string | undefined, intento: number): Vista {
  if (!respuesta || respuesta.id !== id) return { fase: 'cargando' }
  const { resultado } = respuesta
  if (resultado.tipo === 'error') {
    return { fase: 'error', tipo: resultado.error, reintentando: respuesta.intento !== intento }
  }
  return { fase: 'lista', datos: resultado.datos }
}

function candidatos(cantidad: number): string {
  return `${cantidad} ${cantidad === 1 ? 'candidato' : 'candidatos'}`
}

/**
 * Comparativa de candidatos (/app/evaluaciones/:id/comparar; mapa.md, sección 2; R-23).
 * - Encabezado con el nombre de la evaluación, «Volver al detalle» y «Exportar CSV».
 * - DataTable blanca con scroll horizontal (D-23) y la columna del candidato fija.
 *   Cada escala se ordena desde su encabezado (botón con aria-sort, operable con
 *   teclado) con el criterio de antes: por normalized, primero de mayor a menor.
 * - Celdas «{normalized} · {categoría}» (D-14), el mismo formato que el reporte.
 * - El CSV conserva columnas, formato, orden visible y nombre de archivo.
 * - Estados: carga; vacío con nota (nadie completó aún); error distinto del vacío,
 *   con 403 y 404 propios y «Reintentar» ante fallas de red o del servidor.
 */
export default function CompararPage() {
  const { id } = useParams()
  const [intento, setIntento] = useState(0)
  const [respuesta, setRespuesta] = useState<Respuesta | null>(null)
  const [orden, setOrden] = useState<OrdenComparativa | null>(null)

  useEffect(() => {
    let vigente = true
    compareAssessment(Number(id))
      .then((datos) => {
        if (vigente) setRespuesta({ id, intento, resultado: { tipo: 'datos', datos: normalizar(datos) } })
      })
      .catch((error: unknown) => {
        if (vigente) setRespuesta({ id, intento, resultado: { tipo: 'error', error: getErrorKind(error) } })
      })
    return () => {
      vigente = false
    }
  }, [id, intento])

  const vista = vistaDe(respuesta, id, intento)
  const datos = vista.fase === 'lista' ? vista.datos : null

  // Mismo orden en la tabla y en el CSV, como antes.
  const filas = datos ? ordenarFilas(datos.rows, orden) : []

  const columnas: DataTableColumn<CompareRow>[] = datos
    ? [
        { key: 'candidato', header: 'Candidato', rowHeader: true, render: (fila) => fila.candidate },
        ...datos.scales.map<DataTableColumn<CompareRow>>((escala) => ({
          key: `${PREFIJO_ESCALA}${escala.code}`,
          header: escala.name,
          sortable: true,
          sortDescendingFirst: true,
          render: (fila) => <CeldaPuntaje puntaje={fila.scores[escala.code]} />,
        })),
      ]
    : []

  const ordenDeTabla: DataTableSort | null = orden
    ? { key: `${PREFIJO_ESCALA}${orden.escala}`, direction: orden.descendente ? 'descending' : 'ascending' }
    : null

  function cambiarOrden(siguiente: DataTableSort) {
    if (!siguiente.key.startsWith(PREFIJO_ESCALA)) return
    setOrden({ escala: siguiente.key.slice(PREFIJO_ESCALA.length), descendente: siguiente.direction === 'descending' })
  }

  function exportarCsv() {
    if (!datos) return
    descargarArchivo(generarCsv(datos, filas), nombreDelCsv(datos), TIPO_CSV)
  }

  function reintentar() {
    setIntento((actual) => actual + 1)
  }

  const hayFilas = filas.length > 0
  const nombre = datos?.assessment.name?.trim() || TITULO_POR_DEFECTO

  let contenido: ReactNode
  if (vista.fase === 'cargando') {
    contenido = <EstadoCarga variant="bloque" count={5} label="Cargando la comparativa…" />
  } else if (vista.fase === 'error') {
    const textos = TEXTOS_ERROR[vista.tipo]
    const sinAcceso = vista.tipo === 'permiso' || vista.tipo === 'no-encontrado'
    contenido = (
      <EstadoError
        titleAs="h2"
        kind={vista.tipo}
        title={textos?.title}
        message={textos?.message}
        onRetry={esReintentable(vista.tipo) ? reintentar : undefined}
        retrying={vista.reintentando}
        actions={
          sinAcceso ? (
            <Button variant="secondary" to="/app/evaluaciones">
              Ver mis evaluaciones
            </Button>
          ) : undefined
        }
      />
    )
  } else if (!hayFilas) {
    contenido = (
      <EstadoVacio
        titleAs="h2"
        title="Aún no hay candidatos que hayan completado esta evaluación"
        description="La comparativa reúne solo a quienes ya terminaron. En el detalle de la evaluación ves el avance de cada candidato."
      />
    )
  } else {
    contenido = (
      <DataTable
        className="st-comparar__tabla"
        variant="white"
        responsive="scroll"
        minWidth={anchoMinimoDeTabla(vista.datos.scales.length)}
        caption={`Comparativa de candidatos: ${nombre}`}
        title="Resultados por escala"
        subtitle={`· ${candidatos(filas.length)} con la evaluación completada`}
        footer={<span>Cada celda muestra el puntaje de la escala, de 0 a 100, y su categoría.</span>}
        columns={columnas}
        rows={filas}
        getRowKey={(fila) => fila.invitation_id}
        sort={ordenDeTabla}
        onSortChange={cambiarOrden}
        manualSort
      />
    )
  }

  return (
    <div className="st-comparar">
      {/* Arriba del encabezado y en todos los estados, como «Volver a candidatos» del detalle. */}
      <Button
        variant="ghost"
        size="sm"
        to={`/app/evaluaciones/${encodeURIComponent(id ?? '')}`}
        iconLeft={<IconoVolver />}
        className="st-comparar__volver"
      >
        Volver al detalle
      </Button>
      <PageHeader
        eyebrow={datos ? TITULO_POR_DEFECTO : undefined}
        title={nombre}
        lede={
          hayFilas
            ? 'Resultados por escala de quienes ya completaron la evaluación. Ordena por una escala desde su encabezado.'
            : undefined
        }
        actions={
          hayFilas ? (
            <Button iconLeft={<IconoDescargar />} onClick={exportarCsv}>
              Exportar CSV
            </Button>
          ) : undefined
        }
      />
      {contenido}
    </div>
  )
}
