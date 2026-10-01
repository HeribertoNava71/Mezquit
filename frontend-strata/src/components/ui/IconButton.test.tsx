import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { IconButton } from './IconButton'

describe('IconButton', () => {
  it('toma su nombre de aria-label y oculta el ícono', () => {
    render(
      <IconButton aria-label="Cerrar">
        <svg data-testid="icono" />
      </IconButton>,
    )
    const boton = screen.getByRole('button', { name: 'Cerrar' })
    expect(boton).toHaveAttribute('type', 'button')
    expect(boton).toHaveClass('st-icon-btn', 'st-icon-btn--md')
    expect(screen.getByTestId('icono').parentElement).toHaveAttribute('aria-hidden', 'true')
  })

  it('el tamaño sm es el botón de copiar', () => {
    render(
      <IconButton aria-label="Copiar código" size="sm">
        <svg />
      </IconButton>,
    )
    expect(screen.getByRole('button', { name: 'Copiar código' })).toHaveClass('st-icon-btn--sm')
  })

  it('ejecuta onClick y, deshabilitado, no', async () => {
    const user = userEvent.setup()
    const alHacerClic = vi.fn()
    const { rerender } = render(
      <IconButton aria-label="Copiar enlace" onClick={alHacerClic}>
        <svg />
      </IconButton>,
    )
    await user.click(screen.getByRole('button', { name: 'Copiar enlace' }))
    expect(alHacerClic).toHaveBeenCalledTimes(1)

    rerender(
      <IconButton aria-label="Copiar enlace" onClick={alHacerClic} disabled>
        <svg />
      </IconButton>,
    )
    const boton = screen.getByRole('button', { name: 'Copiar enlace' })
    expect(boton).toHaveAttribute('aria-disabled', 'true')
    await user.click(boton)
    expect(alHacerClic).toHaveBeenCalledTimes(1)
  })
})
