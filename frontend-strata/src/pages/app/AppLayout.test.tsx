import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthUser } from '@/api/auth'
import { getProfile } from '@/api/profile'
import { getCredits } from '@/api/rh'
import AppLayout from './AppLayout'

const sesion = vi.hoisted(() => ({ user: null as AuthUser | null }))

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: sesion.user, loading: false, setUser: vi.fn() }),
}))
vi.mock('@/api/auth', () => ({ logout: vi.fn() }))
vi.mock('@/api/rh', () => ({ getCredits: vi.fn() }))
vi.mock('@/api/profile', () => ({ getProfile: vi.fn() }))

beforeEach(() => {
  sesion.user = {
    id: 7,
    name: 'Valentina',
    last_name: 'Ríos',
    email: 'valentina@acme.mx',
    role: 'admin',
    organization_id: 3,
    is_platform_admin: false,
  }
  vi.mocked(getCredits).mockResolvedValue({ balance: 5, transactions: [] })
  vi.mocked(getProfile).mockResolvedValue({ ...sesion.user, organization: { name: 'Acme Talento' } })
})

function montar(ruta: string) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<h1>Resultados</h1>} />
          <Route path="creditos" element={<h1>Créditos</h1>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('AppLayout', () => {
  it('arma el lienzo: barra de RR. HH., transición de la pantalla y pie común', async () => {
    const { container } = montar('/app/creditos')
    const raiz = container.firstElementChild
    expect(raiz).toHaveClass('st-page', 'st-page--default')

    const barra = screen.getByRole('banner')
    expect(barra).toHaveClass('st-topbar')
    expect(barra.parentElement).toBe(raiz)
    expect(within(barra).getByRole('navigation', { name: 'Panel de RR. HH.' })).toBeInTheDocument()
    expect(await within(barra).findByRole('link', { name: '5 créditos disponibles' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Saltar al contenido' })).toBeInTheDocument()

    const titulo = screen.getByRole('heading', { name: 'Créditos' })
    expect(titulo.parentElement).toHaveClass('st-route')
    expect(screen.getByRole('main')).toContainElement(titulo)

    const pie = screen.getByRole('contentinfo')
    expect(pie).toHaveClass('st-footer')
    expect(within(pie).getByRole('link', { name: 'Términos y condiciones' })).toHaveAttribute('href', '/terminos')
  })

  it('ya no escribe la marca a mano ni usa las clases viejas de la barra', async () => {
    const { container } = montar('/app')
    await screen.findByRole('button', { name: /menú de cuenta/i })
    expect(screen.queryByText('Mez')).not.toBeInTheDocument()
    expect(container.querySelector('.applayout__bar, .applayout__main, .applayout__logout')).toBeNull()
    expect(within(screen.getByRole('banner')).getByRole('link', { name: 'Strata, inicio' })).toHaveAttribute('href', '/')
  })
})
