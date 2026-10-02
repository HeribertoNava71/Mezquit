import { describe, expect, it } from 'vitest'
import type { CatalogCategory, CatalogTest } from '@/api/catalog'
import {
  TODAS,
  categoriasConPruebas,
  coincideConBusqueda,
  conteoDeCategoria,
  filtrarPruebas,
  minutosDePrueba,
  normalizarTexto,
  opcionesDeFiltro,
  reactivosDePrueba,
  resumenDeResultados,
  terminosDeBusqueda,
  totalDePruebas,
  unidadDeReactivos,
} from './catalogo'

function prueba(parcial: Partial<CatalogTest> & Pick<CatalogTest, 'slug' | 'name'>): CatalogTest {
  return { id: 1, description: '', duration_min: 10, item_count: 20, ...parcial }
}

/** Forma de GET /api/catalog (CatalogController): categorías en orden fijo y pruebas por nombre. */
const CATEGORIAS: CatalogCategory[] = [
  {
    id: 'personalidad',
    label: 'Personalidad',
    count: 2,
    tests: [
      prueba({ id: 6, slug: 'adaptabilidad', name: 'Adaptabilidad', description: 'Evalúa flexibilidad ante cambios organizacionales.' }),
      prueba({ id: 7, slug: 'trabajo-en-equipo', name: 'Trabajo en equipo', description: 'Mide preferencias de colaboración.' }),
    ],
  },
  {
    id: 'razonamiento',
    label: 'Razonamiento',
    count: 2,
    tests: [
      prueba({ id: 9, slug: 'razonamiento-numerico', name: 'Razonamiento numérico', description: 'Interpreta datos cuantitativos.' }),
      prueba({ id: 10, slug: 'razonamiento-verbal', name: 'Razonamiento verbal', description: 'Comprensión de texto y argumentación lógica.' }),
    ],
  },
  {
    id: 'integridad',
    label: 'Integridad',
    count: 1,
    tests: [prueba({ id: 14, slug: 'etica-en-el-trabajo', name: 'Ética en el trabajo', description: 'Decisiones en situaciones de dilema.' })],
  },
]

const slugs = (lista: ReturnType<typeof filtrarPruebas>) => lista.map(({ prueba: p }) => p.slug)

describe('categoriasConPruebas', () => {
  it('quita las categorías sin pruebas y conserva el orden de la API', () => {
    const vacia: CatalogCategory = { id: 'intereses', label: 'Intereses', count: 0, tests: [] }
    const sinLista = { id: 'otra', label: 'Otra', count: 0 } as unknown as CatalogCategory
    expect(categoriasConPruebas([CATEGORIAS[0], vacia, CATEGORIAS[1], sinLista]).map((c) => c.id)).toEqual([
      'personalidad',
      'razonamiento',
    ])
  })
})

describe('conteos', () => {
  it('usa el count de la API para cada categoría y suma el total', () => {
    expect(conteoDeCategoria(CATEGORIAS[0])).toBe(2)
    expect(totalDePruebas(CATEGORIAS)).toBe(5)
  })

  it('si count no es una cifra válida, cuenta las pruebas', () => {
    const rota = { ...CATEGORIAS[1], count: undefined } as unknown as CatalogCategory
    expect(conteoDeCategoria(rota)).toBe(2)
  })

  it('opciones del filtro: «Todas» con el total y una por categoría con su conteo', () => {
    expect(opcionesDeFiltro(CATEGORIAS)).toEqual([
      { value: TODAS, label: 'Todas', count: 5 },
      { value: 'personalidad', label: 'Personalidad', count: 2 },
      { value: 'razonamiento', label: 'Razonamiento', count: 2 },
      { value: 'integridad', label: 'Integridad', count: 1 },
    ])
  })
})

describe('búsqueda', () => {
  it('normaliza mayúsculas, acentos y diéresis', () => {
    expect(normalizarTexto('Ética Numérica Pingüino')).toBe('etica numerica pinguino')
    expect(terminosDeBusqueda('  Razonamiento   NUMÉRICO ')).toEqual(['razonamiento', 'numerico'])
    expect(terminosDeBusqueda('   ')).toEqual([])
  })

  it('cada palabra debe aparecer en el nombre o en la descripción, en cualquier orden', () => {
    const numerico = CATEGORIAS[1].tests[0]
    expect(coincideConBusqueda(numerico, terminosDeBusqueda('numerico'))).toBe(true)
    expect(coincideConBusqueda(numerico, terminosDeBusqueda('cuantitativos razonamiento'))).toBe(true)
    expect(coincideConBusqueda(numerico, terminosDeBusqueda('numerico verbal'))).toBe(false)
    expect(coincideConBusqueda(numerico, [])).toBe(true)
  })

  it('tolera una descripción nula de la API', () => {
    const sinDescripcion = prueba({ slug: 'x', name: 'Confiabilidad', description: null as unknown as string })
    expect(coincideConBusqueda(sinDescripcion, ['confia'])).toBe(true)
  })
})

describe('filtrarPruebas', () => {
  it('«Todas» sin búsqueda devuelve todo en el orden de la API, con su categoría', () => {
    const todas = filtrarPruebas(CATEGORIAS, TODAS, '')
    expect(slugs(todas)).toEqual([
      'adaptabilidad',
      'trabajo-en-equipo',
      'razonamiento-numerico',
      'razonamiento-verbal',
      'etica-en-el-trabajo',
    ])
    expect(todas[2].categoria).toEqual({ id: 'razonamiento', label: 'Razonamiento' })
  })

  it('filtra por categoría', () => {
    expect(slugs(filtrarPruebas(CATEGORIAS, 'razonamiento', ''))).toEqual(['razonamiento-numerico', 'razonamiento-verbal'])
    expect(filtrarPruebas(CATEGORIAS, 'no-existe', '')).toEqual([])
  })

  it('combina categoría y búsqueda (nombre o descripción, sin acentos)', () => {
    expect(slugs(filtrarPruebas(CATEGORIAS, TODAS, 'etica'))).toEqual(['etica-en-el-trabajo'])
    expect(slugs(filtrarPruebas(CATEGORIAS, TODAS, 'LÓGICA'))).toEqual(['razonamiento-verbal'])
    expect(slugs(filtrarPruebas(CATEGORIAS, 'personalidad', 'razonamiento'))).toEqual([])
  })
})

describe('datos de la tarjeta', () => {
  it('reactivo en singular y plural', () => {
    expect(unidadDeReactivos(1)).toBe('reactivo')
    expect(unidadDeReactivos(0)).toBe('reactivos')
    expect(unidadDeReactivos(24)).toBe('reactivos')
  })

  it('omite duraciones y reactivos que no son cifras válidas', () => {
    expect(minutosDePrueba(prueba({ slug: 'a', name: 'A', duration_min: 15 }))).toBe(15)
    expect(minutosDePrueba(prueba({ slug: 'a', name: 'A', duration_min: 0 }))).toBeNull()
    expect(minutosDePrueba(prueba({ slug: 'a', name: 'A', duration_min: null as unknown as number }))).toBeNull()
    expect(reactivosDePrueba(prueba({ slug: 'a', name: 'A', item_count: 0 }))).toBe(0)
    expect(reactivosDePrueba(prueba({ slug: 'a', name: 'A', item_count: -2 }))).toBeNull()
    expect(reactivosDePrueba(prueba({ slug: 'a', name: 'A', item_count: 'x' as unknown as number }))).toBeNull()
    expect(reactivosDePrueba(prueba({ slug: 'a', name: 'A', item_count: null as unknown as number }))).toBeNull()
    expect(reactivosDePrueba(prueba({ slug: 'a', name: 'A', item_count: '30' as unknown as number }))).toBe(30)
  })
})

describe('resumenDeResultados', () => {
  it('describe el resultado para el anuncio de estado', () => {
    expect(resumenDeResultados(18, 18)).toBe('18 pruebas en el catálogo.')
    expect(resumenDeResultados(1, 1)).toBe('1 prueba en el catálogo.')
    expect(resumenDeResultados(3, 18)).toBe('3 de 18 pruebas coinciden.')
    expect(resumenDeResultados(1, 18)).toBe('1 de 18 pruebas coincide.')
    expect(resumenDeResultados(0, 18)).toBe('No hay pruebas que coincidan con tu búsqueda.')
  })
})
