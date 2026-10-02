import { describe, expect, it } from 'vitest'
import { CORTES_BARRA, consultaEscritorio } from './cortes'

describe('cortes de las barras (Fase 8)', () => {
  it('cada barra tiene su ancho de escritorio, sin pasar de 1024 px', () => {
    expect(CORTES_BARRA).toEqual({ base: 768, rh: 900, publica: 960 })
    for (const corte of Object.values(CORTES_BARRA)) expect(corte).toBeLessThanOrEqual(1024)
  })

  it('arma la media query del diseño de escritorio', () => {
    expect(consultaEscritorio('base')).toBe('(min-width: 768px)')
    expect(consultaEscritorio('rh')).toBe('(min-width: 900px)')
    expect(consultaEscritorio('publica')).toBe('(min-width: 960px)')
  })
})
