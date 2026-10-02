import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthUser } from '@/api/auth'
import { useAuth } from '@/context/AuthContext'
import { AvisoDeRuta } from './AvisoDeRuta'
import RequireOrganization from './RequireOrganization'
import { AVISO_SIN_ORGANIZACION } from './rutasDeSesion'

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

function montar(ruta: string) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/login" element={<h1>Entrar</h1>} />
        <Route
          path="/perfil"
          element={
            <>
              <AvisoDeRuta />
              <h1>Mi perfil</h1>
            </>
          }
        />
        <Route path="/app/*" element={<RequireOrganization><h1>Panel</h1></RequireOrganization>} />
      </Routes>
      <Ubicacion />
    </MemoryRouter>,
  )
}

describe('RequireOrganization', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReset()
  })

  it('una sesión sin empresa va a /perfil con el aviso en location.state', () => {
    sesion({ user: SIN_EMPRESA })
    montar('/app/creditos')
    expect(screen.getByRole('heading', { name: 'Mi perfil' })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(AVISO_SIN_ORGANIZACION)
    expect(ubicacion()).toEqual({ ruta: '/perfil', state: { aviso: AVISO_SIN_ORGANIZACION } })
    expect(screen.queryByRole('heading', { name: 'Panel' })).not.toBeInTheDocument()
  })

  it('con empresa muestra el panel', () => {
    sesion({ user: RH })
    montar('/app/pruebas')
    expect(screen.getByRole('heading', { name: 'Panel' })).toBeInTheDocument()
    expect(ubicacion().ruta).toBe('/app/pruebas')
  })

  it('sin sesión se comporta como RequireAuth: /login con la ruta de origen', () => {
    sesion()
    montar('/app/evaluaciones')
    expect(ubicacion()).toEqual({ ruta: '/login', state: { from: '/app/evaluaciones' } })
  })

  it('muestra el EstadoCarga del sistema mientras carga la sesión', () => {
    sesion({ loading: true })
    montar('/app')
    expect(screen.getByRole('status')).toHaveTextContent('Verificando tu sesión…')
    expect(ubicacion().ruta).toBe('/app')
  })
})
