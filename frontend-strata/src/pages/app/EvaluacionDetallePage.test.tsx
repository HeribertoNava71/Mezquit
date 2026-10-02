import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getAssessment,
  listAssessments,
  resendInvitation,
  type AssessmentDetail,
  type AssessmentSummary,
} from '@/api/rh'
import { ToastProvider } from '@/components/ui'
import EvaluacionDetallePage from './EvaluacionDetallePage'

// /app/evaluaciones/:id con src/api/rh simulado. Formas de AssessmentController@show
// (2026-09-11-fase1-nucleo.md:1472-1487), @index e InvitationController@resend
// (2026-09-12-fase2-panel-rh.md:584-641).

vi.mock('@/api/rh', () => ({
  getAssessment: vi.fn(),
  listAssessments: vi.fn(),
  resendInvitation: vi.fn(),
}))

const BASE = 'http://localhost:5173/evaluar/'

const DETALLE: AssessmentDetail = {
  id: 12,
  name: 'Ejecutivos de ventas',
  position: 'Ejecutivo de ventas',
  invitations: [
    { id: 41, candidate: 'Ana Torres', email: 'ana.torres@acme.mx', status: 'pendiente', link: `${BASE}tokenAna` },
    { id: 42, candidate: 'Bruno Díaz', email: 'bruno.diaz@acme.mx', status: 'iniciada', link: `${BASE}tokenBruno` },
    { id: 43, candidate: 'Carla Méndez', email: 'carla.mendez@acme.mx', status: 'completada', link: `${BASE}tokenCarla` },
    { id: 44, candidate: 'Diego Ruiz', email: 'diego.ruiz@acme.mx', status: 'expirada', link: `${BASE}tokenDiego` },
    { id: 45, candidate: 'Elena Soto', email: 'elena.soto@acme.mx', status: 'pendiente', link: `${BASE}tokenElena` },
  ],
}

const RESUMEN: AssessmentSummary = {
  id: 12,
  name: 'Ejecutivos de ventas',
  position: 'Ejecutivo de ventas',
  deadline: '2026-10-15',
  status: 'activa',
  counts: { total: 5, pendiente: 2, iniciada: 1, completada: 1 },
  created_at: '2026-09-20',
}

const OTRA: AssessmentSummary = { ...RESUMEN, id: 30, name: 'Otra evaluación', deadline: null }

/** Error de axios con el código HTTP dado; sin código, un error de red. */
function errorHttp(status?: number, data: unknown = {}): AxiosError {
  if (status === undefined) return new AxiosError('Network Error', AxiosError.ERR_NETWORK)
  const respuesta = { status, statusText: '', data, headers: {}, config: { headers: new AxiosHeaders() } }
  return new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, undefined, undefined, respuesta as AxiosResponse)
}

function montar(ruta = '/app/evaluaciones/12') {
  render(
    <ToastProvider>
      <MemoryRouter initialEntries={[ruta]}>
        <Routes>
          <Route path="/app/evaluaciones" element={<h1>Mis evaluaciones</h1>} />
          <Route path="/app/evaluaciones/nueva" element={<h1>Nueva evaluación</h1>} />
          <Route path="/app/evaluaciones/:id" element={<EvaluacionDetallePage />} />
          <Route path="/app/evaluaciones/:id/comparar" element={<h1>Comparativa</h1>} />
          <Route path="/app/candidatos/:invitationId/reporte" element={<h1>Reporte del candidato</h1>} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  )
  return userEvent.setup()
}

/** Fila de la tabla por el nombre del candidato (su encabezado de fila). */
async function fila(nombre: string) {
  const celda = await screen.findByRole('rowheader', { name: new RegExp(nombre) })
  const tr = celda.closest('tr')
  if (!tr) throw new Error(`Sin fila para ${nombre}`)
  return within(tr)
}

/** Nombres de los candidatos visibles en la tabla. */
function candidatosVisibles(): string[] {
  return screen
    .queryAllByRole('rowheader')
    .map((celda) => celda.querySelector('.st-persona__nombre')?.textContent ?? '')
}

const esperarTabla = () => fila('Ana Torres')

beforeEach(() => {
  vi.mocked(getAssessment).mockReset().mockResolvedValue(DETALLE)
  vi.mocked(listAssessments).mockReset().mockResolvedValue([OTRA, RESUMEN])
  vi.mocked(resendInvitation).mockReset().mockResolvedValue(undefined)
})

afterEach(() => {
  Reflect.deleteProperty(window.navigator, 'clipboard')
})

describe('EvaluacionDetallePage · encabezado y tabla', () => {
  it('pide el detalle del id de la URL y encabeza con nombre, puesto y fechas reales', async () => {
    montar()
    expect(await screen.findByRole('heading', { level: 1, name: 'Ejecutivos de ventas' })).toBeInTheDocument()
    expect(getAssessment).toHaveBeenCalledWith(12)

    const entradilla = screen.getByText('Ejecutivo de ventas').closest('p') as HTMLElement
    expect(entradilla).toHaveTextContent('Ejecutivo de ventas')
    expect(entradilla).toHaveTextContent('Creada el 20 sep 2026')
    expect(entradilla).toHaveTextContent('Fecha límite: 15 oct 2026')
  })

  it('«Comparar candidatos» (secundario) lleva a la comparativa e «Invitar candidatos» al asistente', async () => {
    const user = montar()
    const comparar = await screen.findByRole('link', { name: 'Comparar candidatos' })
    expect(comparar).toHaveClass('st-btn--secondary')
    expect(comparar).toHaveAttribute('href', '/app/evaluaciones/12/comparar')
    expect(screen.getAllByRole('link', { name: 'Invitar candidatos' })[0]).toHaveAttribute(
      'href',
      '/app/evaluaciones/nueva',
    )
    await user.click(comparar)
    expect(screen.getByRole('heading', { name: 'Comparativa' })).toBeInTheDocument()
  })

  it('lista a cada candidato con su correo y su estado', async () => {
    montar()
    const ana = await fila('Ana Torres')
    expect(ana.getByText('ana.torres@acme.mx')).toBeInTheDocument()
    expect(ana.getByText('Pendiente')).toBeInTheDocument()
    expect((await fila('Bruno Díaz')).getByText('Iniciada')).toBeInTheDocument()
    expect((await fila('Carla Méndez')).getByText('Completada')).toBeInTheDocument()
    expect((await fila('Diego Ruiz')).getByText('Expirada')).toBeInTheDocument()
    expect(screen.getByText('Mostrando 5 de 5 candidatos')).toBeInTheDocument()
  })

  it('«Ver reporte» aparece solo si completó y lleva a su reporte', async () => {
    const user = montar()
    const carla = await fila('Carla Méndez')
    expect(carla.getByRole('link', { name: 'Ver reporte de Carla Méndez' })).toHaveAttribute(
      'href',
      '/app/candidatos/43/reporte',
    )
    for (const nombre of ['Ana Torres', 'Bruno Díaz', 'Diego Ruiz', 'Elena Soto']) {
      expect((await fila(nombre)).queryByRole('link', { name: /Ver reporte/ })).not.toBeInTheDocument()
    }
    await user.click(carla.getByRole('link', { name: 'Ver reporte de Carla Méndez' }))
    expect(screen.getByRole('heading', { name: 'Reporte del candidato' })).toBeInTheDocument()
  })

  it('si falla la lista de evaluaciones, no afirma nada sobre las fechas', async () => {
    vi.mocked(listAssessments).mockRejectedValue(errorHttp())
    const user = montar()
    await esperarTabla()
    expect(screen.queryByText(/Fecha límite|Sin fecha límite|Creada el/)).not.toBeInTheDocument()

    await user.click((await fila('Ana Torres')).getByRole('button', { name: 'Compartir la invitación de Ana Torres' }))
    expect(screen.getByText(/La invitación ya se envió por correo/)).toHaveTextContent(
      /^La invitación ya se envió por correo\.$/,
    )
  })
})

describe('EvaluacionDetallePage · filtro por estado', () => {
  it('filtra por los cuatro estados del backend, cada uno con su conteo', async () => {
    const user = montar()
    await esperarTabla()
    const filtro = screen.getByRole('group', { name: 'Filtrar candidatos por estado' })
    const nombres = within(filtro)
      .getAllByRole('button')
      .map((boton) => boton.textContent?.replace(/\s+/g, ' ').trim())
    expect(nombres).toEqual(['Todos 5', 'Pendiente 2', 'Iniciada 1', 'Completada 1', 'Expirada 1'])

    await user.click(within(filtro).getByRole('button', { name: 'Pendiente 2' }))
    expect(candidatosVisibles()).toEqual(['Ana Torres', 'Elena Soto'])
    expect(screen.getByText('Mostrando 2 de 5 candidatos')).toBeInTheDocument()

    await user.click(within(filtro).getByRole('button', { name: 'Expirada 1' }))
    expect(candidatosVisibles()).toEqual(['Diego Ruiz'])

    await user.click(within(filtro).getByRole('button', { name: 'Todos 5' }))
    expect(candidatosVisibles()).toHaveLength(5)
  })

  it('un estado sin candidatos muestra «Ningún candidato en este estado» y deja volver a todos', async () => {
    vi.mocked(getAssessment).mockResolvedValue({
      ...DETALLE,
      invitations: DETALLE.invitations.filter((invitacion) => invitacion.status !== 'expirada'),
    })
    const user = montar()
    await esperarTabla()

    await user.click(screen.getByRole('button', { name: 'Expirada 0' }))
    expect(candidatosVisibles()).toEqual([])
    const vacio = screen.getByText('Ningún candidato en este estado').closest('[role="status"]') as HTMLElement
    expect(vacio).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    await user.click(within(vacio).getByRole('button', { name: 'Ver todos' }))
    expect(candidatosVisibles()).toHaveLength(4)
  })
})

describe('EvaluacionDetallePage · copiar y compartir', () => {
  it('«Copiar enlace» copia el enlace real de la invitación y lo confirma con un toast', async () => {
    const user = montar()
    await user.click((await fila('Ana Torres')).getByRole('button', { name: 'Copiar enlace de Ana Torres' }))
    await expect(navigator.clipboard.readText()).resolves.toBe(`${BASE}tokenAna`)
    expect(await screen.findByText('Enlace copiado')).toBeInTheDocument()
  })

  it('si el portapapeles falla, lo avisa inline en la fila y no confirma', async () => {
    const user = montar()
    const ana = await fila('Ana Torres')
    Object.defineProperty(window.navigator, 'clipboard', {
      value: { writeText: () => Promise.reject(new Error('Sin permiso')) },
      configurable: true,
    })
    await user.click(ana.getByRole('button', { name: 'Copiar enlace de Ana Torres' }))
    expect(await ana.findByRole('alert')).toHaveTextContent('No pudimos copiar el enlace.')
    expect(screen.queryByText('Enlace copiado')).not.toBeInTheDocument()
  })

  it('«Compartir» abre «Enlace de invitación» con mailto y wa.me del enlace real y la fecha límite', async () => {
    const user = montar()
    const compartir = (await fila('Ana Torres')).getByRole('button', { name: 'Compartir la invitación de Ana Torres' })
    await user.click(compartir)

    const dialogo = screen.getByRole('dialog', { name: 'Enlace de invitación' })
    expect(within(dialogo).getByText(`${BASE}tokenAna`)).toBeInTheDocument()

    const correo = within(dialogo).getByRole('link', { name: 'Enviar por Correo a Ana Torres' }).getAttribute('href') ?? ''
    expect(correo.startsWith('mailto:ana.torres@acme.mx?subject=')).toBe(true)
    const cuerpo = decodeURIComponent(correo.split('&body=')[1] ?? '')
    expect(cuerpo).toContain(`${BASE}tokenAna`)
    expect(cuerpo).toContain('Responde antes del 15/10/2026.')

    const whatsapp = within(dialogo).getByRole('link', { name: /WhatsApp/ }).getAttribute('href') ?? ''
    expect(whatsapp.startsWith('https://wa.me/?text=')).toBe(true)
    expect(new URL(whatsapp).searchParams.get('text')).toContain(`${BASE}tokenAna`)
    expect(within(dialogo).getByText(/La invitación ya se envió por correo/)).toHaveTextContent(
      'La invitación ya se envió por correo. Fecha límite: 15 oct 2026.',
    )

    await user.click(within(dialogo).getByRole('button', { name: 'Cerrar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(compartir).toHaveFocus()
  })

  it('el modal dice «Sin fecha límite» cuando la evaluación no tiene', async () => {
    vi.mocked(listAssessments).mockResolvedValue([{ ...RESUMEN, deadline: null }])
    const user = montar()
    expect(await screen.findByText('Sin fecha límite')).toBeInTheDocument()
    await user.click((await fila('Bruno Díaz')).getByRole('button', { name: 'Compartir la invitación de Bruno Díaz' }))
    expect(screen.getByText(/La invitación ya se envió por correo/)).toHaveTextContent(
      'La invitación ya se envió por correo. Sin fecha límite.',
    )
  })
})

describe('EvaluacionDetallePage · reenviar', () => {
  it('reenvía la invitación y lo confirma con un toast', async () => {
    const user = montar()
    await user.click((await fila('Ana Torres')).getByRole('button', { name: 'Reenviar la invitación a Ana Torres' }))
    expect(resendInvitation).toHaveBeenCalledWith(41)
    expect(await screen.findByText('Invitación reenviada a ana.torres@acme.mx')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('mientras reenvía, el botón queda en carga y no manda dos veces', async () => {
    let terminar: () => void = () => {}
    vi.mocked(resendInvitation).mockReturnValue(new Promise<void>((resolver) => (terminar = resolver)))
    const user = montar()
    const ana = await fila('Ana Torres')
    await user.click(ana.getByRole('button', { name: 'Reenviar la invitación a Ana Torres' }))

    const enCurso = ana.getByRole('button', { name: 'Reenviando… la invitación a Ana Torres' })
    expect(enCurso).toHaveAttribute('aria-busy', 'true')
    await user.click(enCurso)
    expect(resendInvitation).toHaveBeenCalledTimes(1)

    terminar()
    expect(await screen.findByText('Invitación reenviada a ana.torres@acme.mx')).toBeInTheDocument()
    expect(ana.getByRole('button', { name: 'Reenviar la invitación a Ana Torres' })).not.toHaveAttribute('aria-busy')
  })

  it('un 409 se muestra inline en la fila, sin toast', async () => {
    vi.mocked(resendInvitation).mockRejectedValue(errorHttp(409, { message: 'La evaluación ya fue completada.' }))
    const user = montar()
    const bruno = await fila('Bruno Díaz')
    const reenviar = bruno.getByRole('button', { name: 'Reenviar la invitación a Bruno Díaz' })
    await user.click(reenviar)

    const aviso = await bruno.findByRole('alert')
    expect(aviso).toHaveTextContent('Esta invitación ya se completó y no se puede reenviar.')
    expect(reenviar).toHaveAccessibleDescription(/ya se completó/)
    expect(screen.queryByText(/Invitación reenviada/)).not.toBeInTheDocument()
    // Las otras filas no se enteran.
    expect((await fila('Ana Torres')).queryByRole('alert')).not.toBeInTheDocument()
  })

  it.each([
    ['red', errorHttp(), 'No pudimos conectarnos.'],
    ['sesión vencida (401)', errorHttp(401), 'Tu sesión expiró.'],
    ['servidor (500)', errorHttp(500), 'No pudimos reenviar la invitación.'],
  ])('un error de %s también queda inline, sin rechazos sin manejar', async (_caso, error, texto) => {
    vi.mocked(resendInvitation).mockRejectedValue(error)
    const user = montar()
    const ana = await fila('Ana Torres')
    await user.click(ana.getByRole('button', { name: 'Reenviar la invitación a Ana Torres' }))
    expect(await ana.findByRole('alert')).toHaveTextContent(texto)
    // El botón sale de la carga y se puede volver a intentar.
    expect(ana.getByRole('button', { name: 'Reenviar la invitación a Ana Torres' })).not.toHaveAttribute('aria-busy')
  })

  it('un nuevo intento que sale bien quita el aviso', async () => {
    vi.mocked(resendInvitation).mockRejectedValueOnce(errorHttp()).mockResolvedValueOnce(undefined)
    const user = montar()
    const ana = await fila('Ana Torres')
    const reenviar = ana.getByRole('button', { name: 'Reenviar la invitación a Ana Torres' })
    await user.click(reenviar)
    await ana.findByRole('alert')
    await user.click(reenviar)
    expect(await screen.findByText('Invitación reenviada a ana.torres@acme.mx')).toBeInTheDocument()
    expect(ana.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('está deshabilitado si el candidato ya completó, y dice por qué', async () => {
    const user = montar()
    const reenviar = (await fila('Carla Méndez')).getByRole('button', { name: 'Reenviar la invitación a Carla Méndez' })
    expect(reenviar).toHaveAttribute('aria-disabled', 'true')
    expect(reenviar).toHaveAccessibleDescription(/Ya completó la evaluación/)
    await user.click(reenviar)
    expect(resendInvitation).not.toHaveBeenCalled()
  })
})

describe('EvaluacionDetallePage · errores de carga', () => {
  it('un 403 dice «No tienes acceso a esta evaluación», sin reintentar y con salida a la lista', async () => {
    vi.mocked(getAssessment).mockRejectedValue(errorHttp(403))
    const user = montar()
    const error = await screen.findByRole('alert')
    expect(within(error).getByRole('heading', { name: 'No tienes acceso a esta evaluación' })).toBeInTheDocument()
    expect(within(error).queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Detalle de la evaluación' })).toBeInTheDocument()

    await user.click(within(error).getByRole('link', { name: 'Ver mis evaluaciones' }))
    expect(screen.getByRole('heading', { name: 'Mis evaluaciones' })).toBeInTheDocument()
  })

  it('un 404 dice que la evaluación no existe', async () => {
    vi.mocked(getAssessment).mockRejectedValue(errorHttp(404))
    montar()
    const error = await screen.findByRole('alert')
    expect(within(error).getByRole('heading', { name: 'No encontramos esta evaluación' })).toBeInTheDocument()
    expect(within(error).queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument()
  })

  it('un id que no es número muestra «no encontrada» sin llamar a la API', async () => {
    montar('/app/evaluaciones/abc')
    expect(await screen.findByRole('heading', { name: 'No encontramos esta evaluación' })).toBeInTheDocument()
    expect(getAssessment).not.toHaveBeenCalled()
  })

  it('un error de red muestra «Reintentar», distinto de un vacío, y se recupera', async () => {
    vi.mocked(getAssessment).mockRejectedValueOnce(errorHttp()).mockResolvedValueOnce(DETALLE)
    const user = montar()
    expect(screen.getByText('Cargando evaluación…')).toBeInTheDocument()

    const error = await screen.findByRole('alert')
    expect(error).toHaveTextContent('No pudimos conectarnos')
    expect(screen.queryByText(/Ningún candidato|no tiene candidatos/)).not.toBeInTheDocument()

    await user.click(within(error).getByRole('button', { name: 'Reintentar' }))
    await esperarTabla()
    expect(getAssessment).toHaveBeenCalledTimes(2)
    // El botón ya no existe: el foco pasa a la tabla de candidatos y no se pierde en <body>.
    expect(screen.getByRole('table').closest('.st-table')).toHaveFocus()
  })

  it('un error del servidor dice que no se pudo cargar la evaluación', async () => {
    vi.mocked(getAssessment).mockRejectedValue(errorHttp(500))
    montar()
    const error = await screen.findByRole('alert')
    expect(within(error).getByRole('heading', { name: 'No pudimos cargar la evaluación' })).toBeInTheDocument()
    expect(within(error).getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })
})

describe('EvaluacionDetallePage · actualizar', () => {
  it('«Actualizar» vuelve a pedir la evaluación y lo confirma con un toast', async () => {
    const actualizado: AssessmentDetail = {
      ...DETALLE,
      invitations: DETALLE.invitations.map((invitacion) =>
        invitacion.id === 41 ? { ...invitacion, status: 'iniciada' } : invitacion,
      ),
    }
    vi.mocked(getAssessment).mockResolvedValueOnce(DETALLE).mockResolvedValueOnce(actualizado)
    const user = montar()
    await esperarTabla()

    await user.click(screen.getByRole('button', { name: 'Actualizar' }))
    expect(await screen.findByText('Evaluación actualizada')).toBeInTheDocument()
    expect(getAssessment).toHaveBeenCalledTimes(2)
    expect((await fila('Ana Torres')).getByText('Iniciada')).toBeInTheDocument()
  })

  it('si «Actualizar» falla por red, conserva la tabla y avisa inline', async () => {
    vi.mocked(getAssessment).mockResolvedValueOnce(DETALLE).mockRejectedValueOnce(errorHttp())
    const user = montar()
    await esperarTabla()

    await user.click(screen.getByRole('button', { name: 'Actualizar' }))
    const aviso = await screen.findByRole('alert')
    expect(aviso).toHaveTextContent('No pudimos actualizar la evaluación')
    expect(within(aviso).getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
    expect((await fila('Ana Torres')).getByText('Pendiente')).toBeInTheDocument()
  })
})
