import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CargaDeRuta } from './CargaDeRuta'

describe('CargaDeRuta', () => {
  it('muestra el EstadoCarga del sistema (role="status") en el hueco del contenido', () => {
    const { container } = render(<CargaDeRuta />)
    expect(screen.getByRole('status')).toHaveTextContent('Cargando…')
    expect(container.firstElementChild).toHaveClass('st-carga-ruta')
  })
})
