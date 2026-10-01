import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Stepper } from './Stepper'

describe('Stepper', () => {
  it('respeta min y max con los botones y conserva el foco en los límites', async () => {
    const user = userEvent.setup()
    const alCambiar = vi.fn()
    render(<Stepper label="Cantidad" min={1} max={3} defaultValue={2} onChange={alCambiar} />)

    expect(screen.getByRole('group', { name: 'Cantidad' })).toBeInTheDocument()
    const campo = screen.getByRole('spinbutton', { name: 'Cantidad' })
    const menos = screen.getByRole('button', { name: 'Disminuir' })
    const mas = screen.getByRole('button', { name: 'Aumentar' })
    expect(campo).toHaveValue(2)
    expect(campo).toHaveAttribute('min', '1')
    expect(campo).toHaveAttribute('max', '3')

    await user.click(mas)
    expect(campo).toHaveValue(3)
    expect(mas).toHaveAttribute('aria-disabled', 'true')

    await user.click(mas)
    expect(campo).toHaveValue(3)
    expect(mas).toHaveFocus()
    expect(alCambiar).toHaveBeenCalledTimes(1)
    expect(alCambiar).toHaveBeenLastCalledWith(3)

    await user.click(menos)
    await user.click(menos)
    expect(campo).toHaveValue(1)
    expect(menos).toHaveAttribute('aria-disabled', 'true')
    await user.click(menos)
    expect(campo).toHaveValue(1)
    expect(alCambiar).toHaveBeenLastCalledWith(1)
    expect(alCambiar).toHaveBeenCalledTimes(3)
  })

  it('ajusta al rango lo que se escribe al salir del campo', async () => {
    const user = userEvent.setup()
    const alCambiar = vi.fn()
    render(<Stepper label="Créditos" min={1} max={50} defaultValue={5} onChange={alCambiar} />)
    const campo = screen.getByRole('spinbutton', { name: 'Créditos' })

    await user.clear(campo)
    await user.type(campo, '80')
    expect(alCambiar).toHaveBeenLastCalledWith(8)
    await user.tab()
    expect(campo).toHaveValue(50)
    expect(alCambiar).toHaveBeenLastCalledWith(50)

    await user.clear(campo)
    await user.tab()
    expect(campo).toHaveValue(50)
  })

  it('anuncia el valor nuevo al usar los botones', async () => {
    const user = userEvent.setup()
    const { container } = render(<Stepper label="Peso" min={0} max={5} defaultValue={1} size="sm" />)
    await user.click(screen.getByRole('button', { name: 'Aumentar' }))
    const vivo = container.querySelector('[aria-live="polite"]')
    expect(vivo).toHaveTextContent('2')
    expect(container.querySelector('.st-stepper')).toHaveClass('st-stepper--sm')
  })

  it('controlado: muestra el valor de la prop', async () => {
    const user = userEvent.setup()
    function Controlado() {
      const [cantidad, setCantidad] = useState(10)
      return (
        <>
          <Stepper label="Licencias" min={1} value={cantidad} onChange={setCantidad} />
          <output>{cantidad}</output>
        </>
      )
    }
    render(<Controlado />)
    await user.click(screen.getByRole('button', { name: 'Aumentar' }))
    expect(screen.getByRole('spinbutton', { name: 'Licencias' })).toHaveValue(11)
    expect(screen.getByRole('status')).toHaveTextContent('11')
  })

  it('deshabilitado bloquea botones e input', async () => {
    const user = userEvent.setup()
    const alCambiar = vi.fn()
    render(<Stepper label="Cantidad" defaultValue={2} disabled onChange={alCambiar} />)
    expect(screen.getByRole('spinbutton', { name: 'Cantidad' })).toBeDisabled()
    const mas = screen.getByRole('button', { name: 'Aumentar' })
    expect(mas).toHaveAttribute('aria-disabled', 'true')
    await user.click(mas)
    expect(alCambiar).not.toHaveBeenCalled()
  })
})
