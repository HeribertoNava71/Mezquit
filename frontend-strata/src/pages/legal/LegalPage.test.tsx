import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import AvisoPrivacidadPage from '@/pages/AvisoPrivacidadPage'
import TerminosPage from '@/pages/TerminosPage'
import LegalPage from './LegalPage'

function montar(elemento: ReactElement) {
  return render(<MemoryRouter>{elemento}</MemoryRouter>)
}

describe('LegalPage', () => {
  it('aviso de privacidad: H1 y el contenido pendiente a la vista', () => {
    montar(<AvisoPrivacidadPage />)
    expect(screen.getByRole('heading', { level: 1, name: 'Aviso de privacidad' })).toBeInTheDocument()
    const documento = screen.getByRole('article', { name: 'Aviso de privacidad' })
    expect(documento).toHaveClass('st-legal__documento')
    expect(screen.getByText('[PENDIENTE: contenido del aviso de privacidad conforme a la LFPDPPP]')).toHaveClass(
      'st-pendiente',
    )
  })

  it('términos y condiciones: H1 y el contenido pendiente a la vista', () => {
    montar(<TerminosPage />)
    expect(screen.getByRole('heading', { level: 1, name: 'Términos y condiciones' })).toBeInTheDocument()
    expect(screen.getByText('[PENDIENTE: contenido de términos y condiciones]')).toHaveClass('st-pendiente')
  })

  it('con texto real: un párrafo por bloque, sin marcador pendiente', () => {
    montar(<LegalPage title="Aviso de privacidad" body={'Primer párrafo.\n\nSegundo párrafo.'} />)
    const parrafos = screen.getAllByText(/párrafo\./)
    expect(parrafos.map((p) => p.textContent)).toEqual(['Primer párrafo.', 'Segundo párrafo.'])
    for (const parrafo of parrafos) expect(parrafo).toHaveClass('st-legal__parrafo')
    expect(document.querySelector('.st-pendiente')).toBeNull()
  })
})
