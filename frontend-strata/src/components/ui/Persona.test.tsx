import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Persona } from './Persona'

describe('Persona', () => {
  it('muestra el avatar decorativo con iniciales, el nombre y la segunda línea', () => {
    const { container } = render(<Persona name="Valentina Ríos" detail="valentina.rios@example.com" className="extra" />)
    expect(container.firstElementChild).toHaveClass('st-persona', 'extra')
    const avatar = container.querySelector('.st-avatar')
    expect(avatar).toHaveAttribute('aria-hidden', 'true')
    expect(avatar).toHaveClass('st-avatar--square', 'st-avatar--sky', 'st-avatar--md')
    expect(avatar).toHaveTextContent('VR')
    expect(screen.getByText('Valentina Ríos')).toHaveClass('st-persona__nombre')
    expect(screen.getByText('valentina.rios@example.com')).toHaveClass('st-persona__detalle')
  })

  it('sin detalle no pinta la segunda línea', () => {
    const { container } = render(<Persona name="Ana Torres" detail="" />)
    expect(container.querySelector('.st-persona__detalle')).toBeNull()
  })
})
