import type { CatalogCategory, CatalogTest } from '@/api/catalog'

// Datos de la home que salen de GET /api/catalog (una sola llamada, en HomePage):
// el rango de duración de la fila de confianza del hero (D-18) y las pruebas
// del catálogo exprés (mapa.md, V-5). Solo funciones puras.

/** Estado de la llamada a GET /api/catalog en la home. */
export type EstadoCatalogo =
  | { estado: 'cargando' }
  | { estado: 'listo'; categorias: CatalogCategory[] }
  | { estado: 'error' }

/** Rango de duración, en minutos, de las pruebas publicadas. */
export interface RangoDuracion {
  min: number
  max: number
}

/**
 * Texto de la fila de confianza mientras carga, si la llamada falla o si
 * ninguna prueba trae duración. No inventa cifras (D-18).
 */
export const DURACION_RESPALDO = 'Duración según la prueba'

/** Mínimo y máximo de duration_min en todas las categorías; null si no hay datos válidos. */
export function rangoDeDuracion(categorias: readonly CatalogCategory[]): RangoDuracion | null {
  const minutos = categorias
    .flatMap((categoria) => categoria.tests ?? [])
    .map((prueba) => Math.round(Number(prueba.duration_min)))
    .filter((valor) => Number.isFinite(valor) && valor > 0)
  if (minutos.length === 0) return null
  return { min: Math.min(...minutos), max: Math.max(...minutos) }
}

/** «10–25 min por prueba», «15 min por prueba» o el texto de respaldo. */
export function textoDuracion(rango: RangoDuracion | null): string {
  if (!rango) return DURACION_RESPALDO
  if (rango.min === rango.max) return `${rango.min} min por prueba`
  return `${rango.min}–${rango.max} min por prueba`
}

/** Texto de duración según el estado de la llamada. */
export function duracionDelCatalogo(catalogo: EstadoCatalogo): string {
  return catalogo.estado === 'listo' ? textoDuracion(rangoDeDuracion(catalogo.categorias)) : DURACION_RESPALDO
}

/** Prueba destacada del catálogo exprés con su categoría. */
export interface PruebaDestacada {
  prueba: CatalogTest
  categoria: CatalogCategory
}

/**
 * La primera prueba de cada una de las primeras categorías (mapa.md, V-5).
 * El backend no manda categorías vacías, pero se saltan por si acaso: si hay
 * menos de `cuantas`, se devuelven las que haya.
 */
export function pruebasDestacadas(categorias: readonly CatalogCategory[], cuantas = 3): PruebaDestacada[] {
  return categorias
    .filter((categoria) => (categoria.tests ?? []).length > 0)
    .slice(0, cuantas)
    .map((categoria) => ({ prueba: categoria.tests[0], categoria }))
}
