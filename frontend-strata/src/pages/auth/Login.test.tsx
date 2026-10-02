import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError } from 'axios'
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchUser, login, type AuthUser } from '@/api/auth'
import { marcarSesion } from '@/api/axios'
import { AVISO_SESION_VENCIDA } from '@/components/rutasDeSesion'
import { AuthProvider } from '@/context/AuthContext'
import Login from './Login'

// Login con el AuthProvider real: solo se simula la API de autenticación.
vi.mock('@/api/auth', () => ({ fetchUser: vi.fn(), login: vi.fn() }))

const RH: AuthUser = { id: 1, name: 'Ana', email: 'ana@empresa.mx', role: 'admin', organization_id: 7 }
const SIN_EMPRESA: AuthUser = { ...RH, organization_id: null }

/** 422 de SessionController cuando las credenciales no coinciden. */
const CREDENCIALES_422 = {
  response: {
    status: 422,
    data: { message: 'Credenciales incorrectas.', errors: { email: ['Credenciales incorrectas.'] } },
  },
}

function Ubicacion() {
  const { pathname, search, hash } = useLocation()
  return <pre data-testid="ubicacion">{`${pathname}${search}${hash}`}</pre>
}

function Atras() {
  const navigate = useNavigate()
  return (
    <button type="button" onClick={() => navigate(-1)}>
      Atrás
    </button>
  )
}

type Entrada = string | { pathname: string; state?: unknown }

function montar(entradas: Entrada[]) {
  return render(
    <MemoryRouter initialEntries={entradas} initialIndex={entradas.length - 1}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<p>Otra pantalla</p>} />
        </Routes>
        <Ubicacion />
        <Atras />
      </AuthProvider>
    </MemoryRouter>,
  )
}

async function entrar() {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Correo electrónico'), 'ana@empresa.mx')
  await user.type(screen.getByLabelText('Contraseña'), 'secreta123')
  await user.click(screen.getByRole('button', { name: 'Entrar' }))
  return user
}

const ruta = () => screen.getByTestId('ubicacion').textContent

// Margen de 15 s: estas pruebas teclean con userEvent y en una máquina cargada
// pueden pasar de los 5 s por defecto.
describe('Login', { timeout: 15_000 }, () => {
  beforeEach(() => {
    vi.mocked(fetchUser).mockReset().mockResolvedValue(null)
    vi.mocked(login).mockReset()
  })

  afterEach(() => {
    marcarSesion(false)
  })

  it('tarjeta del acceso: título, logo que lleva a «/», enlace a /registro y sin «¿Olvidaste tu contraseña?» (PB-23)', () => {
    const { container } = montar(['/login'])
    expect(screen.getByRole('heading', { level: 1, name: 'Entrar' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Strata, inicio' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Regístrate' })).toHaveAttribute('href', '/registro')
    expect(screen.queryByText(/olvidaste/i)).not.toBeInTheDocument()
    expect(container).not.toHaveTextContent(/olvidaste/i)

    // Input del sistema con el rótulo arriba (sin etiqueta flotante) y la tarjeta del acceso.
    const correo = screen.getByLabelText('Correo electrónico')
    expect(correo).toHaveClass('st-input__field')
    expect(correo).toHaveAttribute('type', 'email')
    expect(correo).toHaveAttribute('aria-required', 'true')
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute('autocomplete', 'current-password')
    expect(correo.closest('.st-card')).toHaveClass('st-card--white', 'st-card--border-warm')
    // Fila de enlaces del acceso, con el acceso del candidato.
    expect(screen.getByRole('link', { name: '¿Te invitaron a una evaluación?' })).toHaveAttribute('href', '/evaluar')
  })

  it('muestra el aviso que trae location.state con el Callout del sistema', async () => {
    montar([{ pathname: '/login', state: { from: '/app/creditos', aviso: AVISO_SESION_VENCIDA } }])
    const aviso = await screen.findByRole('alert')
    expect(aviso).toHaveTextContent('Tu sesión expiró. Vuelve a entrar.')
    expect(aviso).toHaveClass('st-callout')
  })

  it('sin aviso no muestra ningún Callout', () => {
    montar(['/login'])
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('tras entrar vuelve a la ruta de origen si el usuario puede abrirla', async () => {
    vi.mocked(login).mockResolvedValue(RH)
    montar([{ pathname: '/login', state: { from: '/app/evaluaciones/3?tab=candidatos' } }])
    await entrar()
    expect(login).toHaveBeenCalledWith('ana@empresa.mx', 'secreta123')
    expect(await screen.findByText('Otra pantalla')).toBeInTheDocument()
    expect(ruta()).toBe('/app/evaluaciones/3?tab=candidatos')
  })

  it('si no puede abrir la ruta de origen, conserva la redirección de siempre', async () => {
    vi.mocked(login).mockResolvedValue(SIN_EMPRESA)
    montar([{ pathname: '/login', state: { from: '/app/creditos' } }])
    await entrar()
    await screen.findByText('Otra pantalla')
    expect(ruta()).toBe('/perfil')
  })

  it('sin ruta de origen va a /app con empresa', async () => {
    vi.mocked(login).mockResolvedValue(RH)
    montar(['/login'])
    await entrar()
    await screen.findByText('Otra pantalla')
    expect(ruta()).toBe('/app')
  })

  it('reemplaza /login en el historial: «Atrás» no regresa al formulario', async () => {
    vi.mocked(login).mockResolvedValue(RH)
    montar(['/pruebas', '/login'])
    const user = await entrar()
    await screen.findByText('Otra pantalla')
    expect(ruta()).toBe('/app')

    await user.click(screen.getByRole('button', { name: 'Atrás' }))
    expect(ruta()).toBe('/pruebas')
  })

  it('mientras entra, el botón muestra la carga y no deja enviar otra vez', async () => {
    let resolver: (usuario: AuthUser) => void = () => {}
    vi.mocked(login).mockReturnValue(new Promise<AuthUser>((resolve) => (resolver = resolve)))
    montar(['/login'])
    const user = await entrar()

    const boton = await screen.findByRole('button', { name: 'Entrando…' })
    expect(boton).toHaveAttribute('aria-busy', 'true')
    expect(boton).toHaveAttribute('aria-disabled', 'true')
    await user.click(boton)
    expect(login).toHaveBeenCalledTimes(1)

    await act(async () => resolver(RH))
    await screen.findByText('Otra pantalla')
    expect(ruta()).toBe('/app')
  })

  it('valida en el cliente: correo y contraseña obligatorios y el formato del correo, inline y sin enviar', async () => {
    const user = userEvent.setup()
    montar(['/login'])
    const correo = screen.getByLabelText('Correo electrónico')
    const contrasena = screen.getByLabelText('Contraseña')

    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(login).not.toHaveBeenCalled()
    expect(correo).toHaveAttribute('aria-invalid', 'true')
    expect(correo).toHaveAccessibleDescription('Escribe tu correo electrónico.')
    expect(contrasena).toHaveAccessibleDescription('Escribe tu contraseña.')
    // El foco va al primer campo con error.
    expect(correo).toHaveFocus()

    // Escribir quita el error de ese campo.
    await user.type(correo, 'ana@')
    expect(correo).not.toHaveAttribute('aria-invalid')
    expect(contrasena).toHaveAttribute('aria-invalid', 'true')

    await user.type(contrasena, 'secreta123')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(login).not.toHaveBeenCalled()
    expect(correo).toHaveAccessibleDescription('Escribe un correo válido, como nombre@empresa.com.')
    expect(correo).toHaveFocus()
  })

  it('con credenciales incorrectas (422) se queda en /login con el error de siempre, sin «Reintentar»', async () => {
    vi.mocked(login).mockRejectedValue(CREDENCIALES_422)
    montar(['/login'])
    await entrar()
    const error = await screen.findByRole('alert')
    expect(error).toHaveTextContent('Correo o contraseña incorrectos.')
    expect(error).toHaveClass('st-callout', 'st-callout--error')
    // Ícono y texto (D-22).
    expect(error.querySelector('.st-callout__icon svg')).toHaveAttribute('aria-hidden', 'true')
    expect(within(error).queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Entrar' })).not.toHaveAttribute('aria-busy')
    expect(ruta()).toBe('/login')
  })

  it('sin conexión no culpa a las credenciales: aviso distinto con «Reintentar», que vuelve a enviar', async () => {
    vi.mocked(login)
      .mockRejectedValueOnce(new AxiosError('Network Error', AxiosError.ERR_NETWORK))
      .mockResolvedValueOnce(RH)
    montar(['/login'])
    const user = await entrar()

    const error = await screen.findByRole('alert')
    expect(error).toHaveTextContent('No pudimos conectarnos')
    expect(error).toHaveTextContent('Revisa tu conexión a internet e inténtalo de nuevo.')
    expect(screen.queryByText('Correo o contraseña incorrectos.')).not.toBeInTheDocument()

    await user.click(within(error).getByRole('button', { name: 'Reintentar' }))
    await screen.findByText('Otra pantalla')
    expect(login).toHaveBeenCalledTimes(2)
    expect(login).toHaveBeenLastCalledWith('ana@empresa.mx', 'secreta123')
    expect(ruta()).toBe('/app')
  })

  it('un error del servidor (500) también se distingue de las credenciales', async () => {
    vi.mocked(login).mockRejectedValue({ response: { status: 500, data: { message: 'Server Error' } } })
    montar(['/login'])
    await entrar()
    const error = await screen.findByRole('alert')
    expect(error).toHaveTextContent('No pudimos iniciar tu sesión')
    expect(within(error).getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Entrar' })).not.toHaveAttribute('aria-busy'))
  })
})
