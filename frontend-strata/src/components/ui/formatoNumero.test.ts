import { describe, expect, it } from 'vitest'
import { formatearNumero, textoCantidad, textoCreditos } from './formatoNumero'

describe('formatearNumero', () => {
  it('usa el separador de miles de es-MX', () => {
    expect(formatearNumero(0)).toBe('0')
    expect(formatearNumero(37)).toBe('37')
    expect(formatearNumero(1250)).toBe('1,250')
    expect(formatearNumero(1500000)).toBe('1,500,000')
  })
})

describe('textoCantidad', () => {
  it('pone la cifra formateada y el sustantivo en singular o plural', () => {
    expect(textoCantidad(1, 'candidato', 'candidatos')).toBe('1 candidato')
    expect(textoCantidad(0, 'candidato', 'candidatos')).toBe('0 candidatos')
    expect(textoCantidad(1250, 'evaluación', 'evaluaciones')).toBe('1,250 evaluaciones')
    expect(textoCantidad(-1, 'crédito', 'créditos')).toBe('-1 crédito')
  })
})

describe('textoCreditos', () => {
  it('dice «crédito» o «créditos» con la cifra formateada', () => {
    expect(textoCreditos(1)).toBe('1 crédito')
    expect(textoCreditos(0)).toBe('0 créditos')
    expect(textoCreditos(40)).toBe('40 créditos')
    expect(textoCreditos(1500)).toBe('1,500 créditos')
  })
})
