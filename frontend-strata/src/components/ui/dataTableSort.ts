/** Valor con el que se ordena una columna. Los vacíos (null, undefined, '' o NaN) van siempre al final. */
export type DataTableSortValue = string | number | boolean | Date | null | undefined

const collator = new Intl.Collator('es-MX', { numeric: true, sensitivity: 'base' })

function normalize(value: DataTableSortValue): string | number | null {
  if (value === null || value === undefined || value === '') return null
  if (value instanceof Date) {
    const time = value.getTime()
    return Number.isNaN(time) ? null : time
  }
  if (typeof value === 'boolean') return value ? 1 : 0
  if (typeof value === 'number') return Number.isNaN(value) ? null : value
  return value
}

/**
 * Compara dos valores para ordenar filas. Números y fechas por su valor; textos
 * con el orden del español (sin distinguir acentos ni mayúsculas, números
 * naturales). Los vacíos quedan al final en los dos sentidos.
 */
export function compareSortValues(a: DataTableSortValue, b: DataTableSortValue, direction: 'ascending' | 'descending'): number {
  const left = normalize(a)
  const right = normalize(b)
  if (left === null || right === null) {
    if (left === right) return 0
    return left === null ? 1 : -1
  }
  const factor = direction === 'ascending' ? 1 : -1
  if (typeof left === 'number' && typeof right === 'number') return (left - right) * factor
  return collator.compare(String(left), String(right)) * factor
}

/** Lee row[key] cuando la fila es un objeto y el valor se puede ordenar. */
export function readSortValue(row: unknown, key: string): DataTableSortValue {
  if (typeof row !== 'object' || row === null) return undefined
  const value = (row as Record<string, unknown>)[key]
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value instanceof Date
  ) {
    return value
  }
  return undefined
}
