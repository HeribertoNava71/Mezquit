import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ReporteEjemplo } from './ReporteEjemplo'

// Con el SampleReport real (Fase 4): comprueba cómo se incrusta en las páginas públicas.
describe('ReporteEjemplo', () => {
  it('un solo H2 (el de la sección), el reporte en vidrio con su badge «Ejemplo» y sus títulos en H3', () => {
    render(<ReporteEjemplo />)
    const seccion = screen.getByRole('region', { name: 'Así se ve un reporte' })

    expect(within(seccion).getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Así se ve un reporte',
    ])
    expect(within(seccion).getAllByRole('heading', { level: 3 }).length).toBeGreaterThan(0)
    expect(seccion).toHaveTextContent('Datos ficticios para mostrar el formato')

    const tarjeta = seccion.querySelector('.st-card--glass') as HTMLElement
    expect(tarjeta).not.toBeNull()
    expect(within(tarjeta).getAllByText('Ejemplo').length).toBeGreaterThan(0)
  })

  it('acepta otro título', () => {
    render(<ReporteEjemplo title="Reporte de muestra" />)
    expect(screen.getByRole('region', { name: 'Reporte de muestra' })).toBeInTheDocument()
  })
})
