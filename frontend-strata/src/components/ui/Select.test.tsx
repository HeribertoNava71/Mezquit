import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Select } from './Select'

const sectores = [
  { value: 'salud', label: 'Salud' },
  { value: 'retail', label: 'Retail' },
  { value: 'gobierno', label: 'Gobierno', disabled: true },
]

describe('Select', () => {
  it('asocia el rótulo, pinta el placeholder y las opciones y permite elegir', async () => {
    const user = userEvent.setup()
    render(<Select label="Sector" placeholder="Elige un sector" options={sectores} defaultValue="" />)
    const select = screen.getByRole('combobox', { name: 'Sector' })
    expect(select).toHaveValue('')
    expect(screen.getByRole('option', { name: 'Elige un sector' })).toBeEnabled()
    expect(screen.getByRole('option', { name: 'Gobierno' })).toBeDisabled()

    await user.selectOptions(select, 'retail')
    expect(select).toHaveValue('retail')
  })

  it('acepta <option> como hijos', () => {
    render(
      <Select label="Rol" defaultValue="admin">
        <option value="member">Miembro</option>
        <option value="admin">Administrador</option>
      </Select>,
    )
    expect(screen.getByRole('combobox', { name: 'Rol' })).toHaveValue('admin')
  })

  it('required deshabilita la opción vacía y el error marca aria-invalid', () => {
    render(<Select label="Tamaño" placeholder="Elige" options={sectores} required error="Elige un tamaño." />)
    const select = screen.getByRole('combobox', { name: 'Tamaño' })
    expect(select).toBeRequired()
    expect(screen.getByRole('option', { name: 'Elige' })).toBeDisabled()
    expect(select).toHaveAttribute('aria-invalid', 'true')
    expect(select).toHaveAccessibleDescription('Elige un tamaño.')
  })

  it('con placeholder y sin valor inicial arranca en la opción vacía, aunque sea required', () => {
    render(<Select label="Industria" placeholder="Elige una industria" options={sectores} required />)
    expect(screen.getByRole('combobox', { name: 'Industria' })).toHaveValue('')
  })
})
