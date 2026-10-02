import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { logout, type AuthUser } from '@/api/auth'
import Header from './Header'

const sesion = vi.hoisted(() => ({
  user: null as AuthUser | null,
  loading: false,
  setUser: vi.fn(),
}))

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: sesion.user, loading: sesion.loading, setUser: sesion.setUser }),
}))
vi.mock('@/api/auth', () => ({ logout: vi.fn() }))

const sinEmpresa: AuthUser = {
  id: 9,
  name: 'Sofía',
  last_name: 'Navarro',
  email: 'sofia@correo.mx',
  role: 'admin',
  organization_id: null,
  is_platform_admin: false,
}

function montar(ruta = '/precios', variant?: 'default' | 'home') {
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/" element={<h1>Inicio</h1>} />
        <Route path="*" element={<Header variant={variant} />} />
      </Routes>
    </MemoryRouter>,
  )
  return userEvent.setup()
}

const barra = () => within(screen.getByRole('banner'))
const pastilla = () => screen.getByRole('button', { name: /menú de cuenta/i })

function abrirMenuMovil() {
  const boton = screen.getByRole('button', { name: 'Menú' })
  return {
    boton,
    panel: () => within(document.getElementById(boton.getAttribute('aria-controls') ?? '') as HTMLElement),
  }
}

beforeEach(() => {
  sesion.user = null
  sesion.loading = false
  sesion.setUser.mockReset()
  vi.mocked(logout).mockResolvedValue(undefined)
})

describe('Header (barra pública)', () => {
  it('es la barra sticky .st-topbar con el logo que lleva al inicio', () => {
    montar()
    const header = screen.getByRole('banner')
    expect(header).toHaveClass('st-topbar')
    expect(header).not.toHaveClass('st-topbar--home')
    expect(barra().getByRole('link', { name: 'Strata, inicio' })).toHaveAttribute('href', '/')
  })

  it('navegación: Tests, Para empresas, Cómo funciona y Precios, con el activo marcado', () => {
    montar('/como-funciona')
    const nav = within(barra().getByRole('navigation', { name: 'Navegación principal' }))
    expect(nav.getAllByRole('link').map((enlace) => [enlace.textContent, enlace.getAttribute('href')])).toEqual([
      ['Tests', '/pruebas'],
      ['Para empresas', '/demo'],
      ['Cómo funciona', '/como-funciona'],
      ['Precios', '/precios'],
    ])
    expect(nav.getByRole('link', { name: 'Cómo funciona' })).toHaveAttribute('aria-current', 'page')
    // Ayuda ya no está en la barra: queda en el pie y en el menú móvil.
    expect(nav.queryByRole('link', { name: 'Ayuda' })).not.toBeInTheDocument()
  })

  it('sin sesión: «Tengo un código», «Entrar» y el botón tinta «Crear cuenta»', () => {
    montar()
    expect(barra().getByRole('link', { name: 'Tengo un código' })).toHaveAttribute('href', '/evaluar')
    expect(barra().getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/login')
    const crear = barra().getByRole('link', { name: 'Crear cuenta' })
    expect(crear).toHaveAttribute('href', '/registro')
    expect(crear).toHaveClass('st-btn', 'st-btn--ink')
    expect(screen.queryByRole('button', { name: /menú de cuenta/i })).not.toBeInTheDocument()
  })

  it('mientras carga la sesión no ofrece «Entrar» ni la pastilla', () => {
    sesion.loading = true
    montar()
    expect(barra().queryByRole('link', { name: 'Entrar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /menú de cuenta/i })).not.toBeInTheDocument()
    expect(barra().getByRole('link', { name: 'Tengo un código' })).toBeInTheDocument()
  })

  it('con sesión sin organización: pastilla con Mi perfil y Salir, sin Panel de RR. HH. ni Operación', async () => {
    sesion.user = sinEmpresa
    const user = montar()
    expect(barra().queryByRole('link', { name: 'Entrar' })).not.toBeInTheDocument()
    expect(pastilla()).toHaveAccessibleName('Sofía Navarro, menú de cuenta')
    expect(pastilla()).toHaveTextContent('SN')

    await user.click(pastilla())
    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual(['Mi perfil', 'Salir'])
    expect(screen.getByRole('menuitem', { name: 'Mi perfil' })).toHaveAttribute('href', '/perfil')
  })

  it('con organización y operador: Panel de RR. HH. → /app y Operación → /admin/creditos', async () => {
    sesion.user = { ...sinEmpresa, organization_id: 4, is_platform_admin: true }
    const user = montar()
    await user.click(pastilla())
    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'Mi perfil',
      'Panel de RR. HH.',
      'Operación',
      'Salir',
    ])
    expect(screen.getByRole('menuitem', { name: 'Panel de RR. HH.' })).toHaveAttribute('href', '/app')
    expect(screen.getByRole('menuitem', { name: 'Operación' })).toHaveAttribute('href', '/admin/creditos')
  })

  it('Salir hace POST /api/logout, setUser(null) y lleva al inicio', async () => {
    sesion.user = sinEmpresa
    const user = montar('/perfil')
    await user.click(pastilla())
    await user.click(screen.getByRole('menuitem', { name: 'Salir' }))
    expect(await screen.findByRole('heading', { name: 'Inicio' })).toBeInTheDocument()
    expect(logout).toHaveBeenCalledTimes(1)
    expect(sesion.setUser).toHaveBeenCalledWith(null)
  })

  it('menú móvil sin sesión: navegación con Ayuda, «Tengo un código», Entrar y Crear cuenta', async () => {
    const user = montar()
    const { boton, panel } = abrirMenuMovil()
    await user.click(boton)
    expect(panel().getAllByRole('link').map((enlace) => enlace.textContent)).toEqual([
      'Tests',
      'Para empresas',
      'Cómo funciona',
      'Precios',
      'Ayuda',
      'Tengo un código',
      'Entrar',
      'Crear cuenta',
    ])
    expect(panel().getByRole('link', { name: 'Ayuda' })).toHaveAttribute('href', '/ayuda')
    expect(panel().getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/login')
    expect(panel().getByRole('link', { name: 'Crear cuenta' })).toHaveAttribute('href', '/registro')
  })

  it('menú móvil con sesión: Mi perfil, Panel de RR. HH., Operación y Salir (R-06)', async () => {
    sesion.user = { ...sinEmpresa, organization_id: 4, is_platform_admin: true }
    const user = montar()
    const { boton, panel } = abrirMenuMovil()
    await user.click(boton)
    expect(panel().getByRole('link', { name: 'Mi perfil' })).toHaveAttribute('href', '/perfil')
    expect(panel().getByRole('link', { name: 'Panel de RR. HH.' })).toHaveAttribute('href', '/app')
    expect(panel().getByRole('link', { name: 'Operación' })).toHaveAttribute('href', '/admin/creditos')
    expect(panel().queryByRole('link', { name: 'Entrar' })).not.toBeInTheDocument()

    await user.click(panel().getByRole('button', { name: 'Salir' }))
    expect(await screen.findByRole('heading', { name: 'Inicio' })).toBeInTheDocument()
    expect(sesion.setUser).toHaveBeenCalledWith(null)
  })

  it('variante home para la Fase 6', () => {
    montar('/precios', 'home')
    expect(screen.getByRole('banner')).toHaveClass('st-topbar', 'st-topbar--home')
  })
})
