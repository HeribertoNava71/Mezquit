import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getCatalog, type CatalogCategory, type CatalogTest } from '@/api/catalog'
import PruebasPage from './PruebasPage'

vi.mock('@/api/catalog', () => ({ getCatalog: vi.fn() }))

// Las consultas por rol y la escritura con userEvent son lentas en jsdom cuando
// la máquina está cargada (varias suites en paralelo): margen para no fallar por tiempo.
vi.setConfig({ testTimeout: 20_000 })

function prueba(id: number, slug: string, name: string, description: string): CatalogTest {
  return { id, slug, name, description, duration_min: 10 + id, item_count: 20 + id }
}

/**
 * Forma de GET /api/catalog (CatalogController): categorías en orden fijo y
 * pruebas por nombre. «Intereses» llega vacía a propósito: no debe ser filtro.
 */
const CATEGORIAS: CatalogCategory[] = [
  {
    id: 'personalidad',
    label: 'Personalidad',
    count: 2,
    tests: [
      prueba(6, 'adaptabilidad', 'Adaptabilidad', 'Evalúa flexibilidad ante cambios organizacionales.'),
      prueba(7, 'trabajo-en-equipo', 'Trabajo en equipo', 'Mide preferencias de colaboración y roles grupales.'),
    ],
  },
  {
    id: 'razonamiento',
    label: 'Razonamiento',
    count: 2,
    tests: [
      prueba(9, 'razonamiento-numerico', 'Razonamiento numérico', 'Mide habilidad para interpretar datos cuantitativos.'),
      prueba(10, 'razonamiento-verbal', 'Razonamiento verbal', 'Evalúa comprensión de texto y argumentación lógica.'),
    ],
  },
  {
    id: 'integridad',
    label: 'Integridad',
    count: 1,
    tests: [prueba(14, 'etica-en-el-trabajo', 'Ética en el trabajo', 'Evalúa toma de decisiones en situaciones de dilema.')],
  },
  { id: 'intereses', label: 'Intereses', count: 0, tests: [] },
]

/** Error de axios con el código HTTP dado; sin código, un error de red. */
function errorHttp(status?: number): AxiosError {
  if (status === undefined) return new AxiosError('Network Error', AxiosError.ERR_NETWORK)
  const respuesta = { status, statusText: '', data: {}, headers: {}, config: { headers: new AxiosHeaders() } }
  return new AxiosError('Request failed', AxiosError.ERR_BAD_RESPONSE, undefined, undefined, respuesta as AxiosResponse)
}

function Ubicacion() {
  const { pathname, search } = useLocation()
  return <p data-testid="ubicacion">{pathname + search}</p>
}

function montar(ruta = '/pruebas') {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/pruebas" element={<PruebasPage />} />
        <Route path="/app/pruebas" element={<PruebasPage />} />
        <Route path="*" element={<Ubicacion />} />
      </Routes>
    </MemoryRouter>,
  )
}

const grilla = () => screen.getByRole('list')
const titulos = () => within(grilla()).getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
const buscador = () => screen.getByRole('searchbox', { name: 'Buscar prueba' })
const chip = (nombre: string) => screen.getByRole('button', { name: nombre })

beforeEach(() => {
  vi.mocked(getCatalog).mockReset()
})

describe('PruebasPage · estados', () => {
  it('mientras carga: barra y seis tarjetas esqueleto, sin filtros ni tarjetas', () => {
    vi.mocked(getCatalog).mockReturnValue(new Promise<CatalogCategory[]>(() => {}))
    const { container } = montar()
    expect(screen.getByRole('heading', { level: 1, name: 'Catálogo de tests psicométricos' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Cargando catálogo…')
    expect(container.querySelectorAll('.st-carga__tarjeta')).toHaveLength(6)
    expect(container.querySelector('.st-pruebas__barra-esqueleto')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.queryByRole('group', { name: 'Filtrar por categoría' })).not.toBeInTheDocument()
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('error de red: EstadoError distinto del vacío; «Reintentar» vuelve a pedir y enfoca el filtro', async () => {
    const user = userEvent.setup()
    vi.mocked(getCatalog).mockRejectedValueOnce(errorHttp()).mockResolvedValueOnce(CATEGORIAS)
    montar()

    const alerta = await screen.findByRole('alert')
    expect(within(alerta).getByRole('heading', { level: 2, name: 'No pudimos cargar el catálogo.' })).toBeInTheDocument()
    expect(alerta).toHaveTextContent('Revisa tu conexión a internet e inténtalo de nuevo.')
    expect(alerta).not.toHaveTextContent('No hay pruebas')
    expect(screen.queryByRole('group', { name: 'Filtrar por categoría' })).not.toBeInTheDocument()

    await user.click(within(alerta).getByRole('button', { name: 'Reintentar' }))
    expect(getCatalog).toHaveBeenCalledTimes(2)
    const todas = await screen.findByRole('button', { name: 'Todas 5' })
    await waitFor(() => expect(todas).toHaveFocus())
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(titulos()).toHaveLength(5)
  })

  it('error 500: mensaje del servidor, «Reintentando…» mientras pide y el error sigue si vuelve a fallar', async () => {
    const user = userEvent.setup()
    let rechazar: (motivo: unknown) => void = () => {}
    vi.mocked(getCatalog)
      .mockRejectedValueOnce(errorHttp(500))
      .mockReturnValueOnce(new Promise<CatalogCategory[]>((_, r) => (rechazar = r)))
    montar()

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent('Ocurrió un error de nuestro lado. Inténtalo de nuevo en unos minutos.')
    const boton = within(alerta).getByRole('button', { name: 'Reintentar' })
    await user.click(boton)
    expect(boton).toHaveTextContent('Reintentando…')
    expect(boton).toHaveAttribute('aria-busy', 'true')
    expect(boton).toHaveFocus()

    await act(async () => rechazar(errorHttp(500)))
    expect(await within(screen.getByRole('alert')).findByRole('button', { name: 'Reintentar' })).not.toHaveAttribute('aria-busy')
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('una respuesta que no es una lista es un error, no un catálogo vacío', async () => {
    vi.mocked(getCatalog).mockResolvedValue(undefined as unknown as CatalogCategory[])
    montar()
    expect(await screen.findByRole('heading', { level: 2, name: 'No pudimos cargar el catálogo.' })).toBeInTheDocument()
    expect(screen.queryByText('Aún no hay pruebas publicadas.')).not.toBeInTheDocument()
  })

  it('sin pruebas publicadas: EstadoVacio, sin filtros ni búsqueda', async () => {
    vi.mocked(getCatalog).mockResolvedValue([{ id: 'intereses', label: 'Intereses', count: 0, tests: [] }])
    montar()
    expect(await screen.findByRole('heading', { level: 2, name: 'Aún no hay pruebas publicadas.' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Filtrar por categoría' })).not.toBeInTheDocument()
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
  })
})

describe('PruebasPage · contexto', () => {
  it('sitio público: eyebrow, H1 y entradilla sin afirmaciones sin respaldo (D-18) y sin acción de compra', async () => {
    vi.mocked(getCatalog).mockResolvedValue(CATEGORIAS)
    montar('/pruebas')
    await screen.findByRole('heading', { level: 2, name: 'Adaptabilidad' })

    expect(screen.getByText('Evaluación de candidatos')).toBeInTheDocument()
    expect(
      screen.getByText('Explora el catálogo por categoría o busca por nombre. Cada prueba mide un aspecto distinto del candidato.'),
    ).toBeInTheDocument()
    expect(document.body).not.toHaveTextContent(/validad|baremad|latinoam|licencia|carrito|comprar|añadir|\$/i)
    expect(screen.queryByRole('link', { name: /solicitar créditos/i })).not.toBeInTheDocument()
  })

  it('panel: «Solicitar créditos» (secundario) ocupa el lugar del carrito y lleva a /app/creditos?solicitar=1', async () => {
    const user = userEvent.setup()
    vi.mocked(getCatalog).mockResolvedValue(CATEGORIAS)
    montar('/app/pruebas')
    await screen.findByRole('heading', { level: 2, name: 'Adaptabilidad' })

    expect(screen.getByText(/Cada crédito te permite invitar a un candidato\./)).toBeInTheDocument()
    const solicitar = screen.getByRole('link', { name: 'Solicitar créditos' })
    expect(solicitar).toHaveAttribute('href', '/app/creditos?solicitar=1')
    expect(solicitar).toHaveClass('st-btn--secondary')
    expect(screen.queryByText(/carrito/i)).not.toBeInTheDocument()

    await user.click(solicitar)
    expect(screen.getByTestId('ubicacion')).toHaveTextContent('/app/creditos?solicitar=1')
  })

  it('panel: «Solicitar créditos» sigue a la mano aunque el catálogo falle', async () => {
    vi.mocked(getCatalog).mockRejectedValue(errorHttp(500))
    montar('/app/pruebas')
    await screen.findByRole('alert')
    expect(screen.getByRole('link', { name: 'Solicitar créditos' })).toBeInTheDocument()
  })

  it('el contexto también se puede fijar con la prop', () => {
    vi.mocked(getCatalog).mockReturnValue(new Promise<CatalogCategory[]>(() => {}))
    render(
      <MemoryRouter initialEntries={['/pruebas']}>
        <PruebasPage contexto="panel" />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: 'Solicitar créditos' })).toBeInTheDocument()
  })
})

describe('PruebasPage · catálogo', () => {
  beforeEach(() => {
    vi.mocked(getCatalog).mockResolvedValue(CATEGORIAS)
  })

  it('filtros de la API con su conteo, «Todas» con el total y sin categorías vacías', async () => {
    montar()
    const filtro = await screen.findByRole('group', { name: 'Filtrar por categoría' })
    const chips = within(filtro).getAllByRole('button')
    expect(chips.map((c) => c.textContent)).toEqual(['Todas 5', 'Personalidad 2', 'Razonamiento 2', 'Integridad 1'])
    expect(chip('Todas 5')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('search', { name: 'Filtrar y buscar pruebas' })).toContainElement(buscador())
  })

  it('una tarjeta por prueba, en el orden de la API, con «Ver detalle» → /pruebas/:slug y sin compra', async () => {
    montar()
    await screen.findByRole('list')
    expect(titulos()).toEqual([
      'Adaptabilidad',
      'Trabajo en equipo',
      'Razonamiento numérico',
      'Razonamiento verbal',
      'Ética en el trabajo',
    ])
    const primera = within(grilla()).getAllByRole('listitem')[0]
    expect(within(primera).getByText('Personalidad')).toBeInTheDocument()
    expect(within(primera).getByText('16 min')).toBeInTheDocument()
    expect(within(primera).getByText('26 reactivos')).toBeInTheDocument()
    expect(within(primera).getByRole('link', { name: 'Ver detalle de Adaptabilidad' })).toHaveAttribute(
      'href',
      '/pruebas/adaptabilidad',
    )
    expect(within(grilla()).queryAllByRole('button')).toHaveLength(0)
    expect(grilla()).not.toHaveTextContent(/asignar|responder|añadir|comprar|saldo/i)
  })

  it('la grilla entra escalonada; mientras se busca, las tarjetas no se animan', async () => {
    const user = userEvent.setup()
    montar()
    const tarjetas = within(await screen.findByRole('list')).getAllByRole('listitem')
    expect(tarjetas.map((t) => t.style.getPropertyValue('--i'))).toEqual(['0', '1', '2', '3', '4'])
    tarjetas.forEach((t) => expect(t).toHaveClass('st-card--enter'))

    await user.type(buscador(), 'razonamiento')
    within(grilla())
      .getAllByRole('listitem')
      .forEach((t) => expect(t).not.toHaveClass('st-card--enter'))
  })

  it('con muchas pruebas, el escalonado se detiene en el índice 11', async () => {
    const muchas = Array.from({ length: 14 }, (_, i) => prueba(100 + i, `prueba-${i}`, `Prueba ${i}`, ''))
    vi.mocked(getCatalog).mockResolvedValue([{ id: 'personalidad', label: 'Personalidad', count: 14, tests: muchas }])
    montar()
    const tarjetas = within(await screen.findByRole('list')).getAllByRole('listitem')
    expect(tarjetas.slice(-3).map((t) => t.style.getPropertyValue('--i'))).toEqual(['11', '11', '11'])
  })

  it('filtrar por categoría muestra solo sus pruebas', async () => {
    const user = userEvent.setup()
    montar()
    await user.click(await screen.findByRole('button', { name: 'Razonamiento 2' }))
    expect(chip('Razonamiento 2')).toHaveAttribute('aria-pressed', 'true')
    expect(chip('Todas 5')).toHaveAttribute('aria-pressed', 'false')
    expect(titulos()).toEqual(['Razonamiento numérico', 'Razonamiento verbal'])

    await user.click(chip('Todas 5'))
    expect(titulos()).toHaveLength(5)
  })

  it('busca por nombre o descripción, sin importar mayúsculas ni acentos', async () => {
    const user = userEvent.setup()
    montar()
    await screen.findByRole('list')

    await user.type(buscador(), 'logica')
    expect(titulos()).toEqual(['Razonamiento verbal'])

    await user.clear(buscador())
    await user.type(buscador(), 'ÉTICA')
    expect(titulos()).toEqual(['Ética en el trabajo'])

    await user.clear(buscador())
    await user.type(buscador(), 'evalúa razonamiento')
    expect(titulos()).toEqual(['Razonamiento verbal'])
  })

  it('sin resultados: EstadoVacio (no error) y «Limpiar búsqueda» conserva la categoría y vuelve al buscador', async () => {
    const user = userEvent.setup()
    montar()
    await user.click(await screen.findByRole('button', { name: 'Personalidad 2' }))
    await user.type(buscador(), 'zzz')

    expect(screen.getByRole('heading', { level: 2, name: 'No hay pruebas que coincidan con tu búsqueda.' })).toBeInTheDocument()
    expect(screen.getByText('Revisa la ortografía o prueba con otras palabras.')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Buscar en todas las categorías' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Limpiar búsqueda' }))
    expect(buscador()).toHaveValue('')
    expect(buscador()).toHaveFocus()
    expect(chip('Personalidad 2')).toHaveAttribute('aria-pressed', 'true')
    expect(titulos()).toEqual(['Adaptabilidad', 'Trabajo en equipo'])
  })

  it('si la búsqueda coincide en otras categorías, ofrece buscar en todas', async () => {
    const user = userEvent.setup()
    montar()
    await user.click(await screen.findByRole('button', { name: 'Personalidad 2' }))
    await user.type(buscador(), 'numérico')

    expect(
      screen.getByText('En esta categoría no hay resultados, pero hay 1 prueba que coincide en otras categorías.'),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Buscar en todas las categorías' }))
    expect(chip('Todas 5')).toHaveAttribute('aria-pressed', 'true')
    expect(buscador()).toHaveValue('numérico')
    expect(buscador()).toHaveFocus()
    expect(titulos()).toEqual(['Razonamiento numérico'])
  })

  it('Escape borra la búsqueda', async () => {
    const user = userEvent.setup()
    montar()
    await screen.findByRole('list')
    await user.type(buscador(), 'verbal')
    expect(titulos()).toHaveLength(1)
    await user.keyboard('{Escape}')
    expect(buscador()).toHaveValue('')
    expect(titulos()).toHaveLength(5)
  })

  it('anuncia el resultado en una región de estado (WCAG 4.1.3)', async () => {
    const user = userEvent.setup()
    montar()
    await screen.findByRole('list')
    const estado = screen.getByRole('status')
    // El anuncio espera 400 ms sin cambios; el margen cubre una máquina lenta.
    const conMargen = { timeout: 3_000 }
    await waitFor(() => expect(estado).toHaveTextContent('5 pruebas en el catálogo.'), conMargen)

    await user.type(buscador(), 'verbal')
    await waitFor(() => expect(estado).toHaveTextContent('1 de 5 pruebas coincide.'), conMargen)

    await user.type(buscador(), 'zzz')
    await waitFor(() => expect(estado).toHaveTextContent('No hay pruebas que coincidan con tu búsqueda.'), conMargen)
  })
})
