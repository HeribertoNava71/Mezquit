import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Badge } from './Badge'
import { PageHeader } from './PageHeader'

describe('PageHeader', () => {
  it('renderiza el título como h1 por defecto, con eyebrow, entradilla y acciones', () => {
    render(
      <PageHeader
        eyebrow="Paso 3 de 3 · Asignación y seguimiento"
        title="Candidatos y exámenes asignados"
        lede="Estado de cada invitación en tiempo real."
        actions={<button type="button">Invitar candidatos</button>}
      />,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Candidatos y exámenes asignados' })).toHaveClass(
      'st-page-header__title',
    )
    expect(screen.getByText('Paso 3 de 3 · Asignación y seguimiento')).toHaveClass('st-page-header__eyebrow')
    expect(screen.getByText('Estado de cada invitación en tiempo real.')).toHaveClass('st-page-header__lede')
    expect(screen.getByRole('button', { name: 'Invitar candidatos' }).parentElement).toHaveClass(
      'st-page-header__actions',
    )
  })

  it('cambia el nivel del título con level sin cambiar su clase', () => {
    render(<PageHeader title="Créditos" level={2} />)
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Créditos' })).toHaveClass('st-page-header__title')
  })

  it('pone el estado junto al eyebrow y omite lo que no recibe', () => {
    const { container } = render(
      <PageHeader eyebrow="Test Builder" status={<Badge size="sm">Borrador</Badge>} title="Liderazgo Situacional" />,
    )
    const kicker = container.querySelector('.st-page-header__kicker')
    expect(kicker).toContainElement(screen.getByText('Test Builder'))
    expect(kicker).toContainElement(screen.getByText('Borrador'))
    expect(container.querySelector('.st-page-header__lede')).toBeNull()
    expect(container.querySelector('.st-page-header__actions')).toBeNull()
  })

  it('usa header como contenedor y acepta div, className y atributos', () => {
    const { container, rerender } = render(<PageHeader title="Resultados" className="extra" id="encabezado" />)
    const raiz = container.firstElementChild
    expect(raiz?.tagName).toBe('HEADER')
    expect(raiz).toHaveClass('st-page-header', 'extra')
    expect(raiz).toHaveAttribute('id', 'encabezado')
    rerender(<PageHeader title="Resultados" as="div" />)
    expect(container.firstElementChild?.tagName).toBe('DIV')
  })
})
