import type { CatalogCategory, CatalogTest } from '@/api/catalog'
import type { SegmentedFilterOption } from '@/components/ui'

// Datos del catálogo (/pruebas y /app/pruebas) que salen de GET /api/catalog.
// Solo funciones puras: filtro por categoría, búsqueda por texto, conteos y textos.
// Las categorías y sus conteos vienen de la API, en el orden en que llegan
// (R-09, S-16): nada de categorías fijas como las del prototipo (Strata.dc.html:1797).

/**
 * Valor del filtro «Todas». Los id de categoría son slugs en minúsculas
 * (personalidad, razonamiento…), así que este valor no choca con ninguno.
 */
export const TODAS = '__todas__'

/**
 * Último índice del escalonado de entrada (55 ms entre tarjetas). Con 18 pruebas,
 * la última esperaría casi un segundo; desde la duodécima entran juntas.
 */
export const INDICE_MAXIMO_ESCALONADO = 11

/** Prueba con la categoría a la que pertenece (para la tarjeta y su Tag). */
export interface PruebaDelCatalogo {
  prueba: CatalogTest
  categoria: Pick<CatalogCategory, 'id' | 'label'>
}

/**
 * Categorías que se muestran: las que traen al menos una prueba. El backend ya
 * omite las vacías (CatalogController); se filtran también aquí para que un
 * filtro nunca lleve a una categoría sin pruebas.
 */
export function categoriasConPruebas(categorias: readonly CatalogCategory[]): CatalogCategory[] {
  return categorias
    .map((categoria) => ({ ...categoria, tests: Array.isArray(categoria.tests) ? categoria.tests : [] }))
    .filter((categoria) => categoria.tests.length > 0)
}

/** Conteo de una categoría: el `count` de la API; si no es una cifra válida, sus pruebas. */
export function conteoDeCategoria(categoria: CatalogCategory): number {
  const { count } = categoria
  return Number.isInteger(count) && count >= 0 ? count : categoria.tests.length
}

/** Total del catálogo: la suma de los conteos de sus categorías (chip «Todas»). */
export function totalDePruebas(categorias: readonly CatalogCategory[]): number {
  return categorias.reduce((suma, categoria) => suma + conteoDeCategoria(categoria), 0)
}

/** Opciones del SegmentedFilter: «Todas» y una por categoría, cada una con su conteo. */
export function opcionesDeFiltro(categorias: readonly CatalogCategory[]): SegmentedFilterOption[] {
  return [
    { value: TODAS, label: 'Todas', count: totalDePruebas(categorias) },
    ...categorias.map((categoria) => ({
      value: categoria.id,
      label: categoria.label,
      count: conteoDeCategoria(categoria),
    })),
  ]
}

/**
 * Texto comparable: minúsculas y sin acentos ni diéresis, para que «numerico»
 * encuentre «numérico» y «etica», «Ética».
 */
export function normalizarTexto(texto: string): string {
  return texto.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

/** Palabras de la búsqueda, ya normalizadas. Una búsqueda en blanco no tiene términos. */
export function terminosDeBusqueda(consulta: string): string[] {
  return normalizarTexto(consulta).split(/\s+/).filter(Boolean)
}

/**
 * La prueba coincide si cada palabra aparece en su nombre o en su descripción,
 * como la búsqueda anterior (2026-09-11-fase3-sitio-ventas.md:516-523), sin
 * importar mayúsculas, acentos ni el orden de las palabras.
 */
export function coincideConBusqueda(prueba: CatalogTest, terminos: readonly string[]): boolean {
  if (terminos.length === 0) return true
  const texto = normalizarTexto(`${prueba.name ?? ''} ${prueba.description ?? ''}`)
  return terminos.every((termino) => texto.includes(termino))
}

/**
 * Pruebas visibles con el filtro y la búsqueda, en el orden de la API
 * (categorías en orden fijo y, dentro de cada una, por nombre).
 */
export function filtrarPruebas(
  categorias: readonly CatalogCategory[],
  categoriaId: string,
  consulta: string,
): PruebaDelCatalogo[] {
  const terminos = terminosDeBusqueda(consulta)
  return categorias
    .filter((categoria) => categoriaId === TODAS || categoria.id === categoriaId)
    .flatMap((categoria) =>
      categoria.tests
        .filter((prueba) => coincideConBusqueda(prueba, terminos))
        .map((prueba) => ({ prueba, categoria: { id: categoria.id, label: categoria.label } })),
    )
}

/** «reactivo» o «reactivos», según la cantidad. */
export function unidadDeReactivos(cantidad: number): string {
  return cantidad === 1 ? 'reactivo' : 'reactivos'
}

/** Cifra de la API: un número o un texto numérico. null, vacío o cualquier otra cosa no es cifra. */
function cifra(valor: unknown): number | null {
  if (typeof valor === 'string' && valor.trim() !== '') valor = Number(valor)
  return typeof valor === 'number' && Number.isFinite(valor) ? valor : null
}

/** Minutos de la prueba si son una cifra positiva; si no, null (la tarjeta omite el dato). */
export function minutosDePrueba(prueba: CatalogTest): number | null {
  const minutos = cifra(prueba.duration_min)
  return minutos !== null && minutos > 0 ? Math.round(minutos) : null
}

/** Reactivos declarados de la prueba (R-10) si son un entero de 0 o más; si no, null. */
export function reactivosDePrueba(prueba: CatalogTest): number | null {
  const reactivos = cifra(prueba.item_count)
  return reactivos !== null && Number.isInteger(reactivos) && reactivos >= 0 ? reactivos : null
}

/** Mensaje de búsqueda sin resultados (mapa.md, RH-2). */
export const SIN_RESULTADOS = 'No hay pruebas que coincidan con tu búsqueda.'

/**
 * Resumen que se anuncia a los lectores de pantalla al filtrar o buscar
 * (WCAG 4.1.3, mensajes de estado).
 */
export function resumenDeResultados(visibles: number, total: number): string {
  if (visibles === 0) return SIN_RESULTADOS
  if (visibles >= total) return total === 1 ? '1 prueba en el catálogo.' : `${total} pruebas en el catálogo.`
  return visibles === 1 ? `1 de ${total} pruebas coincide.` : `${visibles} de ${total} pruebas coinciden.`
}
