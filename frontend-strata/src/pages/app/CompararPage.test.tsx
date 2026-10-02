import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { compareAssessment, type CompareData, type CompareRow } from '@/api/rh'
import CompararPage from './CompararPage'
import { csvAnterior, filasAnteriores, nombreCsvAnterior, TIPO_CSV_ANTERIOR } from '@/test/comparativaAnterior'

// Comparativa (/app/evaluaciones/:id/comparar) con src/api/rh simulado. Forma
// de la respuesta: AssessmentController::compare (2026-09-12-fase2-panel-rh.md:751-790).

vi.mock('@/api/rh', () => ({ compareAssessment: vi.fn() }))

const DATOS: CompareData = {
  assessment: { id: 13, name: 'Coordinación de almacén · septiembre' },
  scales: [
    { code: 'RES', name: 'Orientación a resultados' },
    { code: 'COL', name: 'Colaboración' },
    { code: 'ADA', name: 'Adaptabilidad' },
  ],
  rows: [
    {
      invitation_id: 41,
      candidate: 'Valentina Ríos',
      status: 'completada',
      scores: {
        RES: { category: 'alto', percentile: 81, normalized: 81.25 },
        COL: { category: 'alto', percentile: 69, normalized: 68.75 },
        ADA: { category: 'medio', percentile: 44, normalized: 43.75 },
      },
    },
    {
      invitation_id: 42,
      candidate: 'Joaquín "Quino" Herrera',
      status: 'completada',
      scores: {
        RES: { category: 'medio', percentile: 50, normalized: 50 },
        COL: { category: 'bajo', percentile: null, normalized: 12.5 },
      },
    },
    {
      invitation_id: 43,
      candidate: 'Paredes, Lucía',
      status: 'completada',
      scores: {
        RES: { category: 'bajo', percentile: 25, normalized: 25 },
        COL: { category: 'medio', percentile: 56, normalized: 56.25 },
        ADA: { category: 'alto', percentile: 88, normalized: 87.5 },
      },
    },
  ],
}

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

function montar(ruta = '/app/evaluaciones/13/comparar') {
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/app/evaluaciones/:id/comparar" element={<CompararPage />} />
        <Route path="/app/evaluaciones/:id" element={<h1>Detalle de la evaluación</h1>} />
        <Route path="/app/evaluaciones" element={<h1>Mis evaluaciones</h1>} />
      </Routes>
    </MemoryRouter>,
  )
  return userEvent.setup()
}

const encabezado = (nombre: string) => screen.getByRole('columnheader', { name: nombre })
const botonDeOrden = (nombre: string) => screen.getByRole('button', { name: nombre })

/** Candidatos en el orden en que se ven las filas. */
function candidatosEnOrden() {
  return screen.getAllByRole('rowheader').map((celda) => celda.querySelector('.st-table__cell-value')?.textContent)
}

const nombres = (filas: readonly CompareRow[]) => filas.map((fila) => fila.candidate)

/** Celda de una escala (en el orden de scales) en la fila de un candidato. */
function celda(candidato: string, indiceEscala: number) {
  const fila = screen.getByRole('rowheader', { name: candidato }).closest('tr')
  if (!fila) throw new Error(`No hay fila para ${candidato}`)
  return within(fila).getAllByRole('cell')[indiceEscala]
}

describe('CompararPage', () => {
  beforeEach(() => {
    vi.mocked(compareAssessment).mockReset()
  })

  it('muestra la carga y después la tabla con el nombre de la evaluación y «Volver al detalle»', async () => {
    const respuesta = diferida<CompareData>()
    vi.mocked(compareAssessment).mockReturnValue(respuesta.promesa)
    montar()

    expect(screen.getByRole('status')).toHaveTextContent('Cargando la comparativa…')
    expect(compareAssessment).toHaveBeenCalledWith(13)
    // Mientras carga, el regreso ya está y el CSV todavía no.
    expect(screen.getByRole('link', { name: 'Volver al detalle' })).toHaveAttribute('href', '/app/evaluaciones/13')
    expect(screen.queryByRole('button', { name: 'Exportar CSV' })).not.toBeInTheDocument()

    await act(async () => respuesta.resolver(DATOS))

    expect(screen.getByRole('heading', { level: 1, name: 'Coordinación de almacén · septiembre' })).toBeInTheDocument()
    expect(screen.getByText('Comparar candidatos')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver al detalle' })).toHaveAttribute('href', '/app/evaluaciones/13')
    expect(screen.getByRole('button', { name: 'Exportar CSV' })).toBeInTheDocument()
    const tabla = screen.getByRole('table', { name: 'Comparativa de candidatos: Coordinación de almacén · septiembre' })
    // Scroll horizontal (D-23): la comparativa nunca pasa a tarjetas.
    expect(tabla.closest('.st-table')).toHaveClass('st-table--scroll')
    expect(tabla.closest('.st-table')).not.toHaveClass('st-table--cards')
    expect(candidatosEnOrden()).toEqual(nombres(DATOS.rows))
  })

  it('«Volver al detalle» lleva al detalle de la evaluación', async () => {
    vi.mocked(compareAssessment).mockResolvedValue(DATOS)
    const user = montar()
    await user.click(await screen.findByRole('link', { name: 'Volver al detalle' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Detalle de la evaluación' })).toBeInTheDocument()
  })

  it('cada celda muestra «{normalized} · {categoría}» con la categoría en texto y sin «pc»', async () => {
    vi.mocked(compareAssessment).mockResolvedValue(DATOS)
    montar()
    await screen.findByRole('table')

    expect(celda('Valentina Ríos', 0)).toHaveTextContent('81 · Alto')
    expect(celda('Valentina Ríos', 1)).toHaveTextContent('69 · Alto')
    expect(celda('Valentina Ríos', 2)).toHaveTextContent('44 · Medio')
    // Los lectores de pantalla oyen el puntaje sobre 100 y la categoría, sin el «·».
    expect(celda('Valentina Ríos', 0)).toHaveAccessibleName('81 de 100, categoría Alto')
    // Sin percentile, el puntaje sale de normalized (12.5 → 13): no se pierde el dato.
    expect(celda('Joaquín "Quino" Herrera', 1)).toHaveTextContent('13 · Bajo')
    // Sin puntaje en la escala: «—» visible y «Sin resultado» para lectores de pantalla.
    expect(celda('Joaquín "Quino" Herrera', 2)).toHaveTextContent('—')
    expect(celda('Joaquín "Quino" Herrera', 2)).toHaveAccessibleName('Sin resultado')
    // El color acompaña a la categoría, nunca la reemplaza.
    expect(celda('Paredes, Lucía', 2).querySelector('.st-celda-puntaje')).toHaveClass('st-celda-puntaje--alto')
    expect(screen.queryByText(/pc \d/)).not.toBeInTheDocument()
    expect(screen.queryByText(/percentil|norma/i)).not.toBeInTheDocument()
  })

  it('ordena por escala con el criterio de antes: de mayor a menor, luego alterna, con aria-sort', async () => {
    vi.mocked(compareAssessment).mockResolvedValue(DATOS)
    const user = montar()
    await screen.findByRole('table')

    expect(encabezado('Orientación a resultados')).not.toHaveAttribute('aria-sort')

    await user.click(botonDeOrden('Orientación a resultados'))
    expect(encabezado('Orientación a resultados')).toHaveAttribute('aria-sort', 'descending')
    expect(candidatosEnOrden()).toEqual(nombres(filasAnteriores(DATOS, 'RES', false)))
    expect(screen.getByRole('status')).toHaveTextContent('Ordenado por Orientación a resultados, en orden descendente.')

    await user.click(botonDeOrden('Orientación a resultados'))
    expect(encabezado('Orientación a resultados')).toHaveAttribute('aria-sort', 'ascending')
    expect(candidatosEnOrden()).toEqual(nombres(filasAnteriores(DATOS, 'RES', true)))

    // Otra escala vuelve a empezar de mayor a menor; quien no tiene puntaje queda al final.
    await user.click(botonDeOrden('Adaptabilidad'))
    expect(encabezado('Adaptabilidad')).toHaveAttribute('aria-sort', 'descending')
    expect(encabezado('Orientación a resultados')).not.toHaveAttribute('aria-sort')
    expect(candidatosEnOrden()).toEqual(['Paredes, Lucía', 'Valentina Ríos', 'Joaquín "Quino" Herrera'])

    // De menor a mayor, sin puntaje cuenta como -1 y va primero, como antes.
    await user.click(botonDeOrden('Adaptabilidad'))
    expect(candidatosEnOrden()).toEqual(nombres(filasAnteriores(DATOS, 'ADA', true)))
    expect(candidatosEnOrden()[0]).toBe('Joaquín "Quino" Herrera')

    // La columna del candidato no se ordena, como antes.
    expect(within(encabezado('Candidato')).queryByRole('button')).not.toBeInTheDocument()
  })

  it('los encabezados de escala se alcanzan con Tab y ordenan con Enter y Espacio', async () => {
    vi.mocked(compareAssessment).mockResolvedValue(DATOS)
    const user = montar()
    await screen.findByRole('table')

    // Orden de tabulación: Volver al detalle, Exportar CSV y los encabezados de escala.
    await user.tab()
    expect(screen.getByRole('link', { name: 'Volver al detalle' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Exportar CSV' })).toHaveFocus()
    await user.tab()
    await user.tab()
    expect(botonDeOrden('Colaboración')).toHaveFocus()

    await user.keyboard('{Enter}')
    expect(encabezado('Colaboración')).toHaveAttribute('aria-sort', 'descending')
    expect(candidatosEnOrden()).toEqual(nombres(filasAnteriores(DATOS, 'COL', false)))

    await user.keyboard(' ')
    expect(encabezado('Colaboración')).toHaveAttribute('aria-sort', 'ascending')
    expect(candidatosEnOrden()).toEqual(nombres(filasAnteriores(DATOS, 'COL', true)))
    expect(botonDeOrden('Colaboración')).toHaveFocus()
  })

  describe('«Exportar CSV»', () => {
    const originales = { crear: URL.createObjectURL, liberar: URL.revokeObjectURL }
    let blobs: Blob[]
    let descargas: { href: string; download: string }[]

    beforeEach(() => {
      blobs = []
      descargas = []
      URL.createObjectURL = vi.fn((objeto: Blob | MediaSource) => {
        blobs.push(objeto as Blob)
        return 'blob:comparativa'
      })
      URL.revokeObjectURL = vi.fn()
      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
        descargas.push({ href: this.href, download: this.download })
      })
    })

    afterEach(() => {
      URL.createObjectURL = originales.crear
      URL.revokeObjectURL = originales.liberar
    })

    it('sin ordenar, descarga exactamente el CSV de antes', async () => {
      vi.mocked(compareAssessment).mockResolvedValue(DATOS)
      const user = montar()
      await user.click(await screen.findByRole('button', { name: 'Exportar CSV' }))

      expect(blobs).toHaveLength(1)
      expect(blobs[0].type).toBe(TIPO_CSV_ANTERIOR)
      expect(await blobs[0].text()).toBe(csvAnterior(DATOS, filasAnteriores(DATOS, null, false)))
      expect(descargas).toEqual([{ href: 'blob:comparativa', download: nombreCsvAnterior(DATOS) }])
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:comparativa')
    })

    it('ordenado, descarga el CSV de antes en el orden visible', async () => {
      vi.mocked(compareAssessment).mockResolvedValue(DATOS)
      const user = montar()
      await screen.findByRole('table')

      await user.click(botonDeOrden('Colaboración'))
      await user.click(botonDeOrden('Colaboración'))
      await user.click(screen.getByRole('button', { name: 'Exportar CSV' }))

      const esperado = csvAnterior(DATOS, filasAnteriores(DATOS, 'COL', true))
      expect(await blobs[0].text()).toBe(esperado)
      // Las mismas columnas y el mismo formato de siempre.
      expect(esperado.split('\n')).toEqual([
        'Candidato,Orientación a resultados,Colaboración,Adaptabilidad',
        '"Joaquín ""Quino"" Herrera","medio (50)","bajo ()",""',
        '"Paredes, Lucía","bajo (25)","medio (56)","alto (88)"',
        '"Valentina Ríos","alto (81)","alto (69)","medio (44)"',
      ])
    })
  })

  it('sin candidatos que completaran muestra el vacío con nota y no ofrece el CSV', async () => {
    vi.mocked(compareAssessment).mockResolvedValue({ ...DATOS, rows: [] })
    montar()

    expect(
      await screen.findByRole('heading', { level: 2, name: 'Aún no hay candidatos que hayan completado esta evaluación' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/reúne solo a quienes ya terminaron/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Coordinación de almacén · septiembre' })).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Exportar CSV' })).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('un 403 muestra «No tienes acceso a esta evaluación», distinto del vacío y sin «Reintentar»', async () => {
    vi.mocked(compareAssessment).mockRejectedValue(errorHttp(403))
    montar('/app/evaluaciones/15/comparar')

    const alerta = await screen.findByRole('alert')
    expect(within(alerta).getByRole('heading', { level: 2, name: 'No tienes acceso a esta evaluación' })).toBeInTheDocument()
    expect(within(alerta).queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument()
    expect(within(alerta).getByRole('link', { name: 'Ver mis evaluaciones' })).toHaveAttribute('href', '/app/evaluaciones')
    expect(screen.queryByText('Cargando la comparativa…')).not.toBeInTheDocument()
    expect(screen.queryByText(/Aún no hay candidatos/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Exportar CSV' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver al detalle' })).toHaveAttribute('href', '/app/evaluaciones/15')
  })

  it('un 404 muestra «No encontramos esta evaluación»', async () => {
    vi.mocked(compareAssessment).mockRejectedValue(errorHttp(404))
    montar('/app/evaluaciones/999/comparar')

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent('No encontramos esta evaluación')
    expect(alerta).not.toHaveTextContent('No tienes acceso')
    expect(within(alerta).queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument()
  })

  it('un 500 muestra su propio error con «Reintentar»', async () => {
    vi.mocked(compareAssessment).mockRejectedValue(errorHttp(500))
    montar()

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent('No pudimos cargar la comparativa')
    expect(within(alerta).getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })

  it('un error de red ofrece «Reintentar», que vuelve a pedir la comparativa sin perder el foco', async () => {
    const segunda = diferida<CompareData>()
    vi.mocked(compareAssessment).mockRejectedValueOnce(errorHttp()).mockReturnValueOnce(segunda.promesa)
    const user = montar()

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent('No pudimos conectarnos')
    const reintentar = within(alerta).getByRole('button', { name: 'Reintentar' })
    await user.click(reintentar)

    // Mientras reintenta, el mismo botón muestra la carga y conserva el foco.
    expect(compareAssessment).toHaveBeenCalledTimes(2)
    expect(reintentar).toHaveAttribute('aria-busy', 'true')
    expect(reintentar).toHaveTextContent('Reintentando…')
    expect(reintentar).toHaveFocus()

    await act(async () => segunda.resolver(DATOS))
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
