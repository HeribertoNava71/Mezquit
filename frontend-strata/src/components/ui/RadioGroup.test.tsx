import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { RadioCard } from './RadioCard'
import { RadioGroup } from './RadioGroup'

const radio = (nombre: string) => screen.getByRole('radio', { name: nombre })

function Asignacion({ alCambiar }: { alCambiar?: (valor: string) => void }) {
  const [valor, setValor] = useState('')
  return (
    <RadioGroup
      label="Test a aplicar"
      value={valor}
      onChange={(siguiente) => {
        setValor(siguiente)
        alCambiar?.(siguiente)
      }}
    >
      <RadioCard value="liderazgo" label="Liderazgo situacional" aside="12 libres" />
      <RadioCard value="personalidad" label="Personalidad" description="Cinco factores" />
      <RadioCard value="cognitivo" label="Razonamiento" disabled />
      <RadioCard value="conductual" label="Conductual" />
    </RadioGroup>
  )
}

describe('RadioGroup y RadioCard', () => {
  it('es un radiogroup con nombre y radios nativos con su descripción', () => {
    render(<Asignacion />)
    expect(screen.getByRole('radiogroup', { name: 'Test a aplicar' })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(4)
    expect(radio('Liderazgo situacional')).toHaveAccessibleDescription('12 libres')
    expect(radio('Personalidad')).toHaveAccessibleDescription('Cinco factores')
    expect(radio('Razonamiento')).toBeDisabled()
  })

  it('las flechas mueven la selección y saltan las opciones deshabilitadas', async () => {
    const user = userEvent.setup()
    const alCambiar = vi.fn()
    render(<Asignacion alCambiar={alCambiar} />)

    await user.tab()
    expect(radio('Liderazgo situacional')).toHaveFocus()

    await user.keyboard('{ArrowDown}')
    expect(radio('Personalidad')).toBeChecked()
    expect(radio('Personalidad')).toHaveFocus()

    await user.keyboard('{ArrowDown}')
    expect(radio('Conductual')).toBeChecked()
    expect(radio('Personalidad')).not.toBeChecked()

    await user.keyboard('{ArrowUp}')
    expect(radio('Personalidad')).toBeChecked()
    expect(alCambiar).toHaveBeenLastCalledWith('personalidad')
    expect(alCambiar).toHaveBeenCalledTimes(3)
  })

  it('Tab entra a la opción elegida y un clic en la tarjeta la elige', async () => {
    const user = userEvent.setup()
    render(
      <>
        <button type="button">Antes</button>
        <RadioGroup label="Modo de envío" defaultValue="link" indicator="none" orientation="horizontal">
          <RadioCard value="email" label="Por correo" description="Strata envía el código." />
          <RadioCard value="link" label="Link de licencia" description="Copias un enlace de un solo uso." />
        </RadioGroup>
      </>,
    )
    await user.click(screen.getByRole('button', { name: 'Antes' }))
    await user.tab()
    expect(radio('Link de licencia')).toHaveFocus()
    expect(radio('Link de licencia')).toBeChecked()

    await user.click(screen.getByText('Strata envía el código.'))
    expect(radio('Por correo')).toBeChecked()

    const tarjeta = radio('Por correo').closest('label')
    expect(tarjeta).toHaveClass('st-radio-card--plain')
    expect(tarjeta?.querySelector('.st-radio-card__radio')).toBeNull()
  })

  it('las opciones del examen usan el tamaño lg con su aro', () => {
    render(
      <RadioGroup label="Me gusta tomar decisiones rápidas" hideLabel size="lg" required>
        <RadioCard value="1" label="Totalmente en desacuerdo" aside="1" />
        <RadioCard value="5" label="Totalmente de acuerdo" aside="5" />
      </RadioGroup>,
    )
    const grupo = screen.getByRole('radiogroup', { name: 'Me gusta tomar decisiones rápidas' })
    expect(grupo).toHaveAttribute('aria-required', 'true')
    const tarjeta = radio('Totalmente de acuerdo').closest('label')
    expect(tarjeta).toHaveClass('st-radio-card--lg')
    expect(tarjeta?.querySelector('.st-radio-card__radio')).toHaveAttribute('aria-hidden', 'true')
    expect(radio('Totalmente de acuerdo')).toBeRequired()
  })

  it('un aria-labelledby propio nombra el grupo con el título visible', () => {
    render(
      <>
        <h2 id="pregunta-3">Me gusta tomar decisiones rápidas</h2>
        <RadioGroup label="Pregunta 3" hideLabel aria-labelledby="pregunta-3" size="lg">
          <RadioCard value="1" label="Totalmente en desacuerdo" aside="1" />
        </RadioGroup>
      </>,
    )
    expect(screen.getByRole('radiogroup', { name: 'Me gusta tomar decisiones rápidas' })).toBeInTheDocument()
  })

  it('el error marca el grupo y lo describe', () => {
    render(
      <RadioGroup label="Método" error="Elige un método.">
        <RadioCard value="a" label="Transferencia" />
      </RadioGroup>,
    )
    const grupo = screen.getByRole('radiogroup', { name: 'Método' })
    expect(grupo).toHaveAttribute('aria-invalid', 'true')
    expect(grupo).toHaveAccessibleDescription('Elige un método.')
  })

  it('RadioCard funciona fuera de un grupo con name propio', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <RadioCard name="densidad" value="comoda" label="Cómoda" defaultChecked />
        <RadioCard name="densidad" value="compacta" label="Compacta" />
      </div>,
    )
    expect(radio('Cómoda')).toBeChecked()
    await user.click(screen.getByText('Compacta'))
    expect(radio('Compacta')).toBeChecked()
    expect(radio('Cómoda')).not.toBeChecked()
  })
})
