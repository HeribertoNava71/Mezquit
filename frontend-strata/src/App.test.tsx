import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, type AxiosAdapter, type AxiosResponse } from 'axios'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchUser, login, type AuthUser } from '@/api/auth'
import api, { marcarSesion } from '@/api/axios'
import { AVISO_SESION_VENCIDA, AVISO_SIN_ORGANIZACION } from '@/components/rutasDeSesion'
import { AuthProvider } from '@/context/AuthContext'
import App from './App'

// Rutas de D-07 con las guardas, AuthProvider y SessionWatcher reales. Se
// simulan la API de autenticación y las pantallas (sus llamadas y su diseño
// son de otras fases); los layouts se reducen a su <Outlet />.

vi.mock('@/api/auth', () => ({ fetchUser: vi.fn(), login: vi.fn(), logout: vi.fn() }))

vi.mock('@/components/layout/RootLayout', async () => {
  const { Outlet } = await import('react-router-dom')
  return { default: () => <Outlet /> }
})
vi.mock('@/pages/app/AppLayout', async () => {
  const { Outlet } = await import('react-router-dom')
  return {
    default: () => (
      <>
        <p>Barra del panel de RR. HH.</p>
        <Outlet />
      </>
    ),
  }
})
vi.mock('@/pages/admin/AdminLayout', async () => {
  const { Outlet } = await import('react-router-dom')
  return {
    default: () => (
      <>
        <p>Barra de operación</p>
        <Outlet />
      </>
    ),
  }
})
vi.mock('@/pages/HomePage', () => ({ default: () => <h1>Inicio</h1> }))
vi.mock('@/pages/PruebasPage', () => ({ default: () => <h1>Catálogo de pruebas</h1> }))
vi.mock('@/pages/app/ResumenPage', () => ({ default: () => <h1>Resultados</h1> }))
vi.mock('@/pages/app/CreditosPage', () => ({ default: () => <h1>Créditos</h1> }))
vi.mock('@/pages/app/NuevaEvaluacion', () => ({ default: () => <h1>Nueva evaluación</h1> }))
vi.mock('@/pages/admin/AdminCreditosPage', () => ({ default: () => <h1>Solicitudes de créditos</h1> }))

// Perfil y Registro: imitan lo que hacen las pantallas reales al salir y al
// registrarse (setUser y navigate después de un await), para comprobar que
// ninguna guarda desvía su navegación.
vi.mock('@/pages/PerfilPage', async () => {
  const { useNavigate } = await import('react-router-dom')
  const { useAuth } = await import('@/context/AuthContext')
  return {
    default: function PerfilFalso() {
      const { setUser } = useAuth()
      const navigate = useNavigate()
      async function salir() {
        await Promise.resolve() // await logout()
        setUser(null)
        navigate('/')
      }
      return (
        <>
          <h1>Mi perfil</h1>
          <button type="button" onClick={salir}>
            Salir
          </button>
        </>
      )
    },
  }
})
vi.mock('@/pages/auth/Registro', async () => {
  const { useNavigate } = await import('react-router-dom')
  const { useAuth } = await import('@/context/AuthContext')
  return {
    default: function RegistroFalso() {
      const { setUser } = useAuth()
      const navigate = useNavigate()
      async function registrar() {
        await Promise.resolve() // await register(form)
        const nuevo = { id: 9, name: 'Leo', email: 'leo@empresa.mx', role: 'admin', organization_id: 3 }
        setUser(nuevo)
        navigate(nuevo.organization_id ? '/app/evaluaciones/nueva' : '/perfil')
      }
      return (
        <>
          <h1>Crear cuenta</h1>
          <button type="button" onClick={registrar}>
            Crear cuenta
          </button>
        </>
      )
    },
  }
})

const RH: AuthUser = { id: 1, name: 'Ana', email: 'ana@empresa.mx', role: 'admin', organization_id: 7 }
const SIN_EMPRESA: AuthUser = { ...RH, organization_id: null }
const OPERADOR: AuthUser = { ...RH, is_platform_admin: true }

function Ubicacion() {
  const { pathname, search, hash } = useLocation()
  return <pre data-testid="ubicacion">{`${pathname}${search}${hash}`}</pre>
}

const ruta = () => screen.getByTestId('ubicacion').textContent

function montar(entrada: string) {
  return render(
    <MemoryRouter initialEntries={[entrada]}>
      <AuthProvider>
        <App />
        <Ubicacion />
      </AuthProvider>
    </MemoryRouter>,
  )
}

async function entrarComo(usuario: AuthUser) {
  vi.mocked(login).mockResolvedValue(usuario)
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Correo electrónico'), usuario.email)
  await user.type(screen.getByLabelText('Contraseña'), 'secreta123')
  await user.click(screen.getByRole('button', { name: 'Entrar' }))
}

/** Adaptador que responde 401 a todo, como un backend con la sesión vencida. */
const responde401: AxiosAdapter = (config) => {
  const response: AxiosResponse = { data: {}, status: 401, statusText: '401', headers: {}, config }
  return Promise.reject(new AxiosError('401', AxiosError.ERR_BAD_REQUEST, config, null, response))
}

describe('App · rutas y guardas (D-07)', () => {
  const adaptadorOriginal = api.defaults.adapter

  beforeEach(() => {
    vi.mocked(fetchUser).mockReset()
    vi.mocked(login).mockReset()
  })

  afterEach(() => {
    api.defaults.adapter = adaptadorOriginal
    marcarSesion(false)
  })

  it('el índice de /admin redirige a /admin/creditos', async () => {
    vi.mocked(fetchUser).mockResolvedValue(OPERADOR)
    montar('/admin')
    expect(await screen.findByRole('heading', { name: 'Solicitudes de créditos' })).toBeInTheDocument()
    expect(screen.getByText('Barra de operación')).toBeInTheDocument()
    expect(ruta()).toBe('/admin/creditos')
  })

  it('/app/pruebas muestra el catálogo dentro del panel', async () => {
    vi.mocked(fetchUser).mockResolvedValue(RH)
    montar('/app/pruebas')
    expect(await screen.findByRole('heading', { name: 'Catálogo de pruebas' })).toBeInTheDocument()
    expect(screen.getByText('Barra del panel de RR. HH.')).toBeInTheDocument()
    expect(ruta()).toBe('/app/pruebas')
  })

  it('/app sin empresa lleva a /perfil con el aviso', async () => {
    vi.mocked(fetchUser).mockResolvedValue(SIN_EMPRESA)
    montar('/app/creditos')
    expect(await screen.findByRole('heading', { name: 'Mi perfil' })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(AVISO_SIN_ORGANIZACION)
    expect(screen.queryByText('Barra del panel de RR. HH.')).not.toBeInTheDocument()
    expect(ruta()).toBe('/perfil')
  })

  it('/perfil sin sesión lleva a /login', async () => {
    vi.mocked(fetchUser).mockResolvedValue(null)
    montar('/perfil')
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    expect(ruta()).toBe('/login')
  })

  it('/login con sesión lleva a /app y /registro sin empresa, a /perfil', async () => {
    vi.mocked(fetchUser).mockResolvedValue(RH)
    const { unmount } = montar('/login')
    expect(await screen.findByRole('heading', { name: 'Resultados' })).toBeInTheDocument()
    expect(ruta()).toBe('/app')
    unmount()

    vi.mocked(fetchUser).mockResolvedValue(SIN_EMPRESA)
    montar('/registro')
    expect(await screen.findByRole('heading', { name: 'Mi perfil' })).toBeInTheDocument()
    expect(ruta()).toBe('/perfil')
  })

  it('sin sesión, /app/creditos lleva a /login y, al entrar, vuelve a /app/creditos', async () => {
    vi.mocked(fetchUser).mockResolvedValue(null)
    montar('/app/creditos')
    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    await entrarComo(RH)
    expect(await screen.findByRole('heading', { name: 'Créditos' })).toBeInTheDocument()
    expect(ruta()).toBe('/app/creditos')
  })

  it('sesión vencida: un 401 en /app lleva a /login con el aviso y, al entrar, vuelve a la ruta de origen', async () => {
    vi.mocked(fetchUser).mockResolvedValue(RH)
    montar('/app/creditos')
    expect(await screen.findByRole('heading', { name: 'Créditos' })).toBeInTheDocument()

    // La sesión se cerró en otra pestaña: la siguiente llamada de la pantalla responde 401.
    api.defaults.adapter = responde401
    await act(async () => {
      await api.get('/api/credits').catch(() => {})
    })

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(AVISO_SESION_VENCIDA)
    expect(ruta()).toBe('/login')

    await entrarComo(RH)
    expect(await screen.findByRole('heading', { name: 'Créditos' })).toBeInTheDocument()
    expect(ruta()).toBe('/app/creditos')
  })

  it('Registro navega a su propio destino sin que la guarda de /registro lo desvíe', async () => {
    vi.mocked(fetchUser).mockResolvedValue(null)
    const user = userEvent.setup()
    montar('/registro')
    await user.click(await screen.findByRole('button', { name: 'Crear cuenta' }))
    expect(await screen.findByRole('heading', { name: 'Nueva evaluación' })).toBeInTheDocument()
    expect(ruta()).toBe('/app/evaluaciones/nueva')
  })

  it('Salir en /perfil llega a / y no rebota a /login', async () => {
    vi.mocked(fetchUser).mockResolvedValue(RH)
    const user = userEvent.setup()
    montar('/perfil')
    await user.click(await screen.findByRole('button', { name: 'Salir' }))
    expect(await screen.findByRole('heading', { name: 'Inicio' })).toBeInTheDocument()
    expect(ruta()).toBe('/')
  })
})
