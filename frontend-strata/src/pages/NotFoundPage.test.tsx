import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import NotFoundPage from './NotFoundPage'

describe('NotFoundPage', () => {
  it('muestra «404», el texto de siempre y «Volver al inicio» → /', () => {
    render(
      <MemoryRouter initialEntries={['/no-existe']}>
        <NotFoundPage />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { level: 1, name: '404' })).toBeInTheDocument()
    expect(screen.getByText('Esta página no existe o fue movida.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/')
  })
})
