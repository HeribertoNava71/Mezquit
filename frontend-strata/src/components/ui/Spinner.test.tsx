import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Spinner } from './Spinner'

describe('Spinner', () => {
  it('con label es un status con el texto oculto a la vista', () => {
    render(<Spinner label="Cargando resultados" size="lg" />)
    const estado = screen.getByRole('status')
    expect(estado).toHaveTextContent('Cargando resultados')
    expect(estado).toHaveClass('st-spinner', 'st-spinner--lg')
    expect(screen.getByText('Cargando resultados')).toHaveClass('st-visually-hidden')
  })

  it('sin label es decorativo', () => {
    const { container } = render(<Spinner />)
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
