import { describe, expect, it } from 'vitest'
import { hasContent } from './hasContent'

describe('hasContent', () => {
  it('descarta null, undefined, false y el texto vacío', () => {
    expect(hasContent(null)).toBe(false)
    expect(hasContent(undefined)).toBe(false)
    expect(hasContent(false)).toBe(false)
    expect(hasContent('')).toBe(false)
  })

  it('acepta texto, números (también 0) y elementos', () => {
    expect(hasContent('Hola')).toBe(true)
    expect(hasContent(0)).toBe(true)
    expect(hasContent(<span />)).toBe(true)
  })
})
