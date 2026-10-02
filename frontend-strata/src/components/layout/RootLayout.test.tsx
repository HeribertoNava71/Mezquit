import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import RootLayout from './RootLayout'

// La barra pública es de otro entregable (Header.tsx, D-06); aquí solo importa el hueco.
vi.mock('@/components/layout/Header', () => ({
  default: () => <header className="st-topbar">Barra pública</header>,
}))

function montar(ruta: string) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route element={<RootLayout />}>
          <Route path="ayuda" element={<h1>Ayuda</h1>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('RootLayout', () => {
  it('arma el lienzo: barra pública, transición, contenido y pie nuevo', () => {
    const { container } = montar('/ayuda')
    const raiz = container.firstElementChild
    expect(raiz).toHaveClass('st-page', 'st-page--default')

    // Hueco de la barra: hija directa del lienzo, para que sea sticky.
    expect(screen.getByRole('banner')).toHaveTextContent('Barra pública')
    expect(screen.getByRole('banner').parentElement).toBe(raiz)
    expect(screen.getByRole('link', { name: 'Saltar al contenido' })).toBeInTheDocument()

    const titulo = screen.getByRole('heading', { name: 'Ayuda' })
    expect(titulo.parentElement).toHaveClass('st-route')
    expect(screen.getByRole('main')).toContainElement(titulo)

    const pie = screen.getByRole('contentinfo')
    expect(pie).toHaveClass('st-footer')
    expect(within(pie).getByRole('link', { name: 'Términos y condiciones' })).toHaveAttribute('href', '/terminos')
  })
})
