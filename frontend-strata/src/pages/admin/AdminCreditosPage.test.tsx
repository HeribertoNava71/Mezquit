import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { approveRequest, listCreditRequests, rejectRequest, type PendingRequest } from '@/api/admin'
import { avisarCambioDeSolicitudes } from '@/components/layout/topbar/datosBarra'
import { ToastProvider } from '@/components/ui'
import AdminCreditosPage from './AdminCreditosPage'

// Solicitudes de créditos (/admin/creditos) con src/api/admin simulado. Forma
// de la respuesta: Admin\CreditRequestController (2026-09-12-fase2-panel-rh.md:1060-1104).

vi.mock('@/api/admin', () => ({
  listCreditRequests: vi.fn(),
  approveRequest: vi.fn(),
  rejectRequest: vi.fn(),
}))

// La barra de super admin vuelve a contar las pendientes cuando la página avisa.
vi.mock('@/components/layout/topbar/datosBarra', () => ({ avisarCambioDeSolicitudes: vi.fn() }))

const SIERRA: PendingRequest = {
  id: 8,
  organization: 'Logística Sierra Alta',
  organization_balance: 3,
  requested_amount: 40,
  note: 'Arranque del reclutamiento para el nuevo centro de distribución.',
  created_at: '2026-09-27 11:42',
}
const MIRADOR: PendingRequest = {
  id: 9,
  organization: 'Clínica Dental Mirador',
  organization_balance: 0,
  requested_amount: 1,
  note: null,
  created_at: '2026-09-28 09:05',
}
const RIO_CLARO: PendingRequest = {
  id: 10,
  organization: 'Comercializadora Río Claro',
  organization_balance: 1250,
  requested_amount: 50,
  note: 'Campaña de contratación de fin de año.',
  created_at: null,
}
const SOLICITUDES = [SIERRA, MIRADOR, RIO_CLARO]

/** Error de axios con el código HTTP dado; sin código, un error de red. */
function errorHttp(status?: number): AxiosError {
  if (status === undefined) return new AxiosError('Network Error', AxiosError.ERR_NETWORK)
  const respuesta = { status, statusText: '', data: {}, headers: {}, config: { headers: new AxiosHeaders() } }
  return new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, undefined, undefined, respuesta as AxiosResponse)
}

/** Promesa que la prueba resuelve o rechaza cuando quiere. */
function diferida<T>() {
  let resolver!: (valor: T) => void
  let rechazar!: (error: unknown) => void
  const promesa = new Promise<T>((res, rej) => {
    resolver = res
    rechazar = rej
  })
  return { promesa, resolver, rechazar }
}

function montar() {
  render(
    <MemoryRouter initialEntries={['/admin/creditos']}>
      <ToastProvider>
        <AdminCreditosPage />
      </ToastProvider>
    </MemoryRouter>,
  )
  return userEvent.setup()
}

type Usuario = ReturnType<typeof userEvent.setup>

/** Fila (tarjeta en móvil) de una empresa. */
function fila(empresa: string) {
  const fila = screen.getByRole('rowheader', { name: empresa }).closest('tr')
  if (!fila) throw new Error(`No hay fila para ${empresa}`)
  return fila
}

const aprobar = (s: PendingRequest, cantidad: string) =>
  screen.getByRole('button', { name: `Aprobar la solicitud de ${s.organization} por ${cantidad}` })
const rechazar = (s: PendingRequest, cantidad: string) =>
  screen.getByRole('button', { name: `Rechazar la solicitud de ${s.organization} por ${cantidad}` })
const dialogo = () => screen.getByRole('alertdialog')

async function esperarTabla() {
  return screen.findByRole('table', { name: 'Solicitudes de créditos pendientes' })
}

/** Abre la confirmación de aprobar la solicitud de Sierra Alta y la confirma. */
async function aprobarSierra(user: Usuario) {
  await user.click(aprobar(SIERRA, '40 créditos'))
  await user.click(within(dialogo()).getByRole('button', { name: 'Aprobar solicitud' }))
}

describe('AdminCreditosPage', () => {
  beforeEach(() => {
    vi.mocked(listCreditRequests).mockReset()
    vi.mocked(approveRequest).mockReset()
    vi.mocked(rejectRequest).mockReset()
    vi.mocked(avisarCambioDeSolicitudes).mockReset()
  })

  it('muestra la carga y después la tabla de pendientes', async () => {
    const lista = diferida<PendingRequest[]>()
    vi.mocked(listCreditRequests).mockReturnValue(lista.promesa)
    montar()

    expect(screen.getByRole('heading', { level: 1, name: 'Solicitudes de créditos' })).toBeInTheDocument()
    // EstadoCarga (role="status"); el proveedor de toasts tiene su propia región.
    expect(screen.getByText('Cargando solicitudes…').closest('[role="status"]')).toHaveClass('st-carga')

    await act(async () => lista.resolver(SOLICITUDES))

    const tabla = screen.getByRole('table', { name: 'Solicitudes de créditos pendientes' })
    expect(Array.from(tabla.querySelectorAll('thead th')).map((th) => th.textContent)).toEqual([
      'Empresa',
      'Saldo actual',
      'Solicita',
      'Nota',
      'Fecha',
      'Acciones',
    ])
    // Por debajo de 640 px, cada solicitud es una tarjeta (D-23).
    expect(tabla.closest('.st-table')).toHaveClass('st-table--cards')
    expect(screen.getByText('· 3 solicitudes, de la más antigua a la más reciente')).toBeInTheDocument()
    expect(screen.queryByText('Cargando solicitudes…')).not.toBeInTheDocument()
  })

  it('cada solicitud muestra empresa, saldo actual, cantidad, nota, fecha y sus dos acciones', async () => {
    vi.mocked(listCreditRequests).mockResolvedValue(SOLICITUDES)
    montar()
    await esperarTabla()

    /** Valores visibles de las celdas de una fila, sin el rótulo de la tarjeta. */
    const valores = (empresa: string) =>
      Array.from(fila(empresa).querySelectorAll('td .st-table__cell-value')).map((celda) => celda.textContent)

    expect(valores('Logística Sierra Alta').slice(0, 4)).toEqual(['3 créditos', '40 créditos', SIERRA.note, '27 sep 2026, 11:42'])
    expect(valores('Clínica Dental Mirador').slice(0, 4)).toEqual(['0 créditos', '1 crédito', 'Sin nota', '28 sep 2026, 09:05'])
    expect(valores('Comercializadora Río Claro').slice(0, 4)).toEqual(['1,250 créditos', '50 créditos', RIO_CLARO.note, '—'])

    const fecha = within(fila('Logística Sierra Alta')).getByText('27 sep 2026, 11:42')
    expect(fecha.tagName).toBe('TIME')
    expect(fecha).toHaveAttribute('datetime', '2026-09-27T11:42')

    // Cada acción dice de qué solicitud se trata.
    expect(aprobar(SIERRA, '40 créditos')).toBeInTheDocument()
    expect(rechazar(MIRADOR, '1 crédito')).toBeInTheDocument()
  })

  it('sin solicitudes muestra «No hay solicitudes pendientes»', async () => {
    vi.mocked(listCreditRequests).mockResolvedValue([])
    montar()

    expect(await screen.findByRole('heading', { level: 2, name: 'No hay solicitudes pendientes' })).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('si la lista no carga, muestra un error distinto del vacío con «Reintentar»', async () => {
    const segunda = diferida<PendingRequest[]>()
    vi.mocked(listCreditRequests).mockRejectedValueOnce(errorHttp()).mockReturnValueOnce(segunda.promesa)
    const user = montar()

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent('No pudimos conectarnos')
    expect(screen.queryByText('No hay solicitudes pendientes')).not.toBeInTheDocument()

    const reintentar = within(alerta).getByRole('button', { name: 'Reintentar' })
    await user.click(reintentar)
    expect(listCreditRequests).toHaveBeenCalledTimes(2)
    expect(reintentar).toHaveTextContent('Reintentando…')
    expect(reintentar).toHaveFocus()

    await act(async () => segunda.resolver(SOLICITUDES))
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('un 500 al cargar dice «No pudimos cargar las solicitudes» y también ofrece «Reintentar»', async () => {
    vi.mocked(listCreditRequests).mockRejectedValue(errorHttp(500))
    montar()

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent('No pudimos cargar las solicitudes')
    expect(within(alerta).getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })

  it('«Aprobar» pide confirmación; «Cancelar» y Escape cierran sin aprobar y devuelven el foco', async () => {
    vi.mocked(listCreditRequests).mockResolvedValue(SOLICITUDES)
    const user = montar()
    await esperarTabla()

    await user.click(aprobar(SIERRA, '40 créditos'))
    const modal = dialogo()
    expect(modal).toHaveAccessibleName('¿Aprobar la solicitud de Logística Sierra Alta?')
    expect(modal).toHaveAccessibleDescription(
      'Se suman 40 créditos al saldo de la empresa. Esta acción no se puede deshacer.',
    )
    expect(within(modal).getByText('3 créditos')).toBeInTheDocument()
    expect(within(modal).getByText(SIERRA.note!)).toBeInTheDocument()
    // El foco empieza en la acción que no hace nada.
    expect(within(modal).getByRole('button', { name: 'Cancelar' })).toHaveFocus()

    await user.click(within(modal).getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(aprobar(SIERRA, '40 créditos')).toHaveFocus()

    await user.click(rechazar(SIERRA, '40 créditos'))
    expect(dialogo()).toHaveAccessibleName('¿Rechazar la solicitud de Logística Sierra Alta?')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(rechazar(SIERRA, '40 créditos')).toHaveFocus()

    expect(approveRequest).not.toHaveBeenCalled()
    expect(rejectRequest).not.toHaveBeenCalled()
  })

  it('al confirmar, aprueba, avisa con un toast, quita la fila y lleva el foco a la siguiente', async () => {
    // La lista en silencio después de aprobar todavía trae la solicitud: no debe volver.
    vi.mocked(listCreditRequests).mockResolvedValue(SOLICITUDES)
    vi.mocked(approveRequest).mockResolvedValue(undefined)
    const user = montar()
    await esperarTabla()

    await aprobarSierra(user)

    expect(approveRequest).toHaveBeenCalledWith(8)
    expect(rejectRequest).not.toHaveBeenCalled()
    expect(await screen.findByText('Solicitud de Logística Sierra Alta aprobada: se sumaron 40 créditos a su saldo.')).toBeInTheDocument()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('rowheader', { name: 'Logística Sierra Alta' })).not.toBeInTheDocument()
    expect(aprobar(MIRADOR, '1 crédito')).toHaveFocus()
    expect(avisarCambioDeSolicitudes).toHaveBeenCalledTimes(1)

    // Vuelve a pedir la lista para tener los saldos al día, sin mostrar la carga.
    await waitFor(() => expect(listCreditRequests).toHaveBeenCalledTimes(2))
    expect(screen.queryByText('Cargando solicitudes…')).not.toBeInTheDocument()
    expect(screen.queryByRole('rowheader', { name: 'Logística Sierra Alta' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('rowheader')).toHaveLength(2)
  })

  it('«Rechazar» también pide confirmación y, al confirmar, rechaza y quita la fila', async () => {
    vi.mocked(listCreditRequests).mockResolvedValue(SOLICITUDES)
    vi.mocked(rejectRequest).mockResolvedValue(undefined)
    const user = montar()
    await esperarTabla()

    await user.click(rechazar(RIO_CLARO, '50 créditos'))
    const modal = dialogo()
    expect(modal).toHaveAccessibleDescription('La empresa no recibirá los créditos que pidió. Esta acción no se puede deshacer.')
    expect(rejectRequest).not.toHaveBeenCalled()

    await user.click(within(modal).getByRole('button', { name: 'Rechazar solicitud' }))

    expect(rejectRequest).toHaveBeenCalledWith(10)
    expect(approveRequest).not.toHaveBeenCalled()
    expect(await screen.findByText('Solicitud de Comercializadora Río Claro rechazada.')).toBeInTheDocument()
    expect(screen.queryByRole('rowheader', { name: 'Comercializadora Río Claro' })).not.toBeInTheDocument()
    // Era la última fila: el foco pasa a la que queda arriba.
    expect(aprobar(MIRADOR, '1 crédito')).toHaveFocus()
    expect(avisarCambioDeSolicitudes).toHaveBeenCalledTimes(1)
  })

  it('mientras aprueba, el botón muestra la carga y el modal no se cierra', async () => {
    const aprobacion = diferida<void>()
    vi.mocked(listCreditRequests).mockResolvedValue(SOLICITUDES)
    vi.mocked(approveRequest).mockReturnValue(aprobacion.promesa)
    const user = montar()
    await esperarTabla()

    await aprobarSierra(user)
    const confirmar = within(dialogo()).getByRole('button', { name: 'Aprobando…' })
    expect(confirmar).toHaveAttribute('aria-busy', 'true')
    expect(within(dialogo()).getByRole('button', { name: 'Cancelar' })).toHaveAttribute('aria-disabled', 'true')

    await user.keyboard('{Escape}')
    await user.click(confirmar)
    expect(dialogo()).toBeInTheDocument()
    expect(approveRequest).toHaveBeenCalledTimes(1)

    await act(async () => aprobacion.resolver(undefined))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('un 409 se muestra en el modal, sin toast, y «Actualizar lista» vuelve a pedirla', async () => {
    vi.mocked(listCreditRequests).mockResolvedValueOnce(SOLICITUDES).mockResolvedValueOnce([MIRADOR, RIO_CLARO])
    vi.mocked(approveRequest).mockRejectedValue(errorHttp(409))
    const user = montar()
    await esperarTabla()

    await aprobarSierra(user)

    const modal = dialogo()
    const alerta = await within(modal).findByRole('alert')
    expect(alerta).toHaveTextContent('Esta solicitud ya no está pendiente')
    expect(alerta).toHaveTextContent('Alguien más la aprobó o la rechazó')
    expect(screen.queryByText(/aprobada/)).not.toBeInTheDocument()
    expect(avisarCambioDeSolicitudes).not.toHaveBeenCalled()
    // Volver a aprobar ya no tiene sentido: el mismo botón, con el foco, pasa a «Actualizar lista».
    const actualizar = within(modal).getByRole('button', { name: 'Actualizar lista' })
    expect(actualizar).toHaveFocus()
    expect(within(modal).queryByRole('button', { name: 'Aprobar solicitud' })).not.toBeInTheDocument()
    expect(within(modal).getByRole('button', { name: 'Cerrar' })).toBeInTheDocument()

    await user.click(actualizar)

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(listCreditRequests).toHaveBeenCalledTimes(2)
    // La barra también vuelve a contar las pendientes.
    expect(avisarCambioDeSolicitudes).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.queryByRole('rowheader', { name: 'Logística Sierra Alta' })).not.toBeInTheDocument())
    expect(screen.getAllByRole('rowheader')).toHaveLength(2)
    // El foco queda en el encabezado de la página, no se pierde.
    expect(screen.getByRole('heading', { level: 1, name: 'Solicitudes de créditos' }).closest('header')).toHaveFocus()
  })

  it('un error de red al rechazar se muestra en el modal y el mismo botón reintenta', async () => {
    vi.mocked(listCreditRequests).mockResolvedValue(SOLICITUDES)
    vi.mocked(rejectRequest).mockRejectedValueOnce(errorHttp()).mockResolvedValueOnce(undefined)
    const user = montar()
    await esperarTabla()

    await user.click(rechazar(MIRADOR, '1 crédito'))
    await user.click(within(dialogo()).getByRole('button', { name: 'Rechazar solicitud' }))

    const alerta = await within(dialogo()).findByRole('alert')
    expect(alerta).toHaveTextContent('No pudimos conectarnos')
    expect(alerta).toHaveTextContent('La solicitud sigue pendiente.')
    expect(screen.getByRole('rowheader', { name: 'Clínica Dental Mirador' })).toBeInTheDocument()

    const reintentar = within(dialogo()).getByRole('button', { name: 'Rechazar solicitud' })
    expect(reintentar).toHaveFocus()
    await user.click(reintentar)

    expect(rejectRequest).toHaveBeenCalledTimes(2)
    expect(rejectRequest).toHaveBeenLastCalledWith(9)
    expect(await screen.findByText('Solicitud de Clínica Dental Mirador rechazada.')).toBeInTheDocument()
    expect(screen.queryByRole('rowheader', { name: 'Clínica Dental Mirador' })).not.toBeInTheDocument()
  })

  it('un 500 al aprobar dice que no se pudo aprobar y deja reintentar', async () => {
    vi.mocked(listCreditRequests).mockResolvedValue(SOLICITUDES)
    vi.mocked(approveRequest).mockRejectedValue(errorHttp(500))
    const user = montar()
    await esperarTabla()

    await aprobarSierra(user)

    const alerta = await within(dialogo()).findByRole('alert')
    expect(alerta).toHaveTextContent('No pudimos aprobar la solicitud')
    expect(within(dialogo()).getByRole('button', { name: 'Aprobar solicitud' })).toBeInTheDocument()
  })

  it('al resolver la última solicitud queda el vacío, con el foco', async () => {
    vi.mocked(listCreditRequests).mockResolvedValueOnce([SIERRA]).mockResolvedValueOnce([])
    vi.mocked(approveRequest).mockResolvedValue(undefined)
    const user = montar()
    await esperarTabla()

    await aprobarSierra(user)

    const titulo = await screen.findByRole('heading', { level: 2, name: 'No hay solicitudes pendientes' })
    expect(titulo.closest('.st-estado-vacio')).toHaveFocus()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('si la lista en silencio falla después de resolver, se queda la que se ve, sin error', async () => {
    vi.mocked(listCreditRequests).mockResolvedValueOnce(SOLICITUDES).mockRejectedValueOnce(errorHttp(500))
    vi.mocked(approveRequest).mockResolvedValue(undefined)
    const user = montar()
    await esperarTabla()

    await aprobarSierra(user)

    await waitFor(() => expect(listCreditRequests).toHaveBeenCalledTimes(2))
    expect(screen.getAllByRole('rowheader').map((celda) => celda.querySelector('.st-table__cell-value')?.textContent)).toEqual([
      'Clínica Dental Mirador',
      'Comercializadora Río Claro',
    ])
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
