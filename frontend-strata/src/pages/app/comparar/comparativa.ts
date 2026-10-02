import type { CompareData, CompareRow } from '@/api/rh'

// Lógica de la comparativa (/app/evaluaciones/:id/comparar) sin React: orden,
// CSV y formato de las celdas.
// - El orden y el CSV son los de la pantalla anterior, sin cambios
//   (2026-09-12-fase2-panel-rh.md:1601-1633): mismo criterio, mismas columnas y
//   mismo formato. Las pruebas comparan la cadena con la del código anterior.
// - La celda sigue a D-14: «{normalized} · {categoría}», como el reporte.

/** Puntaje de una escala en una fila (GET /api/assessments/{id}/compare → rows[].scores[code]). */
export type PuntajeComparado = CompareRow['scores'][string]

/** Orden activo: escala (su code) y sentido. Sin orden, las filas quedan como las manda el servidor. */
export interface OrdenComparativa {
  escala: string
  descendente: boolean
}

/**
 * Ordena por el normalized de una escala con el criterio de la pantalla anterior:
 * quien no tiene puntaje en la escala cuenta como -1 (al final de mayor a menor y
 * al principio de menor a mayor) y los empates conservan el orden del servidor.
 * Sin orden devuelve las mismas filas.
 */
export function ordenarFilas(filas: readonly CompareRow[], orden: OrdenComparativa | null): readonly CompareRow[] {
  if (!orden) return filas
  return [...filas].sort((a, b) => {
    const va = a.scores[orden.escala]?.normalized ?? -1
    const vb = b.scores[orden.escala]?.normalized ?? -1
    return orden.descendente ? vb - va : va - vb
  })
}

/** Tipo del archivo descargado, el mismo de antes. */
export const TIPO_CSV = 'text/csv;charset=utf-8;'

/**
 * CSV de la comparativa, idéntico al de la pantalla anterior: encabezado
 * «Candidato» y el nombre de cada escala, sin comillas; una línea por fila en el
 * orden visible, con cada celda entre comillas y «categoría (percentil)», o vacía
 * si no hay puntaje. Líneas separadas con \n.
 */
export function generarCsv(datos: CompareData, filas: readonly CompareRow[]): string {
  const encabezado = ['Candidato', ...datos.scales.map((escala) => escala.name)]
  const lineas = [encabezado.join(',')]
  for (const fila of filas) {
    const celdas = [
      fila.candidate,
      ...datos.scales.map((escala) => {
        const puntaje = fila.scores[escala.code]
        return puntaje ? `${puntaje.category} (${puntaje.percentile ?? ''})` : ''
      }),
    ]
    lineas.push(celdas.map((celda) => `"${String(celda).replace(/"/g, '""')}"`).join(','))
  }
  return lineas.join('\n')
}

/** Nombre del archivo, el mismo de antes: comparativa-{nombre de la evaluación}.csv. */
export function nombreDelCsv(datos: CompareData): string {
  return `comparativa-${datos.assessment.name}.csv`
}

/**
 * Descarga un texto como archivo, con el mismo mecanismo de antes: un Blob, un
 * enlace temporal con download y la URL liberada después del clic.
 */
export function descargarArchivo(contenido: string, nombre: string, tipo: string): void {
  const blob = new Blob([contenido], { type: tipo })
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombre
  enlace.click()
  URL.revokeObjectURL(url)
}

/**
 * Puntaje de 0 a 100 para mostrar (D-14): normalized redondeado, como el reporte
 * de la Fase 4 (src/sections/report/escalas.ts). Es el mismo valor que el «pc N»
 * anterior, porque el backend guarda percentile como round(normalized)
 * (2026-09-11-fase1-nucleo.md:980). Si falta normalized usa percentile, para no
 * perder el dato; sin ninguno de los dos, null.
 */
export function puntajeVisible(puntaje: Pick<PuntajeComparado, 'normalized' | 'percentile'>): number | null {
  const { normalized, percentile } = puntaje
  if (typeof normalized === 'number' && Number.isFinite(normalized)) return Math.round(normalized)
  if (typeof percentile === 'number' && Number.isFinite(percentile)) return Math.round(percentile)
  return null
}

/** Categorías del baremo con color propio. El color sigue a la categoría del backend, no a umbrales (D-14). */
export type TonoCategoria = 'bajo' | 'medio' | 'alto'

/** Tono de una categoría; null si no es bajo, medio ni alto (se pinta neutra). */
export function tonoDeCategoria(categoria: string | null | undefined): TonoCategoria | null {
  const valor = categoria?.trim().toLocaleLowerCase('es-MX')
  return valor === 'bajo' || valor === 'medio' || valor === 'alto' ? valor : null
}

/** Categoría con mayúscula inicial, como el prototipo («Alto», Strata.dc.html:1463); null si viene vacía. */
export function etiquetaDeCategoria(categoria: string | null | undefined): string | null {
  const valor = categoria?.trim()
  if (!valor) return null
  return valor.charAt(0).toLocaleUpperCase('es-MX') + valor.slice(1)
}

/**
 * Lo que oye un lector de pantalla en la celda: «81 de 100, categoría Alto».
 * No depende de cómo se lea «·»; la escala la anuncia el encabezado de la columna.
 */
export function descripcionDeCelda(puntaje: Pick<PuntajeComparado, 'normalized' | 'percentile' | 'category'>): string {
  const valor = puntajeVisible(puntaje)
  const categoria = etiquetaDeCategoria(puntaje.category)
  const partes: string[] = []
  if (valor !== null) partes.push(`${valor} de 100`)
  if (categoria) partes.push(`categoría ${categoria}`)
  return partes.length > 0 ? partes.join(', ') : 'Sin datos'
}

/**
 * Ancho mínimo de la tabla para que cada escala tenga lugar y el resto se
 * desplace en horizontal (D-23: la comparativa conserva el scroll).
 */
export function anchoMinimoDeTabla(escalas: number): number {
  return Math.max(560, 190 + Math.max(0, escalas) * 128)
}
