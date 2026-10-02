import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthUser } from '@/api/auth'
import { useAuth } from '@/context/AuthContext'
import RedirectIfAuthenticated from './RedirectIfAuthenticated'

vi.mock('@/context/AuthContext', () => ({ useAuth: vi.fn() }))

const RH: AuthUser = { id: 1, name: 'Ana', email: 'ana@empresa.mx', role: 'admin', organization_id: 7 }
const SIN_EMPRESA: AuthUser = { ...RH, organization_id: null }

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

type Entrada = string | { pathname: string; state?: unknown }

function Arbol({ entrada }: { entrada: Entrada }) {
  return (
    <MemoryRouter initialEntries={[entrada]}>
      <Routes>
        <Route path="/login" element={<RedirectIfAuthenticated><h1>Entrar</h1></RedirectIfAuthenticated>} />
        <Route path="/registro" element={<RedirectIfAuthenticated><h1>Crear cuenta</h1></RedirectIfAuthenticated>} />
        <Route path="/app/*" element={<h1>Panel</h1>} />
        <Route path="/perfil" element={<h1>Mi perfil</h1>} />
      </Routes>
      <Ubicacion />
    </MemoryRouter>
  )
}

describe('RedirectIfAuthenticated', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReset()
  })

  it('un visitante ve /login y /registro', () => {
    sesion()
    const { unmount } = render(<Arbol entrada="/login" />)
    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    unmount()

    render(<Arbol entrada="/registro" />)
    expect(screen.getByRole('heading', { name: 'Crear cuenta' })).toBeInTheDocument()
  })

  it('muestra el EstadoCarga del sistema mientras carga la sesión', () => {
    sesion({ loading: true })
    render(<Arbol entrada="/login" />)
    expect(screen.getByRole('status')).toHaveTextContent('Verificando tu sesión…')
    expect(screen.queryByRole('heading', { name: 'Entrar' })).not.toBeInTheDocument()
  })

  it('con sesión y empresa, /login lleva a /app', () => {
    sesion({ user: RH })
    render(<Arbol entrada="/login" />)
    expect(screen.getByRole('heading', { name: 'Panel' })).toBeInTheDocument()
    expect(ubicacion().ruta).toBe('/app')
  })

  it('con sesión sin empresa, /registro lleva a /perfil', () => {
    sesion({ user: SIN_EMPRESA })
    render(<Arbol entrada="/registro" />)
    expect(screen.getByRole('heading', { name: 'Mi perfil' })).toBeInTheDocument()
    expect(ubicacion().ruta).toBe('/perfil')
  })

  it('si trae una ruta de origen permitida, lleva a esa ruta', () => {
    sesion({ user: RH })
    render(<Arbol entrada={{ pathname: '/login', state: { from: '/app/creditos' } }} />)
    expect(ubicacion().ruta).toBe('/app/creditos')
  })

  it('una ruta de origen no permitida cae en el inicio del usuario', () => {
    sesion({ user: SIN_EMPRESA })
    render(<Arbol entrada={{ pathname: '/login', state: { from: '/app/creditos' } }} />)
    expect(ubicacion().ruta).toBe('/perfil')
  })

  it('quien entra o se registra en la pantalla no dispara la guarda: la pantalla decide su destino', () => {
    sesion()
    const { rerender } = render(<Arbol entrada="/registro" />)
    expect(screen.getByRole('heading', { name: 'Crear cuenta' })).toBeInTheDocument()

    // Registro ya llamó a setUser(user) y la guarda se vuelve a pintar con sesión,
    // todavía en /registro: no redirige a /app (Registro navega a /app/evaluaciones/nueva).
    sesion({ user: RH })
    rerender(<Arbol entrada="/registro" />)
    expect(screen.getByRole('heading', { name: 'Crear cuenta' })).toBeInTheDocument()
    expect(ubicacion().ruta).toBe('/registro')
  })
})
