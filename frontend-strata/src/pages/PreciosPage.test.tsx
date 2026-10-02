import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PLANS } from '@/data/plans'
import PreciosPage from './PreciosPage'

// SITE.calendarUrl se puede cambiar por prueba: la página lo lee al dibujarse.
const sitio = vi.hoisted(() => ({ calendarUrl: '[PENDIENTE: enlace de agenda]' }))
vi.mock('@/config/site', async (importOriginal) => {
  const { SITE } = await importOriginal<typeof import('@/config/site')>()
  return {
    SITE: {
      ...SITE,
      get calendarUrl() {
        return sitio.calendarUrl
      },
    },
  }
})

function montar() {
  return render(
    <MemoryRouter>
      <PreciosPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  sitio.calendarUrl = '[PENDIENTE: enlace de agenda]'
})

describe('PreciosPage', () => {
  it('encabezado de página', () => {
    montar()
    expect(screen.getByRole('heading', { level: 1, name: 'Precios' })).toBeInTheDocument()
    expect(screen.getByText('Elige el modelo que se ajuste a tu volumen de evaluaciones.')).toBeInTheDocument()
  })

  it('un plan por tarjeta de vidrio, con el precio pendiente a la vista, la cadencia y las inclusiones de data/plans.ts', () => {
    montar()
    for (const plan of PLANS) {
      const titulo = screen.getByRole('heading', { level: 2, name: plan.name })
      const tarjeta = titulo.closest('li') as HTMLElement
      expect(tarjeta).toHaveClass('st-card', 'st-card--glass')

      // El marcador «[PENDIENTE: precio]» se ve como pendiente (Tag) y se anuncia como precio.
      const precio = within(tarjeta).getByText(plan.price)
      expect(precio).toHaveClass('st-tag', 'st-pendiente')
      expect(precio.closest('p')).toHaveTextContent(`Precio: ${plan.price}`)

      expect(within(tarjeta).getByText(plan.cadence)).toBeInTheDocument()
      const inclusiones = within(tarjeta).getByRole('list', { name: 'Incluye' })
      expect(within(inclusiones).getAllByRole('listitem').map((li) => li.textContent)).toEqual(plan.includes)
    }
  })

  it('«Agenda una demo» lleva a /demo, como antes', () => {
    montar()
    const ctas = screen.getAllByRole('link', { name: 'Agenda una demo' })
    expect(ctas).toHaveLength(PLANS.length)
    for (const cta of ctas) expect(cta).toHaveAttribute('href', '/demo')
  })

  it('con agenda real también lleva a /demo, donde están el formulario y la agenda', () => {
    sitio.calendarUrl = 'https://cal.com/strata/demo'
    montar()
    for (const cta of screen.getAllByRole('link', { name: 'Agenda una demo' })) {
      expect(cta).toHaveAttribute('href', '/demo')
    }
  })

  it('«¿Más de 200 evaluaciones al mes?» lleva a /demo', () => {
    montar()
    const fila = screen.getByRole('region', { name: '¿Más de 200 evaluaciones al mes?' })
    expect(fila).toHaveTextContent('Armamos un plan a tu medida.')
    expect(within(fila).getByRole('link', { name: 'Hablar con nosotros' })).toHaveAttribute('href', '/demo')
  })

  it('no ofrece comprar ni pagar en línea (PB-09)', () => {
    montar()
    expect(screen.queryByRole('button', { name: /comprar|pagar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /comprar|pagar/i })).not.toBeInTheDocument()
  })
})
