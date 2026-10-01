import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Checkbox } from './Checkbox'

function Consentimiento({ alCambiar }: { alCambiar?: (marcado: boolean) => void }) {
  const [marcado, setMarcado] = useState(false)
  return (
    <Checkbox
      variant="consent"
      checked={marcado}
      onChange={(evento) => {
        setMarcado(evento.target.checked)
        alCambiar?.(evento.target.checked)
      }}
      label={
        <>
          Acepto el tratamiento de mis respuestas y el <a href="#aviso">aviso de privacidad</a>.
        </>
      }
    />
  )
}

describe('Checkbox', () => {
  it('es un checkbox nativo que se marca con clic y con Espacio', async () => {
    const user = userEvent.setup()
    render(<Checkbox label="Recordarme" description="En este equipo" />)
    const casilla = screen.getByRole('checkbox', { name: 'Recordarme' })
    expect(casilla).not.toBeChecked()
    expect(casilla).toHaveAccessibleDescription('En este equipo')

    await user.click(screen.getByText('Recordarme'))
    expect(casilla).toBeChecked()

    await user.keyboard(' ')
    expect(casilla).not.toBeChecked()
  })

  it('el consentimiento empieza sin marcar y el enlace no lo marca', async () => {
    const user = userEvent.setup()
    const alCambiar = vi.fn()
    render(<Consentimiento alCambiar={alCambiar} />)
    const casilla = screen.getByRole('checkbox', { name: /Acepto el tratamiento de mis respuestas/ })
    expect(casilla).not.toBeChecked()
    expect(casilla.closest('label')).toHaveClass('st-checkbox--consent')

    // El enlace abre el aviso sin marcar la casilla. Aquí va fireEvent y no
    // user-event: user-event 14 reenvía al control cualquier clic dentro de un
    // <label>, incluso sobre un enlace. Los navegadores y jsdom siguen la
    // especificación de HTML: el label no se activa si el clic cae en contenido
    // interactivo (un <a href>, un botón).
    fireEvent.click(screen.getByRole('link', { name: 'aviso de privacidad' }))
    expect(casilla).not.toBeChecked()
    expect(alCambiar).not.toHaveBeenCalled()

    // Toda la tarjeta es clicable.
    await user.click(screen.getByText(/Acepto el tratamiento/))
    expect(casilla).toBeChecked()
    expect(alCambiar).toHaveBeenLastCalledWith(true)
  })

  it('el error marca aria-invalid y describe la casilla', () => {
    render(<Checkbox label="Acepto el aviso de privacidad" error="Acepta el aviso para continuar." />)
    const casilla = screen.getByRole('checkbox', { name: 'Acepto el aviso de privacidad' })
    expect(casilla).toHaveAttribute('aria-invalid', 'true')
    expect(casilla).toHaveAccessibleDescription('Acepta el aviso para continuar.')
    expect(screen.getByRole('alert')).toHaveTextContent('Acepta el aviso para continuar.')
  })

  it('deshabilitado no cambia', async () => {
    const user = userEvent.setup()
    render(<Checkbox label="Administrador" disabled />)
    const casilla = screen.getByRole('checkbox', { name: 'Administrador' })
    await user.click(casilla)
    expect(casilla).toBeDisabled()
    expect(casilla).not.toBeChecked()
  })
})
