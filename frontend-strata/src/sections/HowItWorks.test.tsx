import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HowItWorks } from './HowItWorks'

describe('HowItWorks', () => {
  it('sección «Cómo funciona» con la insignia del candidato y el ancla #como-funciona', () => {
    const { container } = render(<HowItWorks className="extra" />)
    const seccion = screen.getByRole('region', { name: 'Cómo funciona' })
    expect(seccion).toHaveAttribute('id', 'como-funciona')
    expect(seccion).toHaveClass('st-how', 'extra')
    expect(within(seccion).getByText('El candidato responde sin crear cuenta')).toHaveClass('st-tag--coral')
    expect(container.querySelector('.st-tag__icon svg')).not.toBeNull()
  })

  it('tres pasos en orden, fieles al flujo real: crear, responder con el enlace y leer el reporte', () => {
    render(<HowItWorks />)
    const pasos = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(pasos.map((paso) => within(paso).getByRole('heading', { level: 3 }).textContent)).toEqual([
      'Creas la evaluación',
      'El candidato responde con su enlace',
      'Lees e imprimes el reporte',
    ])
    // Los cuatro pasos del sitio anterior quedan dentro de estos tres.
    expect(pasos[0]).toHaveTextContent(/pruebas del catálogo/)
    expect(pasos[0]).toHaveTextContent(/enlace único/)
    expect(pasos[0]).toHaveTextContent(/WhatsApp/)
    expect(pasos[1]).toHaveTextContent(/celular o laptop, sin descargas ni crear cuenta/)
    expect(pasos[1]).toHaveTextContent(/retomar con el mismo enlace/)
    expect(pasos[2]).toHaveTextContent(/resultados por escala con su interpretación/)
    // La numeración visible es decorativa: la lista ordenada ya la da.
    expect(within(pasos[0]).getByText('01')).toHaveAttribute('aria-hidden', 'true')
  })

  it('no promete el reporte por correo ni al candidato, ni pagos (C-09, D-16)', () => {
    const { container } = render(<HowItWorks />)
    expect(container).not.toHaveTextContent(/PDF|en tu correo|tu informe|pago|suscripci/i)
    expect(container).not.toHaveTextContent(/reporte[^.]*correo/i)
  })
})
