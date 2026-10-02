import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { SITE } from '@/config/site'
import { Marca } from './Marca'

describe('Marca', () => {
  it('muestra la salamandra decorativa y el nombre de SITE', () => {
    const { container } = render(<Marca />)
    expect(SITE.name).toBe('Strata')
    expect(screen.getByText('Strata')).toHaveClass('st-marca__name')
    const logo = container.querySelector('img')
    expect(logo).toHaveAttribute('src', '/brand/strata-salamandra.png')
    expect(logo).toHaveAttribute('alt', '')
    expect(logo).toHaveAttribute('width', '30')
    expect(container.firstElementChild).toHaveClass('st-marca', 'st-marca--md')
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('como enlace al inicio se anuncia «Strata, inicio»', () => {
    render(
      <MemoryRouter>
        <Marca to="/" />
      </MemoryRouter>,
    )
    const enlace = screen.getByRole('link', { name: 'Strata, inicio' })
    expect(enlace).toHaveAttribute('href', '/')
    expect(enlace).toHaveClass('st-marca', 'st-marca--link')
  })

  it('acepta otro destino y otra etiqueta', () => {
    render(
      <MemoryRouter>
        <Marca to="/app" label="Strata, panel de RR. HH." />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: 'Strata, panel de RR. HH.' })).toHaveAttribute('href', '/app')
  })

  it('tamaño sm para el pie y solo logo con hideName', () => {
    const { container, rerender } = render(<Marca size="sm" />)
    expect(container.firstElementChild).toHaveClass('st-marca--sm')
    expect(container.querySelector('img')).toHaveAttribute('width', '20')

    rerender(<Marca hideName />)
    expect(screen.queryByText('Strata')).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Strata' })).toBeInTheDocument()
  })
})
