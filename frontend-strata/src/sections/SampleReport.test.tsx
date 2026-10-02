import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SITE } from '@/config/site'
import SampleReport from './SampleReport'

describe('SampleReport', () => {
  it('muestra el Report de ejemplo con su badge, sus datos y el radar (3 escalas)', () => {
    render(<SampleReport />)

    const seccion = screen.getByRole('region', { name: 'Este es el reporte que recibes' })
    expect(within(seccion).getByRole('heading', { level: 2, name: 'Este es el reporte que recibes' })).toBeInTheDocument()

    // El reporte empieza un nivel abajo del título de la sección.
    const titulo = within(seccion).getByRole('heading', { level: 3, name: 'Ejemplo · Candidato' })
    const banner = titulo.closest('.st-report-banner') as HTMLElement
    expect(within(banner).getByText('Ejemplo')).toBeInTheDocument()
    expect(banner).toHaveTextContent('Evaluación: Evaluación de muestra')
    expect(banner).toHaveTextContent('Puesto: Ejecutivo de ventas')
    expect(banner).toHaveTextContent(`Empresa: ${SITE.name}`)

    const prueba = within(seccion).getByRole('region', { name: 'Perfil de conducta' })
    expect(within(prueba).getAllByRole('tab').map((tab) => tab.querySelector('.st-escala__puntaje')?.textContent)).toEqual([
      '78 · Alto',
      '55 · Medio',
      '30 · Bajo',
    ])
    expect(within(prueba).getByRole('img', { name: 'Perfil por escala de Perfil de conducta' })).toBeInTheDocument()
    expect(within(seccion).getByRole('heading', { name: 'Preguntas sugeridas para entrevista' })).toBeInTheDocument()
  })

  it('va en una tarjeta de vidrio', () => {
    const { container } = render(<SampleReport />)
    expect(container.querySelector('.st-card--glass .st-report')).toBeInTheDocument()
  })

  it('sin título de sección, el reporte toma su nivel', () => {
    render(<SampleReport title={null} headingLevel={2} aria-label="Reporte de ejemplo" />)
    expect(screen.getByRole('region', { name: 'Reporte de ejemplo' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Ejemplo · Candidato' })).toBeInTheDocument()
  })
})
