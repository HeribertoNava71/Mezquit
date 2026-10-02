import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { SITE } from '@/config/site'
import { CandidateFrame } from './CandidateFrame'

function montar(organization?: string) {
  return render(
    <MemoryRouter>
      <CandidateFrame organization={organization}>
        <p>Contenido de la tarjeta</p>
      </CandidateFrame>
    </MemoryRouter>,
  )
}

describe('CandidateFrame', () => {
  it('con organización: su inicial y su nombre, más «Powered by» y la marca de Strata', () => {
    const { container } = montar('Comercializadora Río Claro')

    const inicial = container.querySelector('.st-avatar')
    expect(inicial).toHaveTextContent('C')
    expect(inicial).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByText('Comercializadora Río Claro')).toBeInTheDocument()
    // Frase en inglés: los lectores de pantalla la pronuncian en inglés (WCAG 3.1.2).
    expect(screen.getByText('Powered by')).toHaveAttribute('lang', 'en')
    expect(screen.getByText(SITE.name, { selector: '.st-cand-frame__strata' })).toBeInTheDocument()
    expect(container.querySelector('.st-cand-frame__mark')).toHaveAttribute('src', SITE.brand.mark)
    expect(screen.getByText('Contenido de la tarjeta').closest('.st-card')).toHaveClass(
      'st-card--white',
      'st-card--border-warm',
    )
  })

  it('sin organización: la marca de Strata, que no enlaza', () => {
    montar()
    expect(screen.getByText(SITE.name)).toBeInTheDocument()
    expect(screen.queryByText('Powered by')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: new RegExp(SITE.name) })).not.toBeInTheDocument()
  })

  it('halos globales del candidato, sin barra ni navegación del sitio, y la fila de enlaces', () => {
    const { container } = montar('Acme')
    expect(container.querySelector('.st-page')).toHaveClass('st-page--candidate')
    expect(container.querySelector('.st-page__halos')).toBeInTheDocument()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    expect(screen.queryByRole('banner')).not.toBeInTheDocument()

    // Con SITE.email aún [PENDIENTE], Soporte muestra el marcador sin mailto (Fase 8).
    const enlaces = screen.getAllByRole('link')
    expect(enlaces.map((enlace) => [enlace.textContent, enlace.getAttribute('href')])).toEqual([
      ['¿Problemas con la prueba?', '/ayuda'],
      ['Aviso de privacidad', '/aviso-de-privacidad'],
    ])
    expect(screen.getByRole('contentinfo')).toHaveTextContent(`Soporte: ${SITE.email}`)
  })
})
