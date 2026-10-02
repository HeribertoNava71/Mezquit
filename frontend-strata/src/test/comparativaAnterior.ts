import type { CompareData, CompareRow } from '@/api/rh'

// SOLO PARA PRUEBAS. Copia literal del orden y del CSV de la CompararPage
// anterior al rediseño (2026-09-12-fase2-panel-rh.md:1601-1633). Las pruebas
// comparan contra estas líneas para garantizar que el CSV no cambia: mismas
// columnas, mismo formato y mismo orden. Solo cambia la forma: las mismas
// líneas dentro de funciones que reciben lo que antes leían del estado
// (data, sortScale y asc). Vive en src/test, junto a la configuración de las
// pruebas (Fase 8), para que nada de la aplicación la importe ni entre al bundle.
// La usan pages/app/comparar/comparativa.test.ts y pages/app/CompararPage.test.tsx.

/** El useMemo `rows` anterior. */
export function filasAnteriores(data: CompareData, sortScale: string | null, asc: boolean): CompareRow[] {
  if (!data) return []
  if (!sortScale) return data.rows
  const sorted = [...data.rows].sort((a, b) => {
    const va = a.scores[sortScale]?.normalized ?? -1
    const vb = b.scores[sortScale]?.normalized ?? -1
    return asc ? va - vb : vb - va
  })
  return sorted
}

/** El texto que armaba exportCsv() antes de crear el Blob. */
export function csvAnterior(data: CompareData, rows: CompareRow[]): string {
  const header = ['Candidato', ...data.scales.map(s => s.name)]
  const lines = [header.join(',')]
  for (const row of rows) {
    const cells = [row.candidate, ...data.scales.map(s => {
      const sc = row.scores[s.code]
      return sc ? `${sc.category} (${sc.percentile ?? ''})` : ''
    })]
    lines.push(cells.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
  }
  return lines.join('\n')
}

/** Tipo y nombre del archivo de exportCsv() anterior. */
export const TIPO_CSV_ANTERIOR = 'text/csv;charset=utf-8;'

export function nombreCsvAnterior(data: CompareData): string {
  return `comparativa-${data.assessment.name}.csv`
}
