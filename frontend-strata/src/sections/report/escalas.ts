import type { ReportScale } from '@/api/report'

// Presentación de las escalas del reporte (D-14, C-07).
// - El color y la etiqueta salen de la categoría que calcula el backend (bajo,
//   medio y alto, según el baremo de cada prueba), nunca de los umbrales 80/70
//   del prototipo (Strata.dc.html:1957-1960).
// - El puntaje es el normalized de 0 a 100 redondeado, como el prototipo
//   («78 · Alto», :938). Es el mismo valor que hoy trae percentile
//   (round(normalized), 2026-09-11-fase1-nucleo.md:980): no se pierde ningún
//   dato y no se muestra ningún texto que sugiera comparación con una población.

/** Categorías del baremo que tienen color propio. */
export type CategoriaEscala = 'bajo' | 'medio' | 'alto'

/** Tono visual de una escala: su categoría o «sin-dato» (sin categoría o con una que no se reconoce). */
export type TonoEscala = CategoriaEscala | 'sin-dato'

const CATEGORIAS: readonly string[] = ['bajo', 'medio', 'alto']

/** Mínimo de escalas con puntaje para dibujar el radar (D-14): con menos, el polígono no dice nada. */
export const MINIMO_ESCALAS_RADAR = 3

/** Tono de la categoría que trae el backend. Lo desconocido o vacío es neutro, nunca un umbral. */
export function tonoDeCategoria(category: string | null | undefined): TonoEscala {
  const valor = category?.trim().toLowerCase() ?? ''
  return CATEGORIAS.includes(valor) ? (valor as CategoriaEscala) : 'sin-dato'
}

/** «alto» → «Alto». Sin categoría, null. Una categoría desconocida se muestra tal cual, con mayúscula inicial. */
export function etiquetaDeCategoria(category: string | null | undefined): string | null {
  const valor = category?.trim()
  if (!valor) return null
  return valor.charAt(0).toLocaleUpperCase('es-MX') + valor.slice(1)
}

/** Puntaje de 0 a 100 para mostrar: normalized redondeado. null si no hay dato. */
export function puntajeDe(normalized: number | null | undefined): number | null {
  if (normalized == null || !Number.isFinite(normalized)) return null
  return Math.round(normalized)
}

/** Ancho de la barra en porcentaje (0 a 100). Sin dato, 0. */
export function anchoDeBarra(normalized: number | null | undefined): number {
  if (normalized == null || !Number.isFinite(normalized)) return 0
  return Math.min(100, Math.max(0, normalized))
}

/** «78 · Alto» (Strata.dc.html:938). Con un solo dato, ese dato; sin ninguno, «Sin datos». */
export function textoPuntaje(scale: Pick<ReportScale, 'normalized' | 'category'>): string {
  const partes = [puntajeDe(scale.normalized), etiquetaDeCategoria(scale.category)].filter((parte) => parte != null)
  return partes.length > 0 ? partes.join(' · ') : 'Sin datos'
}

/**
 * Nombre accesible de la fila: «Colaboración: 55 de 100, categoría Medio».
 * Empieza con el nombre visible (WCAG 2.5.3) y no depende de cómo se lea «·».
 */
export function descripcionEscala(scale: Pick<ReportScale, 'name' | 'normalized' | 'category'>): string {
  const puntaje = puntajeDe(scale.normalized)
  const categoria = etiquetaDeCategoria(scale.category)
  const partes: string[] = []
  if (puntaje != null) partes.push(`${puntaje} de 100`)
  if (categoria) partes.push(`categoría ${categoria}`)
  return `${scale.name}: ${partes.length > 0 ? partes.join(', ') : 'sin datos'}`
}

/** Escalas que entran al radar: las que tienen puntaje. */
export function escalasConPuntaje(scales: readonly ReportScale[]): ReportScale[] {
  return scales.filter((scale) => puntajeDe(scale.normalized) != null)
}

/** El radar solo se dibuja con 3 o más escalas con puntaje (D-14). */
export function llevaRadar(scales: readonly ReportScale[]): boolean {
  return escalasConPuntaje(scales).length >= MINIMO_ESCALAS_RADAR
}
