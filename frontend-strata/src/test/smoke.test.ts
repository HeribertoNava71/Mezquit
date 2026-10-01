import { describe, expect, it } from 'vitest'

// Prueba de humo: confirma que Vitest, jsdom, jest-dom y el alias @ funcionan.
describe('entorno de pruebas', () => {
  it('corre en jsdom con los matchers de jest-dom', () => {
    const p = document.createElement('p')
    p.textContent = 'Strata'
    document.body.append(p)
    expect(p).toBeInTheDocument()
    expect(p).toHaveTextContent('Strata')
  })

  it('resuelve el alias @', async () => {
    const { cx } = await import('@/components/ui/cx')
    expect(cx('st-btn', false, 'st-btn--primary')).toBe('st-btn st-btn--primary')
  })

  it('expone matchMedia aunque jsdom no lo implemente', () => {
    expect(window.matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(false)
  })
})
