import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Tag } from './Tag'

describe('Tag', () => {
  it('es una pastilla celeste md por defecto, sin punto', () => {
    render(<Tag>Empresas y equipos</Tag>)
    const tag = screen.getByText('Empresas y equipos')
    expect(tag).toHaveClass('st-tag', 'st-tag--sky', 'st-tag--md')
    expect(tag.querySelector('.st-live-dot')).toBeNull()
  })

  it('con dot pinta un punto fijo y con live uno con pulso, ambos decorativos', () => {
    const { rerender } = render(<Tag tone="coral" dot>Autoconocimiento</Tag>)
    let punto = screen.getByText('Autoconocimiento').querySelector('.st-live-dot')
    expect(punto).toHaveAttribute('aria-hidden', 'true')
    expect(punto).not.toHaveClass('st-live-dot--live')

    rerender(<Tag tone="surface" size="lg" live>Sin registro</Tag>)
    punto = screen.getByText('Sin registro').querySelector('.st-live-dot')
    expect(punto).toHaveClass('st-live-dot--live')
    expect(screen.getByText('Sin registro')).toHaveClass('st-tag--lead', 'st-tag--lg', 'st-tag--surface')
  })

  it('un ícono reemplaza al punto y queda oculto a lectores', () => {
    render(
      <Tag tone="coral" bordered icon={<svg data-testid="icono" />} dot>
        Cero fricción
      </Tag>,
    )
    const tag = screen.getByText('Cero fricción')
    expect(tag).toHaveClass('st-tag--bordered', 'st-tag--lead')
    expect(tag.querySelector('.st-tag__icon')).toHaveAttribute('aria-hidden', 'true')
    expect(tag.querySelector('.st-live-dot')).toBeNull()
  })

  it('mono y cuadrada para códigos', () => {
    render(
      <Tag mono shape="square" size="sm">
        ITEM-12
      </Tag>,
    )
    expect(screen.getByText('ITEM-12')).toHaveClass('st-tag--mono', 'st-tag--square', 'st-tag--sm')
  })

  it('cubre el chip de código del saldo (xs) y la insignia coral (xl)', () => {
    render(
      <>
        <Tag mono shape="square" size="xs">
          LID-360
        </Tag>
        <Tag tone="coral" size="xl" bordered icon={<svg />}>
          Sin crear cuenta
        </Tag>
      </>,
    )
    expect(screen.getByText('LID-360')).toHaveClass('st-tag--xs', 'st-tag--square', 'st-tag--sky')
    expect(screen.getByText('Sin crear cuenta')).toHaveClass('st-tag--xl', 'st-tag--coral', 'st-tag--bordered')
  })
})
