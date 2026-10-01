import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Textarea } from './Textarea'

describe('Textarea', () => {
  it('asocia el rótulo, usa 3 filas y acepta texto', async () => {
    const user = userEvent.setup()
    render(<Textarea label="Descripción para el catálogo" />)
    const campo = screen.getByRole('textbox', { name: 'Descripción para el catálogo' })
    expect(campo).toHaveAttribute('rows', '3')
    await user.type(campo, 'Mide estilo directivo.')
    expect(campo).toHaveValue('Mide estilo directivo.')
  })

  it('el error marca aria-invalid y describe el campo', () => {
    render(<Textarea label="Candidatos" hint="Una línea por candidato" error="Falta el correo en la línea 2." />)
    const campo = screen.getByRole('textbox', { name: 'Candidatos' })
    expect(campo).toHaveAttribute('aria-invalid', 'true')
    expect(campo).toHaveAccessibleDescription('Falta el correo en la línea 2. Una línea por candidato')
    expect(screen.getByRole('alert')).toHaveTextContent('Falta el correo en la línea 2.')
  })

  it('valid muestra el check', () => {
    render(<Textarea label="Nota" valid />)
    const caja = screen.getByRole('textbox', { name: 'Nota' }).parentElement
    expect(caja).toHaveClass('st-textarea--valid')
    expect(caja?.querySelector('.st-textarea__check')).not.toBeNull()
  })
})
