import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getAssessment,
  getCredits,
  listAssessments,
  type AssessmentDetail,
  type AssessmentSummary,
  type CreditsData,
  type InvitationRow,
} from '@/api/rh'
import ResumenPage from './ResumenPage'

// «Resultados» (/app) con src/api/rh simulado. Formas de GET /api/credits
// ({balance, transactions}), GET /api/assessments (AssessmentController@index:
// counts por estado y created_at «Y-m-d») y GET /api/assessments/{id} (show:
// id, name, position e invitations).

vi.mock('@/api/rh', () => ({
  getCredits: vi.fn(),
  listAssessments: vi.fn(),
  getAssessment: vi.fn(),
}))

const CREDITOS: CreditsData = { balance: 1250, transactions: [] }

function evaluacion(
  id: number,
  conteos: Partial<AssessmentSummary['counts']>,
  parcial: Partial<AssessmentSummary> = {},
): AssessmentSummary {
  return {
    id,
    name: `Evaluación ${id}`,
    position: `Puesto ${id}`,
    deadline: null,
    status: 'activa',
    counts: { total: 0, pendiente: 0, iniciada: 0, completada: 0, ...conteos },
    created_at: '2026-09-01',
    ...parcial,
  }
}

function invitacion(id: number, candidate: string, status: string): InvitationRow {
  const usuario = candidate.split(' ')[0].toLowerCase()
  return { id, candidate, email: `${usuario}@correo.mx`, status, link: `http://localhost:5173/evaluar/token${id}` }
}

// Ventas Norte (20 sep): 1 de 3 completadas · Analistas (25 sep, sin puesto): 2 de 2 ·
// Sin avance (28 sep): 0 de 4. Activas: Ventas Norte y Sin avance. Completados: 3.
const VENTAS = evaluacion(1, { total: 3, pendiente: 1, iniciada: 1, completada: 1 }, {
  name: 'Ventas Norte',
  position: 'Ejecutivo de ventas',
  created_at: '2026-09-20',
})
const ANALISTAS = evaluacion(2, { total: 2, completada: 2 }, { name: 'Analistas', position: null, created_at: '2026-09-25' })
const SIN_AVANCE = evaluacion(3, { total: 4, pendiente: 4 }, { name: 'Sin avance', created_at: '2026-09-28' })
const LISTA = [SIN_AVANCE, ANALISTAS, VENTAS]

const DETALLES: Record<number, AssessmentDetail> = {
  1: {
    id: 1,
    name: 'Ventas Norte',
    position: 'Ejecutivo de ventas',
    invitations: [
      invitacion(11, 'Camila Ferrer', 'completada'),
      invitacion(12, 'Diego Salas', 'pendiente'),
      invitacion(13, 'Elena Ruiz', 'iniciada'),
    ],
  },
  2: {
    id: 2,
    name: 'Analistas',
    position: null,
    invitations: [invitacion(21, 'Valentina Ríos', 'completada'), invitacion(22, 'Andrés Molina', 'completada')],
  },
}

/** Error de axios con el código HTTP dado; sin código, un error de red. */
function errorHttp(status?: number): AxiosError {
  if (status === undefined) return new AxiosError('Network Error', AxiosError.ERR_NETWORK)
  const respuesta = { status, statusText: '', data: {}, headers: {}, config: { headers: new AxiosHeaders() } }
  return new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, undefined, undefined, respuesta as AxiosResponse)
}

function diferido<T = void>() {
  let resolver!: (valor: T) => void
  let rechazar!: (error: unknown) => void
  const promesa = new Promise<T>((resolve, reject) => {
    resolver = resolve
    rechazar = reject
  })
  return { promesa, resolver, rechazar }
}

function detallesDe(registro: Record<number, AssessmentDetail>) {
  return async (id: number) => {
    const encontrado = registro[id]
    if (!encontrado) throw errorHttp(404)
    return encontrado
  }
}

function montar() {
  return render(
    <MemoryRouter initialEntries={['/app']}>
      <ResumenPage />
    </MemoryRouter>,
  )
}

const resumen = () => screen.getByRole('list', { name: 'Resumen' })
/** Tarjeta (li) de una StatCard por su rótulo. */
function tarjeta(rotulo: string): HTMLElement {
  const li = within(resumen()).getByText(rotulo).closest('li')
  if (!li) throw new Error(`Sin tarjeta «${rotulo}»`)
  return li
}
/** Nombres de los candidatos en el orden de la tabla. */
function candidatosEnOrden(): string[] {
  return screen
    .getAllByRole('rowheader')
    .map((celda) => celda.querySelector('.st-persona__nombre')?.textContent ?? '')
}
const idsPedidos = () => vi.mocked(getAssessment).mock.calls.map(([id]) => id)

beforeEach(() => {
  vi.mocked(getCredits).mockReset().mockResolvedValue(CREDITOS)
  vi.mocked(listAssessments).mockReset().mockResolvedValue(LISTA)
  vi.mocked(getAssessment).mockReset().mockImplementation(detallesDe(DETALLES))
})

describe('ResumenPage · «Resultados»', () => {
  it('encabezado «Resultados» con el CTA «Invitar candidatos» al asistente', async () => {
    montar()
    expect(screen.getByRole('heading', { level: 1, name: 'Resultados' })).toBeInTheDocument()
    expect(screen.getByText('Panel de RR. HH.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Invitar candidatos' })).toHaveAttribute('href', '/app/evaluaciones/nueva')
    await screen.findByText('Valentina Ríos')
  })

  it('mientras carga: las tres StatCards y la tabla muestran carga, sin error', () => {
    vi.mocked(getCredits).mockReturnValue(new Promise(() => {}))
    vi.mocked(listAssessments).mockReturnValue(new Promise(() => {}))
    montar()

    expect(resumen()).toHaveAttribute('aria-busy', 'true')
    expect(within(resumen()).getAllByRole('listitem')).toHaveLength(3)
    expect(within(resumen()).getAllByText('Cargando…')).toHaveLength(3)
    expect(screen.getByRole('status')).toHaveTextContent('Cargando las últimas completadas…')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(getAssessment).not.toHaveBeenCalled()
  })

  it('StatCards: saldo, evaluaciones activas (completada < total) y candidatos completados (suma)', async () => {
    montar()
    await screen.findByText('Valentina Ríos')

    expect(resumen()).not.toHaveAttribute('aria-busy')
    expect(within(tarjeta('Créditos disponibles')).getByText('1,250')).toBeInTheDocument()
    expect(within(tarjeta('Evaluaciones activas')).getByText('2')).toBeInTheDocument()
    expect(within(tarjeta('Candidatos completados')).getByText('3')).toBeInTheDocument()
  })

  it('conserva «Ver créditos» y «Ver evaluaciones» del Resumen anterior', async () => {
    montar()
    await screen.findByText('Valentina Ríos')
    expect(within(tarjeta('Créditos disponibles')).getByRole('link', { name: 'Ver créditos' })).toHaveAttribute(
      'href',
      '/app/creditos',
    )
    expect(within(tarjeta('Evaluaciones activas')).getByRole('link', { name: 'Ver evaluaciones' })).toHaveAttribute(
      'href',
      '/app/evaluaciones',
    )
  })

  it('un saldo que no es número se muestra como «—» con texto para lectores', async () => {
    vi.mocked(getCredits).mockResolvedValue({ balance: null } as unknown as CreditsData)
    montar()
    await screen.findByText('Valentina Ríos')
    expect(within(tarjeta('Créditos disponibles')).getByText('Sin dato')).toBeInTheDocument()
    expect(within(tarjeta('Créditos disponibles')).getByText('—')).toBeInTheDocument()
  })
})

describe('ResumenPage · error de las llamadas principales', () => {
  it('si falla GET /api/credits: EstadoError en lugar de cifras y tabla, sin pedir detalles', async () => {
    vi.mocked(getCredits).mockRejectedValue(errorHttp())
    montar()

    const alerta = await screen.findByRole('alert')
    expect(within(alerta).getByRole('heading', { level: 2, name: 'No pudimos cargar tus resultados' })).toBeInTheDocument()
    expect(alerta).toHaveTextContent('Revisa tu conexión a internet e inténtalo de nuevo.')
    expect(screen.queryByRole('list', { name: 'Resumen' })).not.toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(getAssessment).not.toHaveBeenCalled()
    // El CTA sigue disponible.
    expect(screen.getByRole('link', { name: 'Invitar candidatos' })).toBeInTheDocument()
  })

  it('si falla GET /api/assessments: EstadoError de servidor, distinto del vacío', async () => {
    vi.mocked(listAssessments).mockRejectedValue(errorHttp(500))
    montar()

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent('No pudimos cargar tus resultados')
    expect(alerta).toHaveTextContent('Ocurrió un error de nuestro lado. Inténtalo de nuevo en unos minutos.')
    expect(screen.queryByText('Aún no tienes evaluaciones')).not.toBeInTheDocument()
    expect(screen.queryByText('Aún no hay evaluaciones completadas')).not.toBeInTheDocument()
  })

  it('«Reintentar» vuelve a pedir las dos llamadas, dice «Reintentando…» y al cargar lleva el foco a las cifras', async () => {
    const usuario = userEvent.setup()
    const segundoIntento = diferido<CreditsData>()
    vi.mocked(getCredits).mockRejectedValueOnce(errorHttp()).mockReturnValueOnce(segundoIntento.promesa)
    montar()

    await usuario.click(await screen.findByRole('button', { name: 'Reintentar' }))
    const boton = within(screen.getByRole('alert')).getByRole('button')
    expect(boton).toHaveTextContent('Reintentando…')
    expect(boton).toHaveAttribute('aria-busy', 'true')
    expect(boton).toHaveFocus()

    await act(async () => segundoIntento.resolver(CREDITOS))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(getCredits).toHaveBeenCalledTimes(2)
    expect(listAssessments).toHaveBeenCalledTimes(2)
    expect(within(tarjeta('Créditos disponibles')).getByText('1,250')).toBeInTheDocument()
    expect(resumen()).toHaveFocus()
    expect(await screen.findByText('Valentina Ríos')).toBeInTheDocument()
  })
})

describe('ResumenPage · «Últimas completadas» (agregación limitada, PB-05)', () => {
  it('pide el detalle de 5 evaluaciones como mucho: las más recientes con completadas', async () => {
    // 8 con completadas (ids 1-8, fechas desordenadas) y 2 sin completadas más recientes.
    const fechas = ['2026-09-03', '2026-09-28', '2026-09-11', '2026-09-19', '2026-09-07', '2026-09-24', '2026-09-15', '2026-09-01']
    const conCompletadas = fechas.map((created_at, i) => evaluacion(i + 1, { total: 3, completada: 1 }, { created_at }))
    const sinCompletadas = [
      evaluacion(20, { total: 2, pendiente: 2 }, { created_at: '2026-09-30' }),
      evaluacion(21, { total: 0 }, { created_at: '2026-09-29' }),
    ]
    vi.mocked(listAssessments).mockResolvedValue([...sinCompletadas, ...conCompletadas])
    vi.mocked(getAssessment).mockImplementation(async (id) => ({
      id,
      name: `Evaluación ${id}`,
      position: null,
      invitations: [invitacion(100 + id, `Persona ${id}`, 'completada')],
    }))
    montar()

    await screen.findByText('Persona 2')
    expect(getAssessment).toHaveBeenCalledTimes(5)
    // 28, 24, 19, 15 y 11 de septiembre.
    expect(idsPedidos()).toEqual([2, 6, 4, 7, 3])
    expect(candidatosEnOrden()).toEqual(['Persona 2', 'Persona 6', 'Persona 4', 'Persona 7', 'Persona 3'])
    // El total de la StatCard cuenta todas; el pie dice cuántas se ven.
    expect(within(tarjeta('Candidatos completados')).getByText('8')).toBeInTheDocument()
    expect(screen.getByText(/Mostrando 5 de 8 candidatos completados\./)).toBeInTheDocument()
  })

  it('lista solo las invitaciones completadas con candidato, evaluación, puesto, fecha y «Ver reporte»', async () => {
    montar()
    await screen.findByText('Valentina Ríos')

    // Sin avance no tiene completadas: no se pide su detalle.
    expect(idsPedidos()).toEqual([2, 1])
    // Analistas (25 sep) antes que Ventas Norte (20 sep); pendientes e iniciadas no salen.
    expect(candidatosEnOrden()).toEqual(['Valentina Ríos', 'Andrés Molina', 'Camila Ferrer'])
    expect(screen.queryByText('Diego Salas')).not.toBeInTheDocument()
    expect(screen.queryByText('Elena Ruiz')).not.toBeInTheDocument()

    const fila = screen.getByRole('rowheader', { name: /Valentina Ríos/ }).closest('tr')
    if (!fila) throw new Error('Sin fila')
    const celdas = within(fila)
    expect(celdas.getByText('valentina@correo.mx')).toBeInTheDocument()
    expect(celdas.getByText('Analistas')).toBeInTheDocument()
    expect(celdas.getByText('Sin puesto')).toBeInTheDocument()
    expect(celdas.getByText('25 sep 2026')).toHaveAttribute('datetime', '2026-09-25')
    expect(celdas.getByRole('link', { name: 'Ver reporte de Valentina Ríos' })).toHaveAttribute(
      'href',
      '/app/candidatos/21/reporte',
    )

    const camila = screen.getByRole('rowheader', { name: /Camila Ferrer/ }).closest('tr')
    if (!camila) throw new Error('Sin fila')
    expect(within(camila).getByText('Ejecutivo de ventas')).toBeInTheDocument()
    expect(within(camila).getByRole('link', { name: 'Ver reporte de Camila Ferrer' })).toHaveAttribute(
      'href',
      '/app/candidatos/11/reporte',
    )
  })

  it('dice que el orden sigue la fecha de la evaluación (PB-06) y enlaza a todas las evaluaciones', async () => {
    montar()
    await screen.findByText('Valentina Ríos')

    expect(screen.getByRole('heading', { level: 2, name: 'Últimas completadas' })).toBeInTheDocument()
    expect(screen.getByText('· por fecha de la evaluación')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Mostrando 3 de 3 candidatos completados. El orden sigue la fecha de creación de cada evaluación; la fecha en que terminó cada candidato está en su reporte.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver todas las evaluaciones' })).toHaveAttribute('href', '/app/evaluaciones')
  })

  it('sin evaluaciones: vacío con CTA para invitar y sin pedir detalles', async () => {
    vi.mocked(listAssessments).mockResolvedValue([])
    montar()

    expect(await screen.findByText('Aún no tienes evaluaciones')).toBeInTheDocument()
    expect(screen.getByText('Invita a tus primeros candidatos. Cuando terminen, aquí verás el enlace a cada reporte.')).toBeInTheDocument()
    const ctas = screen.getAllByRole('link', { name: 'Invitar candidatos' })
    expect(ctas).toHaveLength(2)
    ctas.forEach((cta) => expect(cta).toHaveAttribute('href', '/app/evaluaciones/nueva'))
    expect(within(tarjeta('Evaluaciones activas')).getByText('0')).toBeInTheDocument()
    expect(within(tarjeta('Candidatos completados')).getByText('0')).toBeInTheDocument()
    expect(getAssessment).not.toHaveBeenCalled()
    expect(screen.queryByText(/Mostrando/)).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('con evaluaciones pero ninguna completada: vacío propio con CTA, sin pedir detalles', async () => {
    vi.mocked(listAssessments).mockResolvedValue([SIN_AVANCE])
    montar()

    expect(await screen.findByText('Aún no hay evaluaciones completadas')).toBeInTheDocument()
    expect(screen.getByText('Cuando un candidato termine su evaluación, aquí verás el enlace a su reporte.')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Invitar candidatos' })).toHaveLength(2)
    expect(within(tarjeta('Evaluaciones activas')).getByText('1')).toBeInTheDocument()
    expect(getAssessment).not.toHaveBeenCalled()
  })

  it('mientras llegan los detalles, las cifras ya se ven y la tabla sigue en carga', async () => {
    vi.mocked(getAssessment).mockReturnValue(new Promise(() => {}))
    montar()

    expect(await within(resumen()).findByText('1,250')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Cargando las últimas completadas…')
    expect(getAssessment).toHaveBeenCalledTimes(2)
  })

  it('si fallan todos los detalles: EstadoError en la tabla; las cifras siguen y «Reintentar» pide de nuevo', async () => {
    const usuario = userEvent.setup()
    const puerta = diferido()
    vi.mocked(getAssessment)
      .mockRejectedValueOnce(errorHttp())
      .mockRejectedValueOnce(errorHttp())
      .mockImplementation(async (id) => {
        await puerta.promesa
        return detallesDe(DETALLES)(id)
      })
    montar()

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent('No pudimos cargar las últimas completadas')
    expect(alerta).toHaveTextContent('Revisa tu conexión a internet e inténtalo de nuevo.')
    expect(within(tarjeta('Créditos disponibles')).getByText('1,250')).toBeInTheDocument()
    expect(screen.queryByText('Aún no hay evaluaciones completadas')).not.toBeInTheDocument()

    await usuario.click(within(alerta).getByRole('button', { name: 'Reintentar' }))
    expect(within(screen.getByRole('alert')).getByRole('button')).toHaveTextContent('Reintentando…')
    // Solo se repiten los detalles (como mucho 5), no las llamadas principales.
    expect(getAssessment).toHaveBeenCalledTimes(4)
    expect(getCredits).toHaveBeenCalledTimes(1)
    expect(listAssessments).toHaveBeenCalledTimes(1)

    await act(async () => puerta.resolver())
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(candidatosEnOrden()).toEqual(['Valentina Ríos', 'Andrés Molina', 'Camila Ferrer'])
    // El botón desapareció: el foco pasa a la tabla.
    expect(document.activeElement).toHaveClass('st-table')
  })

  it('si falla una parte: muestra lo que llegó y un aviso con «Reintentar»', async () => {
    const usuario = userEvent.setup()
    let primeraVez = true
    vi.mocked(getAssessment).mockImplementation(async (id) => {
      if (id === 1 && primeraVez) {
        primeraVez = false
        throw errorHttp(500)
      }
      return detallesDe(DETALLES)(id)
    })
    montar()

    expect(await screen.findByText('Valentina Ríos')).toBeInTheDocument()
    expect(candidatosEnOrden()).toEqual(['Valentina Ríos', 'Andrés Molina'])
    const aviso = screen.getByRole('status')
    expect(aviso).toHaveTextContent('Faltan candidatos en «Últimas completadas»')
    expect(aviso).toHaveTextContent('No pudimos cargar los candidatos de 1 evaluación. Inténtalo de nuevo en unos momentos.')
    expect(screen.getByText(/Mostrando 2 de 3 candidatos completados\./)).toBeInTheDocument()

    await usuario.click(within(aviso).getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('Camila Ferrer')).toBeInTheDocument()
    expect(candidatosEnOrden()).toEqual(['Valentina Ríos', 'Andrés Molina', 'Camila Ferrer'])
    expect(screen.queryByText('Faltan candidatos en «Últimas completadas»')).not.toBeInTheDocument()
    expect(getAssessment).toHaveBeenCalledTimes(4)
  })

  it('al desmontar descarta las respuestas pendientes', async () => {
    const credito = diferido<CreditsData>()
    vi.mocked(getCredits).mockReturnValue(credito.promesa)
    const { unmount } = montar()
    unmount()
    await act(async () => credito.resolver(CREDITOS))
    expect(getAssessment).not.toHaveBeenCalled()
  })
})
