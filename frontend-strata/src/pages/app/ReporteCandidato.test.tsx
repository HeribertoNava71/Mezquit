import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getReport, type ReportData } from '@/api/report'
import ReporteCandidato from './ReporteCandidato'

// Página del reporte con src/api/report simulado. Errores del ReportController
// (2026-09-11-fase1-nucleo.md:1931-1932): 403 otra organización, 409 sin
// completar y 404 sin invitación.

vi.mock('@/api/report', () => ({ getReport: vi.fn() }))

const REPORTE: ReportData = {
  candidate: 'Valentina Ríos',
  position: 'Gerente de tienda',
  assessment: 'Selección de gerentes 2026',
  organization: 'Comercializadora Río Claro',
  completed_at: '15/09/2026',
  tests: [
    {
      name: 'Prueba de demostración',
      integrity: { blur_count: 1 },
      scales: [
        { code: 'RES', name: 'Orientación a resultados', normalized: 75, percentile: 75, category: 'alto', interpretation: 'Puntaje alto en Orientación a resultados: es una fortaleza marcada del candidato.' },
        { code: 'COL', name: 'Colaboración', normalized: 50, percentile: 50, category: 'medio', interpretation: 'Puntaje medio en Colaboración: dentro del promedio esperado.' },
        { code: 'ADA', name: 'Adaptabilidad', normalized: 25, percentile: 25, category: 'bajo', interpretation: 'Puntaje bajo en Adaptabilidad: podría ser un área a explorar en entrevista.' },
      ],
    },
  ],
  interview_questions: ['Cuéntame de una situación reciente relacionada con «Orientación a resultados».'],
}

/** Error de axios con el código HTTP dado; sin código, un error de red. */
function errorHttp(status?: number): AxiosError {
  if (status === undefined) return new AxiosError('Network Error', AxiosError.ERR_NETWORK)
  const respuesta = { status, statusText: '', data: {}, headers: {}, config: { headers: new AxiosHeaders() } }
  return new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, undefined, undefined, respuesta as AxiosResponse)
}

/** Promesa que se resuelve a mano. */
function diferida<T>() {
  let resolver!: (valor: T) => void
  let rechazar!: (error: unknown) => void
  const promesa = new Promise<T>((res, rej) => {
    resolver = res
    rechazar = rej
  })
  return { promesa, resolver, rechazar }
}

function montar(entradas: string[] = ['/app/candidatos/12/reporte']) {
  return render(
    <MemoryRouter initialEntries={entradas} initialIndex={entradas.length - 1}>
      <Routes>
        <Route path="/app/candidatos/:invitationId/reporte" element={<ReporteCandidato />} />
        <Route path="/app/evaluaciones" element={<p>Lista de evaluaciones</p>} />
        <Route path="/app/evaluaciones/:id" element={<p>Detalle de la evaluación</p>} />
        <Route path="/login" element={<p>Pantalla de entrada</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

const tituloDelReporte = () => screen.findByRole('heading', { level: 1, name: 'Valentina Ríos' })

beforeEach(() => {
  vi.mocked(getReport).mockReset()
})

describe('ReporteCandidato', () => {
  it('muestra la carga mientras llega el reporte y después el Report con el id de la URL', async () => {
    const pendiente = diferida<ReportData>()
    vi.mocked(getReport).mockReturnValue(pendiente.promesa)
    montar()

    expect(screen.getByRole('status')).toHaveTextContent('Cargando reporte…')
    expect(getReport).toHaveBeenCalledWith(12)

    await act(async () => pendiente.resolver(REPORTE))
    expect(await tituloDelReporte()).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Prueba de demostración' })).toBeInTheDocument()
  })

  it('«Descargar PDF» abre la impresión con el nombre del candidato en el título y lo restaura', async () => {
    const user = userEvent.setup()
    vi.mocked(getReport).mockResolvedValue(REPORTE)
    document.title = 'Strata'
    const tituloAlImprimir: string[] = []
    const imprimir = vi.spyOn(window, 'print').mockImplementation(() => {
      tituloAlImprimir.push(document.title)
    })
    montar()
    await tituloDelReporte()

    await user.click(screen.getByRole('button', { name: 'Descargar PDF' }))
    expect(imprimir).toHaveBeenCalledTimes(1)
    expect(tituloAlImprimir).toEqual(['Reporte de Valentina Ríos · Strata'])

    act(() => {
      window.dispatchEvent(new Event('afterprint'))
    })
    expect(document.title).toBe('Strata')
  })

  it('las acciones no se imprimen', async () => {
    vi.mocked(getReport).mockResolvedValue(REPORTE)
    montar()
    await tituloDelReporte()
    expect(screen.getByRole('button', { name: 'Descargar PDF' }).closest('.no-print')).not.toBeNull()
  })

  it('«Volver» regresa a la pantalla anterior de la app', async () => {
    const user = userEvent.setup()
    vi.mocked(getReport).mockResolvedValue(REPORTE)
    montar(['/app/evaluaciones/5', '/app/candidatos/12/reporte'])
    await tituloDelReporte()

    await user.click(screen.getByRole('link', { name: 'Volver' }))
    expect(screen.getByText('Detalle de la evaluación')).toBeInTheDocument()
  })

  it('«Volver» sin historial va a /app/evaluaciones (PB-17)', async () => {
    const user = userEvent.setup()
    vi.mocked(getReport).mockResolvedValue(REPORTE)
    montar()
    await tituloDelReporte()

    const volver = screen.getByRole('link', { name: 'Volver' })
    expect(volver).toHaveAttribute('href', '/app/evaluaciones')
    await user.click(volver)
    expect(screen.getByText('Lista de evaluaciones')).toBeInTheDocument()
  })

  it('403: otra organización, sin «Reintentar»', async () => {
    vi.mocked(getReport).mockRejectedValue(errorHttp(403))
    montar()

    const alerta = await screen.findByRole('alert')
    expect(screen.getByRole('heading', { level: 2, name: 'No tienes acceso a este reporte' })).toBeInTheDocument()
    expect(alerta).toHaveTextContent('Este reporte pertenece a una evaluación de otra organización.')
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver' })).toBeInTheDocument()
    // La página conserva un h1 para lectores de pantalla.
    expect(screen.getByRole('heading', { level: 1, name: 'Reporte del candidato' })).toBeInTheDocument()
  })

  it('409: la evaluación aún no está completada, con «Reintentar»', async () => {
    vi.mocked(getReport).mockRejectedValue(errorHttp(409))
    montar()

    const alerta = await screen.findByRole('alert')
    expect(screen.getByRole('heading', { name: 'La evaluación aún no está completada' })).toBeInTheDocument()
    expect(alerta).toHaveTextContent('El reporte se genera cuando el candidato termina todas sus pruebas.')
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })

  it('404: no existe, sin «Reintentar»', async () => {
    vi.mocked(getReport).mockRejectedValue(errorHttp(404))
    montar()

    const alerta = await screen.findByRole('alert')
    expect(screen.getByRole('heading', { name: 'No encontramos este reporte' })).toBeInTheDocument()
    expect(alerta).toHaveTextContent('Puede que el enlace esté incompleto o que la invitación ya no exista.')
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument()
  })

  it('cada código tiene su propio mensaje', async () => {
    const titulos: string[] = []
    for (const status of [403, 409, 404, 500, undefined]) {
      vi.mocked(getReport).mockRejectedValueOnce(errorHttp(status))
      const { unmount } = montar()
      const alerta = await screen.findByRole('alert')
      titulos.push(alerta.querySelector('.st-estado__title')?.textContent ?? '')
      unmount()
    }
    expect(new Set(titulos).size).toBe(titulos.length)
  })

  it('error de red: «Reintentar» vuelve a pedir el reporte y, al llegar, el foco pasa al título', async () => {
    const user = userEvent.setup()
    const segundo = diferida<ReportData>()
    vi.mocked(getReport).mockRejectedValueOnce(errorHttp()).mockReturnValueOnce(segundo.promesa)
    montar()

    expect(await screen.findByRole('heading', { name: 'No pudimos conectarnos' })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Revisa tu conexión a internet e inténtalo de nuevo.')

    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(getReport).toHaveBeenCalledTimes(2)
    // Mientras reintenta, el botón lo dice y no se puede volver a pulsar.
    const boton = screen.getByRole('button', { name: /Reintentando/ })
    expect(boton).toHaveAttribute('aria-busy', 'true')

    await act(async () => segundo.resolver(REPORTE))
    const titulo = await tituloDelReporte()
    expect(titulo).toHaveFocus()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('500: error del servidor con «Reintentar»; si vuelve a fallar, sigue el error', async () => {
    const user = userEvent.setup()
    vi.mocked(getReport).mockRejectedValue(errorHttp(500))
    montar()

    expect(await screen.findByRole('heading', { name: 'No pudimos cargar el reporte' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
    expect(getReport).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('heading', { name: 'No pudimos cargar el reporte' })).toBeInTheDocument()
  })

  it('un id que no es número no llama a la API y muestra «no encontrado»', () => {
    montar(['/app/candidatos/abc/reporte'])
    expect(getReport).not.toHaveBeenCalled()
    expect(screen.getByRole('heading', { name: 'No encontramos este reporte' })).toBeInTheDocument()
  })

  it('vacío: un reporte sin pruebas se muestra como vacío, no como error', async () => {
    vi.mocked(getReport).mockResolvedValue({ ...REPORTE, tests: [], interview_questions: [] })
    montar()
    await tituloDelReporte()
    expect(screen.getByRole('heading', { name: 'Este reporte no tiene pruebas calificadas' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('sesión vencida (401): pide volver a entrar', async () => {
    const user = userEvent.setup()
    vi.mocked(getReport).mockRejectedValue(errorHttp(401))
    montar()

    expect(await screen.findByRole('heading', { name: 'Tu sesión expiró' })).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Entrar' }))
    expect(screen.getByText('Pantalla de entrada')).toBeInTheDocument()
  })
})
