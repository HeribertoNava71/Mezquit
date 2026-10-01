import {
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type HTMLAttributes,
  type Key,
  type ReactNode,
  type Ref,
} from 'react'
import { cx } from './cx'
import { compareSortValues, readSortValue, type DataTableSortValue } from './dataTableSort'
import { useHorizontalOverflow } from './useHorizontalOverflow'
import { useReducedMotion } from './useReducedMotion'
import { VisuallyHidden } from './VisuallyHidden'
import './DataTable.css'

/** Sentido del orden, con los mismos valores que aria-sort. */
export type DataTableSortDirection = 'ascending' | 'descending'

/** Orden activo: columna y sentido. */
export interface DataTableSort {
  key: string
  direction: DataTableSortDirection
}

/** comfortable: celdas con 14 px de padding vertical. compact: 9 px (Strata.dc.html:2101). */
export type DataTableDensity = 'comfortable' | 'compact'

/** Alineación del encabezado y de las celdas de una columna. */
export type DataTableAlign = 'start' | 'center' | 'end'

/**
 * Superficie, con los nombres de las variantes de Card: glass (vidrio, por defecto),
 * white (tarjeta blanca) o none (sin superficie, dentro de otra tarjeta).
 */
export type DataTableVariant = 'glass' | 'white' | 'none'

export interface DataTableColumn<Row> {
  /** Identificador de la columna. Sin render ni sortValue, también es la propiedad que se lee de la fila. */
  key: string
  /** Encabezado visible. */
  header: ReactNode
  /** Contenido de la celda. Por defecto, row[key] como texto. */
  render?: (row: Row, index: number) => ReactNode
  /** Permite ordenar por esta columna con un botón en el encabezado. */
  sortable?: boolean
  /** Valor para ordenar. Por defecto, row[key]. */
  sortValue?: (row: Row) => DataTableSortValue
  /** El primer clic ordena de mayor a menor (útil en puntajes). */
  sortDescendingFirst?: boolean
  /** Alineación. Por defecto, start. */
  align?: DataTableAlign
  /** Ancho de la columna (número en px o cualquier medida CSS). */
  width?: number | string
  /** Oculta la columna en el modo tarjeta (640 px o menos). */
  hideOnCard?: boolean
  /** Rótulo en el modo tarjeta. Por defecto, el header; false lo quita (por ejemplo, en acciones). */
  cardLabel?: ReactNode
  /**
   * La celda es el encabezado de su fila (th scope="row"), por ejemplo el nombre del
   * candidato. En el modo tarjeta es el título: va a todo el ancho y sin rótulo.
   */
  rowHeader?: boolean
}

export interface DataTableProps<Row> extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children'> {
  /** Columnas en orden. */
  columns: ReadonlyArray<DataTableColumn<Row>>
  /** Filas. */
  rows: ReadonlyArray<Row>
  /** Clave estable de cada fila (por ejemplo, el id). */
  getRowKey: (row: Row, index: number) => Key
  /** Caption de la tabla: no se ve, pero le da nombre para lectores de pantalla. */
  caption: ReactNode
  /** Título visible de la barra superior (14 px, 700). Es un encabezado de nivel titleLevel. */
  title?: ReactNode
  /** Texto al lado del título (11.5 px, terciario). */
  subtitle?: ReactNode
  /** Nivel del título. Por defecto, 2. */
  titleLevel?: 2 | 3 | 4 | 5 | 6
  /** Controles de la barra superior, a la derecha (filtros, búsqueda). */
  toolbar?: ReactNode
  /** Pie: nota, conteo o paginación. */
  footer?: ReactNode
  /**
   * Contenido cuando no hay filas (por ejemplo, un EstadoVacío). Mientras carga,
   * pasa aquí el estado de carga con rows vacío. Por defecto, un texto breve.
   */
  empty?: ReactNode
  /** Densidad. Por defecto, comfortable. */
  density?: DataTableDensity
  /**
   * cards: a 640 px o menos cada fila es una tarjeta con rótulos (D-23).
   * scroll: siempre tabla, con scroll horizontal (comparativa). Por defecto, cards.
   */
  responsive?: 'cards' | 'scroll'
  /** Superficie: vidrio (por defecto), blanca o ninguna (dentro de otra tarjeta). Mismo nombre que en Card. */
  variant?: DataTableVariant
  /** Ancho mínimo de la tabla en modo tabla. Por defecto, 900 px (--width-table-min). */
  minWidth?: number | string
  /** Orden controlado. Con null no hay orden activo. */
  sort?: DataTableSort | null
  /** Orden inicial si no es controlado. */
  defaultSort?: DataTableSort | null
  /** Se llama al pedir un orden nuevo desde un encabezado. */
  onSortChange?: (sort: DataTableSort) => void
  /** Las filas ya llegan ordenadas (por ejemplo, desde el servidor): la tabla solo marca el encabezado. */
  manualSort?: boolean
  /** Entrada escalonada de las filas (rowIn, 28 ms). Por defecto, true; nunca con movimiento reducido. */
  animateRows?: boolean
  ref?: Ref<HTMLDivElement>
}

/** Las filas después de esta comparten el último retardo (12 × 28 ms). */
const STAGGER_LIMIT = 12

const ALIGN_CLASS: Record<DataTableAlign, string | undefined> = {
  start: undefined,
  center: 'st-table__align-center',
  end: 'st-table__align-end',
}

function columnText<Row>(column: DataTableColumn<Row>): string {
  if (typeof column.header === 'string') return column.header
  if (typeof column.cardLabel === 'string') return column.cardLabel
  return column.key
}

function defaultCell(row: unknown, key: string): ReactNode {
  const value = readSortValue(row, key)
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  if (value instanceof Date) return value.toLocaleDateString('es-MX')
  return value ?? null
}

function SortIcon({ direction }: { direction?: DataTableSortDirection }) {
  return (
    <svg
      className={cx('st-table__sort-icon', direction && `st-table__sort-icon--${direction}`)}
      width="8"
      height="12"
      viewBox="0 0 8 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path className="st-table__sort-up" d="M1.5 4.5 4 2l2.5 2.5" />
      <path className="st-table__sort-down" d="M1.5 7.5 4 10l2.5-2.5" />
    </svg>
  )
}

/**
 * Tabla de datos (Strata.dc.html:708-768 y 809-868): barra con título y filtros,
 * cabecera tintada, filas con entrada escalonada y hover, pie con nota o paginación.
 * - Orden controlado (sort + onSortChange) o no (defaultSort), con aria-sort y
 *   botones en los encabezados. Anuncia el orden nuevo por role="status".
 * - A 640 px o menos, cada fila pasa a tarjeta con rótulos (D-23), separada por un
 *   divisor dentro de la superficie de la tabla (sin tarjetas anidadas); la celda
 *   rowHeader es su título y los encabezados ordenables quedan como botones de orden.
 * - Conserva la semántica de tabla con roles explícitos aunque cambie el display.
 */
export function DataTable<Row>({
  columns,
  rows,
  getRowKey,
  caption,
  title,
  subtitle,
  titleLevel = 2,
  toolbar,
  footer,
  empty,
  density = 'comfortable',
  responsive = 'cards',
  variant = 'glass',
  minWidth,
  sort,
  defaultSort = null,
  onSortChange,
  manualSort = false,
  animateRows = true,
  className,
  style,
  ref,
  ...rest
}: DataTableProps<Row>) {
  const captionId = useId()
  const reduceMotion = useReducedMotion()
  const scrollRef = useRef<HTMLDivElement>(null)
  const overflowing = useHorizontalOverflow(scrollRef)
  const [internalSort, setInternalSort] = useState<DataTableSort | null>(defaultSort)
  const [announcement, setAnnouncement] = useState('')

  const isControlled = sort !== undefined
  const activeSort = isControlled ? sort : internalSort

  const sortedRows = useMemo(() => {
    if (!activeSort || manualSort) return rows
    const column = columns.find((item) => item.key === activeSort.key)
    if (!column) return rows
    const valueOf = column.sortValue ?? ((row: Row) => readSortValue(row, column.key))
    return [...rows].sort((a, b) => compareSortValues(valueOf(a), valueOf(b), activeSort.direction))
  }, [rows, columns, activeSort, manualSort])

  function requestSort(column: DataTableColumn<Row>) {
    const direction: DataTableSortDirection =
      activeSort?.key === column.key
        ? activeSort.direction === 'ascending'
          ? 'descending'
          : 'ascending'
        : column.sortDescendingFirst
          ? 'descending'
          : 'ascending'
    const next: DataTableSort = { key: column.key, direction }
    if (!isControlled) setInternalSort(next)
    onSortChange?.(next)
    setAnnouncement(
      `Ordenado por ${columnText(column)}, en orden ${direction === 'ascending' ? 'ascendente' : 'descendente'}.`,
    )
  }

  const hasSortable = columns.some((column) => column.sortable)
  const isEmpty = sortedRows.length === 0
  const hasToolbar = Boolean(title || subtitle || toolbar)
  const animate = animateRows && !reduceMotion
  const TitleTag = `h${titleLevel}` as const
  const tableStyle =
    minWidth === undefined
      ? undefined
      : ({ '--st-table-min': typeof minWidth === 'number' ? `${minWidth}px` : minWidth } as CSSProperties)
  const scrollA11y = overflowing ? { tabIndex: 0, role: 'region', 'aria-labelledby': captionId } : {}

  return (
    <div
      ref={ref}
      className={cx(
        'st-table',
        `st-table--${variant}`,
        `st-table--${density}`,
        `st-table--${responsive}`,
        hasSortable && 'st-table--sortable',
        isEmpty && 'st-table--empty',
        className,
      )}
      style={style}
      {...rest}
    >
      {hasToolbar && (
        <div className="st-table__toolbar">
          {(title || subtitle) && (
            <div className="st-table__heading">
              {title && <TitleTag className="st-table__title">{title}</TitleTag>}
              {subtitle && <p className="st-table__subtitle">{subtitle}</p>}
            </div>
          )}
          {toolbar && <div className="st-table__tools">{toolbar}</div>}
        </div>
      )}

      <div ref={scrollRef} className="st-table__scroll" {...scrollA11y}>
        <table role="table" className="st-table__table" style={tableStyle}>
          <caption id={captionId} className="st-table__caption">
            {caption}
          </caption>
          <thead role="rowgroup" className="st-table__head">
            <tr role="row" className="st-table__head-row">
              {columns.map((column) => {
                const direction = column.sortable && activeSort?.key === column.key ? activeSort.direction : undefined
                return (
                  <th
                    key={column.key}
                    role="columnheader"
                    scope="col"
                    aria-sort={direction}
                    className={cx(
                      'st-table__th',
                      ALIGN_CLASS[column.align ?? 'start'],
                      column.sortable && 'st-table__th--sortable',
                      column.hideOnCard && 'st-table__th--hide-on-card',
                    )}
                    style={column.width === undefined ? undefined : { width: column.width }}
                  >
                    {column.sortable ? (
                      <button type="button" className="st-table__sort" onClick={() => requestSort(column)}>
                        <span>{column.header}</span>
                        <SortIcon direction={direction} />
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody role="rowgroup" className="st-table__body">
            {isEmpty ? (
              <tr role="row" className="st-table__empty-row">
                <td role="cell" colSpan={columns.length} className="st-table__empty">
                  {empty ?? <p className="st-table__empty-text">No hay registros para mostrar.</p>}
                </td>
              </tr>
            ) : (
              sortedRows.map((row, index) => (
                <tr
                  key={getRowKey(row, index)}
                  role="row"
                  className={cx('st-table__row', animate && 'st-table__row--enter')}
                  style={animate ? ({ '--i': Math.min(index, STAGGER_LIMIT) } as CSSProperties) : undefined}
                >
                  {columns.map((column) => {
                    const CellTag: ElementType = column.rowHeader ? 'th' : 'td'
                    const label = column.cardLabel === undefined ? column.header : column.cardLabel
                    const hasLabel = label !== false && label !== null && label !== ''
                    return (
                      <CellTag
                        key={column.key}
                        role={column.rowHeader ? 'rowheader' : 'cell'}
                        scope={column.rowHeader ? 'row' : undefined}
                        className={cx(
                          'st-table__cell',
                          ALIGN_CLASS[column.align ?? 'start'],
                          column.rowHeader && 'st-table__cell--row-header',
                          column.hideOnCard && 'st-table__cell--hide-on-card',
                          !hasLabel && 'st-table__cell--no-label',
                        )}
                      >
                        {hasLabel && (
                          <span className="st-table__cell-label" aria-hidden="true">
                            {label}
                          </span>
                        )}
                        <div className="st-table__cell-value">
                          {column.render ? column.render(row, index) : defaultCell(row, column.key)}
                        </div>
                      </CellTag>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {footer && <div className="st-table__footer">{footer}</div>}
      {hasSortable && <VisuallyHidden role="status">{announcement}</VisuallyHidden>}
    </div>
  )
}
