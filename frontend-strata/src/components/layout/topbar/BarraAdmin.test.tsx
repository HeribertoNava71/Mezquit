import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError } from 'axios'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listCreditRequests, type PendingRequest } from '@/api/admin'
import { logout, type AuthUser } from '@/api/auth'
import { BarraAdmin } from './BarraAdmin'
import { avisarCambioDeSolicitudes } from './datosBarra'

const sesion = vi.hoisted(() => ({
  user: null as AuthUser | null,
  setUser: vi.fn(),
}))

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: sesion.user, loading: false, setUser: sesion.setUser }),
}))
vi.mock('@/api/auth', () => ({ logout: vi.fn() }))
vi.mock('@/api/admin', () => ({ listCreditRequests: vi.fn() }))

const operador: AuthUser = {
  id: 1,
  name: 'Luis',
  last_name: 'Ordóñez',
  email: 'operacion@strata.mx',
  role: 'admin',
  organization_id: 1,
  is_platform_admin: true,
}

function solicitudes(cantidad: number): PendingRequest[] {
  return Array.from({ length: cantidad }, (_, indice) => ({
    id: indice + 1,
    organization: `Empresa ${indice + 1}`,
    organization_balance: 0,
    requested_amount: 10,
    note: null,
    created_at: null,
  }))
}

function montar(ruta = '/admin/creditos') {
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/login" element={<h1>Pantalla de entrada</h1>} />
        <Route path="*" element={<BarraAdmin />} />
      </Routes>
    </MemoryRouter>,
  )
  return userEvent.setup()
}

const barra = () => within(screen.getByRole('banner'))
const pastilla = () => screen.getByRole('button', { name: /menú de cuenta/i })

beforeEach(() => {
  sesion.user = operador
  sesion.setUser.mockReset()
  vi.mocked(listCreditRequests).mockResolvedValue(solicitudes(3))
  vi.mocked(logout).mockResolvedValue(undefined)
})

describe('BarraAdmin', () => {
  it('logo a «/», Solicitudes y Usuarios, sin Test Builder, Reactivos ni Algoritmos (PB-20)', () => {
    montar('/admin/usuarios/4')
    expect(barra().getByRole('link', { name: 'Strata, inicio' })).toHaveAttribute('href', '/')
    const nav = within(barra().getByRole('navigation', { name: 'Operación' }))
    expect(nav.getByRole('link', { name: 'Solicitudes' })).toHaveAttribute('href', '/admin/creditos')
    expect(nav.getByRole('link', { name: 'Usuarios' })).toHaveAttribute('aria-current', 'page')
    expect(nav.getAllByRole('link')).toHaveLength(2)
    for (const nombre of ['Test Builder', 'Reactivos', 'Algoritmos']) {
      expect(screen.queryByText(nombre)).not.toBeInTheDocument()
    }
  })

  it('muestra «N solicitudes pendientes» desde GET /api/admin/credit-requests', async () => {
    montar()
    const contador = await barra().findByRole('link', { name: '3 solicitudes pendientes' })
    expect(contador).toHaveAttribute('href', '/admin/creditos')
    expect(listCreditRequests).toHaveBeenCalledTimes(1)
  })

  it('si la lista falla, no muestra el contador', async () => {
    vi.mocked(listCreditRequests).mockRejectedValue(new AxiosError('Network Error', AxiosError.ERR_NETWORK))
    const { container } = render(
      <MemoryRouter initialEntries={['/admin/usuarios']}>
        <BarraAdmin />
      </MemoryRouter>,
    )
    await waitFor(() => expect(listCreditRequests).toHaveBeenCalled())
    await act(async () => {})
    expect(container.querySelector('.st-pending')).toBeNull()
  })

  it('sin is_platform_admin no pide las solicitudes', () => {
    sesion.user = { ...operador, is_platform_admin: false }
    montar()
    expect(listCreditRequests).not.toHaveBeenCalled()
  })

  it('pastilla con iniciales y nombre; menú de operador con Panel de RR. HH. y Sitio público', async () => {
    const user = montar()
    expect(pastilla()).toHaveAccessibleName('Luis Ordóñez, menú de cuenta')
    expect(pastilla()).toHaveTextContent('LO')
    await user.click(pastilla())
    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'Mi perfil de operador',
      'Panel de RR. HH.',
      'Sitio público',
      'Salir',
    ])
    expect(screen.getByRole('menuitem', { name: 'Mi perfil de operador' })).toHaveAttribute('href', '/admin/perfil')
    expect(screen.getByRole('menuitem', { name: 'Panel de RR. HH.' })).toHaveAttribute('href', '/app')
  })

  it('sin organización no aparece Panel de RR. HH.', async () => {
    sesion.user = { ...operador, organization_id: null }
    const user = montar()
    await user.click(pastilla())
    expect(screen.queryByRole('menuitem', { name: 'Panel de RR. HH.' })).not.toBeInTheDocument()
  })

  it('Salir cierra la sesión y lleva a /login', async () => {
    const user = montar()
    await user.click(pastilla())
    await user.click(screen.getByRole('menuitem', { name: 'Salir' }))
    expect(await screen.findByRole('heading', { name: 'Pantalla de entrada' })).toBeInTheDocument()
    expect(logout).toHaveBeenCalledTimes(1)
    expect(sesion.setUser).toHaveBeenCalledWith(null)
  })

  it('vuelve a contar cuando una pantalla avisa que las solicitudes cambiaron', async () => {
    montar()
    await barra().findByRole('link', { name: '3 solicitudes pendientes' })
    vi.mocked(listCreditRequests).mockResolvedValue(solicitudes(0))
    act(() => avisarCambioDeSolicitudes())
    expect(await barra().findByRole('link', { name: 'Sin solicitudes pendientes' })).toBeInTheDocument()
  })

  it('en el menú móvil están Salir y las opciones del operador (R-06)', async () => {
    const user = montar()
    const boton = screen.getByRole('button', { name: 'Menú' })
    await user.click(boton)
    const panel = within(document.getElementById(boton.getAttribute('aria-controls') ?? '') as HTMLElement)
    expect(panel.getAllByRole('link').map((enlace) => enlace.textContent)).toEqual([
      'Solicitudes',
      'Usuarios',
      'Mi perfil de operador',
      'Panel de RR. HH.',
      'Sitio público',
    ])
    expect(panel.getByRole('button', { name: 'Salir' })).toBeInTheDocument()
  })
})
