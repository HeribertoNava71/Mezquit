import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios'
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getTest, type TestDetail } from '@/api/catalog'
import PruebaDetallePage from './PruebaDetallePage'

vi.mock('@/api/catalog', () => ({ getTest: vi.fn() }))
// El reporte de ejemplo es de la Fase 4 (su tarjeta de vidrio y su badge «Ejemplo»
// se prueban en SampleReport.test.tsx); aquí importa dónde va y cómo se incrusta.
const ejemplo = vi.hoisted(() => ({ props: null as Record<string, unknown> | null }))
vi.mock('@/sections/SampleReport', () => ({
  default: (props: Record<string, unknown>) => {
    ejemplo.props = props
    return <div data-testid="sample-report">Reporte de ejemplo</div>
  },
}))

/** Forma de GET /api/catalog/{slug} (CatalogController@show; e2e/mocks/visitante.json). */
const ADAPTABILIDAD: TestDetail = {
  id: 6,
  slug: 'adaptabilidad',
  name: 'Adaptabilidad',
  category: 'personalidad',
  category_label: 'Personalidad',
  description: 'Evalúa flexibilidad ante cambios organizacionales.',
  duration_min: 10,
  item_count: 18,
}

const CONFIABILIDAD: TestDetail = {
  id: 13,
  slug: 'confiabilidad',
  name: 'Confiabilidad',
  category: 'integridad',
  category_label: 'Integridad',
  description: 'Mide consistencia y cumplimiento de compromisos.',
  duration_min: 12,
  item_count: 1,
}

/** Error de axios con el código HTTP dado; sin código, un error de red. */
function errorHttp(status?: number): AxiosError {
  if (status === undefined) return new AxiosError('Network Error', AxiosError.ERR_NETWORK)
  const respuesta = { status, statusText: '', data: { message: '' }, headers: {}, config: { headers: new AxiosHeaders() } }
  return new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, undefined, undefined, respuesta as AxiosResponse)
}

/** Promesa que el test resuelve o rechaza a mano. */
function pendiente<T>() {
  let resolver!: (valor: T) => void
  let rechazar!: (error: unknown) => void
  const promesa = new Promise<T>((res, rej) => {
    resolver = res
    rechazar = rej
  })
  return { promesa, resolver, rechazar }
}

function montar(slug = 'adaptabilidad') {
  render(
    <MemoryRouter initialEntries={[`/pruebas/${slug}`]}>
      <Routes>
        <Route
          path="/pruebas/:slug"
          element={
            <>
              <PruebaDetallePage />
              <Link to="/pruebas/confiabilidad">Otra prueba</Link>
            </>
          }
        />
        <Route path="/pruebas" element={<h1>Catálogo de pruebas</h1>} />
      </Routes>
    </MemoryRouter>,
  )
  return userEvent.setup()
}

const volver = () => screen.getByRole('link', { name: 'Volver al catálogo' })

beforeEach(() => {
  vi.mocked(getTest).mockReset()
  ejemplo.props = null
})

describe('PruebaDetallePage', () => {
  it('con datos: categoría, nombre, descripción, duración y reactivos en mono, y el reporte de ejemplo', async () => {
    vi.mocked(getTest).mockResolvedValue(ADAPTABILIDAD)
    montar()

    const h1 = await screen.findByRole('heading', { level: 1, name: 'Adaptabilidad' })
    expect(getTest).toHaveBeenCalledWith('adaptabilidad')
    const encabezado = h1.closest('header') as HTMLElement
    expect(within(encabezado).getByText('Personalidad')).toHaveClass('st-page-header__eyebrow')
    expect(within(encabezado).getByText('Evalúa flexibilidad ante cambios organizacionales.')).toHaveClass(
      'st-page-header__lede',
    )

    const datos = screen.getByRole('list', { name: 'Datos de la prueba' })
    expect(datos).toHaveClass('st-detalle__meta')
    const [duracion, reactivos] = within(datos).getAllByRole('listitem')
    expect(duracion).toHaveTextContent('Duración estimada: 10 min')
    expect(reactivos).toHaveTextContent('[ 18 ] reactivos')

    // Reporte de ejemplo bajo su H2, sin título propio y con sus encabezados en H3.
    const seccion = screen.getByRole('region', { name: 'Así se ve un reporte' })
    expect(within(seccion).getByRole('heading', { level: 2, name: 'Así se ve un reporte' })).toBeInTheDocument()
    expect(seccion).toHaveTextContent('Datos ficticios para mostrar el formato')
    expect(within(seccion).getByTestId('sample-report')).toBeInTheDocument()
    expect(ejemplo.props).toMatchObject({ title: null, headingLevel: 3 })

    expect(volver()).toHaveAttribute('href', '/pruebas')
  })

  it('un solo reactivo se escribe en singular', async () => {
    vi.mocked(getTest).mockResolvedValue(CONFIABILIDAD)
    montar('confiabilidad')
    expect(await screen.findByText('[ 1 ] reactivo')).toBeInTheDocument()
  })

  it('mientras carga: estado de carga, «Volver al catálogo» y un H1 para lectores de pantalla', () => {
    vi.mocked(getTest).mockReturnValue(new Promise(() => {}))
    montar()
    expect(screen.getByRole('status')).toHaveTextContent('Cargando la prueba…')
    expect(screen.getByRole('heading', { level: 1, name: 'Detalle de la prueba' })).toBeInTheDocument()
    expect(volver()).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('404: «Prueba no encontrada», sin «Reintentar»', async () => {
    vi.mocked(getTest).mockRejectedValue(errorHttp(404))
    montar('no-existe')

    const alerta = await screen.findByRole('alert')
    expect(within(alerta).getByRole('heading', { level: 2, name: 'Prueba no encontrada' })).toBeInTheDocument()
    expect(alerta).toHaveTextContent('Esta prueba no existe o no está disponible.')
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument()
    expect(volver()).toHaveAttribute('href', '/pruebas')
  })

  it('error de red: distinto del 404, con «Reintentar» que vuelve a pedir la prueba', async () => {
    const reintento = pendiente<TestDetail>()
    vi.mocked(getTest).mockRejectedValueOnce(errorHttp()).mockReturnValueOnce(reintento.promesa)
    const user = montar()

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent('No pudimos conectarnos')
    expect(alerta).toHaveTextContent('Revisa tu conexión a internet e inténtalo de nuevo.')
    expect(alerta).not.toHaveTextContent('Prueba no encontrada')

    const boton = within(alerta).getByRole('button', { name: 'Reintentar' })
    await user.click(boton)
    expect(getTest).toHaveBeenCalledTimes(2)
    // Mientras reintenta, el error sigue a la vista y el botón conserva el foco.
    const enCurso = screen.getByRole('button', { name: 'Reintentando…' })
    expect(enCurso).toHaveAttribute('aria-busy', 'true')
    expect(enCurso).toHaveFocus()

    await act(async () => reintento.resolver(ADAPTABILIDAD))
    expect(await screen.findByRole('heading', { level: 1, name: 'Adaptabilidad' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('500: «No pudimos cargar la prueba» con «Reintentar»', async () => {
    vi.mocked(getTest).mockRejectedValue(errorHttp(500))
    montar()

    const alerta = await screen.findByRole('alert')
    expect(within(alerta).getByRole('heading', { level: 2, name: 'No pudimos cargar la prueba' })).toBeInTheDocument()
    expect(within(alerta).getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })

  it('al cambiar de prueba vuelve a cargar y descarta la respuesta tardía de la anterior', async () => {
    const primera = pendiente<TestDetail>()
    vi.mocked(getTest).mockReturnValueOnce(primera.promesa).mockResolvedValueOnce(CONFIABILIDAD)
    const user = montar()

    await user.click(screen.getByRole('link', { name: 'Otra prueba' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Confiabilidad' })).toBeInTheDocument()
    expect(getTest).toHaveBeenLastCalledWith('confiabilidad')

    await act(async () => primera.resolver(ADAPTABILIDAD))
    expect(screen.getByRole('heading', { level: 1, name: 'Confiabilidad' })).toBeInTheDocument()
    expect(screen.queryByText('Adaptabilidad')).not.toBeInTheDocument()
  })
})
