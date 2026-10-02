import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import type { CatalogTest } from '@/api/catalog'
import { TarjetaPrueba } from './TarjetaPrueba'

const ADAPTABILIDAD: CatalogTest = {
  id: 6,
  slug: 'adaptabilidad',
  name: 'Adaptabilidad',
  description: 'Evalúa flexibilidad ante cambios organizacionales.',
  duration_min: 10,
  item_count: 18,
}

const PERSONALIDAD = { id: 'personalidad', label: 'Personalidad' }

function montar(prueba: CatalogTest = ADAPTABILIDAD, indice?: number) {
  return render(
    <MemoryRouter>
      <ul>
        <TarjetaPrueba prueba={prueba} categoria={PERSONALIDAD} indice={indice} />
      </ul>
    </MemoryRouter>,
  )
}

describe('TarjetaPrueba', () => {
  it('muestra categoría, nombre, descripción, duración y reactivos de la API', () => {
    montar()
    const tarjeta = screen.getByRole('listitem')
    expect(within(tarjeta).getByRole('heading', { level: 2, name: 'Adaptabilidad' })).toBeInTheDocument()
    // Categoría como texto en mayúsculas, sin pastilla (Strata.dc.html:634).
    expect(within(tarjeta).getByText('Personalidad')).toHaveClass('st-catalogo-tarjeta__categoria')
    expect(within(tarjeta).getByText('Evalúa flexibilidad ante cambios organizacionales.')).toBeInTheDocument()
    expect(within(tarjeta).getByText('10 min')).toBeInTheDocument()
    expect(within(tarjeta).getByText('18 reactivos')).toBeInTheDocument()
    // La coma solo la oyen los lectores de pantalla, entre los dos datos.
    expect(tarjeta).toHaveTextContent('10 min, 18 reactivos')
  })

  it('«Ver detalle» lleva a /pruebas/:slug y nombra la prueba para lectores de pantalla', () => {
    montar({ ...ADAPTABILIDAD, slug: 'ética y valores' })
    const enlace = screen.getByRole('link', { name: 'Ver detalle de Adaptabilidad' })
    expect(enlace).toHaveAttribute('href', '/pruebas/%C3%A9tica%20y%20valores')
    expect(enlace).toHaveTextContent(/^Ver detalle/)
  })

  it('no ofrece compra, precio, cantidad ni asignación (P-02, PB-09, R-10)', () => {
    montar()
    const tarjeta = screen.getByRole('listitem')
    expect(within(tarjeta).getAllByRole('link')).toHaveLength(1)
    expect(within(tarjeta).queryByRole('button')).not.toBeInTheDocument()
    expect(tarjeta).not.toHaveTextContent(/\$|licencia|añadir|comprar|asignar|saldo/i)
  })

  it('un reactivo va en singular; sin descripción ni duración válidas, omite esos datos', () => {
    montar({ ...ADAPTABILIDAD, description: '  ', duration_min: 0, item_count: 1 })
    const tarjeta = screen.getByRole('listitem')
    expect(tarjeta).toHaveTextContent('1 reactivo')
    expect(tarjeta).not.toHaveTextContent('reactivos')
    expect(tarjeta).not.toHaveTextContent('min')
    expect(tarjeta.querySelector('.st-catalogo-tarjeta__descripcion')).toBeNull()
  })

  it('sin duración ni reactivos válidos no pinta la fila de datos', () => {
    montar({ ...ADAPTABILIDAD, duration_min: null as unknown as number, item_count: null as unknown as number })
    expect(screen.getByRole('listitem').querySelector('.st-catalogo-tarjeta__datos')).toBeNull()
  })

  it('entra escalonada solo con índice (55 ms por posición, en CSS)', () => {
    const { unmount } = montar(ADAPTABILIDAD, 3)
    const animada = screen.getByRole('listitem')
    expect(animada).toHaveClass('st-card--glass', 'st-card--hover-outline', 'st-card--enter')
    expect(animada.style.getPropertyValue('--i')).toBe('3')
    unmount()

    montar(ADAPTABILIDAD)
    expect(screen.getByRole('listitem')).not.toHaveClass('st-card--enter')
  })
})
