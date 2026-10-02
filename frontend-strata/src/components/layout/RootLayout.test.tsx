import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import RootLayout from './RootLayout'

// La barra pública es de otro entregable (Header.tsx, D-06); aquí solo importa
// el hueco y la variante que recibe.
vi.mock('@/components/layout/Header', () => ({
  default: ({ variant = 'default' }: { variant?: string }) => (
    <header className="st-topbar" data-variant={variant}>
      Barra pública
    </header>
  ),
}))

function montar(ruta: string) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route element={<RootLayout />}>
          <Route
            index
            element={
              <>
                <h1>Inicio</h1>
                <Link to="/ayuda">Ir a Ayuda</Link>
              </>
            }
          />
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
    expect(screen.getByRole('banner')).toHaveAttribute('data-variant', 'default')
    expect(screen.getByRole('banner').parentElement).toBe(raiz)
    expect(screen.getByRole('link', { name: 'Saltar al contenido' })).toBeInTheDocument()

    const titulo = screen.getByRole('heading', { name: 'Ayuda' })
    expect(titulo.parentElement).toHaveClass('st-route')
    expect(screen.getByRole('main')).toContainElement(titulo)

    const pie = screen.getByRole('contentinfo')
    expect(pie).toHaveClass('st-footer')
    expect(pie).not.toHaveClass('st-footer--home')
    expect(within(pie).getByRole('link', { name: 'Términos y condiciones' })).toHaveAttribute('href', '/terminos')
    expect(within(pie).queryByRole('link', { name: 'Acceso interno' })).not.toBeInTheDocument()
  })

  it('en la home usa la variante home: halos propios, barra dentro del marco y pie con «Acceso interno»', () => {
    const { container } = montar('/')
    expect(container.firstElementChild).toHaveClass('st-page', 'st-page--home')
    expect(container.querySelector('.st-page__halos')).toHaveClass('st-page__halos--home')

    const marco = container.querySelector('.st-page__frame')
    const barra = screen.getByRole('banner')
    expect(barra).toHaveAttribute('data-variant', 'home')
    expect(marco).toContainElement(barra)
    expect(marco).toContainElement(screen.getByRole('heading', { name: 'Inicio' }))

    const pie = screen.getByRole('contentinfo')
    expect(pie).toHaveClass('st-footer', 'st-footer--home')
    expect(within(pie).getByRole('link', { name: 'Acceso interno' })).toHaveAttribute('href', '/login')
  })

  it('al salir de la home vuelve a la variante default', async () => {
    const user = userEvent.setup()
    const { container } = montar('/')
    await user.click(screen.getByRole('link', { name: 'Ir a Ayuda' }))
    expect(await screen.findByRole('heading', { name: 'Ayuda' })).toBeInTheDocument()
    expect(container.firstElementChild).toHaveClass('st-page--default')
    expect(container.querySelector('.st-page__frame')).toBeNull()
    expect(screen.getByRole('banner')).toHaveAttribute('data-variant', 'default')
    expect(screen.getByRole('contentinfo')).not.toHaveClass('st-footer--home')
  })
})
