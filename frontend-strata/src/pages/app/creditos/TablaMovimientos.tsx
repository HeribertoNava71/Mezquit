import { useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  Badge,
  Button,
  DataTable,
  EstadoCarga,
  EstadoVacio,
  SegmentedFilter,
  VisuallyHidden,
  cx,
  type DataTableColumn,
  type SegmentedFilterOption,
} from '@/components/ui'
import { IconoInfo } from '@/components/ui/Iconos'
import {
  TIPOS_MOVIMIENTO,
  contarPorTipo,
  formatearMonto,
  getTipoMovimientoMeta,
  type Movimiento,
} from './movimientos'
import './TablaMovimientos.css'

/** Valor del filtro que muestra todos los tipos. */
const TODOS = 'todos'

function CeldaFecha({ movimiento }: { movimiento: Movimiento }) {
  const { fecha } = movimiento
  if (!fecha) {
    return (
      <span className="st-cr-movs__sin-dato">
        <span aria-hidden="true">—</span>
        <VisuallyHidden>Sin fecha</VisuallyHidden>
      </span>
    )
  }
  // Un created_at que no es fecha se muestra tal cual, sin <time> (regla 5).
  if (!fecha.iso) return <span className="st-cr-movs__dia">{fecha.texto}</span>
  return (
    <time className="st-cr-movs__fecha" dateTime={fecha.iso}>
      <span className="st-cr-movs__dia">{fecha.texto}</span>
      {fecha.hora && <span className="st-cr-movs__hora">{fecha.hora}</span>}
    </time>
  )
}

function CeldaMonto({ monto }: { monto: number }) {
  return (
    <span
      className={cx(
        'st-cr-movs__monto',
        monto > 0 && 'st-cr-movs__monto--entrada',
        monto === 0 && 'st-cr-movs__monto--cero',
      )}
    >
      {formatearMonto(monto)}
    </span>
  )
}

function CeldaReferencia({ movimiento }: { movimiento: Movimiento }) {
  const { referencia } = movimiento
  if (referencia.tipo === 'evaluacion') {
    return (
      <Link className="st-cr-movs__enlace" to={referencia.ruta}>
        {referencia.texto}
      </Link>
    )
  }
  if (referencia.tipo === 'texto') return <span className="st-cr-movs__referencia">{referencia.texto}</span>
  return (
    <span className="st-cr-movs__sin-dato">
      <span aria-hidden="true">—</span>
      <VisuallyHidden>Sin referencia</VisuallyHidden>
    </span>
  )
}

/** Columnas de «Movimientos»: fecha, tipo, monto con signo y referencia legible. */
const COLUMNAS: ReadonlyArray<DataTableColumn<Movimiento>> = [
  { key: 'fecha', header: 'Fecha', rowHeader: true, render: (fila) => <CeldaFecha movimiento={fila} /> },
  {
    key: 'tipo',
    header: 'Tipo',
    render: (fila) => {
      const meta = getTipoMovimientoMeta(fila.tipo)
      return <Badge tone={meta.tone}>{meta.label}</Badge>
    },
  },
  { key: 'monto', header: 'Monto', align: 'end', render: (fila) => <CeldaMonto monto={fila.monto} /> },
  { key: 'referencia', header: 'Referencia', render: (fila) => <CeldaReferencia movimiento={fila} /> },
]

export interface TablaMovimientosProps {
  /** Movimientos del más reciente al más antiguo. null mientras carga. */
  movimientos: readonly Movimiento[] | null
  /** Abre el drawer «Solicitar créditos» (acción del estado vacío). */
  onSolicitar: () => void
}

/**
 * Tabla «Movimientos» con el lenguaje de «Códigos emitidos» (Strata.dc.html:708-768):
 * barra con título y filtro segmentado por tipo con conteos, cabecera tintada,
 * filas escalonadas y pie con nota. A 640 px o menos, cada movimiento es una
 * tarjeta (D-23). Estados: carga (esqueleto), sin movimientos y vacío por filtro.
 */
export function TablaMovimientos({ movimientos, onSolicitar }: TablaMovimientosProps) {
  const [filtro, setFiltro] = useState<string>(TODOS)
  const filtroRef = useRef<HTMLDivElement>(null)
  const cargando = movimientos === null
  const todos = movimientos ?? []
  const hayMovimientos = todos.length > 0
  const visibles = filtro === TODOS ? todos : todos.filter((movimiento) => movimiento.tipo === filtro)
  const etiquetaFiltro = filtro === TODOS ? null : getTipoMovimientoMeta(filtro).label

  const conteo = contarPorTipo(todos)
  const opciones: SegmentedFilterOption[] = [
    { value: TODOS, label: 'Todos', count: todos.length },
    ...TIPOS_MOVIMIENTO.map((tipo) => ({ value: tipo, label: getTipoMovimientoMeta(tipo).label, count: conteo[tipo] })),
  ]

  // «Ver todos» desaparece al quitar el filtro: el foco pasa al chip «Todos».
  function verTodos() {
    setFiltro(TODOS)
    filtroRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
  }

  let vacio: ReactNode
  if (cargando) {
    vacio = <EstadoCarga variant="bloque" skeleton="lineas" count={5} label="Cargando movimientos…" />
  } else if (!hayMovimientos) {
    vacio = (
      <EstadoVacio
        titleAs="h3"
        title="Aún no hay movimientos"
        description="Aquí verás cada crédito que recibas o uses: compras, cortesías, consumos y ajustes."
        actions={
          <Button variant="secondary" size="sm" aria-haspopup="dialog" onClick={onSolicitar}>
            Solicitar créditos
          </Button>
        }
      />
    )
  } else {
    vacio = (
      <EstadoVacio
        size="sm"
        role="status"
        title="No hay movimientos de este tipo"
        description="Elige otro tipo o vuelve a ver todos los movimientos."
        actions={
          <Button variant="ghost" size="sm" onClick={verTodos}>
            Ver todos
          </Button>
        }
      />
    )
  }

  return (
    <DataTable
      className="st-cr-movs"
      caption={etiquetaFiltro ? `Movimientos de créditos de tipo ${etiquetaFiltro}` : 'Movimientos de créditos'}
      title="Movimientos"
      subtitle={hayMovimientos && '· más recientes primero'}
      toolbar={
        hayMovimientos && (
          <SegmentedFilter
            ref={filtroRef}
            aria-label="Filtrar movimientos por tipo"
            size="sm"
            options={opciones}
            value={filtro}
            onChange={setFiltro}
          />
        )
      }
      columns={COLUMNAS}
      rows={visibles}
      getRowKey={(fila) => fila.clave}
      minWidth={560}
      empty={vacio}
      footer={
        hayMovimientos && (
          <p className="st-cr-movs__nota">
            <IconoInfo width={14} height={14} />
            <span>Cuando se aprueba una solicitud, sus créditos aparecen aquí como «Compra».</span>
          </p>
        )
      }
    />
  )
}
