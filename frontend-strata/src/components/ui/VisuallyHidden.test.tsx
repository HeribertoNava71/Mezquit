import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { VisuallyHidden } from './VisuallyHidden'

describe('VisuallyHidden', () => {
  it('da nombre accesible a un botón de ícono', () => {
    render(
      <button type="button">
        <svg aria-hidden="true" />
        <VisuallyHidden>Cerrar</VisuallyHidden>
      </button>,
    )
    expect(screen.getByRole('button', { name: 'Cerrar' })).toBeInTheDocument()
    expect(screen.getByText('Cerrar')).toHaveClass('st-visually-hidden')
  })

  it('renderiza la etiqueta de as y pasa los atributos', () => {
    render(
      <VisuallyHidden as="h2" id="titulo" className="extra">
        Resultados
      </VisuallyHidden>,
    )
    const titulo = screen.getByRole('heading', { level: 2, name: 'Resultados' })
    expect(titulo).toHaveAttribute('id', 'titulo')
    expect(titulo).toHaveClass('st-visually-hidden', 'extra')
  })

  it('agrega el modificador focusable', () => {
    render(<VisuallyHidden focusable>Saltar al contenido</VisuallyHidden>)
    expect(screen.getByText('Saltar al contenido')).toHaveClass('st-visually-hidden', 'st-visually-hidden--focusable')
  })
})
