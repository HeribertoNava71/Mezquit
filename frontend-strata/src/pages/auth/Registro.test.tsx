import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError } from 'axios'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchUser, register, type AuthUser, type RegisterPayload } from '@/api/auth'
import { marcarSesion } from '@/api/axios'
import { AuthProvider } from '@/context/AuthContext'
import Registro from './Registro'

// Registro con el AuthProvider real: solo se simula la API de autenticación.
vi.mock('@/api/auth', () => ({ fetchUser: vi.fn(), register: vi.fn() }))

const CON_EMPRESA: AuthUser = { id: 9, name: 'Leo', email: 'leo@empresa.mx', role: 'admin', organization_id: 3 }
const SIN_EMPRESA: AuthUser = { ...CON_EMPRESA, organization_id: null }

const NO_COINCIDEN = 'Las contraseñas no coinciden.'

function Ubicacion() {
  const { pathname } = useLocation()
  return <pre data-testid="ubicacion">{pathname}</pre>
}

function montar() {
  return render(
    <MemoryRouter initialEntries={['/registro']}>
      <AuthProvider>
        <Routes>
          <Route path="/registro" element={<Registro />} />
          <Route path="*" element={<p>Otra pantalla</p>} />
        </Routes>
        <Ubicacion />
      </AuthProvider>
    </MemoryRouter>,
  )
}

const ruta = () => screen.getByTestId('ubicacion').textContent
const campo = (rotulo: string) => screen.getByLabelText(rotulo)
const casillaAviso = () => screen.getByRole('checkbox', { name: /Acepto el aviso de privacidad/ })
const botonCrear = () => screen.getByRole('button', { name: 'Crear cuenta' })

/**
 * Llena los campos de golpe con un evento change por campo (el onChange de
 * React): mucho más rápido que teclear, y la prueba no depende de la carga de
 * la máquina. El tecleo real se prueba aparte, en la confirmación en vivo.
 */
function llenar(valores: Record<string, string>) {
  for (const [rotulo, valor] of Object.entries(valores)) {
    fireEvent.change(campo(rotulo), { target: { value: valor } })
  }
}

/** Los cinco datos obligatorios, con la confirmación igual a la contraseña. */
function llenarObligatorios(contrasena = 'Secreta123') {
  llenar({
    Nombre: 'Leo',
    Apellido: 'Ríos',
    'Correo electrónico': 'leo@empresa.mx',
    Contraseña: contrasena,
    'Confirmar contraseña': contrasena,
  })
}

// Margen de 15 s: varias pruebas teclean con userEvent y en una máquina cargada
// pueden pasar de los 5 s por defecto.
describe('Registro', { timeout: 15_000 }, () => {
  beforeEach(() => {
    vi.mocked(fetchUser).mockReset().mockResolvedValue(null)
    vi.mocked(register).mockReset()
  })

  afterEach(() => {
    marcarSesion(false)
  })

  it('tarjeta ancha con «Datos personales» y «Empresa (opcional)», los 9 campos más sector y tamaño', () => {
    montar()
    expect(screen.getByRole('heading', { level: 1, name: 'Crear cuenta' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Strata, inicio' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Entra aquí' })).toHaveAttribute('href', '/login')

    const personales = screen.getByRole('group', { name: 'Datos personales' })
    for (const rotulo of [
      'Nombre',
      'Apellido',
      'Correo electrónico',
      'Contraseña',
      'Confirmar contraseña',
      'Fecha de nacimiento',
      'Teléfono',
    ]) {
      expect(within(personales).getByLabelText(rotulo)).toHaveClass('st-input__field')
    }
    const empresa = screen.getByRole('group', { name: 'Empresa (opcional)' })
    expect(within(empresa).getByLabelText('Empresa / Organización')).toBeInTheDocument()
    expect(within(empresa).getByLabelText('Puesto')).toBeInTheDocument()

    // R-03: sector y tamaño con los valores que acepta RegisterRequest; empiezan vacíos.
    const sector = within(empresa).getByRole('combobox', { name: 'Sector' })
    expect(sector).toHaveValue('')
    expect([...sector.querySelectorAll('option')].map((o) => o.value)).toEqual([
      '',
      'comercio',
      'manufactura',
      'servicios',
      'otro',
    ])
    const tamano = within(empresa).getByRole('combobox', { name: 'Tamaño de la empresa' })
    expect(tamano).toHaveValue('')
    expect([...tamano.querySelectorAll('option')].map((o) => o.value)).toEqual(['', '1-10', '11-50', '51-250', '250+'])

    // Obligatorios con aria-required; los opcionales lo dicen junto al rótulo.
    expect(campo('Nombre')).toHaveAttribute('aria-required', 'true')
    expect(campo('Teléfono')).not.toHaveAttribute('aria-required')
    expect(campo('Teléfono')).toHaveAccessibleDescription('Opcional')
    expect(campo('Contraseña')).toHaveAccessibleDescription('Mínimo 8 caracteres')
  })

  it('la casilla del aviso de privacidad empieza sin marcar y enlaza al aviso en otra pestaña', () => {
    montar()
    const casilla = casillaAviso()
    expect(casilla).not.toBeChecked()
    const enlace = screen.getByRole('link', { name: /aviso de privacidad/ })
    expect(enlace).toHaveAttribute('href', '/aviso-de-privacidad')
    expect(enlace).toHaveAttribute('target', '_blank')
  })

  it('ningún texto promete un correo de verificación (PB-32)', () => {
    const { container } = montar()
    expect(container).not.toHaveTextContent(/verific/i)
    expect(container).not.toHaveTextContent(/te enviaremos/i)
  })

  it('envía el cuerpo exacto de siempre, con sector y tamaño, y con empresa lleva a /app/evaluaciones/nueva', async () => {
    vi.mocked(register).mockResolvedValue(CON_EMPRESA)
    const user = userEvent.setup()
    montar()

    llenarObligatorios()
    fireEvent.change(campo('Fecha de nacimiento'), { target: { value: '1990-05-17' } })
    llenar({
      Teléfono: '5512345678',
      'Empresa / Organización': 'Comercializadora Río Claro',
      Puesto: 'Gerente de RR. HH.',
    })
    await user.selectOptions(campo('Sector'), 'manufactura')
    await user.selectOptions(campo('Tamaño de la empresa'), '51-250')
    await user.click(casillaAviso())
    await user.click(botonCrear())

    expect(await screen.findByText('Otra pantalla')).toBeInTheDocument()
    expect(register).toHaveBeenCalledTimes(1)
    const esperado: RegisterPayload = {
      name: 'Leo',
      last_name: 'Ríos',
      email: 'leo@empresa.mx',
      password: 'Secreta123',
      password_confirmation: 'Secreta123',
      company_name: 'Comercializadora Río Claro',
      sector: 'manufactura',
      company_size: '51-250',
      phone: '5512345678',
      birth_date: '1990-05-17',
      position: 'Gerente de RR. HH.',
      privacy_accepted: true,
    }
    expect(register).toHaveBeenCalledWith(esperado)
    expect(Object.keys(vi.mocked(register).mock.calls[0][0]).sort()).toEqual(Object.keys(esperado).sort())
    expect(ruta()).toBe('/app/evaluaciones/nueva')
  })

  it('solo con los obligatorios envía los opcionales vacíos, como antes, y sin empresa lleva a /perfil', async () => {
    vi.mocked(register).mockResolvedValue(SIN_EMPRESA)
    const user = userEvent.setup()
    montar()

    llenarObligatorios()
    await user.click(casillaAviso())
    await user.click(botonCrear())

    expect(await screen.findByText('Otra pantalla')).toBeInTheDocument()
    expect(register).toHaveBeenCalledWith({
      name: 'Leo',
      last_name: 'Ríos',
      email: 'leo@empresa.mx',
      password: 'Secreta123',
      password_confirmation: 'Secreta123',
      company_name: '',
      sector: '',
      company_size: '',
      phone: '',
      birth_date: '',
      position: '',
      privacy_accepted: true,
    })
    expect(ruta()).toBe('/perfil')
  })

  it('confirmación en vivo: espera mientras escribes el principio, marca el error en cuanto se aparta y el válido al coincidir', async () => {
    const user = userEvent.setup()
    montar()
    const contrasena = campo('Contraseña')
    const confirmacion = campo('Confirmar contraseña')

    await user.type(contrasena, 'Secreta123')
    await user.type(confirmacion, 'Secre')
    // Todavía escribe el principio de la contraseña: ni error ni válido.
    expect(screen.queryByText(NO_COINCIDEN)).not.toBeInTheDocument()
    expect(confirmacion).not.toHaveAttribute('aria-invalid')
    expect(confirmacion.closest('.st-input')).not.toHaveClass('st-input--valid')

    // Se aparta: error inline con ícono, al momento.
    await user.type(confirmacion, 'x')
    expect(confirmacion).toHaveAttribute('aria-invalid', 'true')
    expect(confirmacion).toHaveAccessibleDescription(NO_COINCIDEN)
    expect(confirmacion.closest('.st-input')).toHaveClass('st-input--invalid')

    // Coincide: estado válido del Input, sin error.
    await user.clear(confirmacion)
    await user.type(confirmacion, 'Secreta123')
    expect(screen.queryByText(NO_COINCIDEN)).not.toBeInTheDocument()
    expect(confirmacion).not.toHaveAttribute('aria-invalid')
    expect(confirmacion.closest('.st-input')).toHaveClass('st-input--valid')

    // Si después cambia la contraseña, se vuelven a comparar.
    await user.type(contrasena, '4')
    expect(confirmacion).toHaveAttribute('aria-invalid', 'true')
    expect(confirmacion).toHaveAccessibleDescription(NO_COINCIDEN)
  })

  it('al salir de la confirmación con solo el principio de la contraseña, marca el error', async () => {
    const user = userEvent.setup()
    montar()
    await user.type(campo('Contraseña'), 'Secreta123')
    await user.type(campo('Confirmar contraseña'), 'Secre')
    expect(screen.queryByText(NO_COINCIDEN)).not.toBeInTheDocument()

    await user.tab()
    expect(campo('Confirmar contraseña')).toHaveAccessibleDescription(NO_COINCIDEN)
  })

  it('si la confirmación no coincide, no envía y el foco va a la confirmación', async () => {
    const user = userEvent.setup()
    montar()
    llenar({
      Nombre: 'Leo',
      Apellido: 'Ríos',
      'Correo electrónico': 'leo@empresa.mx',
      Contraseña: 'Secreta123',
      'Confirmar contraseña': 'Secreta12',
    })
    await user.click(casillaAviso())
    await user.click(botonCrear())

    expect(register).not.toHaveBeenCalled()
    await waitFor(() => expect(campo('Confirmar contraseña')).toHaveFocus())
    expect(campo('Confirmar contraseña')).toHaveAccessibleDescription(NO_COINCIDEN)
  })

  it('muestra la fuerza de la contraseña con los niveles de siempre', async () => {
    const user = userEvent.setup()
    montar()
    const contrasena = campo('Contraseña')
    await user.type(contrasena, 'abc')
    expect(contrasena).toHaveAccessibleDescription('Mínimo 8 caracteres Seguridad de la contraseña: Débil')
    await user.type(contrasena, 'defgh')
    expect(contrasena).toHaveAccessibleDescription('Mínimo 8 caracteres Seguridad de la contraseña: Media')
    await user.type(contrasena, '1')
    expect(contrasena).toHaveAccessibleDescription('Mínimo 8 caracteres Seguridad de la contraseña: Fuerte')
  })

  it('422: cada mensaje en su campo, con ícono y aria-invalid; el foco va al primero y el error se quita al editar', async () => {
    vi.mocked(register).mockRejectedValue({
      response: {
        status: 422,
        data: {
          message: 'El correo ya está registrado. (y 3 errores más)',
          errors: {
            email: ['El correo ya está registrado.'],
            password: ['La contraseña debe tener al menos 8 caracteres.'],
            sector: ['El sector no es válido.'],
            privacy_accepted: ['Debes aceptar el aviso de privacidad.'],
          },
        },
      },
    })
    const user = userEvent.setup()
    montar()
    llenarObligatorios('corta')
    await user.click(botonCrear())

    const correo = campo('Correo electrónico')
    expect(await screen.findByText('El correo ya está registrado.')).toBeInTheDocument()
    expect(correo).toHaveAttribute('aria-invalid', 'true')
    expect(correo).toHaveAccessibleDescription('El correo ya está registrado.')
    expect(campo('Contraseña')).toHaveAccessibleDescription(
      expect.stringContaining('La contraseña debe tener al menos 8 caracteres.'),
    )
    expect(campo('Sector')).toHaveAttribute('aria-invalid', 'true')
    expect(campo('Sector')).toHaveAccessibleDescription('El sector no es válido.')
    expect(casillaAviso()).toHaveAttribute('aria-invalid', 'true')
    expect(casillaAviso()).toHaveAccessibleDescription('Debes aceptar el aviso de privacidad.')
    // Error con ícono y texto (D-22).
    const error = screen.getByText('El correo ya está registrado.').closest('.st-field__error')
    expect(error?.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    // Sin aviso general: todo error tiene su campo.
    expect(screen.queryByText('Revisa tus datos')).not.toBeInTheDocument()
    // El foco va al primer campo con error, en el orden del formulario.
    await waitFor(() => expect(correo).toHaveFocus())

    await user.type(correo, 'x')
    expect(correo).not.toHaveAttribute('aria-invalid')
    expect(screen.queryByText('El correo ya está registrado.')).not.toBeInTheDocument()
    expect(campo('Sector')).toHaveAttribute('aria-invalid', 'true')
  })

  it('un 422 de la confirmación se muestra en su campo y se quita al cambiar la contraseña', async () => {
    vi.mocked(register).mockRejectedValue({
      response: {
        status: 422,
        data: { errors: { password_confirmation: ['La confirmación no coincide.'] } },
      },
    })
    const user = userEvent.setup()
    montar()
    llenarObligatorios()
    await user.click(botonCrear())

    const confirmacion = campo('Confirmar contraseña')
    expect(await screen.findByText('La confirmación no coincide.')).toBeInTheDocument()
    expect(confirmacion).toHaveAttribute('aria-invalid', 'true')

    await user.type(campo('Contraseña'), '4')
    expect(screen.queryByText('La confirmación no coincide.')).not.toBeInTheDocument()
    // Ahora manda la comparación en vivo.
    expect(confirmacion).toHaveAccessibleDescription(NO_COINCIDEN)
  })

  it('un 422 de un dato que no está en el formulario va al aviso general', async () => {
    vi.mocked(register).mockRejectedValue({
      response: { status: 422, data: { errors: { organization: ['No pudimos registrar la empresa.'] } } },
    })
    const user = userEvent.setup()
    montar()
    llenarObligatorios()
    await user.click(botonCrear())

    const aviso = await screen.findByText('Revisa tus datos')
    const callout = aviso.closest('.st-callout')
    expect(callout).toHaveClass('st-callout--error')
    expect(callout).toHaveTextContent('No pudimos registrar la empresa.')
    expect(callout).toHaveAttribute('role', 'alert')
  })

  it('sin conexión: aviso con «Reintentar», que vuelve a enviar el mismo cuerpo', async () => {
    vi.mocked(register)
      .mockRejectedValueOnce(new AxiosError('Network Error', AxiosError.ERR_NETWORK))
      .mockResolvedValueOnce(CON_EMPRESA)
    const user = userEvent.setup()
    montar()
    llenarObligatorios()
    await user.click(casillaAviso())
    await user.click(botonCrear())

    const aviso = await screen.findByRole('alert')
    expect(aviso).toHaveTextContent('No pudimos conectarnos')
    expect(aviso).toHaveTextContent('Revisa tu conexión a internet e inténtalo de nuevo.')

    await user.click(within(aviso).getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('Otra pantalla')).toBeInTheDocument()
    expect(register).toHaveBeenCalledTimes(2)
    expect(vi.mocked(register).mock.calls[1][0]).toEqual(vi.mocked(register).mock.calls[0][0])
    expect(ruta()).toBe('/app/evaluaciones/nueva')
  })

  it('un error del servidor sin mensajes por campo: «No pudimos crear tu cuenta» con «Reintentar»', async () => {
    vi.mocked(register).mockRejectedValue({ response: { status: 500, data: { message: 'Server Error' } } })
    const user = userEvent.setup()
    montar()
    llenarObligatorios()
    await user.click(botonCrear())

    const aviso = await screen.findByRole('alert')
    expect(aviso).toHaveTextContent('No pudimos crear tu cuenta')
    expect(within(aviso).getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
    expect(ruta()).toBe('/registro')
  })

  it('mientras crea la cuenta, el botón muestra la carga y no deja enviar otra vez', async () => {
    let resolver: (usuario: AuthUser) => void = () => {}
    vi.mocked(register).mockReturnValue(new Promise<AuthUser>((resolve) => (resolver = resolve)))
    const user = userEvent.setup()
    montar()
    llenarObligatorios()
    await user.click(botonCrear())

    const boton = await screen.findByRole('button', { name: 'Creando cuenta…' })
    expect(boton).toHaveAttribute('aria-busy', 'true')
    await user.click(boton)
    expect(register).toHaveBeenCalledTimes(1)

    await act(async () => resolver(CON_EMPRESA))
    expect(await screen.findByText('Otra pantalla')).toBeInTheDocument()
  })
})
