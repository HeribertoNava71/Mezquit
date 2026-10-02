import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthUser } from '@/api/auth'
import { useAuth } from '@/context/AuthContext'
import RequireAuth from './RequireAuth'
import { AVISO_SESION_VENCIDA } from './rutasDeSesion'

vi.mock('@/context/AuthContext', () => ({ useAuth: vi.fn() }))

const ANA: AuthUser = { id: 1, name: 'Ana', email: 'ana@empresa.mx', role: 'admin', organization_id: 7 }

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
        <Route path="/app/*" element={<RequireAuth><h1>Panel</h1></RequireAuth>} />
        <Route path="/perfil" element={<RequireAuth><h1>Mi perfil</h1></RequireAuth>} />
      </Routes>
      <Ubicacion />
    </MemoryRouter>,
  )
}

describe('RequireAuth', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReset()
  })

  it('muestra el EstadoCarga del sistema mientras carga la sesión', () => {
    sesion({ loading: true })
    montar('/app')
    expect(screen.getByRole('status')).toHaveTextContent('Verificando tu sesión…')
    expect(screen.queryByText('Cargando…')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Panel' })).not.toBeInTheDocument()
    expect(ubicacion().ruta).toBe('/app')
  })

  it('sin sesión manda a /login y recuerda la ruta de origen completa en state.from', () => {
    sesion()
    montar('/app/creditos?pagina=2#movimientos')
    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    expect(ubicacion()).toEqual({ ruta: '/login', state: { from: '/app/creditos?pagina=2#movimientos' } })
  })

  it('protege /perfil: sin sesión va a /login con la ruta de origen', () => {
    sesion()
    montar('/perfil')
    expect(ubicacion()).toEqual({ ruta: '/login', state: { from: '/perfil' } })
  })

  it('si la sesión venció, el estado lleva también el aviso para /login', () => {
    sesion({ sesionVencida: true })
    montar('/app/evaluaciones/3')
    expect(ubicacion()).toEqual({ ruta: '/login', state: { from: '/app/evaluaciones/3', aviso: AVISO_SESION_VENCIDA } })
  })

  it('con sesión muestra el contenido', () => {
    sesion({ user: ANA })
    montar('/perfil')
    expect(screen.getByRole('heading', { name: 'Mi perfil' })).toBeInTheDocument()
    expect(ubicacion().ruta).toBe('/perfil')
  })
})
