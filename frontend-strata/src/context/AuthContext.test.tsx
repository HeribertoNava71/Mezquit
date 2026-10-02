import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, type AxiosAdapter, type AxiosResponse } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'
import { fetchUser, type AuthUser } from '@/api/auth'
import api, { EVENTO_SESION_VENCIDA, marcarSesion } from '@/api/axios'
import { AuthProvider, useAuth } from './AuthContext'

// AuthProvider con el cliente api real: marca la sesión, escucha el evento de
// sesión vencida que emite el interceptor y limpia user (D-07, punto 8).

vi.mock('@/api/auth', () => ({ fetchUser: vi.fn() }))

const ANA: AuthUser = { id: 1, name: 'Ana', email: 'ana@empresa.mx', role: 'admin', organization_id: 7 }

/** Adaptador que responde 401 a todo, como un backend con la sesión vencida. */
const responde401: AxiosAdapter = (config) => {
  const response: AxiosResponse = { data: {}, status: 401, statusText: '401', headers: {}, config }
  return Promise.reject(new AxiosError('401', AxiosError.ERR_BAD_REQUEST, config, null, response))
}

function Sesion() {
  const { user, loading, sesionVencida, setUser } = useAuth()
  return (
    <div>
      <p>{loading ? 'Cargando sesión' : user ? `Sesión de ${user.name}` : 'Sin sesión'}</p>
      <p>{sesionVencida ? 'Sesión vencida' : 'Sesión vigente'}</p>
      <button type="button" onClick={() => setUser(ANA)}>
        Entrar
      </button>
      <button type="button" onClick={() => setUser(null)}>
        Salir
      </button>
    </div>
  )
}

function montar() {
  return render(
    <AuthProvider>
      <Sesion />
    </AuthProvider>,
  )
}

/** Una petición que vuelve con 401, como cualquier pantalla con la sesión vencida. */
async function peticionCon401() {
  await act(async () => {
    await api.get('/api/credits').catch(() => {})
  })
}

describe('AuthProvider', () => {
  const adaptadorOriginal = api.defaults.adapter
  let alVencer: Mock<(evento: Event) => void>

  beforeEach(() => {
    vi.mocked(fetchUser).mockReset()
    api.defaults.adapter = responde401
    alVencer = vi.fn<(evento: Event) => void>()
    window.addEventListener(EVENTO_SESION_VENCIDA, alVencer)
  })

  afterEach(() => {
    window.removeEventListener(EVENTO_SESION_VENCIDA, alVencer)
    api.defaults.adapter = adaptadorOriginal
    marcarSesion(false)
  })

  it('carga la sesión con GET /api/user al montar', async () => {
    vi.mocked(fetchUser).mockResolvedValue(ANA)
    montar()
    expect(screen.getByText('Cargando sesión')).toBeInTheDocument()
    expect(await screen.findByText('Sesión de Ana')).toBeInTheDocument()
    expect(screen.getByText('Sesión vigente')).toBeInTheDocument()
  })

  it('un 401 de una petición con sesión limpia user y marca la sesión como vencida', async () => {
    vi.mocked(fetchUser).mockResolvedValue(ANA)
    montar()
    await screen.findByText('Sesión de Ana')

    await peticionCon401()
    expect(alVencer).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Sin sesión')).toBeInTheDocument()
    expect(screen.getByText('Sesión vencida')).toBeInTheDocument()
  })

  it('el 401 del visitante no emite el aviso ni marca nada', async () => {
    vi.mocked(fetchUser).mockResolvedValue(null)
    montar()
    await screen.findByText('Sin sesión')

    await peticionCon401()
    expect(alVencer).not.toHaveBeenCalled()
    expect(screen.getByText('Sesión vigente')).toBeInTheDocument()
  })

  it('un evento sin sesión se ignora', async () => {
    vi.mocked(fetchUser).mockResolvedValue(null)
    montar()
    await screen.findByText('Sin sesión')

    act(() => {
      window.dispatchEvent(new CustomEvent(EVENTO_SESION_VENCIDA))
    })
    expect(screen.getByText('Sesión vigente')).toBeInTheDocument()
  })

  it('setUser(user) quita el vencimiento y vuelve a marcar la sesión en el cliente', async () => {
    const user = userEvent.setup()
    vi.mocked(fetchUser).mockResolvedValue(ANA)
    montar()
    await screen.findByText('Sesión de Ana')
    await peticionCon401()
    expect(screen.getByText('Sesión vencida')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(screen.getByText('Sesión de Ana')).toBeInTheDocument()
    expect(screen.getByText('Sesión vigente')).toBeInTheDocument()

    // Con la sesión marcada otra vez, un nuevo 401 vuelve a avisar.
    await peticionCon401()
    expect(alVencer).toHaveBeenCalledTimes(2)
    expect(screen.getByText('Sesión vencida')).toBeInTheDocument()
  })

  it('Salir (setUser(null)) no cuenta como sesión vencida y los 401 posteriores no avisan', async () => {
    const user = userEvent.setup()
    vi.mocked(fetchUser).mockResolvedValue(ANA)
    montar()
    await screen.findByText('Sesión de Ana')

    await user.click(screen.getByRole('button', { name: 'Salir' }))
    expect(screen.getByText('Sin sesión')).toBeInTheDocument()
    expect(screen.getByText('Sesión vigente')).toBeInTheDocument()

    await peticionCon401()
    expect(alVencer).not.toHaveBeenCalled()
  })
})
