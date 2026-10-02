import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthUser } from '@/api/auth'
import { useAuth } from '@/context/AuthContext'
import RequirePlatformAdmin from './RequirePlatformAdmin'
import { AVISO_SESION_VENCIDA } from './rutasDeSesion'

vi.mock('@/context/AuthContext', () => ({ useAuth: vi.fn() }))

const RH: AuthUser = { id: 1, name: 'Ana', email: 'ana@empresa.mx', role: 'admin', organization_id: 7 }
const OPERADOR: AuthUser = { ...RH, is_platform_admin: true }

function sesion(estado: Partial<ReturnType<typeof useAuth>> = {}) {
  vi.mocked(useAuth).mockReturnValue({ user: null, loading: false, setUser: vi.fn(), ...estado })
}

function Ubicacion() {
  const { pathname, search, hash, state } = useLocation()
  return <pre data-testid="ubicacion">{JSON.stringify({ ruta: `${pathname}${search}${hash}`, state: state ?? null })}</pre>
}

function ubicacion(): { ruta: string; state: unknown } {
  return JSON.parse(screen.getByTestId('ubicacion').textContent ?? '{}')
}

function montar(ruta: string) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/login" element={<h1>Entrar</h1>} />
        <Route path="/app" element={<h1>Panel de RR. HH.</h1>} />
        <Route path="/admin/*" element={<RequirePlatformAdmin><h1>Operación</h1></RequirePlatformAdmin>} />
      </Routes>
      <Ubicacion />
    </MemoryRouter>,
  )
}

describe('RequirePlatformAdmin', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReset()
  })

  it('el super admin ve la zona de operación', () => {
    sesion({ user: OPERADOR })
    montar('/admin/creditos')
    expect(screen.getByRole('heading', { name: 'Operación' })).toBeInTheDocument()
  })

  it('sin is_platform_admin va a /app, como siempre', () => {
    sesion({ user: RH })
    montar('/admin/usuarios')
    expect(screen.getByRole('heading', { name: 'Panel de RR. HH.' })).toBeInTheDocument()
    expect(ubicacion()).toEqual({ ruta: '/app', state: null })
  })

  it('sin sesión manda a /login y recuerda la ruta de origen', () => {
    sesion()
    montar('/admin/usuarios?q=ana')
    expect(ubicacion()).toEqual({ ruta: '/login', state: { from: '/admin/usuarios?q=ana' } })
  })

  it('con la sesión vencida, el estado lleva el aviso', () => {
    sesion({ sesionVencida: true })
    montar('/admin/creditos')
    expect(ubicacion()).toEqual({ ruta: '/login', state: { from: '/admin/creditos', aviso: AVISO_SESION_VENCIDA } })
  })

  it('muestra el EstadoCarga del sistema mientras carga la sesión', () => {
    sesion({ loading: true })
    montar('/admin/creditos')
    expect(screen.getByRole('status')).toHaveTextContent('Verificando tu sesión…')
    expect(screen.queryByRole('heading', { name: 'Operación' })).not.toBeInTheDocument()
  })
})
