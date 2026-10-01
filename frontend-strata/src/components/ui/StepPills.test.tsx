import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { StepPills } from './StepPills'

const PASOS = ['Datos generales', 'Candidatos', 'Confirmación']

describe('StepPills', () => {
  it('marca el paso actual con aria-current="step" y los anteriores como hechos', () => {
    render(<StepPills steps={PASOS} current={1} aria-label="Pasos de la invitación" />)
    const lista = screen.getByRole('list', { name: 'Pasos de la invitación' })
    const items = within(lista).getAllByRole('listitem')
    expect(items).toHaveLength(3)

    expect(items[1]).toHaveAttribute('aria-current', 'step')
    expect(items[1]).toHaveClass('st-steps__item--active')
    expect(items[0]).not.toHaveAttribute('aria-current')
    expect(items[0]).toHaveClass('st-steps__item--done')
    expect(items[0]).toHaveTextContent('Datos generales (completado)')
    expect(items[2]).toHaveClass('st-steps__item--todo')
    // El número es decorativo: la lista ordenada ya dice la posición.
    expect(items[2].querySelector('.st-steps__number')).toHaveAttribute('aria-hidden', 'true')
    expect(items[2].querySelector('.st-steps__number')).toHaveTextContent('3')
  })

  it('con onStepSelect cada paso es un botón; el actual lleva aria-current', async () => {
    const user = userEvent.setup()
    const alElegir = vi.fn()
    render(<StepPills steps={PASOS} current={0} onStepSelect={alElegir} />)

    expect(screen.getByRole('button', { name: 'Datos generales' })).toHaveAttribute('aria-current', 'step')
    await user.click(screen.getByRole('button', { name: 'Confirmación' }))
    expect(alElegir).toHaveBeenCalledWith(2)
  })

  it('canSelectStep deja como texto los pasos que no se pueden elegir', () => {
    render(<StepPills steps={PASOS} current={1} onStepSelect={() => {}} canSelectStep={(indice) => indice <= 1} />)
    expect(screen.getAllByRole('button')).toHaveLength(2)
    expect(screen.queryByRole('button', { name: /Confirmación/ })).not.toBeInTheDocument()
    expect(screen.getByText('Confirmación').closest('li')).not.toHaveAttribute('aria-current')
  })

  it('acepta pasos hechos explícitos y objetos con id', () => {
    render(
      <StepPills
        steps={[{ label: 'Uno', id: 'uno' }, { label: 'Dos', id: 'dos' }, { label: 'Tres', id: 'tres' }]}
        current={0}
        completed={[2]}
      />,
    )
    expect(screen.getByText('Tres').closest('li')).toHaveClass('st-steps__item--done')
    expect(screen.getByText('Dos').closest('li')).toHaveClass('st-steps__item--todo')
  })
})
