import { describe, expect, it } from 'vitest'
import type { ReportScale } from '@/api/report'
import {
  anchoDeBarra,
  descripcionEscala,
  escalasConPuntaje,
  etiquetaDeCategoria,
  llevaRadar,
  puntajeDe,
  textoPuntaje,
  tonoDeCategoria,
} from './escalas'

function escala(parcial: Partial<ReportScale> = {}): ReportScale {
  return {
    code: 'RES',
    name: 'Orientación a resultados',
    normalized: 75,
    percentile: 75,
    category: 'alto',
    interpretation: 'Puntaje alto en Orientación a resultados: es una fortaleza marcada del candidato.',
    ...parcial,
  }
}

describe('tonoDeCategoria', () => {
  it('usa la categoría del backend (bajo, medio, alto) sin importar mayúsculas ni espacios', () => {
    expect(tonoDeCategoria('alto')).toBe('alto')
    expect(tonoDeCategoria('Medio')).toBe('medio')
    expect(tonoDeCategoria(' bajo ')).toBe('bajo')
  })

  it('sin categoría o con una desconocida es neutro (nunca se deduce de un umbral)', () => {
    expect(tonoDeCategoria(null)).toBe('sin-dato')
    expect(tonoDeCategoria(undefined)).toBe('sin-dato')
    expect(tonoDeCategoria('')).toBe('sin-dato')
    expect(tonoDeCategoria('muy alto')).toBe('sin-dato')
  })
})

describe('etiquetaDeCategoria', () => {
  it('pone mayúscula inicial y conserva categorías desconocidas', () => {
    expect(etiquetaDeCategoria('alto')).toBe('Alto')
    expect(etiquetaDeCategoria('muy alto')).toBe('Muy alto')
    expect(etiquetaDeCategoria(null)).toBeNull()
    expect(etiquetaDeCategoria('  ')).toBeNull()
  })
})

describe('puntajeDe y anchoDeBarra', () => {
  it('redondea el normalized como el percentil del backend (round)', () => {
    expect(puntajeDe(56.25)).toBe(56)
    expect(puntajeDe(68.75)).toBe(69)
    expect(puntajeDe(0)).toBe(0)
    expect(puntajeDe(null)).toBeNull()
    expect(puntajeDe(Number.NaN)).toBeNull()
  })

  it('la barra se limita a 0–100 y sin dato mide 0', () => {
    expect(anchoDeBarra(56.25)).toBe(56.25)
    expect(anchoDeBarra(130)).toBe(100)
    expect(anchoDeBarra(-4)).toBe(0)
    expect(anchoDeBarra(null)).toBe(0)
  })
})

describe('textoPuntaje', () => {
  it('«{normalized} · {categoría}», como el prototipo', () => {
    expect(textoPuntaje(escala({ normalized: 78, category: 'alto' }))).toBe('78 · Alto')
    expect(textoPuntaje(escala({ normalized: 55.4, category: 'medio' }))).toBe('55 · Medio')
  })

  it('con un solo dato muestra ese dato; sin datos, «Sin datos»', () => {
    expect(textoPuntaje(escala({ normalized: 40, category: null }))).toBe('40')
    expect(textoPuntaje(escala({ normalized: null, category: 'bajo' }))).toBe('Bajo')
    expect(textoPuntaje(escala({ normalized: null, category: null }))).toBe('Sin datos')
  })

  it('no agrega textos de percentil ni de norma', () => {
    expect(textoPuntaje(escala())).not.toMatch(/pc|percentil|norma/i)
  })
})

describe('descripcionEscala', () => {
  it('empieza con el nombre visible y dice puntaje y categoría', () => {
    expect(descripcionEscala(escala({ name: 'Colaboración', normalized: 55, category: 'medio' }))).toBe(
      'Colaboración: 55 de 100, categoría Medio',
    )
    expect(descripcionEscala(escala({ name: 'Adaptabilidad', normalized: null, category: null }))).toBe(
      'Adaptabilidad: sin datos',
    )
  })
})

describe('escalas del radar', () => {
  it('solo entran las escalas con puntaje, y el radar pide 3 o más', () => {
    const tres = [escala({ code: 'A' }), escala({ code: 'B' }), escala({ code: 'C' })]
    expect(llevaRadar(tres)).toBe(true)
    expect(llevaRadar(tres.slice(0, 2))).toBe(false)

    const unaSinDato = [...tres.slice(0, 2), escala({ code: 'C', normalized: null })]
    expect(escalasConPuntaje(unaSinDato).map((s) => s.code)).toEqual(['A', 'B'])
    expect(llevaRadar(unaSinDato)).toBe(false)
  })
})
