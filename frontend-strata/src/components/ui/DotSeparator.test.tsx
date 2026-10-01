import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DotSeparator } from './DotSeparator'

describe('DotSeparator', () => {
  it('es un punto decorativo con el tono por defecto', () => {
    const { container } = render(<DotSeparator />)
    const punto = container.firstElementChild
    expect(punto?.tagName).toBe('SPAN')
    expect(punto).toHaveAttribute('aria-hidden', 'true')
    expect(punto).toHaveClass('st-dot-sep')
    expect(punto?.className).toBe('st-dot-sep')
    expect(punto).toBeEmptyDOMElement()
  })

  it('acepta los tonos soft y on-dark, className y atributos', () => {
    const { container, rerender } = render(<DotSeparator tone="soft" className="extra" data-testid="punto" />)
    expect(container.firstElementChild).toHaveClass('st-dot-sep--soft', 'extra')
    expect(container.firstElementChild).toHaveAttribute('data-testid', 'punto')

    rerender(<DotSeparator tone="on-dark" />)
    expect(container.firstElementChild).toHaveClass('st-dot-sep--on-dark')
  })
})
