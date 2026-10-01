import { render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Card } from './Card'

describe('Card', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('es una tarjeta de vidrio con padding md por defecto', () => {
    render(<Card>Contenido</Card>)
    expect(screen.getByText('Contenido')).toHaveClass('st-card', 'st-card--glass', 'st-card--pad-md')
  })

  it('renderiza el elemento de as y pasa ref, className y atributos', () => {
    const ref = createRef<HTMLElement>()
    render(
      <Card as="section" ref={ref} aria-labelledby="titulo" className="extra" variant="white" padding="lg" hover="lift">
        <h2 id="titulo">Perfil por dimensión</h2>
      </Card>,
    )
    const seccion = screen.getByRole('region', { name: 'Perfil por dimensión' })
    expect(seccion.tagName).toBe('SECTION')
    expect(ref.current).toBe(seccion)
    expect(seccion).toHaveClass('st-card--white', 'st-card--pad-lg', 'st-card--hover-lift', 'extra')
  })

  it('la tarjeta blanca acepta el borde cálido; las demás variantes lo ignoran', () => {
    const { rerender } = render(
      <Card variant="white" borderTone="warm">
        Acceso
      </Card>,
    )
    expect(screen.getByText('Acceso')).toHaveClass('st-card--white', 'st-card--border-warm')

    rerender(
      <Card variant="glass" borderTone="warm">
        Acceso
      </Card>,
    )
    expect(screen.getByText('Acceso')).not.toHaveClass('st-card--border-warm')
  })

  it('la variante oscura activa el foco claro', () => {
    render(<Card variant="dark">Vista previa</Card>)
    expect(screen.getByText('Vista previa')).toHaveClass('st-card--dark', 'st-on-dark')
  })

  it('con staggerIndex entra escalonada; sin índice no se anima', () => {
    const { rerender } = render(<Card staggerIndex={3}>Prueba</Card>)
    const tarjeta = screen.getByText('Prueba')
    expect(tarjeta).toHaveClass('st-card--enter')
    expect(tarjeta.style.getPropertyValue('--i')).toBe('3')

    rerender(<Card>Prueba</Card>)
    expect(screen.getByText('Prueba')).not.toHaveClass('st-card--enter')
  })

  it('no se anima con movimiento reducido', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      })),
    )
    render(<Card staggerIndex={2}>Prueba</Card>)
    expect(screen.getByText('Prueba')).not.toHaveClass('st-card--enter')
  })
})
