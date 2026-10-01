import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LiveDot } from './LiveDot'

describe('LiveDot', () => {
  it('es decorativo y late por defecto; blink y none cambian el pulso', () => {
    const { container, rerender } = render(<LiveDot />)
    const punto = container.firstElementChild
    expect(punto?.tagName).toBe('SPAN')
    expect(punto).toHaveAttribute('aria-hidden', 'true')
    expect(punto).toHaveClass('st-live-dot', 'st-live-dot--sky', 'st-live-dot--size-7', 'st-live-dot--live')

    rerender(<LiveDot tone="sky-strong" size={6} pulse="blink" />)
    expect(container.firstElementChild).toHaveClass('st-live-dot--sky-strong', 'st-live-dot--blink', 'st-live-dot--size-6')

    rerender(<LiveDot pulse="none" />)
    expect(container.firstElementChild).not.toHaveClass('st-live-dot--live')
    expect(container.firstElementChild).not.toHaveClass('st-live-dot--blink')
  })

  it('el ritmo solo aplica cuando el punto late', () => {
    const { container, rerender } = render(<LiveDot tempo="slow" />)
    expect(container.firstElementChild).toHaveClass('st-live-dot--live', 'st-live-dot--tempo-slow')

    rerender(<LiveDot pulse="blink" tempo="fast" />)
    expect(container.firstElementChild).toHaveClass('st-live-dot--blink', 'st-live-dot--tempo-fast')

    rerender(<LiveDot pulse="none" tempo="fast" />)
    expect(container.firstElementChild?.className).not.toMatch(/tempo/)
  })

  it('pasa className y atributos al punto', () => {
    const { container } = render(<LiveDot tone="success" size={5} className="extra" data-testid="punto" />)
    const punto = container.firstElementChild
    expect(punto).toHaveClass('st-live-dot--success', 'st-live-dot--size-5', 'extra')
    expect(punto).toHaveAttribute('data-testid', 'punto')
  })
})
