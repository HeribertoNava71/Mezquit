import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SegmentedFilter } from './SegmentedFilter'

const estados = [
  { value: 'todas', label: 'Todas', count: 24 },
  { value: 'disponible', label: 'Disponible', count: 9 },
  { value: 'consumida', label: 'Consumida' },
]

describe('SegmentedFilter', () => {
  it('marca la activa con aria-pressed y cambia al hacer clic', async () => {
    const user = userEvent.setup()
    const alCambiar = vi.fn()
    render(<SegmentedFilter aria-label="Filtrar por estado" options={estados} onChange={alCambiar} />)

    expect(screen.getByRole('group', { name: 'Filtrar por estado' })).toBeInTheDocument()
    const todas = screen.getByRole('button', { name: 'Todas 24' })
    const disponible = screen.getByRole('button', { name: 'Disponible 9' })
    expect(todas).toHaveAttribute('aria-pressed', 'true')
    expect(disponible).toHaveAttribute('aria-pressed', 'false')

    await user.click(disponible)
    expect(disponible).toHaveAttribute('aria-pressed', 'true')
    expect(todas).toHaveAttribute('aria-pressed', 'false')
    expect(alCambiar).toHaveBeenCalledWith('disponible')

    // Volver a pulsar la activa no la apaga ni avisa otra vez.
    await user.click(disponible)
    expect(disponible).toHaveAttribute('aria-pressed', 'true')
    expect(alCambiar).toHaveBeenCalledTimes(1)
  })

  it('se usa con el teclado', async () => {
    const user = userEvent.setup()
    render(<SegmentedFilter aria-label="Categoría" options={estados} defaultValue="consumida" size="sm" />)
    expect(screen.getByRole('button', { name: 'Consumida' })).toHaveAttribute('aria-pressed', 'true')

    await user.tab()
    expect(screen.getByRole('button', { name: 'Todas 24' })).toHaveFocus()
    await user.keyboard(' ')
    expect(screen.getByRole('button', { name: 'Todas 24' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('controlado: manda la prop value', async () => {
    const user = userEvent.setup()
    const alCambiar = vi.fn()
    render(<SegmentedFilter aria-label="Estado" options={estados} value="todas" onChange={alCambiar} />)
    await user.click(screen.getByRole('button', { name: 'Consumida' }))
    expect(alCambiar).toHaveBeenCalledWith('consumida')
    expect(screen.getByRole('button', { name: 'Todas 24' })).toHaveAttribute('aria-pressed', 'true')
  })
})
