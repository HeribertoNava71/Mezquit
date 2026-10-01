import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { EstadoVacio } from './EstadoVacio'

describe('EstadoVacio', () => {
  it('muestra título, texto y acción, sin role por defecto', async () => {
    const user = userEvent.setup()
    const crear = vi.fn()
    const { container } = render(
      <EstadoVacio
        title="Aún no tienes evaluaciones"
        description="Crea la primera para invitar candidatos."
        actions={
          <button type="button" onClick={crear}>
            Invitar candidatos
          </button>
        }
      />,
    )
    expect(screen.getByText('Aún no tienes evaluaciones')).toBeInTheDocument()
    expect(screen.getByText('Crea la primera para invitar candidatos.')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    expect(container.firstChild).toHaveClass('st-estado', 'st-estado-vacio', 'st-estado--md')

    await user.click(screen.getByRole('button', { name: 'Invitar candidatos' }))
    expect(crear).toHaveBeenCalledTimes(1)
  })

  it('size="sm" reproduce el carrito vacío; acepta role="status" e ícono decorativo', () => {
    const { container } = render(
      <EstadoVacio
        size="sm"
        role="status"
        icon={<svg data-icono />}
        title="Ningún candidato en este estado"
        description="Prueba con otro filtro."
      />,
    )
    const estado = screen.getByRole('status')
    expect(estado).toHaveClass('st-estado--sm')
    expect(estado).toHaveTextContent('Ningún candidato en este estado')
    expect(container.querySelector('.st-estado__icon')).toHaveAttribute('aria-hidden', 'true')
  })

  it('titleAs convierte el título en encabezado sin cambiar su clase', () => {
    render(<EstadoVacio titleAs="h2" title="Aún no hay movimientos" className="extra" data-prueba="vacio" />)
    const titulo = screen.getByRole('heading', { level: 2, name: 'Aún no hay movimientos' })
    expect(titulo).toHaveClass('st-estado__title')
    expect(titulo.parentElement).toHaveClass('st-estado-vacio', 'extra')
    expect(titulo.parentElement).toHaveAttribute('data-prueba', 'vacio')
  })
})
