import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { SITE } from '@/config/site'
import ComoFuncionaPage from './ComoFuncionaPage'

// El reporte de ejemplo es de la Fase 4 (su tarjeta de vidrio y su badge «Ejemplo»
// se prueban en SampleReport.test.tsx); aquí importa dónde va y cómo se incrusta.
const ejemplo = vi.hoisted(() => ({ props: null as Record<string, unknown> | null }))
vi.mock('@/sections/SampleReport', () => ({
  default: (props: Record<string, unknown>) => {
    ejemplo.props = props
    return <div data-testid="sample-report">Reporte de ejemplo</div>
  },
}))

function montar() {
  return render(
    <MemoryRouter>
      <ComoFuncionaPage />
    </MemoryRouter>,
  )
}

describe('ComoFuncionaPage', () => {
  it('encabezado de página con eyebrow, H1 y entradilla con la marca', () => {
    montar()
    const h1 = screen.getByRole('heading', { level: 1, name: 'Del catálogo al reporte en tres pasos' })
    const encabezado = h1.closest('header') as HTMLElement
    expect(within(encabezado).getByText('Cómo funciona')).toHaveClass('st-page-header__eyebrow')
    expect(encabezado).toHaveTextContent(`Así se aplica una evaluación con ${SITE.name}`)
  })

  it('los tres pasos de «Cómo funciona» (HowItWorks de la Fase 6)', () => {
    montar()
    const pasos = screen.getByRole('region', { name: 'Cómo funciona' })
    expect(within(pasos).getAllByRole('listitem')).toHaveLength(3)
  })

  it('metodología en cuatro tarjetas de vidrio con sus textos', () => {
    montar()
    const metodologia = screen.getByRole('region', { name: 'Cómo se construyen las pruebas' })
    expect(metodologia).toHaveAttribute('id', 'metodologia')
    expect(within(metodologia).getByText('Metodología')).toBeInTheDocument()
    const tarjetas = within(metodologia).getAllByRole('listitem')
    expect(tarjetas).toHaveLength(4)
    for (const tarjeta of tarjetas) expect(tarjeta).toHaveClass('st-card', 'st-card--glass')
    expect(tarjetas.map((t) => within(t).getByRole('heading', { level: 3 }).textContent)).toEqual([
      'Validez',
      'Confiabilidad',
      'Estandarización',
      'Baremos y normas',
    ])
    expect(tarjetas[0]).toHaveTextContent('Una prueba es válida cuando mide lo que dice medir.')
  })

  it('el reporte de ejemplo que salió de la home, bajo su H2 y sin título propio (D-24)', () => {
    ejemplo.props = null
    montar()
    const seccion = screen.getByRole('region', { name: 'Así se ve un reporte' })
    expect(seccion).toHaveTextContent('Datos ficticios para mostrar el formato')
    expect(within(seccion).getByTestId('sample-report')).toBeInTheDocument()
    expect(ejemplo.props).toMatchObject({ title: null, headingLevel: 3 })
  })
})
