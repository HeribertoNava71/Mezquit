import { act, configure, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getCredits, requestCredits, type CreditsData } from '@/api/rh'
import { ToastProvider } from '@/components/ui'
import CreditosPage from '../CreditosPage'
import { MENSAJE_EXITO } from './solicitud'

// /app/creditos completa (mapa.md, RH-4 y RH-5) con src/api/rh simulado.
// Datos del escenario e2e/mocks/rh.json: saldo 37, 57 recibidos y 20 consumidos.

vi.mock('@/api/rh', () => ({
  getCredits: vi.fn(),
  requestCredits: vi.fn(),
}))

// Pruebas de interacción: con varias suites en paralelo, jsdom y user-event
// pueden pasar de los 5 s por prueba y del segundo de espera de findBy*.
vi.setConfig({ testTimeout: 20_000 })
configure({ asyncUtilTimeout: 4_000 })

const DATOS: CreditsData = {
  balance: 37,
  transactions: [
    { type: 'consumo', amount: -4, reference: 'assessment:17', created_at: '2026-09-29 09:30' },
    { type: 'compra', amount: 20, reference: 'request:7', created_at: '2026-09-26 16:10' },
    { type: 'ajuste', amount: 2, reference: null, created_at: '2026-09-18 13:45' },
    { type: 'consumo', amount: -6, reference: 'assessment:13', created_at: '2026-09-16 10:02' },
    { type: 'consumo', amount: -5, reference: 'assessment:9', created_at: '2026-09-09 11:20' },
    { type: 'compra', amount: 25, reference: 'request:3', created_at: '2026-09-08 17:30' },
    { type: 'consumo', amount: -3, reference: 'assessment:6', created_at: '2026-09-05 12:05' },
    { type: 'consumo', amount: -2, reference: 'assessment:4', created_at: '2026-09-03 09:40' },
    { type: 'cortesia', amount: 10, reference: 'registro', created_at: '2026-09-02 10:15' },
  ],
}

/** Error de axios con el código HTTP dado; sin código, un error de red. */
function errorHttp(status?: number): AxiosError {
  if (status === undefined) return new AxiosError('Network Error', AxiosError.ERR_NETWORK)
  const respuesta = { status, statusText: '', data: {}, headers: {}, config: { headers: new AxiosHeaders() } }
  return new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, undefined, undefined, respuesta as AxiosResponse)
}

function diferida<T>() {
  let resolver: (valor: T) => void = () => {}
  let rechazar: (error: unknown) => void = () => {}
  const promesa = new Promise<T>((res, rej) => {
    resolver = res
    rechazar = rej
  })
  return { promesa, resolver, rechazar }
}

function Ubicacion() {
  const { pathname, search } = useLocation()
  return <output data-testid="ubicacion">{pathname + search}</output>
}

function montar(ruta = '/app/creditos') {
  render(
    <ToastProvider>
      <MemoryRouter initialEntries={[ruta]}>
        <Routes>
          <Route
            path="/app/creditos"
            element={
              <>
                <CreditosPage />
                <Ubicacion />
              </>
            }
          />
          <Route path="/app/evaluaciones/nueva" element={<h1>Nueva evaluación</h1>} />
          <Route path="/app/evaluaciones/:id" element={<h1>Detalle de la evaluación</h1>} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>,
  )
  return userEvent.setup()
}

const ubicacion = () => screen.getByTestId('ubicacion').textContent
const tabla = () => screen.getByRole('table', { name: /^Movimientos de créditos/ })
const filas = () => within(tabla()).getAllByRole('row').slice(1)
const botonSolicitar = () => screen.getAllByRole('button', { name: 'Solicitar créditos' })[0]

/** Cifra del cuadro de una StatCard del resumen. */
function cifra(rotulo: string): string | null | undefined {
  const tarjeta = screen.getByText(rotulo, { selector: '.st-stat__label' }).closest('.st-stat')
  return tarjeta?.querySelector('.st-stat__badge')?.textContent
}

beforeEach(() => {
  vi.mocked(getCredits).mockReset().mockResolvedValue(DATOS)
  vi.mocked(requestCredits).mockReset().mockResolvedValue(undefined)
})

describe('CreditosPage · encabezado', () => {
  it('muestra el PageHeader con «Solicitar créditos» e «Invitar candidatos»', async () => {
    const user = montar()
    expect(screen.getByRole('heading', { level: 1, name: 'Créditos' })).toBeInTheDocument()
    expect(screen.getByText('Saldo y movimientos')).toBeInTheDocument()
    expect(botonSolicitar()).toHaveAttribute('aria-haspopup', 'dialog')

    const invitar = screen.getByRole('link', { name: 'Invitar candidatos' })
    expect(invitar).toHaveAttribute('href', '/app/evaluaciones/nueva')
    await user.click(invitar)
    expect(screen.getByRole('heading', { name: 'Nueva evaluación' })).toBeInTheDocument()
  })
})

describe('CreditosPage · estados', () => {
  it('carga: StatCards con rótulos y cifras en esqueleto, y la tabla en carga', () => {
    vi.mocked(getCredits).mockReturnValue(new Promise(() => {}))
    montar()
    expect(screen.getByRole('region', { name: 'Resumen de créditos' })).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('Disponibles')).toBeInTheDocument()
    // La cifra es el esqueleto de StatCard: nada visible, «Cargando…» solo para lectores.
    expect(cifra('Disponibles')).toBe('Cargando…')
    expect(screen.getByText('Cargando movimientos…').closest('[role="status"]')).toBeInTheDocument()
    expect(screen.queryByText('Aún no hay movimientos')).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Filtrar movimientos por tipo' })).not.toBeInTheDocument()
  })

  it('vacío: «Aún no hay movimientos» con acceso a la solicitud, sin filtro', async () => {
    vi.mocked(getCredits).mockResolvedValue({ balance: 0, transactions: [] })
    const user = montar()
    expect(await screen.findByText('Aún no hay movimientos')).toBeInTheDocument()
    expect(cifra('Disponibles')).toBe('0')
    expect(cifra('Recibidos')).toBe('0')
    expect(cifra('Consumidos')).toBe('0')
    expect(screen.queryByRole('group', { name: 'Filtrar movimientos por tipo' })).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    const enVacio = within(tabla()).getByRole('button', { name: 'Solicitar créditos' })
    await user.click(enVacio)
    expect(screen.getByRole('dialog', { name: 'Solicitar créditos' })).toBeInTheDocument()
  })

  it('error: EstadoError distinto del vacío, con «Reintentar» que vuelve a pedir GET /api/credits', async () => {
    const reintento = diferida<CreditsData>()
    vi.mocked(getCredits).mockRejectedValueOnce(errorHttp()).mockReturnValueOnce(reintento.promesa)
    const user = montar()

    const error = await screen.findByRole('alert')
    expect(within(error).getByRole('heading', { level: 2, name: 'No pudimos cargar tus créditos' })).toBeInTheDocument()
    expect(error).toHaveTextContent('Revisa tu conexión a internet e inténtalo de nuevo.')
    expect(screen.queryByText('Aún no hay movimientos')).not.toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    // Las acciones del encabezado siguen disponibles.
    expect(botonSolicitar()).toBeInTheDocument()

    await user.click(within(error).getByRole('button', { name: 'Reintentar' }))
    expect(getCredits).toHaveBeenCalledTimes(2)
    expect(within(error).getByRole('button', { name: 'Reintentando…' })).toHaveAttribute('aria-busy', 'true')

    await act(async () => reintento.resolver(DATOS))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(cifra('Disponibles')).toBe('37')
    // El botón ya no existe: el foco pasa al resumen y no se pierde en <body>.
    expect(screen.getByRole('region', { name: 'Resumen de créditos' })).toHaveFocus()
  })

  it.each([
    [500, 'No pudimos cargar tus créditos', 'Ocurrió un error de nuestro lado. Inténtalo de nuevo en unos minutos.'],
    [401, 'Tu sesión expiró', 'Vuelve a entrar para continuar.'],
    [403, 'No tienes acceso', 'Tu cuenta no tiene permiso para ver esta información.'],
  ])('error %i: título y texto propios', async (status, titulo, texto) => {
    vi.mocked(getCredits).mockRejectedValue(errorHttp(status))
    montar()
    const error = await screen.findByRole('alert')
    expect(within(error).getByRole('heading', { name: titulo })).toBeInTheDocument()
    expect(error).toHaveTextContent(texto)
    expect(within(error).getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })
})

describe('CreditosPage · resumen y movimientos', () => {
  it('StatCards: disponibles es el balance; recibidos y consumidos suman el historial', async () => {
    montar()
    await screen.findByRole('table', { name: 'Movimientos de créditos' })
    expect(screen.getByRole('region', { name: 'Resumen de créditos' })).not.toHaveAttribute('aria-busy')
    expect(cifra('Disponibles')).toBe('37')
    expect(cifra('Recibidos')).toBe('57')
    expect(cifra('Consumidos')).toBe('20')
  })

  it('cada fila trae fecha, tipo, monto con signo y referencia legible', async () => {
    montar()
    await screen.findByRole('table', { name: 'Movimientos de créditos' })
    expect(filas()).toHaveLength(9)

    const [primera, segunda, tercera] = filas()
    expect(within(primera).getByRole('rowheader')).toHaveTextContent('29 sep 2026')
    expect(within(primera).getByRole('rowheader')).toHaveTextContent('09:30')
    expect(within(primera).getByText('Consumo')).toBeInTheDocument()
    expect(within(primera).getByText('−4')).toBeInTheDocument()
    expect(within(primera).getByRole('link', { name: 'Evaluación #17' })).toHaveAttribute('href', '/app/evaluaciones/17')

    expect(within(segunda).getByText('Compra')).toBeInTheDocument()
    expect(within(segunda).getByText('+20')).toBeInTheDocument()
    expect(within(segunda).getByText('Solicitud aprobada')).toBeInTheDocument()

    expect(within(tercera).getByText('Ajuste')).toBeInTheDocument()
    expect(within(tercera).getByText('Sin referencia')).toBeInTheDocument()

    const ultima = filas()[8]
    expect(within(ultima).getByText('Cortesía')).toBeInTheDocument()
    expect(within(ultima).getByText('+10')).toBeInTheDocument()
    expect(within(ultima).getByText('Cortesía de registro')).toBeInTheDocument()
    // Ninguna referencia queda en crudo.
    expect(within(tabla()).queryByText(/assessment:|request:/)).not.toBeInTheDocument()
  })

  it('la referencia de una evaluación lleva a su detalle', async () => {
    const user = montar()
    await user.click(await screen.findByRole('link', { name: 'Evaluación #13' }))
    expect(screen.getByRole('heading', { name: 'Detalle de la evaluación' })).toBeInTheDocument()
  })

  it('filtra por tipo con conteos y avisa cuando un tipo no tiene movimientos', async () => {
    vi.mocked(getCredits).mockResolvedValue({
      balance: 6,
      transactions: DATOS.transactions.filter((movimiento) => movimiento.type !== 'ajuste'),
    })
    const user = montar()
    const filtro = await screen.findByRole('group', { name: 'Filtrar movimientos por tipo' })
    expect(within(filtro).getByRole('button', { name: 'Todos 8' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(filtro).getByRole('button', { name: 'Compra 2' })).toBeInTheDocument()
    expect(within(filtro).getByRole('button', { name: 'Cortesía 1' })).toBeInTheDocument()

    await user.click(within(filtro).getByRole('button', { name: 'Consumo 5' }))
    expect(within(filtro).getByRole('button', { name: 'Consumo 5' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('table', { name: 'Movimientos de créditos de tipo Consumo' })).toBeInTheDocument()
    expect(filas()).toHaveLength(5)
    filas().forEach((fila) => expect(within(fila).getByText('Consumo')).toBeInTheDocument())

    await user.click(within(filtro).getByRole('button', { name: 'Ajuste 0' }))
    expect(screen.getByText('No hay movimientos de este tipo')).toBeInTheDocument()
    expect(screen.queryByText('Aún no hay movimientos')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Ver todos' }))
    const todos = within(filtro).getByRole('button', { name: 'Todos 8' })
    expect(todos).toHaveAttribute('aria-pressed', 'true')
    // El botón «Ver todos» desaparece: el foco no se pierde, pasa al chip «Todos».
    expect(todos).toHaveFocus()
    expect(filas()).toHaveLength(8)
  })
})

describe('CreditosPage · solicitud de créditos', () => {
  it('?solicitar=1 abre el drawer al llegar y el parámetro se quita al cerrar', async () => {
    const user = montar('/app/creditos?solicitar=1&origen=asistente')
    const dialogo = screen.getByRole('dialog', { name: 'Solicitar créditos' })
    expect(ubicacion()).toBe('/app/creditos?solicitar=1&origen=asistente')

    await user.click(within(dialogo).getByRole('button', { name: 'Cerrar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(ubicacion()).toBe('/app/creditos?origen=asistente')
    // Sin disparador, el foco vuelve a «Solicitar créditos».
    expect(botonSolicitar()).toHaveFocus()
  })

  it('sin ?solicitar=1 (u otro valor) el drawer queda cerrado', () => {
    montar('/app/creditos?solicitar=0')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('«Solicitar créditos» abre el drawer, pone ?solicitar=1 y, al cerrar, devuelve el foco', async () => {
    const user = montar()
    await user.click(botonSolicitar())
    expect(screen.getByRole('dialog', { name: 'Solicitar créditos' })).toBeInTheDocument()
    expect(ubicacion()).toBe('/app/creditos?solicitar=1')

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(ubicacion()).toBe('/app/creditos')
    expect(botonSolicitar()).toHaveFocus()
  })

  it('al enviar confirma la solicitud y el saldo no cambia (no se vuelve a pedir)', async () => {
    const user = montar('/app/creditos?solicitar=1')
    await screen.findByRole('table', { name: 'Movimientos de créditos' })
    const dialogo = screen.getByRole('dialog', { name: 'Solicitar créditos' })
    await user.click(within(dialogo).getByRole('button', { name: 'Agregar un crédito' }))
    await user.click(within(dialogo).getByRole('button', { name: 'Enviar solicitud' }))

    expect(requestCredits).toHaveBeenCalledWith(2, '')
    expect(within(dialogo).getAllByText(MENSAJE_EXITO)).toHaveLength(2)
    expect(getCredits).toHaveBeenCalledTimes(1)
    expect(cifra('Disponibles')).toBe('37')
  })
})
