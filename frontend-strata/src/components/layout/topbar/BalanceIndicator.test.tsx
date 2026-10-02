import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { BalanceIndicator } from './BalanceIndicator'

function montar(saldo: number | null) {
  return render(
    <MemoryRouter>
      <BalanceIndicator saldo={saldo} />
    </MemoryRouter>,
  )
}

describe('BalanceIndicator', () => {
  it('muestra «{saldo} créditos» con punto celeste y lleva a Créditos', () => {
    const { container } = montar(1250)
    const enlace = screen.getByRole('link', { name: '1,250 créditos disponibles' })
    expect(enlace).toHaveAttribute('href', '/app/creditos')
    expect(enlace).toHaveTextContent('1,250 créditos')
    expect(enlace).toHaveClass('st-balance')
    const punto = container.querySelector('.st-live-dot')
    expect(punto).toHaveClass('st-live-dot--sky')
    expect(punto).toHaveAttribute('aria-hidden', 'true')
  })

  it('en singular con un crédito y en plural con cero', () => {
    const { unmount } = montar(1)
    expect(screen.getByRole('link', { name: '1 crédito disponible' })).toBeInTheDocument()
    unmount()
    montar(0)
    expect(screen.getByRole('link', { name: '0 créditos disponibles' })).toBeInTheDocument()
  })

  it('sin cifra (cargando o con error) dice solo «Créditos»', () => {
    montar(null)
    const enlace = screen.getByRole('link', { name: 'Créditos' })
    expect(enlace).toHaveAttribute('href', '/app/creditos')
    expect(enlace).not.toHaveTextContent(/\d/)
  })
})
