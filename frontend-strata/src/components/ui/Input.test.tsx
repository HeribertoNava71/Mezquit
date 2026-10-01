import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, it } from 'vitest'
import { Input } from './Input'

describe('Input', () => {
  it('asocia el rótulo con el input', () => {
    render(<Input label="Nombre del test" defaultValue="Liderazgo 360" />)
    const campo = screen.getByRole('textbox', { name: 'Nombre del test' })
    expect(campo).toHaveValue('Liderazgo 360')
    expect(campo).not.toHaveAttribute('aria-invalid')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('el error marca aria-invalid y se enlaza con aria-describedby, con ícono y texto', () => {
    render(<Input label="Correo electrónico" type="email" error="Escribe un correo válido." />)
    const campo = screen.getByRole('textbox', { name: 'Correo electrónico' })
    const error = screen.getByRole('alert')

    expect(campo).toHaveAttribute('aria-invalid', 'true')
    expect(error).toHaveTextContent('Escribe un correo válido.')
    expect(campo.getAttribute('aria-describedby')?.split(' ')).toContain(error.id)
    expect(campo).toHaveAccessibleDescription('Escribe un correo válido.')
    expect(error.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    expect(campo.closest('.st-input')).toHaveClass('st-input--invalid')
  })

  it('describe con el error, la ayuda, el prefijo y el aria-describedby propio', () => {
    render(
      <>
        <p id="nota">Sin IVA.</p>
        <Input
          label="Precio por licencia"
          hint="En pesos mexicanos"
          prefix="$"
          error="Escribe un número."
          aria-describedby="nota"
        />
      </>,
    )
    const campo = screen.getByRole('textbox', { name: 'Precio por licencia' })
    expect(campo).toHaveAccessibleDescription('Escribe un número. En pesos mexicanos $ Sin IVA.')
  })

  it('valid muestra el check, salvo que haya error', () => {
    const { rerender } = render(<Input label="Nombre completo" size="lg" valid />)
    const caja = screen.getByRole('textbox', { name: 'Nombre completo' }).closest('.st-input')
    expect(caja).toHaveClass('st-input--valid', 'st-input--lg')
    expect(caja?.querySelector('.st-input__check svg')).toHaveAttribute('aria-hidden', 'true')

    rerender(<Input label="Nombre completo" size="lg" valid error="Falta tu apellido." />)
    expect(caja).not.toHaveClass('st-input--valid')
    expect(caja?.querySelector('.st-input__check')).toBeNull()
  })

  it('required usa el atributo nativo y el asterisco no entra en el nombre', () => {
    render(<Input label="Nombre" required />)
    const campo = screen.getByRole('textbox', { name: 'Nombre' })
    expect(campo).toBeRequired()
    expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true')
  })

  it('hideLabel conserva el nombre accesible', () => {
    render(<Input label="Código de licencia" hideLabel variant="code" placeholder="9B2X-88K1" />)
    const campo = screen.getByRole('textbox', { name: 'Código de licencia' })
    expect(screen.getByText('Código de licencia')).toHaveClass('st-visually-hidden')
    expect(campo).toHaveAttribute('autocomplete', 'off')
    expect(campo).toHaveAttribute('spellcheck', 'false')
    expect(campo.closest('.st-input')).toHaveClass('st-input--code')
  })

  it('un clic en el ícono lleva el foco al input', async () => {
    const user = userEvent.setup()
    render(<Input label="Correo" icon={<svg data-testid="icono" />} />)
    await user.click(screen.getByTestId('icono'))
    expect(screen.getByRole('textbox', { name: 'Correo' })).toHaveFocus()
  })

  it('pasa ref, inputClassName y los atributos al <input>; className va al contenedor', () => {
    const ref = createRef<HTMLInputElement>()
    const { container } = render(
      <Input ref={ref} label="Desde" variant="mono" size="sm" className="campo" inputClassName="dato" name="min" />,
    )
    const campo = screen.getByRole('textbox', { name: 'Desde' })
    expect(ref.current).toBe(campo)
    expect(campo).toHaveClass('st-input__field', 'dato')
    expect(campo).toHaveAttribute('name', 'min')
    expect(container.firstElementChild).toHaveClass('st-field', 'campo')
  })
})
