import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { deleteUser, getUser, updateUser, type AdminUser } from '@/api/adminUsers'
import { ToastProvider } from '@/components/ui'
import AdminUsuarioDetallePage from './AdminUsuarioDetallePage'

// /admin/usuarios/:id con src/api/adminUsers simulado. Formas de
// Admin\UserController::show, update y destroy
// (2026-09-12-registro-login-crud-usuarios.md:667-683) y de e2e/mocks/admin.json.

vi.mock('@/api/adminUsers', () => ({
  listUsers: vi.fn(),
  getUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  updateAdminMe: vi.fn(),
}))

const MARIANA: AdminUser = {
  id: 34,
  name: 'Mariana',
  last_name: 'Solís',
  email: 'mariana.solis@example.com',
  phone: '55 0142 8890',
  birth_date: '1987-04-23T00:00:00.000000Z',
  position: 'Gerente de Talento y Cultura',
  role: 'admin',
  created_at: '2026-09-02T12:15:02.000000Z',
  organization: { name: 'Comercializadora Río Claro' },
}

/** Usuario previo a la migración de perfil: last_name, teléfono, puesto y fecha en null (PB-27). */
const SIN_APELLIDO = {
  ...MARIANA,
  id: 36,
  name: 'Óscar',
  last_name: null,
  phone: null,
  position: null,
  birth_date: null,
  organization: null,
} as unknown as AdminUser

/** Error de axios con el código HTTP dado; sin código, un error de red. */
function errorHttp(status?: number, data: unknown = {}): AxiosError {
  if (status === undefined) return new AxiosError('Network Error', AxiosError.ERR_NETWORK)
  const respuesta = { status, statusText: '', data, headers: {}, config: { headers: new AxiosHeaders() } }
  return new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, undefined, undefined, respuesta as AxiosResponse)
}

function montar(id: number | string = 34) {
  render(
    <ToastProvider>
      <MemoryRouter initialEntries={[`/admin/usuarios/${id}`]}>
        <Routes>
          <Route path="/admin/usuarios/:id" element={<AdminUsuarioDetallePage />} />
          <Route path="/admin/usuarios" element={<h1>Lista de usuarios</h1>} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  )
  return userEvent.setup()
}

const campo = (nombre: string) => screen.getByRole('textbox', { name: nombre })
const rol = () => screen.getByRole('combobox', { name: 'Rol' })
const guardar = () => screen.getByRole('button', { name: 'Guardar cambios' })

beforeEach(() => {
  vi.mocked(getUser).mockReset()
  vi.mocked(updateUser).mockReset()
  vi.mocked(deleteUser).mockReset()
  vi.mocked(getUser).mockImplementation(async (id) => {
    if (id === 34) return MARIANA
    if (id === 36) return SIN_APELLIDO
    throw errorHttp(404, { message: 'No query results for model [App\\Models\\User].' })
  })
  vi.mocked(updateUser).mockResolvedValue(undefined)
  vi.mocked(deleteUser).mockResolvedValue(undefined)
})

describe('AdminUsuarioDetallePage (/admin/usuarios/:id)', () => {
  it('muestra la carga y luego el perfil editable con el rol en un Select con etiqueta', async () => {
    montar()
    expect(screen.getByText('Cargando usuario…')).toBeInTheDocument()

    expect(await screen.findByRole('heading', { level: 1, name: 'Mariana Solís' })).toBeInTheDocument()
    expect(getUser).toHaveBeenCalledWith(34)
    expect(campo('Nombre')).toHaveValue('Mariana')
    expect(campo('Nombre')).toBeRequired()
    expect(campo('Apellido')).toHaveValue('Solís')
    expect(screen.getByRole('textbox', { name: 'Teléfono' })).toHaveValue('55 0142 8890')
    expect(campo('Puesto')).toHaveValue('Gerente de Talento y Cultura')
    expect(rol()).toHaveValue('admin')
    expect(within(rol()).getAllByRole('option').map((opcion) => opcion.textContent)).toEqual([
      'Administrador',
      'Reclutador',
      'Visualizador',
    ])
    // R-33: el rol es un dato, no un permiso.
    expect(rol()).toHaveAccessibleDescription('Solo informativo: no cambia sus permisos')
  })

  it('correo, organización, fecha de nacimiento y fecha de registro van en solo lectura', async () => {
    montar()
    const cuenta = await screen.findByRole('region', { name: 'Datos de la cuenta' })
    expect(within(cuenta).getByText('Solo lectura')).toBeInTheDocument()
    const valor = (rotulo: string) => within(cuenta).getByText(rotulo).nextElementSibling
    expect(valor('Correo')).toHaveTextContent('mariana.solis@example.com')
    expect(valor('Organización')).toHaveTextContent('Comercializadora Río Claro')
    // La fecha de nacimiento (medianoche UTC) no se corre un día por la zona horaria.
    expect(valor('Fecha de nacimiento')).toHaveTextContent('23 de abril de 1987')
    expect(valor('Fecha de registro')).toHaveTextContent('2 de septiembre de 2026')
    expect(within(cuenta).queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: /Correo/ })).not.toBeInTheDocument()
  })

  it('sin organización ni fecha de nacimiento lo dice en texto', async () => {
    montar(36)
    const cuenta = await screen.findByRole('region', { name: 'Datos de la cuenta' })
    expect(within(cuenta).getByText('Sin organización')).toBeInTheDocument()
    expect(within(cuenta).getByText('No registrada')).toBeInTheDocument()
  })

  describe('guardar (PATCH)', () => {
    it('envía exactamente name, last_name, phone, position y role, y confirma con un toast', async () => {
      const user = montar()
      await screen.findByRole('heading', { level: 1, name: 'Mariana Solís' })
      await user.clear(campo('Puesto'))
      await user.type(campo('Puesto'), 'Directora de Talento')
      await user.selectOptions(rol(), 'viewer')
      await user.click(guardar())

      expect(updateUser).toHaveBeenCalledTimes(1)
      expect(updateUser).toHaveBeenCalledWith(34, {
        name: 'Mariana',
        last_name: 'Solís',
        phone: '55 0142 8890',
        position: 'Directora de Talento',
        role: 'viewer',
      })
      expect(Object.keys(vi.mocked(updateUser).mock.calls[0][1])).toEqual(['name', 'last_name', 'phone', 'position', 'role'])
      expect(await screen.findByText('Cambios guardados')).toBeInTheDocument()
      // El encabezado muestra el rol guardado.
      expect(screen.getByText('Visualizador', { selector: '.st-badge' })).toBeInTheDocument()
      expect(guardar()).toHaveFocus()
    })

    it('no envía last_name si está vacío (PB-27)', async () => {
      const user = montar(36)
      await screen.findByRole('heading', { level: 1, name: 'Óscar' })
      expect(campo('Apellido')).toHaveValue('')
      await user.click(guardar())

      expect(updateUser).toHaveBeenCalledWith(36, { name: 'Óscar', phone: '', position: '', role: 'admin' })
      expect(vi.mocked(updateUser).mock.calls[0][1]).not.toHaveProperty('last_name')
    })

    it('si se borra un apellido guardado, no se envía y el campo vuelve al que conserva el servidor', async () => {
      const user = montar()
      await screen.findByRole('heading', { level: 1, name: 'Mariana Solís' })
      expect(campo('Apellido')).toHaveAccessibleDescription('Si lo dejas vacío, se conserva el actual')
      await user.clear(campo('Apellido'))
      await user.click(guardar())

      expect(vi.mocked(updateUser).mock.calls[0][1]).not.toHaveProperty('last_name')
      expect(await screen.findByText('Cambios guardados')).toBeInTheDocument()
      expect(campo('Apellido')).toHaveValue('Solís')
    })

    it('sin nombre no envía nada: error en línea y foco en el campo', async () => {
      const user = montar()
      await screen.findByRole('heading', { level: 1, name: 'Mariana Solís' })
      await user.clear(campo('Nombre'))
      await user.click(guardar())

      expect(updateUser).not.toHaveBeenCalled()
      expect(campo('Nombre')).toHaveAttribute('aria-invalid', 'true')
      expect(campo('Nombre')).toHaveAccessibleDescription('Escribe el nombre.')
      expect(campo('Nombre')).toHaveFocus()

      // Al escribir, el error se va.
      await user.type(campo('Nombre'), 'M')
      expect(campo('Nombre')).not.toHaveAttribute('aria-invalid')
    })

    it('un 422 marca cada campo con su mensaje y lleva el foco al primero', async () => {
      const user = montar()
      await screen.findByRole('heading', { level: 1, name: 'Mariana Solís' })
      vi.mocked(updateUser).mockRejectedValueOnce(
        errorHttp(422, {
          message: 'The phone field must not be greater than 30 characters. (and 1 more error)',
          errors: {
            phone: ['The phone field must not be greater than 30 characters.'],
            role: ['The selected role is invalid.'],
          },
        }),
      )
      await user.click(guardar())

      const telefono = screen.getByRole('textbox', { name: 'Teléfono' })
      expect(await screen.findByText('The phone field must not be greater than 30 characters.')).toBeInTheDocument()
      expect(telefono).toHaveAttribute('aria-invalid', 'true')
      expect(telefono).toHaveAccessibleDescription('The phone field must not be greater than 30 characters.')
      expect(rol()).toHaveAttribute('aria-invalid', 'true')
      expect(telefono).toHaveFocus()
      expect(screen.queryByText('Cambios guardados')).not.toBeInTheDocument()
    })

    it('un error que no es de campo se muestra en línea con ícono', async () => {
      const user = montar()
      await screen.findByRole('heading', { level: 1, name: 'Mariana Solís' })
      vi.mocked(updateUser).mockRejectedValueOnce(errorHttp())
      await user.click(guardar())

      const aviso = await screen.findByRole('alert')
      expect(aviso).toHaveTextContent('No pudimos conectarnos. Revisa tu conexión e inténtalo de nuevo.')
      expect(aviso.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    })

    it('los campos respetan el largo máximo del servidor y no autocompletan con datos del operador', async () => {
      montar()
      await screen.findByRole('heading', { level: 1, name: 'Mariana Solís' })
      expect(campo('Nombre')).toHaveAttribute('maxLength', '255')
      expect(screen.getByRole('textbox', { name: 'Teléfono' })).toHaveAttribute('maxLength', '30')
      expect(campo('Nombre')).toHaveAttribute('autocomplete', 'off')
    })
  })

  describe('carga', () => {
    it('un 404 muestra «No encontramos a este usuario» sin «Reintentar»', async () => {
      montar(999)
      const error = await screen.findByRole('alert')
      expect(within(error).getByRole('heading', { name: 'No encontramos a este usuario' })).toBeInTheDocument()
      expect(within(error).queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument()
      expect(within(error).getByRole('link', { name: 'Ver todos los usuarios' })).toHaveAttribute('href', '/admin/usuarios')
      expect(screen.getByRole('heading', { level: 1, name: 'Detalle del usuario' })).toBeInTheDocument()
    })

    it('un id que no es número no se pide al servidor', async () => {
      montar('abc')
      expect(await screen.findByRole('heading', { name: 'No encontramos a este usuario' })).toBeInTheDocument()
      expect(getUser).not.toHaveBeenCalled()
    })

    it('un error del servidor muestra EstadoError con «Reintentar» (ya no «Cargando…» sin fin)', async () => {
      vi.mocked(getUser).mockRejectedValueOnce(errorHttp(500))
      const user = montar()
      const error = await screen.findByRole('alert')
      expect(within(error).getByRole('heading', { name: 'No pudimos cargar al usuario' })).toBeInTheDocument()

      await user.click(within(error).getByRole('button', { name: 'Reintentar' }))
      expect(await screen.findByRole('heading', { level: 1, name: 'Mariana Solís' })).toBeInTheDocument()
      expect(getUser).toHaveBeenCalledTimes(2)
    })

    it('«Volver a usuarios» lleva a la lista', async () => {
      const user = montar()
      await screen.findByRole('heading', { level: 1, name: 'Mariana Solís' })
      await user.click(screen.getByRole('link', { name: 'Volver a usuarios' }))
      expect(await screen.findByRole('heading', { name: 'Lista de usuarios' })).toBeInTheDocument()
    })
  })

  describe('zona de peligro', () => {
    it('pide confirmación, elimina, confirma con un toast y vuelve a la lista', async () => {
      const user = montar()
      await screen.findByRole('heading', { level: 1, name: 'Mariana Solís' })
      const peligro = screen.getByRole('region', { name: 'Zona de peligro' })
      await user.click(within(peligro).getByRole('button', { name: 'Eliminar usuario' }))

      const dialogo = screen.getByRole('alertdialog', { name: '¿Eliminar a Mariana Solís?' })
      expect(within(dialogo).getByRole('button', { name: 'Cancelar' })).toHaveFocus()
      await user.click(within(dialogo).getByRole('button', { name: 'Eliminar usuario' }))

      expect(deleteUser).toHaveBeenCalledWith(34)
      expect(await screen.findByRole('heading', { name: 'Lista de usuarios' })).toBeInTheDocument()
      expect(screen.getByText('Eliminaste la cuenta de Mariana Solís')).toBeInTheDocument()
    })

    it('el 409 al eliminarse a sí mismo se muestra en el modal y no sale de la página', async () => {
      vi.mocked(deleteUser).mockRejectedValueOnce(errorHttp(409, { message: 'No puedes eliminar tu propia cuenta.' }))
      const user = montar()
      await screen.findByRole('heading', { level: 1, name: 'Mariana Solís' })
      await user.click(screen.getByRole('button', { name: 'Eliminar usuario' }))
      const dialogo = screen.getByRole('alertdialog')
      await user.click(within(dialogo).getByRole('button', { name: 'Eliminar usuario' }))

      expect(await within(dialogo).findByRole('alert')).toHaveTextContent('No puedes eliminar tu propia cuenta.')
      expect(within(dialogo).getByRole('button', { name: 'Eliminar usuario' })).toHaveAttribute('aria-disabled', 'true')
      expect(screen.getByRole('heading', { level: 1, name: 'Mariana Solís' })).toBeInTheDocument()

      await user.click(within(dialogo).getByRole('button', { name: 'Cancelar' }))
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
      // El foco vuelve al botón que abrió el modal.
      expect(screen.getByRole('button', { name: 'Eliminar usuario' })).toHaveFocus()
    })
  })
})
