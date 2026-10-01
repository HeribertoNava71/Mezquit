import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatCard } from './StatCard'
import { Tag } from './Tag'

describe('StatCard', () => {
  it('muestra rótulo, cifra, unidad, ayuda y la barra con nombre', () => {
    render(
      <StatCard
        label="Créditos disponibles"
        value={12}
        unit="de 30"
        help="18 usados este mes"
        meta={<Tag tone="sky" shape="square" size="sm" mono>CRED</Tag>}
        progress={{ value: 12, max: 30, label: 'Créditos libres', valueText: '12 de 30' }}
      />,
    )
    expect(screen.getByText('Créditos disponibles')).toHaveClass('st-stat__label')
    expect(screen.getByText('12')).toHaveClass('st-stat__value')
    expect(screen.getByText('de 30')).toHaveClass('st-stat__unit')
    expect(screen.getByText('18 usados este mes')).toHaveClass('st-stat__help')
    expect(screen.getByText('CRED')).toHaveClass('st-tag--mono')
    const barra = screen.getByRole('progressbar', { name: 'Créditos libres' })
    expect(barra).toHaveAttribute('aria-valuenow', '12')
    expect(barra).toHaveAttribute('aria-valuemax', '30')
    expect(barra).toHaveClass('st-progress--track-divider', 'st-progress--sky-strong')
  })

  it('sin label la barra es decorativa (el valor ya está en texto)', () => {
    render(<StatCard label="Saldo" value={8} unit="de 20 libres" progress={{ value: 8, max: 20 }} />)
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('la cifra puede ir en mono', () => {
    render(<StatCard label="Código" value="LID-360" valueFont="mono" />)
    expect(screen.getByText('LID-360')).toHaveClass('st-stat__value', 'st-stat__value--mono')
  })

  it('por defecto la cifra va en General Sans (sin modificador); heading la pasa a Satoshi', () => {
    const { rerender } = render(<StatCard label="Saldo" value={12} />)
    expect(screen.getByText('12')).toHaveClass('st-stat__value')
    expect(screen.getByText('12')).not.toHaveClass('st-stat__value--heading', 'st-stat__value--mono')
    rerender(<StatCard label="Saldo" value={12} valueFont="heading" />)
    expect(screen.getByText('12')).toHaveClass('st-stat__value', 'st-stat__value--heading')
    rerender(<StatCard layout="inline" label="Enviadas" value={4} valueFont="heading" />)
    expect(screen.getByText('4')).toHaveClass('st-stat__badge', 'st-stat__badge--heading')
  })

  it('el diseño inline pone la cifra en el cuadro numérico con su tono', () => {
    render(<StatCard layout="inline" tone="sky" label="Enviadas" value={4} help="esperando al candidato" />)
    expect(screen.getByText('4')).toHaveClass('st-stat__badge', 'st-stat__badge--sky')
    expect(screen.getByText('Enviadas').closest('.st-stat')).toHaveClass('st-stat--inline', 'st-card--glass')
  })
})
