import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listCreditRequests } from '@/api/admin'
import type { AuthUser } from '@/api/auth'
import AdminLayout from './AdminLayout'

const sesion = vi.hoisted(() => ({ user: null as AuthUser | null }))

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: sesion.user, loading: false, setUser: vi.fn() }),
}))
vi.mock('@/api/auth', () => ({ logout: vi.fn() }))
vi.mock('@/api/admin', () => ({ listCreditRequests: vi.fn() }))

beforeEach(() => {
  sesion.user = {
    id: 1,
    name: 'Luis',
    last_name: 'Ordóñez',
    email: 'operacion@strata.mx',
    role: 'admin',
    organization_id: 1,
    is_platform_admin: true,
  }
  vi.mocked(listCreditRequests).mockResolvedValue([])
})

describe('AdminLayout', () => {
  it('usa el mismo lienzo, la barra de super admin, la transición y el pie común', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/admin/usuarios']}>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="usuarios" element={<h1>Usuarios</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
    const raiz = container.firstElementChild
    expect(raiz).toHaveClass('st-page', 'st-page--default')

    const barra = screen.getByRole('banner')
    expect(barra.parentElement).toBe(raiz)
    expect(within(barra).getByRole('navigation', { name: 'Operación' })).toBeInTheDocument()
    expect(await within(barra).findByRole('link', { name: 'Sin solicitudes pendientes' })).toBeInTheDocument()
    expect(screen.queryByText(/Mez/)).not.toBeInTheDocument()
    expect(container.querySelector('.admin__bar, .applayout__logout')).toBeNull()

    const titulo = screen.getByRole('heading', { name: 'Usuarios' })
    expect(titulo.parentElement).toHaveClass('st-route')
    expect(screen.getByRole('contentinfo')).toHaveClass('st-footer')
  })
})
