import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { updateAdminMe } from '@/api/adminUsers'
import type { AuthUser } from '@/api/auth'
import { ToastProvider } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import AdminPerfilPage, { EXITO_CREDENCIALES, MENSAJE_SIN_DETALLE } from './AdminPerfilPage'

// /admin/perfil con PUT /api/admin/me y la sesión simulados. Forma de
// UserController::updateMe (2026-09-12-registro-login-crud-usuarios.md:684-697):
// validate() responde 422 con `errors`; la contraseña actual incorrecta, 422 sin
// `errors` y el detalle serializado en `message` (PB-24).

vi.mock('@/api/adminUsers', () => ({ updateAdminMe: vi.fn() }))
vi.mock('@/context/AuthContext', () => ({ useAuth: vi.fn() }))

const OPERADOR: AuthUser = {
  id: 2,
  name: 'Luis',
  last_name: 'Ordóñez',
  email: 'operador@strata.mx',
  role: 'admin',
  organization_id: 7,
  is_platform_admin: true,
}

function errorHttp(status?: number, data: unknown = {}): AxiosError {
  if (status === undefined) return new AxiosError('Network Error', AxiosError.ERR_NETWORK)
  const respuesta = { status, statusText: '', data, headers: {}, config: { headers: new AxiosHeaders() } }
  return new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, undefined, undefined, respuesta as AxiosResponse)
}

const setUser = vi.fn()

function montar() {
  render(
    <MemoryRouter initialEntries={['/admin/perfil']}>
      <ToastProvider>
        <AdminPerfilPage />
      </ToastProvider>
    </MemoryRouter>,
  )
  return userEvent.setup()
}

type Usuario = ReturnType<typeof userEvent.setup>

/** Escribe un texto de una vez (pegar): un solo evento de cambio por campo, rápido con la máquina cargada. */
async function escribir(user: Usuario, elemento: HTMLElement, texto: string) {
  await user.click(elemento)
  await user.paste(texto)
}

const correo = () => screen.getByRole('textbox', { name: 'Correo electrónico' })
const campo = (etiqueta: RegExp) => screen.getByLabelText(etiqueta) as HTMLInputElement
const formulario = () => screen.getByRole('form', { name: 'Correo y contraseña' })
const guardar = () => within(formulario()).getByRole('button', { name: 'Guardar cambios' })
const toaster = () => document.querySelector('.st-toaster') as HTMLElement

async function escribirContrasenas(user: Usuario, actual = 'actual123', nueva = 'secreta123', confirmacion = nueva) {
  await escribir(user, campo(/^Contraseña actual/), actual)
  await escribir(user, campo(/^Nueva contraseña/), nueva)
  await escribir(user, campo(/^Confirmar nueva contraseña/), confirmacion)
}

// Margen para correr junto a otras suites en paralelo; una prueba colgada igual falla.
describe('AdminPerfilPage', { timeout: 15_000 }, () => {
  beforeEach(() => {
    vi.mocked(updateAdminMe).mockReset()
    vi.mocked(useAuth).mockReset()
    setUser.mockReset()
    vi.mocked(useAuth).mockReturnValue({ user: OPERADOR, loading: false, setUser })
  })

  it('muestra el encabezado y precarga el correo de la sesión', () => {
    montar()
    expect(screen.getByRole('heading', { level: 1, name: 'Mi perfil de operador' })).toBeInTheDocument()
    expect(correo()).toHaveValue('operador@strata.mx')
    expect(correo()).toBeRequired()
    expect(campo(/^Contraseña actual/)).toHaveValue('')
  })

  it('valida la confirmación al momento', async () => {
    const user = montar()
    await escribirContrasenas(user, 'actual123', 'secreta123', 'secreta124')
    const confirmacion = campo(/^Confirmar nueva contraseña/)
    expect(confirmacion).toHaveAttribute('aria-invalid', 'true')
    expect(confirmacion).toHaveAccessibleDescription(/Las contraseñas no coinciden\./)

    await user.keyboard('{Backspace}3')
    expect(confirmacion).not.toHaveAttribute('aria-invalid')
    expect(confirmacion.closest('.st-input')).toHaveClass('st-input--valid')
  })

  it('envía el payload de siempre, actualiza el correo en la sesión y confirma', async () => {
    vi.mocked(updateAdminMe).mockResolvedValue()
    const user = montar()

    await user.clear(correo())
    await escribir(user, correo(), 'nuevo@strata.mx')
    await escribirContrasenas(user)
    await user.click(guardar())

    expect(updateAdminMe).toHaveBeenCalledWith({
      email: 'nuevo@strata.mx',
      current_password: 'actual123',
      password: 'secreta123',
      password_confirmation: 'secreta123',
    })
    expect(await within(toaster()).findByText(EXITO_CREDENCIALES)).toBeInTheDocument()
    expect(within(formulario()).getByText(EXITO_CREDENCIALES)).toBeInTheDocument()
    // Antes la sesión se quedaba con el correo anterior.
    expect(setUser).toHaveBeenCalledWith({ ...OPERADOR, email: 'nuevo@strata.mx' })
    expect(correo()).toHaveValue('nuevo@strata.mx')
    expect(campo(/^Contraseña actual/)).toHaveValue('')
    expect(campo(/^Nueva contraseña/)).toHaveValue('')
    expect(campo(/^Confirmar nueva contraseña/)).toHaveValue('')
  })

  it('el 422 sin errores (PB-24) muestra un mensaje genérico en línea y no toca la sesión', async () => {
    vi.mocked(updateAdminMe).mockRejectedValue(
      errorHttp(422, {
        message: JSON.stringify({
          message: 'La contraseña actual es incorrecta.',
          errors: { current_password: ['La contraseña actual es incorrecta.'] },
        }),
      }),
    )
    const user = montar()
    await escribirContrasenas(user, 'equivocada')
    await user.click(guardar())

    const aviso = await within(formulario()).findByRole('alert')
    expect(aviso).toHaveTextContent('No pudimos guardar tus cambios')
    expect(aviso).toHaveTextContent(MENSAJE_SIN_DETALLE)
    // No se muestra el JSON crudo del servidor.
    expect(aviso).not.toHaveTextContent('{')
    expect(setUser).not.toHaveBeenCalled()
    expect(within(toaster()).queryByText(EXITO_CREDENCIALES)).not.toBeInTheDocument()
    // Lo escrito se conserva para corregirlo.
    expect(campo(/^Nueva contraseña/)).toHaveValue('secreta123')
  })

  it('el correo en uso (422 con errors) va en su campo', async () => {
    vi.mocked(updateAdminMe).mockRejectedValue(
      errorHttp(422, { message: 'The email has already been taken.', errors: { email: ['El correo ya está en uso.'] } }),
    )
    const user = montar()
    await user.clear(correo())
    await escribir(user, correo(), 'otra@empresa.mx')
    await escribirContrasenas(user)
    await user.click(guardar())

    expect(await within(formulario()).findByText('El correo ya está en uso.')).toBeInTheDocument()
    expect(correo()).toHaveAttribute('aria-invalid', 'true')
    expect(correo()).toHaveFocus()
    expect(within(formulario()).queryByText('No pudimos guardar tus cambios')).not.toBeInTheDocument()
    expect(setUser).not.toHaveBeenCalled()
  })

  it('revisa el correo antes de enviar', async () => {
    const user = montar()
    await user.clear(correo())
    await escribir(user, correo(), 'no-es-correo')
    await escribirContrasenas(user)
    await user.click(guardar())

    expect(updateAdminMe).not.toHaveBeenCalled()
    expect(within(formulario()).getByText('Escribe un correo válido, como nombre@empresa.com.')).toBeInTheDocument()
    expect(correo()).toHaveFocus()
  })

  it('un error de red se muestra en línea', async () => {
    vi.mocked(updateAdminMe).mockRejectedValue(errorHttp())
    const user = montar()
    await escribirContrasenas(user)
    await user.click(guardar())

    const aviso = await within(formulario()).findByRole('alert')
    expect(aviso).toHaveTextContent('Revisa tu conexión a internet e inténtalo de nuevo.')
    expect(setUser).not.toHaveBeenCalled()
  })
})
