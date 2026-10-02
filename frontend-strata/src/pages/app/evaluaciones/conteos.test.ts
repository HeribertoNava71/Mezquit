import { describe, expect, it } from 'vitest'
import { contarInvitaciones, conteosDeResumen, estadosConInvitaciones, sumarConteos, textoConteo } from './conteos'

describe('sumarConteos', () => {
  it('suma cada estado de todas las evaluaciones, con las expiradas derivadas de cada una', () => {
    expect(
      sumarConteos([
        { counts: { total: 6, pendiente: 1, iniciada: 1, completada: 3 } },
        { counts: { total: 5, pendiente: 0, iniciada: 0, completada: 5 } },
        { counts: { total: 2, pendiente: 2, iniciada: 0, completada: 0 } },
      ]),
    ).toEqual({ conteo: { pendiente: 3, iniciada: 1, completada: 8, expirada: 1 }, total: 13 })
  })

  it('sin evaluaciones da ceros', () => {
    expect(sumarConteos([])).toEqual({ conteo: { pendiente: 0, iniciada: 0, completada: 0, expirada: 0 }, total: 0 })
  })
})

describe('contarInvitaciones', () => {
  it('cuenta los cuatro estados del backend e ignora uno desconocido', () => {
    const conteo = contarInvitaciones([
      { status: 'pendiente' },
      { status: 'pendiente' },
      { status: 'iniciada' },
      { status: 'completada' },
      { status: 'expirada' },
      { status: 'archivada' },
    ])
    expect(conteo).toEqual({ pendiente: 2, iniciada: 1, completada: 1, expirada: 1 })
  })
})

describe('conteosDeResumen', () => {
  it('toma los tres conteos del índice y deriva las expiradas del total (PB-07)', () => {
    expect(conteosDeResumen({ total: 6, pendiente: 2, iniciada: 1, completada: 2 })).toEqual({
      pendiente: 2,
      iniciada: 1,
      completada: 2,
      expirada: 1,
    })
  })

  it('nunca da expiradas negativas', () => {
    expect(conteosDeResumen({ total: 1, pendiente: 1, iniciada: 1, completada: 0 }).expirada).toBe(0)
  })
})

describe('textoConteo y estadosConInvitaciones', () => {
  it('concuerda en número', () => {
    expect(textoConteo('pendiente', 1)).toBe('1 pendiente')
    expect(textoConteo('completada', 3)).toBe('3 completadas')
    expect(textoConteo('expirada', 0)).toBe('0 expiradas')
  })

  it('devuelve solo los estados con candidatos, en orden de avance', () => {
    expect(estadosConInvitaciones({ pendiente: 0, iniciada: 2, completada: 1, expirada: 0 })).toEqual([
      'iniciada',
      'completada',
    ])
  })
})
