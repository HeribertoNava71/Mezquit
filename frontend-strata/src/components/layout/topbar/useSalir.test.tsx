import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { logout } from '@/api/auth'
import { useSalir } from './useSalir'

const auth = vi.hoisted(() => ({ setUser: vi.fn() }))

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: null, loading: false, setUser: auth.setUser }),
}))
vi.mock('@/api/auth', () => ({ logout: vi.fn() }))

/** Error de axios con el código HTTP dado; sin código, un error de red. */
function errorHttp(status?: number): AxiosError {
  if (status === undefined) return new AxiosError('Network Error', AxiosError.ERR_NETWORK)
  const respuesta = { status, statusText: '', data: {}, headers: {}, config: { headers: new AxiosHeaders() } }
  return new AxiosError('Request failed', AxiosError.ERR_BAD_RESPONSE, undefined, undefined, respuesta as AxiosResponse)
}

function Prueba({ destino }: { destino: string }) {
  const { salir, saliendo, error, descartarError } = useSalir(destino)
  return (
    <>
      <button type="button" onClick={() => void salir()}>
        Salir
      </button>
      <button type="button" onClick={descartarError}>
        Descartar
      </button>
      <p data-testid="estado">
        {saliendo ? 'saliendo' : 'quieto'} · {error ?? 'sin error'}
      </p>
    </>
  )
}

function montar(destino = '/login') {
  render(
    <MemoryRouter initialEntries={['/app/creditos']}>
      <Routes>
        <Route path="/login" element={<h1>Pantalla de entrada</h1>} />
        <Route path="/" element={<h1>Inicio</h1>} />
        <Route path="*" element={<Prueba destino={destino} />} />
      </Routes>
    </MemoryRouter>,
  )
  return userEvent.setup()
}

beforeEach(() => {
  auth.setUser.mockReset()
})

describe('useSalir', () => {
  it('hace POST /api/logout, limpia la sesión y navega al destino', async () => {
    vi.mocked(logout).mockResolvedValue(undefined)
    const user = montar('/login')
    await user.click(screen.getByRole('button', { name: 'Salir' }))

    expect(await screen.findByRole('heading', { name: 'Pantalla de entrada' })).toBeInTheDocument()
    expect(logout).toHaveBeenCalledTimes(1)
    expect(auth.setUser).toHaveBeenCalledWith(null)
  })

  it('desde el sitio público lleva al inicio', async () => {
    vi.mocked(logout).mockResolvedValue(undefined)
    const user = montar('/')
    await user.click(screen.getByRole('button', { name: 'Salir' }))
    expect(await screen.findByRole('heading', { name: 'Inicio' })).toBeInTheDocument()
  })

  it.each([401, 419])('con %i la sesión ya no existe: también la cierra en el navegador', async (status) => {
    vi.mocked(logout).mockRejectedValue(errorHttp(status))
    const user = montar('/login')
    await user.click(screen.getByRole('button', { name: 'Salir' }))
    expect(await screen.findByRole('heading', { name: 'Pantalla de entrada' })).toBeInTheDocument()
    expect(auth.setUser).toHaveBeenCalledWith(null)
  })

  it.each([
    [undefined, 'red'],
    [500, 'servidor'],
  ])('si falla (%s) no finge la salida: conserva la sesión y expone el error «%s»', async (status, tipo) => {
    vi.mocked(logout).mockRejectedValue(errorHttp(status))
    const user = montar('/login')
    await user.click(screen.getByRole('button', { name: 'Salir' }))

    await waitFor(() => expect(screen.getByTestId('estado')).toHaveTextContent(`quieto · ${tipo}`))
    expect(auth.setUser).not.toHaveBeenCalled()
    expect(screen.queryByRole('heading', { name: 'Pantalla de entrada' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Descartar' }))
    expect(screen.getByTestId('estado')).toHaveTextContent('quieto · sin error')
  })

  it('no manda dos POST si se pulsa Salir dos veces seguidas', async () => {
    let terminar: () => void = () => {}
    vi.mocked(logout).mockReturnValue(
      new Promise<void>((resolve) => {
        terminar = resolve
      }),
    )
    const user = montar('/login')
    const salir = screen.getByRole('button', { name: 'Salir' })
    await user.click(salir)
    await user.click(salir)
    expect(screen.getByTestId('estado')).toHaveTextContent('saliendo')
    expect(logout).toHaveBeenCalledTimes(1)

    terminar()
    expect(await screen.findByRole('heading', { name: 'Pantalla de entrada' })).toBeInTheDocument()
  })
})
