import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import type { CatalogCategory } from '@/api/catalog'
import { CatalogoExpres } from './CatalogoExpres'
import type { EstadoCatalogo } from './catalogoInicio'

/** Forma de GET /api/catalog (CatalogController): categorías en orden fijo y pruebas por nombre. */
const CATEGORIAS: CatalogCategory[] = [
  {
    id: 'personalidad',
    label: 'Personalidad',
    count: 2,
    tests: [
      { id: 6, slug: 'adaptabilidad', name: 'Adaptabilidad', description: 'Evalúa flexibilidad ante cambios organizacionales.', duration_min: 10, item_count: 18 },
      { id: 4, slug: 'estilos-de-trabajo', name: 'Estilos de trabajo', description: 'Identifica preferencias.', duration_min: 12, item_count: 20 },
    ],
  },
  {
    id: 'razonamiento',
    label: 'Razonamiento',
    count: 1,
    tests: [
      { id: 11, slug: 'atencion-y-concentracion', name: 'Atención y concentración', description: 'Mide la capacidad de mantener el foco.', duration_min: 15, item_count: 40 },
    ],
  },
  {
    id: 'integridad',
    label: 'Integridad',
    count: 1,
    tests: [{ id: 13, slug: 'confiabilidad', name: 'Confiabilidad', description: 'Mide consistencia.', duration_min: 12, item_count: 1 }],
  },
  {
    id: 'intereses',
    label: 'Intereses',
    count: 1,
    tests: [{ id: 15, slug: 'intereses-vocacionales', name: 'Intereses vocacionales', description: '', duration_min: 20, item_count: 45 }],
  },
]

function montar(catalogo: EstadoCatalogo) {
  return render(
    <MemoryRouter>
      <CatalogoExpres catalogo={catalogo} />
    </MemoryRouter>,
  )
}

const seccion = () => screen.getByRole('region', { name: 'Elige las pruebas de tu evaluación' })
const verCatalogo = () => screen.getByRole('link', { name: 'Ver catálogo completo' })

describe('CatalogoExpres', () => {
  it('con datos: tres tarjetas con la primera prueba de las tres primeras categorías', () => {
    montar({ estado: 'listo', categorias: CATEGORIAS })
    const tarjetas = within(seccion()).getAllByRole('listitem')
    expect(tarjetas).toHaveLength(3)
    expect(tarjetas.map((t) => within(t).getByRole('heading', { level: 3 }).textContent)).toEqual([
      'Adaptabilidad',
      'Atención y concentración',
      'Confiabilidad',
    ])

    const primera = within(tarjetas[0])
    expect(primera.getByText('Personalidad')).toHaveClass('st-tag', 'st-tag--sky')
    expect(primera.getByText('10 min')).toBeInTheDocument()
    expect(primera.getByText('18 reactivos')).toBeInTheDocument()
    expect(primera.getByText('Evalúa flexibilidad ante cambios organizacionales.')).toBeInTheDocument()
    expect(within(tarjetas[1]).getByText('Razonamiento')).toHaveClass('st-tag--coral')
    expect(within(tarjetas[2]).getByText('Integridad')).toHaveClass('st-tag--navy')
    expect(within(tarjetas[2]).getByText('1 reactivo')).toBeInTheDocument()
  })

  it('«Previsualizar test» lleva al detalle /pruebas/:slug y nombra la prueba', () => {
    montar({ estado: 'listo', categorias: CATEGORIAS })
    const previa = screen.getByRole('link', { name: 'Previsualizar test: Atención y concentración' })
    expect(previa).toHaveAttribute('href', '/pruebas/atencion-y-concentracion')
    expect(previa).toHaveAttribute('data-mascota-objetivo')
  })

  it('«Ver catálogo completo» → /pruebas, sin precios ni compra (P-02, P-03)', () => {
    montar({ estado: 'listo', categorias: CATEGORIAS })
    expect(verCatalogo()).toHaveAttribute('href', '/pruebas')
    expect(verCatalogo()).toHaveAttribute('data-mascota-objetivo')
    expect(seccion()).not.toHaveTextContent(/\$|USD|comprar|pago|licencia/i)
  })

  it('cargando: tres tarjetas esqueleto con un estado que se anuncia', () => {
    const { container } = montar({ estado: 'cargando' })
    expect(screen.getByRole('status')).toHaveTextContent('Cargando pruebas destacadas…')
    expect(container.querySelectorAll('.st-carga__tarjeta')).toHaveLength(3)
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
    expect(verCatalogo()).toBeInTheDocument()
  })

  it('error: ninguna tarjeta, un aviso con ícono y el enlace al catálogo', () => {
    montar({ estado: 'error' })
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
    const aviso = screen.getByText(/no pudimos cargar las pruebas destacadas/i).closest('.st-callout')
    expect(aviso).toHaveClass('st-callout--warning')
    expect(aviso?.querySelector('.st-callout__icon svg')).not.toBeNull()
    expect(verCatalogo()).toHaveAttribute('href', '/pruebas')
  })

  it('con menos categorías muestra las que hay', () => {
    montar({ estado: 'listo', categorias: CATEGORIAS.slice(0, 2) })
    expect(within(seccion()).getAllByRole('listitem')).toHaveLength(2)
  })

  it('sin pruebas publicadas avisa que el catálogo está vacío y conserva el enlace', () => {
    montar({ estado: 'listo', categorias: [] })
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
    expect(screen.getByText('Aún no hay pruebas publicadas en el catálogo.')).toBeInTheDocument()
    expect(verCatalogo()).toBeInTheDocument()
  })
})
