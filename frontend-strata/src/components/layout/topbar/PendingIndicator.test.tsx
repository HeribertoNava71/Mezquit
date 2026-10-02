import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { PendingIndicator } from './PendingIndicator'

function montar(pendientes: number | null) {
  return render(
    <MemoryRouter>
      <PendingIndicator pendientes={pendientes} />
    </MemoryRouter>,
  )
}

describe('PendingIndicator', () => {
  it.each([
    [3, '3 solicitudes pendientes', '3 pendientes'],
    [1, '1 solicitud pendiente', '1 pendiente'],
    [0, 'Sin solicitudes pendientes', 'Sin pendientes'],
    [1200, '1,200 solicitudes pendientes', '1,200 pendientes'],
  ])('%i → «%s» (corto: «%s») y lleva a Solicitudes', (pendientes, largo, corto) => {
    const { container } = montar(pendientes)
    const enlace = screen.getByRole('link', { name: largo })
    expect(enlace).toHaveAttribute('href', '/admin/creditos')
    const breve = container.querySelector('.st-pending__short')
    expect(breve).toHaveTextContent(corto)
    expect(breve).toHaveAttribute('aria-hidden', 'true')
  })

  it('sin dato (cargando o con error) no se muestra', () => {
    const { container } = montar(null)
    expect(container).toBeEmptyDOMElement()
  })
})
