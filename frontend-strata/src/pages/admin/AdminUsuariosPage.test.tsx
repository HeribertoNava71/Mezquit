import { act, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios'
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { deleteUser, listUsers, type AdminUser, type UserList } from '@/api/adminUsers'
import { ToastProvider } from '@/components/ui'
import AdminUsuariosPage from './AdminUsuariosPage'

// /admin/usuarios con src/api/adminUsers simulado. Formas de
// Admin\UserController (2026-09-12-registro-login-crud-usuarios.md:647-683)
// y de e2e/mocks/admin.json.

vi.mock('@/api/adminUsers', () => ({
  listUsers: vi.fn(),
  getUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  updateAdminMe: vi.fn(),
}))

function usuario(id: number, parcial: Partial<AdminUser> = {}): AdminUser {
  return {
    id,
    name: `Nombre${id}`,
    last_name: `Apellido${id}`,
    email: `usuario${id}@example.com`,
    position: `Puesto ${id}`,
    role: 'admin',
    // A mediodía UTC: el mismo día en cualquier zona horaria de América.
    created_at: '2026-09-12T12:00:00.000000Z',
    organization: { name: `Empresa ${id}` },
    ...parcial,
  }
}

function lista(items: AdminUser[], meta: Partial<Omit<UserList, 'items'>> = {}): UserList {
  return { total: items.length, current_page: 1, last_page: 1, items, ...meta }
}

const PAGINA_1 = Array.from({ length: 15 }, (_, i) => usuario(48 - i))
const PAGINA_2 = Array.from({ length: 4 }, (_, i) => usuario(33 - i))

/** Simula paginate(15) con 19 usuarios y la búsqueda «ana» con un resultado. */
function servidorConUsuarios() {
  vi.mocked(listUsers).mockImplementation(async (search, page = 1) => {
    if (search === 'ana') return lista([usuario(47, { name: 'Ana Lucía', last_name: 'Treviño' })])
    if (search) return lista([])
    return page === 2
      ? lista(PAGINA_2, { total: 19, current_page: 2, last_page: 2 })
      : lista(PAGINA_1, { total: 19, current_page: 1, last_page: 2 })
  })
}

/** Error de axios con el código HTTP dado; sin código, un error de red. */
function errorHttp(status?: number, data: unknown = {}): AxiosError {
  if (status === undefined) return new AxiosError('Network Error', AxiosError.ERR_NETWORK)
  const respuesta = { status, statusText: '', data, headers: {}, config: { headers: new AxiosHeaders() } }
  return new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, undefined, undefined, respuesta as AxiosResponse)
}

function DetalleFalso() {
  const { id } = useParams()
  return <h1>Detalle {id}</h1>
}

function montar() {
  render(
    <ToastProvider>
      <MemoryRouter initialEntries={['/admin/usuarios']}>
        <Routes>
          <Route path="/admin/usuarios" element={<AdminUsuariosPage />} />
          <Route path="/admin/usuarios/:id" element={<DetalleFalso />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  )
}

const buscador = () => screen.getByRole('searchbox', { name: 'Buscar usuarios' })
const fila = (nombre: string) => screen.getByRole('rowheader', { name: nombre }).closest('tr') as HTMLElement

beforeEach(() => {
  vi.mocked(listUsers).mockReset()
  vi.mocked(deleteUser).mockReset()
  servidorConUsuarios()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('AdminUsuariosPage (/admin/usuarios)', () => {
  it('muestra la carga y luego la tabla con Nombre, Correo, Organización, Puesto, Rol, Registro y Acciones', async () => {
    montar()
    expect(screen.getByRole('heading', { level: 1, name: 'Usuarios' })).toBeInTheDocument()
    expect(screen.getByText('Cargando usuarios…').closest('[role="status"]')).toBeInTheDocument()

    const tabla = await screen.findByRole('table', { name: 'Usuarios registrados, página 1 de 2' })
    const encabezados = within(tabla)
      .getAllByRole('columnheader')
      .map((celda) => celda.textContent)
    expect(encabezados).toEqual(['Nombre', 'Correo', 'Organización', 'Puesto', 'Rol', 'Registro', 'Acciones'])
    expect(listUsers).toHaveBeenCalledTimes(1)
    expect(listUsers).toHaveBeenCalledWith(undefined, 1)

    const primera = fila('Nombre48 Apellido48')
    expect(within(primera).getByText('usuario48@example.com')).toBeInTheDocument()
    expect(within(primera).getByText('Empresa 48')).toBeInTheDocument()
    expect(within(primera).getByText('Puesto 48')).toBeInTheDocument()
    expect(within(primera).getByText('12 sep 2026')).toHaveAttribute('dateTime', '2026-09-12')
  })

  it('traduce el rol: admin → Administrador, recruiter → Reclutador, viewer → Visualizador', async () => {
    vi.mocked(listUsers).mockResolvedValue(
      lista([
        usuario(1, { name: 'Ada', last_name: 'Admin', role: 'admin' }),
        usuario(2, { name: 'Rita', last_name: 'Recluta', role: 'recruiter' }),
        usuario(3, { name: 'Leo', last_name: 'Lector', role: 'viewer' }),
      ]),
    )
    montar()
    expect(within(await screen.findByRole('row', { name: /Ada Admin/ })).getByText('Administrador')).toBeInTheDocument()
    expect(within(fila('Rita Recluta')).getByText('Reclutador')).toBeInTheDocument()
    expect(within(fila('Leo Lector')).getByText('Visualizador')).toBeInTheDocument()
    expect(screen.queryByText('recruiter')).not.toBeInTheDocument()
    expect(screen.queryByText('viewer')).not.toBeInTheDocument()
  })

  it('sin organización ni puesto muestra «—» con un texto para lectores de pantalla', async () => {
    vi.mocked(listUsers).mockResolvedValue(lista([usuario(32, { organization: undefined, position: undefined })]))
    montar()
    const celdas = within(await screen.findByRole('row', { name: /Nombre32/ })).getAllByRole('cell')
    expect(celdas[1]).toHaveTextContent('Sin organización')
    expect(celdas[2]).toHaveTextContent('Sin puesto')
  })

  it('«Editar» lleva al detalle y cada acción dice a quién aplica', async () => {
    const user = userEvent.setup()
    montar()
    const primera = await screen.findByRole('row', { name: /Nombre48 Apellido48/ })
    expect(within(primera).getByRole('button', { name: 'Eliminar a Nombre48 Apellido48' })).toBeInTheDocument()
    await user.click(within(primera).getByRole('link', { name: 'Editar a Nombre48 Apellido48' }))
    expect(await screen.findByRole('heading', { name: 'Detalle 48' })).toBeInTheDocument()
  })

  describe('búsqueda', () => {
    it('espera 300 ms después de la última tecla y hace una sola petición', async () => {
      // Solo setTimeout es falso. Se escribe con fireEvent: user-event espera
      // con setTimeout entre acciones y se quedaría detenido.
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
      montar()
      await act(async () => {})
      expect(listUsers).toHaveBeenCalledTimes(1)

      // Tres teclas, cada una antes de que se cumpla el retardo de la anterior.
      for (const valor of ['a', 'an', 'ana']) {
        fireEvent.change(buscador(), { target: { value: valor } })
        act(() => {
          vi.advanceTimersByTime(200)
        })
      }
      expect(listUsers).toHaveBeenCalledTimes(1)

      await act(async () => {
        vi.advanceTimersByTime(99)
      })
      expect(listUsers).toHaveBeenCalledTimes(1)

      await act(async () => {
        vi.advanceTimersByTime(1)
      })
      expect(listUsers).toHaveBeenCalledTimes(2)
      expect(listUsers).toHaveBeenLastCalledWith('ana', 1)
      // Nunca se pidió una búsqueda por cada tecla.
      expect(listUsers).not.toHaveBeenCalledWith('a', expect.anything())
      expect(listUsers).not.toHaveBeenCalledWith('an', expect.anything())

      await act(async () => {})
      expect(screen.getByRole('rowheader', { name: 'Ana Lucía Treviño' })).toBeInTheDocument()
      expect(screen.getByRole('table', { name: /Usuarios que coinciden con «ana»/ })).toBeInTheDocument()
    })

    it('Enter busca al momento, sin esperar el retardo', async () => {
      const user = userEvent.setup()
      montar()
      await screen.findByRole('table')
      await user.type(buscador(), 'ana{Enter}')
      expect(listUsers).toHaveBeenLastCalledWith('ana', 1)
      expect(await screen.findByRole('rowheader', { name: 'Ana Lucía Treviño' })).toBeInTheDocument()
    })

    it('el buscador tiene etiqueta visible y ayuda, y vive en un landmark de búsqueda', async () => {
      montar()
      await screen.findByRole('table')
      expect(buscador()).toHaveAccessibleDescription('Nombre, apellido o correo')
      expect(screen.getByRole('search')).toContainElement(buscador())
    })

    it('sin resultados muestra el vacío de búsqueda y «Borrar búsqueda» vuelve a la lista completa', async () => {
      const user = userEvent.setup()
      montar()
      await screen.findByRole('table')
      await user.type(buscador(), 'zzz{Enter}')

      expect(await screen.findByText('Ningún usuario coincide con tu búsqueda')).toBeInTheDocument()
      expect(screen.queryByText(/Mostrando/)).not.toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Borrar búsqueda' }))
      expect(buscador()).toHaveValue('')
      expect(buscador()).toHaveFocus()
      expect(await screen.findByRole('rowheader', { name: 'Nombre48 Apellido48' })).toBeInTheDocument()
      expect(listUsers).toHaveBeenLastCalledWith(undefined, 1)
    })

    it('una búsqueda nueva vuelve a la página 1', async () => {
      const user = userEvent.setup()
      montar()
      await screen.findByRole('table')
      await user.click(screen.getByRole('button', { name: 'Siguiente' }))
      expect(await screen.findByText('Página 2 de 2')).toBeInTheDocument()

      await user.type(buscador(), 'ana{Enter}')
      expect(listUsers).toHaveBeenLastCalledWith('ana', 1)
    })
  })

  describe('paginación', () => {
    it('muestra el total y avanza o retrocede de 15 en 15', async () => {
      const user = userEvent.setup()
      montar()
      await screen.findByRole('table')
      expect(screen.getByText('Mostrando 1–15 de 19 usuarios')).toBeInTheDocument()
      expect(screen.getByText('Página 1 de 2')).toBeInTheDocument()
      const paginas = screen.getByRole('navigation', { name: 'Páginas de usuarios' })
      expect(within(paginas).getByRole('button', { name: 'Anterior' })).toHaveAttribute('aria-disabled', 'true')

      await user.click(within(paginas).getByRole('button', { name: 'Siguiente' }))
      expect(listUsers).toHaveBeenLastCalledWith(undefined, 2)
      expect(await screen.findByText('Mostrando 16–19 de 19 usuarios')).toBeInTheDocument()
      expect(screen.getByText('Página 2 de 2')).toBeInTheDocument()
      expect(screen.getByRole('rowheader', { name: 'Nombre33 Apellido33' })).toBeInTheDocument()
      expect(within(paginas).getByRole('button', { name: 'Siguiente' })).toHaveAttribute('aria-disabled', 'true')
      // El botón pulsado conserva el foco mientras carga y después.
      expect(within(paginas).getByRole('button', { name: 'Siguiente' })).toHaveFocus()

      await user.click(within(paginas).getByRole('button', { name: 'Anterior' }))
      expect(listUsers).toHaveBeenLastCalledWith(undefined, 1)
      expect(await screen.findByText('Mostrando 1–15 de 19 usuarios')).toBeInTheDocument()
    })

    it('con una sola página muestra el total sin botones', async () => {
      vi.mocked(listUsers).mockResolvedValue(lista([usuario(1)]))
      montar()
      expect(await screen.findByText('Mostrando 1 de 1 usuario')).toBeInTheDocument()
      expect(screen.queryByRole('navigation', { name: 'Páginas de usuarios' })).not.toBeInTheDocument()
    })
  })

  describe('error de carga', () => {
    it('muestra EstadoError distinto del vacío y «Reintentar» vuelve a pedir la lista', async () => {
      const user = userEvent.setup()
      vi.mocked(listUsers).mockRejectedValueOnce(errorHttp(500))
      montar()

      const error = await screen.findByRole('alert')
      expect(within(error).getByRole('heading', { level: 2, name: 'No pudimos cargar los usuarios' })).toBeInTheDocument()
      expect(screen.queryByRole('table')).not.toBeInTheDocument()
      expect(screen.queryByText('Ningún usuario coincide con tu búsqueda')).not.toBeInTheDocument()

      await user.click(within(error).getByRole('button', { name: 'Reintentar' }))
      expect(await screen.findByRole('rowheader', { name: 'Nombre48 Apellido48' })).toBeInTheDocument()
      expect(listUsers).toHaveBeenCalledTimes(2)
    })

    it('sin conexión usa el texto de red', async () => {
      vi.mocked(listUsers).mockRejectedValueOnce(errorHttp())
      montar()
      expect(await screen.findByText('No pudimos conectarnos')).toBeInTheDocument()
    })
  })

  describe('eliminar', () => {
    it('pide confirmación en un Modal; Cancelar no elimina', async () => {
      const user = userEvent.setup()
      montar()
      const primera = await screen.findByRole('row', { name: /Nombre48 Apellido48/ })
      await user.click(within(primera).getByRole('button', { name: 'Eliminar a Nombre48 Apellido48' }))

      const dialogo = screen.getByRole('alertdialog', { name: '¿Eliminar a Nombre48 Apellido48?' })
      expect(dialogo).toHaveAccessibleDescription('Esta acción no se puede deshacer.')
      expect(within(dialogo).getByText('usuario48@example.com')).toBeInTheDocument()
      expect(within(dialogo).getByRole('button', { name: 'Cancelar' })).toHaveFocus()

      await user.click(within(dialogo).getByRole('button', { name: 'Cancelar' }))
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
      expect(deleteUser).not.toHaveBeenCalled()
    })

    it('al confirmar elimina, confirma con un toast y recarga la lista', async () => {
      const user = userEvent.setup()
      vi.mocked(deleteUser).mockResolvedValue(undefined)
      montar()
      const primera = await screen.findByRole('row', { name: /Nombre48 Apellido48/ })
      await user.click(within(primera).getByRole('button', { name: 'Eliminar a Nombre48 Apellido48' }))
      await user.click(screen.getByRole('button', { name: 'Eliminar usuario' }))

      expect(deleteUser).toHaveBeenCalledWith(48)
      expect(await screen.findByText('Eliminaste la cuenta de Nombre48 Apellido48')).toBeInTheDocument()
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
      expect(listUsers).toHaveBeenCalledTimes(2)
      expect(listUsers).toHaveBeenLastCalledWith(undefined, 1)
      // El foco pasa al título de la tabla (la fila eliminada ya no está).
      expect(screen.getByText('Todos los usuarios')).toHaveFocus()
    })

    it('el 409 dice «No puedes eliminar tu propia cuenta.» dentro del modal y no recarga', async () => {
      const user = userEvent.setup()
      vi.mocked(deleteUser).mockRejectedValue(errorHttp(409, { message: 'No puedes eliminar tu propia cuenta.' }))
      montar()
      const primera = await screen.findByRole('row', { name: /Nombre48 Apellido48/ })
      await user.click(within(primera).getByRole('button', { name: 'Eliminar a Nombre48 Apellido48' }))
      await user.click(screen.getByRole('button', { name: 'Eliminar usuario' }))

      const dialogo = screen.getByRole('alertdialog')
      const aviso = await within(dialogo).findByRole('alert')
      expect(aviso).toHaveTextContent('No puedes eliminar tu propia cuenta.')
      expect(aviso.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
      const confirmar = within(dialogo).getByRole('button', { name: 'Eliminar usuario' })
      expect(confirmar).toHaveAttribute('aria-disabled', 'true')
      expect(confirmar).toHaveAccessibleDescription('No puedes eliminar tu propia cuenta.')

      // Repetir no hace otra petición.
      await user.click(confirmar)
      expect(deleteUser).toHaveBeenCalledTimes(1)
      expect(listUsers).toHaveBeenCalledTimes(1)
      expect(screen.queryByText(/Eliminaste la cuenta/)).not.toBeInTheDocument()
    })

    it('un error de red se muestra en línea y se puede reintentar', async () => {
      const user = userEvent.setup()
      vi.mocked(deleteUser).mockRejectedValueOnce(errorHttp()).mockResolvedValueOnce(undefined)
      montar()
      const primera = await screen.findByRole('row', { name: /Nombre48 Apellido48/ })
      await user.click(within(primera).getByRole('button', { name: 'Eliminar a Nombre48 Apellido48' }))
      await user.click(screen.getByRole('button', { name: 'Eliminar usuario' }))

      expect(await screen.findByText('No pudimos conectarnos. Revisa tu conexión e inténtalo de nuevo.')).toBeInTheDocument()
      const confirmar = screen.getByRole('button', { name: 'Eliminar usuario' })
      expect(confirmar).not.toHaveAttribute('aria-disabled')

      await user.click(confirmar)
      expect(await screen.findByText('Eliminaste la cuenta de Nombre48 Apellido48')).toBeInTheDocument()
      expect(deleteUser).toHaveBeenCalledTimes(2)
    })

    it('si la página queda vacía tras eliminar, va a la última que exista', async () => {
      const user = userEvent.setup()
      vi.mocked(deleteUser).mockResolvedValue(undefined)
      let eliminado = false
      vi.mocked(listUsers).mockImplementation(async (_search, page = 1) => {
        if (page === 2) {
          return eliminado
            ? lista([], { total: 15, current_page: 2, last_page: 1 })
            : lista([usuario(33)], { total: 16, current_page: 2, last_page: 2 })
        }
        return lista(PAGINA_1, { total: eliminado ? 15 : 16, current_page: 1, last_page: eliminado ? 1 : 2 })
      })
      vi.mocked(deleteUser).mockImplementation(async () => {
        eliminado = true
      })
      montar()
      await screen.findByRole('table')
      await user.click(screen.getByRole('button', { name: 'Siguiente' }))
      const unica = await screen.findByRole('row', { name: /Nombre33 Apellido33/ })
      await user.click(within(unica).getByRole('button', { name: 'Eliminar a Nombre33 Apellido33' }))
      await user.click(screen.getByRole('button', { name: 'Eliminar usuario' }))

      expect(await screen.findByText('Mostrando 1–15 de 15 usuarios')).toBeInTheDocument()
      expect(listUsers).toHaveBeenLastCalledWith(undefined, 1)
    })
  })

  it('ninguna acción depende del rol (R-33): todos los usuarios tienen Editar y Eliminar', async () => {
    vi.mocked(listUsers).mockResolvedValue(
      lista([usuario(1, { role: 'viewer' }), usuario(2, { role: 'recruiter' }), usuario(3, { role: 'admin' })]),
    )
    montar()
    await screen.findByRole('table')
    for (const id of [1, 2, 3]) {
      const filaUsuario = fila(`Nombre${id} Apellido${id}`)
      expect(within(filaUsuario).getByRole('link', { name: /^Editar/ })).toBeInTheDocument()
      expect(within(filaUsuario).getByRole('button', { name: /^Eliminar/ })).toBeInTheDocument()
    }
  })
})
