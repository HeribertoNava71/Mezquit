import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listAssessments, type AssessmentSummary } from '@/api/rh'
import { ToastProvider } from '@/components/ui'
import EvaluacionesPage from './EvaluacionesPage'

// /app/evaluaciones con src/api/rh simulado. Forma de GET /api/assessments:
// AssessmentController@index (2026-09-12-fase2-panel-rh.md:584-611).

vi.mock('@/api/rh', () => ({ listAssessments: vi.fn() }))

const VENTAS: AssessmentSummary = {
  id: 12,
  name: 'Ejecutivos de ventas',
  position: 'Ejecutivo de ventas',
  deadline: '2026-10-15',
  status: 'activa',
  counts: { total: 5, pendiente: 2, iniciada: 1, completada: 1 },
  created_at: '2026-09-20',
}

const SOPORTE: AssessmentSummary = {
  id: 15,
  name: 'Soporte nivel 1',
  position: null,
  deadline: null,
  status: 'activa',
  counts: { total: 1, pendiente: 0, iniciada: 0, completada: 1 },
  created_at: '2026-09-28',
}

/** Error de axios con el código HTTP dado; sin código, un error de red. */
function errorHttp(status?: number): AxiosError {
  if (status === undefined) return new AxiosError('Network Error', AxiosError.ERR_NETWORK)
  const respuesta = { status, statusText: '', data: {}, headers: {}, config: { headers: new AxiosHeaders() } }
  return new AxiosError('Request failed', AxiosError.ERR_BAD_RESPONSE, undefined, undefined, respuesta as AxiosResponse)
}

function montar() {
  render(
    <ToastProvider>
      <MemoryRouter initialEntries={['/app/evaluaciones']}>
        <Routes>
          <Route path="/app/evaluaciones" element={<EvaluacionesPage />} />
          <Route path="/app/evaluaciones/nueva" element={<h1>Nueva evaluación</h1>} />
          <Route path="/app/evaluaciones/:id" element={<h1>Detalle de la evaluación</h1>} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  )
  return userEvent.setup()
}

/** Fila de la tabla por el nombre de la evaluación (su encabezado de fila). */
async function fila(nombre: string) {
  const celda = await screen.findByRole('rowheader', { name: new RegExp(nombre) })
  const tr = celda.closest('tr')
  if (!tr) throw new Error(`Sin fila para ${nombre}`)
  return within(tr)
}

beforeEach(() => {
  vi.mocked(listAssessments).mockReset()
})

describe('EvaluacionesPage', () => {
  it('encabeza «Candidatos» con eyebrow, entradilla sin «tiempo real» y el CTA «Invitar candidatos»', async () => {
    vi.mocked(listAssessments).mockResolvedValue([VENTAS])
    montar()

    expect(screen.getByRole('heading', { level: 1, name: 'Candidatos' })).toBeInTheDocument()
    expect(screen.getByText('Asignación y seguimiento')).toBeInTheDocument()
    expect(screen.getByText(/Sigue el avance de cada evaluación/)).toBeInTheDocument()
    expect(screen.queryByText(/tiempo real|actualizado hace/i)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Invitar candidatos' })).toHaveAttribute('href', '/app/evaluaciones/nueva')
    await fila('Ejecutivos de ventas')
  })

  it('muestra la carga y después cada evaluación con su avance, sus estados y sus fechas', async () => {
    let entregar: (lista: AssessmentSummary[]) => void = () => {}
    vi.mocked(listAssessments).mockReturnValue(new Promise((resolver) => (entregar = resolver)))
    montar()

    expect(screen.getByText('Cargando evaluaciones…').closest('[role="status"]')).toBeInTheDocument()
    entregar([VENTAS, SOPORTE])

    const ventas = await fila('Ejecutivos de ventas')
    expect(ventas.getByText('Ejecutivo de ventas')).toBeInTheDocument()
    expect(ventas.getByText('1 de 5 completadas')).toBeInTheDocument()
    // Conteos del índice y las expiradas que no cuenta (5 − 2 − 1 − 1).
    expect(ventas.getByText('2 pendientes')).toBeInTheDocument()
    expect(ventas.getByText('1 iniciada')).toBeInTheDocument()
    expect(ventas.getByText('1 completada')).toBeInTheDocument()
    expect(ventas.getByText('1 expirada')).toBeInTheDocument()
    expect(ventas.getByText('15 oct 2026')).toHaveAttribute('datetime', '2026-10-15')
    expect(ventas.getByText('20 sep 2026')).toHaveAttribute('datetime', '2026-09-20')
    expect(ventas.getByRole('link', { name: 'Ver detalle de Ejecutivos de ventas' })).toHaveAttribute(
      'href',
      '/app/evaluaciones/12',
    )

    const soporte = await fila('Soporte nivel 1')
    expect(soporte.getByText('Sin puesto')).toBeInTheDocument()
    expect(soporte.getByText('1 de 1 completada')).toBeInTheDocument()
    expect(soporte.getByText('Sin fecha límite')).toBeInTheDocument()
    expect(soporte.queryByText(/pendiente/)).not.toBeInTheDocument()

    expect(screen.getByText('· 6 candidatos invitados')).toBeInTheDocument()
    expect(screen.getByText('Mostrando 2 evaluaciones')).toBeInTheDocument()
    expect(screen.queryByText('Cargando evaluaciones…')).not.toBeInTheDocument()
  })

  it('resume los candidatos por estado de todas las evaluaciones, en lugar del saldo por prueba (P-12)', async () => {
    let entregar: (lista: AssessmentSummary[]) => void = () => {}
    vi.mocked(listAssessments).mockReturnValue(new Promise((resolver) => (entregar = resolver)))
    montar()

    const resumen = screen.getByRole('region', { name: 'Candidatos por estado' })
    expect(resumen).toHaveAttribute('aria-busy', 'true')
    expect(within(resumen).getAllByText('Cargando…')).toHaveLength(4)
    entregar([VENTAS, SOPORTE])
    await fila('Ejecutivos de ventas')

    expect(resumen).not.toHaveAttribute('aria-busy')
    const tarjeta = (rotulo: string) => within(resumen).getByText(rotulo).closest('.st-stat')
    // VENTAS (2 pendientes, 1 iniciada, 1 completada y 1 expirada) más SOPORTE (1 completada).
    expect(tarjeta('Pendientes')).toHaveTextContent(/^Pendientes2de 6 invitados/)
    expect(tarjeta('Iniciadas')).toHaveTextContent(/^Iniciadas1de 6 invitados/)
    expect(tarjeta('Completadas')).toHaveTextContent(/^Completadas2de 6 invitados/)
    expect(tarjeta('Expiradas')).toHaveTextContent(/^Expiradas1de 6 invitados/)
  })

  it('«Ver detalle» lleva al detalle de la evaluación', async () => {
    vi.mocked(listAssessments).mockResolvedValue([VENTAS])
    const user = montar()
    await user.click((await fila('Ejecutivos de ventas')).getByRole('link', { name: /Ver detalle/ }))
    expect(screen.getByRole('heading', { name: 'Detalle de la evaluación' })).toBeInTheDocument()
  })

  it('sin evaluaciones muestra el vacío con su CTA, no un error', async () => {
    vi.mocked(listAssessments).mockResolvedValue([])
    montar()

    const titulo = await screen.findByRole('heading', { name: 'Aún no tienes evaluaciones' })
    const vacio = titulo.parentElement as HTMLElement
    expect(vacio).toHaveTextContent('Crea la primera')
    expect(within(vacio).getByRole('link', { name: 'Invitar candidatos' })).toHaveAttribute(
      'href',
      '/app/evaluaciones/nueva',
    )
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByText(/Mostrando/)).not.toBeInTheDocument()
    // Sin evaluaciones no hay resumen por estado: solo el vacío con su CTA.
    expect(screen.queryByRole('region', { name: 'Candidatos por estado' })).not.toBeInTheDocument()
  })

  it('un error de red es distinto del vacío y se puede reintentar', async () => {
    vi.mocked(listAssessments).mockRejectedValueOnce(errorHttp()).mockResolvedValueOnce([VENTAS])
    const user = montar()

    const error = await screen.findByRole('alert')
    expect(error).toHaveTextContent('No pudimos conectarnos')
    expect(screen.queryByText('Aún no tienes evaluaciones')).not.toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()

    await user.click(within(error).getByRole('button', { name: 'Reintentar' }))
    await fila('Ejecutivos de ventas')
    expect(listAssessments).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    // El botón ya no existe: el foco pasa a la tabla y no se pierde en <body>.
    expect(screen.getByRole('table').closest('.st-table')).toHaveFocus()
  })

  it('un error del servidor dice que no se pudieron cargar las evaluaciones', async () => {
    vi.mocked(listAssessments).mockRejectedValue(errorHttp(500))
    montar()
    const error = await screen.findByRole('alert')
    expect(within(error).getByRole('heading', { name: 'No pudimos cargar tus evaluaciones' })).toBeInTheDocument()
    expect(within(error).getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })

  it('«Actualizar» vuelve a pedir la lista y lo confirma con un toast', async () => {
    vi.mocked(listAssessments)
      .mockResolvedValueOnce([VENTAS])
      .mockResolvedValueOnce([{ ...VENTAS, counts: { ...VENTAS.counts, completada: 2, pendiente: 1 } }])
    const user = montar()
    await fila('Ejecutivos de ventas')

    await user.click(screen.getByRole('button', { name: 'Actualizar' }))
    expect(await screen.findByText('Lista actualizada')).toBeInTheDocument()
    expect(listAssessments).toHaveBeenCalledTimes(2)
    expect((await fila('Ejecutivos de ventas')).getByText('2 de 5 completadas')).toBeInTheDocument()
  })

  it('si «Actualizar» falla, conserva la lista y avisa inline con «Reintentar»', async () => {
    vi.mocked(listAssessments).mockResolvedValueOnce([VENTAS]).mockRejectedValueOnce(errorHttp())
    const user = montar()
    await fila('Ejecutivos de ventas')

    await user.click(screen.getByRole('button', { name: 'Actualizar' }))
    const aviso = await screen.findByRole('alert')
    expect(aviso).toHaveTextContent('No pudimos actualizar la lista')
    expect(within(aviso).getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
    expect((await fila('Ejecutivos de ventas')).getByText('1 de 5 completadas')).toBeInTheDocument()
    expect(screen.queryByText('Lista actualizada')).not.toBeInTheDocument()
  })
})
