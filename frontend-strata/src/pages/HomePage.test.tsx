import { render, screen, within } from '@testing-library/react'
import type { RefObject } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getCatalog, type CatalogCategory } from '@/api/catalog'
import HomePage from './HomePage'

vi.mock('@/api/catalog', () => ({ getCatalog: vi.fn() }))
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: null, loading: false, setUser: vi.fn() }),
}))

// La mascota es de otro entregable (Fase 6 · mascota); aquí solo importa el hueco.
const mascota = vi.hoisted(() => ({ tituloRef: undefined as RefObject<HTMLElement | null> | undefined }))
vi.mock('@/components/mascota/Mascota', () => {
  function Mascota(props: { tituloRef?: RefObject<HTMLElement | null> }) {
    mascota.tituloRef = props.tituloRef
    return <div data-testid="mascota" />
  }
  return { Mascota, default: Mascota }
})

const CATEGORIAS: CatalogCategory[] = [
  {
    id: 'personalidad',
    label: 'Personalidad',
    count: 2,
    tests: [
      { id: 6, slug: 'adaptabilidad', name: 'Adaptabilidad', description: 'Evalúa flexibilidad.', duration_min: 10, item_count: 18 },
      { id: 3, slug: 'rasgos-de-personalidad', name: 'Rasgos de personalidad', description: 'Mide estabilidad.', duration_min: 20, item_count: 40 },
    ],
  },
  {
    id: 'razonamiento',
    label: 'Razonamiento',
    count: 1,
    tests: [{ id: 8, slug: 'razonamiento-abstracto', name: 'Razonamiento abstracto', description: 'Patrones.', duration_min: 25, item_count: 30 }],
  },
  {
    id: 'integridad',
    label: 'Integridad',
    count: 1,
    tests: [{ id: 13, slug: 'confiabilidad', name: 'Confiabilidad', description: 'Consistencia.', duration_min: 12, item_count: 24 }],
  },
]

function montar() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  )
}

const filaDeConfianza = () => screen.getByText('Reporte para RR. HH.').closest('ul') as HTMLElement

beforeEach(() => {
  mascota.tituloRef = undefined
  vi.mocked(getCatalog).mockReset()
})

describe('HomePage', () => {
  it('arma la home: hero con demo, catálogo exprés y cómo funciona, sin el reporte de ejemplo (D-24)', async () => {
    vi.mocked(getCatalog).mockResolvedValue(CATEGORIAS)
    montar()
    expect(screen.getByRole('heading', { level: 1, name: /descubre lo que llevas dentro/i })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Ejemplo de una pregunta del examen' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Elige las pruebas de tu evaluación' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Cómo funciona' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { level: 3, name: 'Adaptabilidad' })).toBeInTheDocument()
    expect(screen.queryByText(/este es el reporte que recibes/i)).not.toBeInTheDocument()
    expect(getCatalog).toHaveBeenCalledTimes(1)
  })

  it('el rango de duración de la fila de confianza sale de GET /api/catalog', async () => {
    vi.mocked(getCatalog).mockResolvedValue(CATEGORIAS)
    montar()
    expect(await within(filaDeConfianza()).findByText('10–25 min por prueba')).toBeInTheDocument()
  })

  it('mientras carga: tres esqueletos y la duración de respaldo', () => {
    vi.mocked(getCatalog).mockReturnValue(new Promise<CatalogCategory[]>(() => {}))
    const { container } = montar()
    expect(screen.getByRole('status')).toHaveTextContent('Cargando pruebas destacadas…')
    expect(container.querySelectorAll('.st-carga__tarjeta')).toHaveLength(3)
    expect(within(filaDeConfianza()).getByText('Duración según la prueba')).toBeInTheDocument()
  })

  it('si GET /api/catalog falla: duración de respaldo, aviso y enlace al catálogo', async () => {
    vi.mocked(getCatalog).mockRejectedValue(new Error('Network Error'))
    montar()
    expect(await screen.findByText(/no pudimos cargar las pruebas destacadas/i)).toBeInTheDocument()
    expect(within(filaDeConfianza()).getByText('Duración según la prueba')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /previsualizar test/i })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver catálogo completo' })).toHaveAttribute('href', '/pruebas')
  })

  it('deja el hueco de la mascota con la ref al H1 del hero (vigilarTitular)', () => {
    vi.mocked(getCatalog).mockReturnValue(new Promise<CatalogCategory[]>(() => {}))
    montar()
    expect(screen.getByTestId('mascota')).toBeInTheDocument()
    const titulo = screen.getByRole('heading', { level: 1 })
    expect(mascota.tituloRef?.current).toBe(titulo)
    expect(titulo).toHaveAttribute('data-mascota-titular')
  })

  it('si la home se desmonta antes de la respuesta, la descarta sin avisos de React', async () => {
    let responder: (valor: CatalogCategory[]) => void = () => {}
    vi.mocked(getCatalog).mockReturnValue(new Promise<CatalogCategory[]>((resolve) => (responder = resolve)))
    const error = vi.spyOn(console, 'error')
    const { unmount } = montar()
    unmount()
    responder(CATEGORIAS)
    await Promise.resolve()
    expect(error).not.toHaveBeenCalled()
  })
})
