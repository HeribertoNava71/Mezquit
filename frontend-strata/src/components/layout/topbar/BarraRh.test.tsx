import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError } from 'axios'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { logout, type AuthUser } from '@/api/auth'
import { getProfile } from '@/api/profile'
import { getCredits } from '@/api/rh'
import { BarraRh } from './BarraRh'
import { avisarCambioDeCreditos } from './datosBarra'

const sesion = vi.hoisted(() => ({
  user: null as AuthUser | null,
  setUser: vi.fn(),
}))

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: sesion.user, loading: false, setUser: sesion.setUser }),
}))
vi.mock('@/api/auth', () => ({ logout: vi.fn() }))
vi.mock('@/api/rh', () => ({ getCredits: vi.fn() }))
vi.mock('@/api/profile', () => ({ getProfile: vi.fn() }))

const valentina: AuthUser = {
  id: 7,
  name: 'Valentina',
  last_name: 'Ríos',
  email: 'valentina@acme.mx',
  role: 'admin',
  organization_id: 3,
  is_platform_admin: false,
}

function montar(ruta = '/app/evaluaciones/3') {
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/login" element={<h1>Pantalla de entrada</h1>} />
        <Route path="*" element={<BarraRh />} />
      </Routes>
    </MemoryRouter>,
  )
  return userEvent.setup()
}

const pastilla = () => screen.getByRole('button', { name: /menú de cuenta/i })
const barra = () => within(screen.getByRole('banner'))

beforeEach(() => {
  sesion.user = valentina
  sesion.setUser.mockReset()
  vi.mocked(getCredits).mockResolvedValue({ balance: 12, transactions: [] })
  vi.mocked(getProfile).mockResolvedValue({ ...valentina, organization: { name: 'Acme Talento' } })
  vi.mocked(logout).mockResolvedValue(undefined)
})

describe('BarraRh', () => {
  it('logo a «/», navegación del panel, saldo y pastilla con la organización', async () => {
    montar()
    // Corte del menú móvil de RR. HH.: 900 px (Fase 8, topbar/cortes.ts).
    expect(screen.getByRole('banner')).toHaveClass('st-topbar--corte-rh')
    expect(barra().getByRole('link', { name: 'Strata, inicio' })).toHaveAttribute('href', '/')
    const nav = within(barra().getByRole('navigation', { name: 'Panel de RR. HH.' }))
    expect(nav.getAllByRole('link').map((enlace) => enlace.textContent)).toEqual([
      'Tests',
      'Créditos',
      'Candidatos',
      'Resultados',
    ])
    expect(nav.getByRole('link', { name: 'Candidatos' })).toHaveAttribute('aria-current', 'page')

    const saldo = await barra().findByRole('link', { name: '12 créditos disponibles' })
    expect(saldo).toHaveAttribute('href', '/app/creditos')
    expect(await screen.findByRole('button', { name: 'Acme Talento, menú de cuenta de Valentina Ríos' })).toHaveTextContent('VR')
    expect(getCredits).toHaveBeenCalledTimes(1)
    expect(getProfile).toHaveBeenCalledTimes(1)
    expect(screen.queryByText(/\bMez\b/)).not.toBeInTheDocument()
  })

  it('si GET /api/credits falla, el saldo queda sin cifra', async () => {
    vi.mocked(getCredits).mockRejectedValue(new AxiosError('Network Error', AxiosError.ERR_NETWORK))
    const { container } = render(
      <MemoryRouter initialEntries={['/app']}>
        <BarraRh />
      </MemoryRouter>,
    )
    await waitFor(() => expect(getCredits).toHaveBeenCalled())
    await act(async () => {})
    const indicador = container.querySelector('.st-balance')
    expect(indicador).toHaveTextContent('Créditos')
    expect(indicador).not.toHaveTextContent(/\d/)
  })

  it('sin organización no pide el saldo ni lo muestra', async () => {
    sesion.user = { ...valentina, organization_id: null }
    const { container } = render(
      <MemoryRouter initialEntries={['/app']}>
        <BarraRh />
      </MemoryRouter>,
    )
    await screen.findByRole('button', { name: /menú de cuenta/i })
    expect(getCredits).not.toHaveBeenCalled()
    expect(container.querySelector('.st-balance')).toBeNull()
  })

  it('si GET /api/user/profile falla, la pastilla usa el nombre de la persona', async () => {
    vi.mocked(getProfile).mockRejectedValue(new AxiosError('Network Error', AxiosError.ERR_NETWORK))
    montar()
    expect(await screen.findByRole('button', { name: 'Valentina Ríos, menú de cuenta' })).toHaveTextContent('Valentina Ríos')
  })

  it('menú: Mi perfil, Sitio público y Salir; sin is_platform_admin no aparece Operación', async () => {
    const user = montar()
    await user.click(pastilla())
    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual(['Mi perfil', 'Sitio público', 'Salir'])
    expect(screen.queryByRole('menuitem', { name: 'Operación' })).not.toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Panel de RR. HH.' })).not.toBeInTheDocument()
  })

  it('con is_platform_admin el menú ofrece Operación → /admin/creditos', async () => {
    sesion.user = { ...valentina, is_platform_admin: true }
    const user = montar()
    await user.click(pastilla())
    expect(screen.getByRole('menuitem', { name: 'Operación' })).toHaveAttribute('href', '/admin/creditos')
  })

  it('Salir hace POST /api/logout, limpia la sesión y lleva a /login', async () => {
    const user = montar()
    await user.click(pastilla())
    await user.click(screen.getByRole('menuitem', { name: 'Salir' }))
    expect(await screen.findByRole('heading', { name: 'Pantalla de entrada' })).toBeInTheDocument()
    expect(logout).toHaveBeenCalledTimes(1)
    expect(sesion.setUser).toHaveBeenCalledWith(null)
  })

  it('si Salir falla por la red, avisa en línea con «Reintentar» y la sesión sigue', async () => {
    vi.mocked(logout).mockRejectedValue(new AxiosError('Network Error', AxiosError.ERR_NETWORK))
    const user = montar()
    await user.click(pastilla())
    await user.click(screen.getByRole('menuitem', { name: 'Salir' }))

    const aviso = await screen.findByRole('alert')
    expect(aviso).toHaveTextContent('No pudimos cerrar tu sesión')
    expect(aviso).toHaveTextContent('Revisa tu conexión a internet')
    expect(barra().getByRole('alert')).toBe(aviso)
    expect(sesion.setUser).not.toHaveBeenCalled()

    vi.mocked(logout).mockResolvedValue(undefined)
    await user.click(within(aviso).getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByRole('heading', { name: 'Pantalla de entrada' })).toBeInTheDocument()
    expect(logout).toHaveBeenCalledTimes(2)
  })

  it('el aviso de error se puede cerrar', async () => {
    vi.mocked(logout).mockRejectedValue(new AxiosError('Network Error', AxiosError.ERR_NETWORK))
    const user = montar()
    await user.click(pastilla())
    await user.click(screen.getByRole('menuitem', { name: 'Salir' }))
    await user.click(await screen.findByRole('button', { name: 'Cerrar aviso' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('vuelve a pedir el saldo al cambiar de ruta y cuando una pantalla avisa', async () => {
    const user = montar('/app')
    await barra().findByRole('link', { name: '12 créditos disponibles' })
    expect(getCredits).toHaveBeenCalledTimes(1)

    vi.mocked(getCredits).mockResolvedValue({ balance: 11, transactions: [] })
    await user.click(within(barra().getByRole('navigation', { name: 'Panel de RR. HH.' })).getByRole('link', { name: 'Candidatos' }))
    expect(await barra().findByRole('link', { name: '11 créditos disponibles' })).toBeInTheDocument()
    expect(getCredits).toHaveBeenCalledTimes(2)

    vi.mocked(getCredits).mockResolvedValue({ balance: 30, transactions: [] })
    act(() => avisarCambioDeCreditos())
    expect(await barra().findByRole('link', { name: '30 créditos disponibles' })).toBeInTheDocument()
    expect(getCredits).toHaveBeenCalledTimes(3)
  })

  it('el menú móvil lleva los enlaces del panel y las opciones de la pastilla', async () => {
    sesion.user = { ...valentina, is_platform_admin: true }
    const user = montar()
    await user.click(screen.getByRole('button', { name: 'Menú' }))
    const id = screen.getByRole('button', { name: 'Menú' }).getAttribute('aria-controls')
    const panel = within(document.getElementById(id ?? '') as HTMLElement)
    expect(panel.getByRole('navigation', { name: 'Panel de RR. HH.' })).toBeInTheDocument()
    expect(panel.getByRole('link', { name: 'Operación' })).toHaveAttribute('href', '/admin/creditos')
    expect(panel.getByRole('link', { name: 'Sitio público' })).toHaveAttribute('href', '/')
    expect(panel.getByRole('button', { name: 'Salir' })).toBeInTheDocument()
  })
})
