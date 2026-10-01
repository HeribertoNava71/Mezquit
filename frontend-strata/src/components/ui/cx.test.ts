import { describe, expect, it } from 'vitest'
import { cx } from './cx'

describe('cx', () => {
  it('une textos e ignora los valores falsos', () => {
    expect(cx('st-btn', false, null, undefined, '', 0, 'st-btn--primary')).toBe('st-btn st-btn--primary')
  })

  it('acepta diccionarios y listas anidadas', () => {
    const loading = false
    expect(
      cx('st-btn', { 'st-btn--primary': true, 'st-btn--ghost': false }, ['a', ['b', loading && 'c']]),
    ).toBe('st-btn st-btn--primary a b')
  })

  it('convierte los números distintos de cero e ignora true', () => {
    expect(cx(1, 0, true)).toBe('1')
  })

  it('devuelve una cadena vacía si no hay clases', () => {
    expect(cx()).toBe('')
    expect(cx(false, { oculto: false })).toBe('')
  })
})
