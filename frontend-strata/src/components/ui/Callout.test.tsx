import { render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it } from 'vitest'
import { Callout } from './Callout'

describe('Callout', () => {
  it('sin live es contenido estático (sin role de región viva)', () => {
    render(<Callout title="Variables disponibles">Usa {'{nombre}'} en el texto.</Callout>)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByText('Variables disponibles')).toBeInTheDocument()
  })

  it('live="alert" usa role="alert" y live="status" usa role="status"', () => {
    const { rerender } = render(
      <Callout tone="error" live="alert" title="No pudimos enviar la solicitud">
        Revisa tu conexión e inténtalo de nuevo.
      </Callout>,
    )
    const alerta = screen.getByRole('alert')
    expect(alerta).toHaveTextContent('No pudimos enviar la solicitud')
    expect(alerta).toHaveTextContent('Revisa tu conexión e inténtalo de nuevo.')
    expect(alerta).toHaveClass('st-callout', 'st-callout--error')

    rerender(
      <Callout tone="success" live="status">
        Solicitud registrada. Un asesor la revisará.
      </Callout>,
    )
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Solicitud registrada. Un asesor la revisará.')
  })

  it('lleva ícono decorativo por tono; icon={null} lo quita y neutral no lleva', () => {
    const { container, rerender } = render(<Callout tone="warning">Aviso</Callout>)
    const icono = container.querySelector('.st-callout__icon')
    expect(icono).toHaveAttribute('aria-hidden', 'true')
    expect(icono?.querySelector('svg')).toBeInTheDocument()

    rerender(
      <Callout tone="warning" icon={null}>
        Aviso
      </Callout>,
    )
    expect(container.querySelector('.st-callout__icon')).not.toBeInTheDocument()

    rerender(<Callout tone="neutral">Interpretación</Callout>)
    expect(container.querySelector('.st-callout__icon')).not.toBeInTheDocument()
  })

  it('el banner dark agrega st-on-dark (foco claro) y muestra las acciones', () => {
    render(
      <Callout tone="dark" title="Examen finalizado · Reporte generado" actions={<a href="/app">Volver al panel</a>}>
        Valentina Ríos · Liderazgo Situacional
      </Callout>,
    )
    const enlace = screen.getByRole('link', { name: 'Volver al panel' })
    const banner = enlace.closest('.st-callout')
    expect(banner).toHaveClass('st-callout--dark', 'st-on-dark')
  })

  it('size="sm" usa la variante compacta y pasa className y atributos', () => {
    render(
      <Callout size="sm" className="extra" data-prueba="pista" id="pista">
        Variables disponibles
      </Callout>,
    )
    const caja = document.getElementById('pista')
    expect(caja).toHaveClass('st-callout--info', 'st-callout--sm', 'extra')
    expect(caja).toHaveAttribute('data-prueba', 'pista')
  })

  it('acepta ref para llevar el foco al aviso tras un envío fallido', () => {
    const ref = createRef<HTMLDivElement>()
    render(
      <Callout ref={ref} tone="error" live="alert" tabIndex={-1} title="No pudimos enviar la solicitud">
        Revisa tu conexión.
      </Callout>,
    )
    expect(ref.current).toBe(screen.getByRole('alert'))
    ref.current?.focus()
    expect(screen.getByRole('alert')).toHaveFocus()
  })
})
