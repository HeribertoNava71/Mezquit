import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

describe('Login', () => {
  beforeEach(() => {
    vi.mocked(fetchUser).mockReset().mockResolvedValue(null)
    vi.mocked(login).mockReset()
  })

  afterEach(() => {
    marcarSesion(false)
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

  it('con credenciales incorrectas se queda en /login con el error', async () => {
    vi.mocked(login).mockRejectedValue(new Error('422'))
    montar(['/login'])
    await entrar()
    expect(await screen.findByText('Correo o contraseña incorrectos.')).toBeInTheDocument()
    expect(ruta()).toBe('/login')
  })
})
