import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EstadoCarga } from './EstadoCarga'

describe('EstadoCarga', () => {
  it('inline: role="status" con spinner decorativo y «Cargando…» visible', () => {
    render(<EstadoCarga />)
    const estado = screen.getByRole('status')
    expect(estado).toHaveTextContent('Cargando…')
    expect(estado).toHaveClass('st-carga--inline')
    expect(estado.querySelector('.st-carga__spinner')).toHaveAttribute('aria-hidden', 'true')
  })

  it('bloque: esqueleto de N líneas, oculto a lectores, con el texto solo para ellos', () => {
    render(<EstadoCarga variant="bloque" count={5} label="Cargando movimientos…" />)
    const estado = screen.getByRole('status')
    expect(estado).toHaveTextContent('Cargando movimientos…')
    expect(screen.getByText('Cargando movimientos…')).toHaveClass('st-visually-hidden')

    const lineas = estado.querySelector('.st-carga__lineas')
    expect(lineas).toHaveAttribute('aria-hidden', 'true')
    expect(lineas?.querySelectorAll('.st-carga__linea')).toHaveLength(5)
  })

  it('bloque de tarjetas y límites del conteo', () => {
    const { container, rerender } = render(<EstadoCarga variant="bloque" skeleton="tarjetas" count={3} />)
    expect(container.querySelectorAll('.st-carga__tarjeta')).toHaveLength(3)

    rerender(<EstadoCarga variant="bloque" skeleton="tarjetas" count={0} />)
    expect(container.querySelectorAll('.st-carga__tarjeta')).toHaveLength(1)

    rerender(<EstadoCarga variant="bloque" count={40} />)
    expect(container.querySelectorAll('.st-carga__linea')).toHaveLength(12)
  })
})
