import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { SITE } from '@/config/site'
import { AuthFrame } from './AuthFrame'

function montar(width?: 'narrow' | 'wide') {
  return render(
    <MemoryRouter>
      <AuthFrame width={width}>
        <p>Contenido de la tarjeta</p>
      </AuthFrame>
    </MemoryRouter>,
  )
}

describe('AuthFrame', () => {
  it('marco del acceso: halos globales, sin barra, tarjeta blanca con borde cálido', () => {
    const { container } = montar()
    expect(container.querySelector('.st-page')).toHaveClass('st-page--candidate')
    expect(container.querySelector('.st-page__halos')).toBeInTheDocument()
    expect(screen.queryByRole('banner')).not.toBeInTheDocument()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    expect(screen.getByText('Contenido de la tarjeta').closest('.st-card')).toHaveClass(
      'st-card--white',
      'st-card--border-warm',
    )
    expect(container.querySelector('.st-auth')).toHaveClass('st-auth--narrow')
  })

  it('la marca lleva a «/»', () => {
    montar()
    const marca = screen.getByRole('link', { name: `${SITE.name}, inicio` })
    expect(marca).toHaveAttribute('href', '/')
    expect(marca).toHaveClass('st-marca--link')
  })

  it('fila de enlaces: evaluación del candidato, aviso de privacidad y soporte', () => {
    montar()
    const enlaces = screen
      .getAllByRole('link')
      .filter((enlace) => enlace.closest('.st-footer'))
      .map((enlace) => [enlace.textContent, enlace.getAttribute('href')])
    // Con SITE.email aún [PENDIENTE], Soporte muestra el marcador sin mailto (Fase 8).
    expect(enlaces).toEqual([
      ['¿Te invitaron a una evaluación?', '/evaluar'],
      ['Aviso de privacidad', '/aviso-de-privacidad'],
    ])
    expect(screen.getByRole('contentinfo')).toHaveTextContent(`Soporte: ${SITE.email}`)
  })

  it('variante ancha para el registro', () => {
    const { container } = montar('wide')
    expect(container.querySelector('.st-auth')).toHaveClass('st-auth--wide')
  })
})
