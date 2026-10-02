import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AvisoDeRuta } from './AvisoDeRuta'

function montar(state: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/perfil', state }]}>
      <AvisoDeRuta />
    </MemoryRouter>,
  )
}

describe('AvisoDeRuta', () => {
  it('muestra el aviso de location.state con el Callout del sistema y role="alert"', () => {
    const { container } = montar({ aviso: 'Tu sesión expiró. Vuelve a entrar.' })
    const aviso = screen.getByRole('alert')
    expect(aviso).toHaveTextContent('Tu sesión expiró. Vuelve a entrar.')
    expect(aviso).toHaveClass('st-callout', 'st-callout--info')
    // Ícono decorativo junto al texto (D-22).
    expect(container.querySelector('.st-callout__icon')).toHaveAttribute('aria-hidden', 'true')
  })

  it('sin aviso, o con un aviso que no es texto, no pinta nada', () => {
    const { container, unmount } = montar(null)
    expect(container).toBeEmptyDOMElement()
    unmount()

    const otro = montar({ aviso: { texto: 'no' } })
    expect(otro.container).toBeEmptyDOMElement()
  })
})
