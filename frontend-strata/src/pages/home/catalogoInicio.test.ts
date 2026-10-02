import { describe, expect, it } from 'vitest'
import type { CatalogCategory, CatalogTest } from '@/api/catalog'
import {
  DURACION_RESPALDO,
  duracionDelCatalogo,
  pruebasDestacadas,
  rangoDeDuracion,
  textoDuracion,
} from './catalogoInicio'

function prueba(slug: string, duration_min: number): CatalogTest {
  return { id: slug.length, slug, name: slug, description: '', duration_min, item_count: 10 }
}

function categoria(id: string, tests: CatalogTest[]): CatalogCategory {
  return { id, label: id, count: tests.length, tests }
}

const CATALOGO = [
  categoria('personalidad', [prueba('adaptabilidad', 10), prueba('rasgos', 20)]),
  categoria('razonamiento', [prueba('abstracto', 25), prueba('atencion', 15)]),
  categoria('integridad', [prueba('confiabilidad', 12)]),
  categoria('intereses', [prueba('vocacional', 20)]),
]

describe('rangoDeDuracion', () => {
  it('toma el mínimo y el máximo de duration_min de todas las categorías', () => {
    expect(rangoDeDuracion(CATALOGO)).toEqual({ min: 10, max: 25 })
  })

  it('ignora duraciones vacías o no válidas', () => {
    const raro = [categoria('a', [prueba('x', 0), prueba('y', Number.NaN), prueba('z', 18)])]
    expect(rangoDeDuracion(raro)).toEqual({ min: 18, max: 18 })
  })

  it('sin pruebas no hay rango', () => {
    expect(rangoDeDuracion([])).toBeNull()
    expect(rangoDeDuracion([categoria('vacia', [])])).toBeNull()
  })
})

describe('textoDuracion', () => {
  it('escribe el rango por prueba, con una sola cifra si mínimo y máximo coinciden', () => {
    expect(textoDuracion({ min: 10, max: 25 })).toBe('10–25 min por prueba')
    expect(textoDuracion({ min: 15, max: 15 })).toBe('15 min por prueba')
  })

  it('sin rango usa el respaldo, sin inventar cifras', () => {
    expect(textoDuracion(null)).toBe(DURACION_RESPALDO)
    expect(DURACION_RESPALDO).not.toMatch(/\d/)
  })
})

describe('duracionDelCatalogo', () => {
  it('usa el rango solo cuando el catálogo cargó', () => {
    expect(duracionDelCatalogo({ estado: 'listo', categorias: CATALOGO })).toBe('10–25 min por prueba')
    expect(duracionDelCatalogo({ estado: 'cargando' })).toBe(DURACION_RESPALDO)
    expect(duracionDelCatalogo({ estado: 'error' })).toBe(DURACION_RESPALDO)
  })
})

describe('pruebasDestacadas', () => {
  it('toma la primera prueba de cada una de las tres primeras categorías', () => {
    const destacadas = pruebasDestacadas(CATALOGO)
    expect(destacadas.map(({ prueba: p, categoria: c }) => [c.id, p.slug])).toEqual([
      ['personalidad', 'adaptabilidad'],
      ['razonamiento', 'abstracto'],
      ['integridad', 'confiabilidad'],
    ])
  })

  it('con menos categorías devuelve las que haya y salta las vacías', () => {
    expect(pruebasDestacadas(CATALOGO.slice(0, 2))).toHaveLength(2)
    const conVacia = [categoria('vacia', []), ...CATALOGO.slice(0, 1)]
    expect(pruebasDestacadas(conVacia).map(({ prueba: p }) => p.slug)).toEqual(['adaptabilidad'])
    expect(pruebasDestacadas([])).toEqual([])
  })
})
