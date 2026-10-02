import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { ReportData, ReportTest } from '@/api/report'
import Report from './Report'

// Forma de GET /api/invitations/{id}/report (ReportController,
// 2026-09-11-fase1-nucleo.md:1931-1974): tests[] con nombre, integridad y
// escalas; interview_questions en la raíz; completed_at en d/m/Y.
// Las categorías no coinciden a propósito con los umbrales 80/70 del prototipo:
// el color y la etiqueta deben salir de la categoría del backend.
const DEMO: ReportTest = {
  name: 'Prueba de demostración',
  integrity: { blur_count: 2 },
  scales: [
    {
      code: 'RES',
      name: 'Orientación a resultados',
      normalized: 85,
      percentile: 85,
      category: 'medio',
      interpretation: 'Puntaje medio en Orientación a resultados: dentro del promedio esperado.',
    },
    {
      code: 'COL',
      name: 'Colaboración',
      normalized: 60,
      percentile: 60,
      category: 'alto',
      interpretation: 'Puntaje alto en Colaboración: es una fortaleza marcada del candidato.',
    },
    {
      code: 'ADA',
      name: 'Adaptabilidad',
      normalized: 18.75,
      percentile: 19,
      category: 'bajo',
      interpretation: 'Puntaje bajo en Adaptabilidad: podría ser un área a explorar en entrevista.',
    },
  ],
}

const ESTILOS: ReportTest = {
  name: 'Estilos de trabajo',
  integrity: { blur_count: 0 },
  scales: [
    {
      code: 'ORD',
      name: 'Orden',
      normalized: 50,
      percentile: 50,
      category: 'medio',
      interpretation: 'Puntaje medio en Orden: dentro del promedio esperado.',
    },
    { code: 'INI', name: 'Iniciativa', normalized: null, percentile: null, category: null, interpretation: 'Sin datos suficientes.' },
  ],
}

const REPORTE: ReportData = {
  candidate: 'Valentina Ríos',
  position: 'Gerente de tienda',
  assessment: 'Selección de gerentes 2026',
  organization: 'Comercializadora Río Claro',
  completed_at: '15/09/2026',
  tests: [DEMO, ESTILOS],
  interview_questions: [
    'Cuéntame de una situación reciente relacionada con «Colaboración».',
    'Cuéntame de una situación reciente relacionada con «Adaptabilidad».',
  ],
}

const PIE_LEGAL = /Apoya la decisión de contratación, no la sustituye\./

const seccion = (nombre: string) => screen.getByRole('region', { name: nombre })
const panelDe = (nombre: string) => within(seccion(nombre)).getByRole('tabpanel')

describe('Report', () => {
  it('banner con candidato, evaluación, puesto, empresa y fecha (sin código)', () => {
    render(<Report data={REPORTE} />)

    // Por defecto el título es h2 (el reporte va dentro de otra página).
    const titulo = screen.getByRole('heading', { level: 2, name: 'Valentina Ríos' })
    const banner = titulo.closest('.st-report-banner') as HTMLElement
    expect(banner).toHaveTextContent('Examen finalizado · Reporte generado')
    expect(banner).toHaveTextContent('Evaluación: Selección de gerentes 2026')
    expect(banner).toHaveTextContent('Puesto: Gerente de tienda')
    expect(banner).toHaveTextContent('Empresa: Comercializadora Río Claro')
    expect(banner).toHaveTextContent('Completada el 15/09/2026')
    expect(banner).not.toHaveTextContent(/código/i)
    expect(screen.getByRole('article', { name: 'Valentina Ríos' })).toBeInTheDocument()
  })

  it('sin puesto ni fecha: «Sin puesto» y sin fecha', () => {
    render(<Report data={{ ...REPORTE, position: null, completed_at: null }} headingLevel={1} />)
    const banner = screen.getByRole('heading', { level: 1, name: 'Valentina Ríos' }).closest('.st-report-banner')
    expect(banner).toHaveTextContent('Puesto: Sin puesto')
    expect(banner).not.toHaveTextContent('Completada el')
  })

  it('una sección por cada prueba de tests[], titulada con test.name', () => {
    const { container } = render(<Report data={REPORTE} />)
    expect(container.querySelectorAll('.st-report-test')).toHaveLength(2)
    expect(within(seccion('Prueba de demostración')).getByRole('heading', { level: 3 })).toHaveTextContent(
      'Prueba de demostración',
    )
    expect(within(seccion('Estilos de trabajo')).getByRole('heading', { level: 3 })).toHaveTextContent(
      'Estilos de trabajo',
    )
  })

  it('el radar solo aparece con 3 o más escalas con puntaje, con descripción y tabla alternativa', () => {
    render(<Report data={REPORTE} />)

    const radar = within(seccion('Prueba de demostración')).getByRole('img', {
      name: 'Perfil por escala de Prueba de demostración',
    })
    expect(radar.tagName.toLowerCase()).toBe('svg')
    expect(radar).toHaveAccessibleDescription(/Gráfica de radar de 3 escalas con puntajes de 0 a 100/)

    const tabla = within(seccion('Prueba de demostración')).getByRole('table', {
      name: 'Puntajes de Prueba de demostración',
    })
    const filas = within(tabla).getAllByRole('row').slice(1)
    expect(filas.map((fila) => fila.textContent)).toEqual([
      'Orientación a resultados85Medio',
      'Colaboración60Alto',
      'Adaptabilidad19Bajo',
    ])

    // Dos escalas (y una sin dato): sin radar.
    expect(within(seccion('Estilos de trabajo')).queryByRole('img')).not.toBeInTheDocument()
    expect(within(seccion('Estilos de trabajo')).queryByRole('table')).not.toBeInTheDocument()
  })

  it('cada escala muestra «{puntaje} · {categoría}» y su barra, con color por categoría y no por umbral', () => {
    render(<Report data={REPORTE} />)
    const pestanas = within(seccion('Prueba de demostración')).getAllByRole('tab')
    expect(pestanas.map((tab) => tab.querySelector('.st-escala__puntaje')?.textContent)).toEqual([
      '85 · Medio',
      '60 · Alto',
      '19 · Bajo',
    ])
    // 85 es «medio» y 60 es «alto»: manda la categoría del backend.
    expect(pestanas[0]).toHaveClass('st-escala--medio')
    expect(pestanas[1]).toHaveClass('st-escala--alto')
    expect(pestanas[2]).toHaveClass('st-escala--bajo')
    expect(pestanas[0].querySelector('.st-escala__relleno')).toHaveStyle({ width: '85%' })
    expect(pestanas[2].querySelector('.st-escala__relleno')).toHaveStyle({ width: '18.75%' })
    expect(pestanas[1]).toHaveAccessibleName('Colaboración: 60 de 100, categoría Alto')

    // Sin dato: neutro, «Sin datos» y barra vacía.
    const sinDato = within(seccion('Estilos de trabajo')).getByRole('tab', { name: 'Iniciativa: sin datos' })
    expect(sinDato).toHaveClass('st-escala--sin-dato')
    expect(sinDato.querySelector('.st-escala__puntaje')).toHaveTextContent('Sin datos')
    expect(sinDato.querySelector('.st-escala__relleno')).toHaveStyle({ width: '0%' })
  })

  it('al elegir una escala, el panel muestra su interpretación y el radar la marca', async () => {
    const user = userEvent.setup()
    const { container } = render(<Report data={REPORTE} />)
    const demo = seccion('Prueba de demostración')
    const [resultados, colaboracion] = within(demo).getAllByRole('tab')

    expect(resultados).toHaveAttribute('aria-selected', 'true')
    expect(panelDe('Prueba de demostración')).toHaveTextContent('Orientación a resultados · Medio85/100')
    expect(panelDe('Prueba de demostración')).toHaveTextContent(DEMO.scales[0].interpretation)

    await user.click(colaboracion)
    expect(colaboracion).toHaveAttribute('aria-selected', 'true')
    expect(resultados).toHaveAttribute('aria-selected', 'false')
    expect(panelDe('Prueba de demostración')).toHaveTextContent('Colaboración · Alto60/100')
    expect(panelDe('Prueba de demostración')).toHaveAccessibleName('Colaboración: 60 de 100, categoría Alto')
    expect(container.querySelector('.st-radar__etiqueta--activa')).toHaveTextContent('Colaboración')
  })

  it('las escalas se recorren con el teclado (flechas, Inicio y Fin) y solo la elegida está en el orden de tabulación', async () => {
    const user = userEvent.setup()
    render(<Report data={REPORTE} />)
    const pestanas = within(seccion('Prueba de demostración')).getAllByRole('tab')
    expect(pestanas.map((tab) => tab.tabIndex)).toEqual([0, -1, -1])

    await user.tab()
    expect(pestanas[0]).toHaveFocus()

    await user.keyboard('{ArrowDown}')
    expect(pestanas[1]).toHaveFocus()
    expect(pestanas[1]).toHaveAttribute('aria-selected', 'true')
    expect(pestanas.map((tab) => tab.tabIndex)).toEqual([-1, 0, -1])

    await user.keyboard('{End}')
    expect(pestanas[2]).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    expect(pestanas[0]).toHaveFocus()
    await user.keyboard('{ArrowUp}')
    expect(pestanas[2]).toHaveFocus()
    await user.keyboard('{Home}')
    expect(pestanas[0]).toHaveFocus()
    expect(panelDe('Prueba de demostración')).toHaveTextContent(DEMO.scales[0].interpretation)

    // Tab pasa de la lista al panel de interpretación.
    await user.tab()
    expect(panelDe('Prueba de demostración')).toHaveFocus()
  })

  it('cada prueba muestra su integridad como dato neutro', () => {
    render(<Report data={REPORTE} />)
    expect(
      within(seccion('Prueba de demostración')).getByText(/vez\(ces\) que la pantalla perdió el foco/),
    ).toHaveTextContent('2 vez(ces) que la pantalla perdió el foco')
    expect(within(seccion('Estilos de trabajo')).getByText(/vez\(ces\) que la pantalla perdió el foco/)).toHaveTextContent(
      '0 vez(ces) que la pantalla perdió el foco',
    )
  })

  it('preguntas sugeridas y pie legal aparecen una sola vez, al final', () => {
    const { container } = render(<Report data={REPORTE} />)
    const preguntas = screen.getByRole('region', { name: 'Preguntas sugeridas para entrevista' })
    expect(screen.getAllByRole('heading', { name: 'Preguntas sugeridas para entrevista' })).toHaveLength(1)
    expect(within(preguntas).getAllByRole('listitem').map((item) => item.textContent)).toEqual(REPORTE.interview_questions)
    expect(screen.getAllByText(PIE_LEGAL)).toHaveLength(1)

    // Orden: pruebas, preguntas y pie legal (el último elemento del reporte).
    const reporte = container.querySelector('.st-report') as HTMLElement
    const bloques = Array.from(reporte.children).map((hijo) => hijo.className)
    expect(bloques.at(-2)).toContain('st-report-preguntas')
    expect(bloques.at(-1)).toContain('st-report__legal')
  })

  it('sin preguntas sugeridas no muestra esa sección, pero sí el pie legal', () => {
    render(<Report data={{ ...REPORTE, interview_questions: [] }} />)
    expect(screen.queryByRole('heading', { name: 'Preguntas sugeridas para entrevista' })).not.toBeInTheDocument()
    expect(screen.getByText(PIE_LEGAL)).toBeInTheDocument()
  })

  it('no muestra textos normativos ni flujos sin backend', () => {
    const { container } = render(<Report data={REPORTE} actions={<button type="button">Descargar PDF</button>} />)
    const texto = container.textContent ?? ''
    expect(texto).not.toMatch(/índice global/i)
    expect(texto).not.toMatch(/rango esperado/i)
    expect(texto).not.toMatch(/percentil/i)
    expect(texto).not.toMatch(/norma/i)
    expect(texto).not.toMatch(/LATAM|Latinoam/i)
    expect(texto).not.toMatch(/población/i)
    expect(texto).not.toMatch(/\bpc\s*\d/i)
    expect(texto).not.toMatch(/envío automático/i)
    expect(texto).not.toMatch(/ver respuestas/i)
    expect(screen.queryByRole('switch')).not.toBeInTheDocument()
  })

  it('modo ejemplo: badge «Ejemplo» con la prop sample o con data.sample', () => {
    const { rerender } = render(<Report data={REPORTE} />)
    expect(screen.queryByText('Ejemplo')).not.toBeInTheDocument()

    rerender(<Report data={REPORTE} sample />)
    expect(screen.getByText('Ejemplo')).toBeInTheDocument()

    rerender(<Report data={{ ...REPORTE, sample: true }} />)
    expect(screen.getByText('Ejemplo')).toBeInTheDocument()

    rerender(<Report data={{ ...REPORTE, sample: true }} sample={false} />)
    expect(screen.queryByText('Ejemplo')).not.toBeInTheDocument()
  })

  it('pinta las acciones de la página en el banner', () => {
    render(<Report data={REPORTE} actions={<button type="button">Descargar PDF</button>} />)
    const banner = screen.getByRole('heading', { name: 'Valentina Ríos' }).closest('.st-report-banner') as HTMLElement
    expect(within(banner).getByRole('button', { name: 'Descargar PDF' })).toBeInTheDocument()
  })

  it('vacío: sin pruebas muestra un estado vacío (no un error)', () => {
    render(<Report data={{ ...REPORTE, tests: [], interview_questions: [] }} />)
    expect(screen.getByRole('heading', { name: 'Este reporte no tiene pruebas calificadas' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
    expect(screen.getByText(PIE_LEGAL)).toBeInTheDocument()
  })

  it('una prueba sin escalas avisa y conserva su integridad', () => {
    render(<Report data={{ ...REPORTE, tests: [{ name: 'Atención', integrity: { blur_count: 1 }, scales: [] }] }} />)
    const atencion = seccion('Atención')
    expect(within(atencion).getByText('Esta prueba no tiene escalas calificadas')).toBeInTheDocument()
    expect(within(atencion).queryByRole('tab')).not.toBeInTheDocument()
    expect(within(atencion).queryByRole('img')).not.toBeInTheDocument()
    expect(within(atencion).getByText(/vez\(ces\) que la pantalla perdió el foco/)).toHaveTextContent('1 vez(ces)')
  })
})
