import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SegmentedToggle } from './SegmentedToggle'

const modos = [
  { value: 'mi', label: 'Para mí (Sin registro)' },
  { value: 'empresa', label: 'Para mi Empresa (B2B)' },
] as const

const radio = (nombre: string) => screen.getByRole('radio', { name: nombre })

describe('SegmentedToggle', () => {
  it('es un radiogroup de dos opciones y el thumb sigue a la elegida', async () => {
    const user = userEvent.setup()
    const alCambiar = vi.fn()
    render(<SegmentedToggle aria-label="Tipo de cliente" options={modos} onChange={alCambiar} />)

    const grupo = screen.getByRole('radiogroup', { name: 'Tipo de cliente' })
    expect(radio('Para mí (Sin registro)')).toBeChecked()
    expect(grupo).not.toHaveClass('st-toggle--second')

    await user.click(screen.getByText('Para mi Empresa (B2B)'))
    expect(radio('Para mi Empresa (B2B)')).toBeChecked()
    expect(grupo).toHaveClass('st-toggle--second')
    expect(alCambiar).toHaveBeenCalledWith('empresa')
  })

  it('las flechas cambian de opción', async () => {
    const user = userEvent.setup()
    render(<SegmentedToggle aria-label="Tipo de cliente" options={modos} defaultValue="empresa" />)

    await user.tab()
    expect(radio('Para mi Empresa (B2B)')).toHaveFocus()
    await user.keyboard('{ArrowLeft}')
    expect(radio('Para mí (Sin registro)')).toBeChecked()
    expect(radio('Para mí (Sin registro)')).toHaveFocus()
    expect(screen.getByRole('radiogroup')).not.toHaveClass('st-toggle--second')
  })
})
