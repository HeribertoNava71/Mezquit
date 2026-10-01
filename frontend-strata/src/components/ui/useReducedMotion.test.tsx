import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { prefersReducedMotion, useReducedMotion } from './useReducedMotion'

function Sonda() {
  const reducir = useReducedMotion()
  return <p>{reducir ? 'reducido' : 'normal'}</p>
}

/** matchMedia falso y controlable: cambia la preferencia y avisa a los suscriptores. */
function simularPreferencia(inicial: boolean) {
  let matches = inicial
  const oyentes = new Set<() => void>()
  const mql = {
    get matches() {
      return matches
    },
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addEventListener: (_tipo: string, oyente: () => void) => oyentes.add(oyente),
    removeEventListener: (_tipo: string, oyente: () => void) => oyentes.delete(oyente),
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  } as unknown as MediaQueryList
  vi.stubGlobal('matchMedia', vi.fn(() => mql))
  return {
    oyentes,
    cambiar(valor: boolean) {
      matches = valor
      oyentes.forEach((oyente) => oyente())
    },
  }
}

describe('useReducedMotion', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('devuelve false si no se pidió reducir el movimiento', () => {
    render(<Sonda />)
    expect(screen.getByText('normal')).toBeInTheDocument()
  })

  it('devuelve true con prefers-reduced-motion: reduce', () => {
    simularPreferencia(true)
    render(<Sonda />)
    expect(screen.getByText('reducido')).toBeInTheDocument()
    expect(prefersReducedMotion()).toBe(true)
  })

  it('se actualiza cuando cambia la preferencia y se desuscribe al desmontar', () => {
    const preferencia = simularPreferencia(false)
    const { unmount } = render(<Sonda />)
    expect(screen.getByText('normal')).toBeInTheDocument()

    act(() => preferencia.cambiar(true))
    expect(screen.getByText('reducido')).toBeInTheDocument()

    unmount()
    expect(preferencia.oyentes.size).toBe(0)
  })
})
