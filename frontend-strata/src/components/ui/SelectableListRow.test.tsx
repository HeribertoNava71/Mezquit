import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { SelectableListRow } from './SelectableListRow'

describe('SelectableListRow', () => {
  it('es un botón (type="button") que se marca como elegido y responde al clic', async () => {
    const user = userEvent.setup()
    const alElegir = vi.fn()
    const { rerender } = render(<SelectableListRow onClick={alElegir}>Colaboración</SelectableListRow>)

    const fila = screen.getByRole('button', { name: 'Colaboración' })
    expect(fila).toHaveAttribute('type', 'button')
    expect(fila).toHaveClass('st-select-row')
    expect(fila).not.toHaveClass('st-select-row--selected')

    await user.click(fila)
    expect(alElegir).toHaveBeenCalledTimes(1)

    rerender(
      <SelectableListRow selected onClick={alElegir}>
        Colaboración
      </SelectableListRow>,
    )
    expect(fila).toHaveClass('st-select-row--selected')
  })

  it('deja que la lista ponga la semántica y pasa la ref', () => {
    const ref = createRef<HTMLButtonElement>()
    render(
      <div role="tablist" aria-label="Escalas">
        <SelectableListRow ref={ref} role="tab" aria-selected selected tabIndex={0} className="extra">
          Orden
        </SelectableListRow>
      </div>,
    )
    const pestana = screen.getByRole('tab', { name: 'Orden', selected: true })
    expect(pestana).toBe(ref.current)
    expect(pestana).toHaveClass('st-select-row', 'st-select-row--selected', 'extra')
  })
})
