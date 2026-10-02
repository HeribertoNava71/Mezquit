import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PasswordStrength, { PasswordStrength as PasswordStrengthConNombre } from './PasswordStrength'

function barrasEncendidas(container: HTMLElement) {
  return container.querySelectorAll('.st-password-strength__bar--on').length
}

describe('PasswordStrength', () => {
  it('sin contraseña no muestra nada', () => {
    const { container } = render(<PasswordStrength password="" />)
    expect(container).toBeEmptyDOMElement()
  })

  it.each([
    // Lógica de siempre: menos de 8 es Débil; con 8 o más, Media, y Fuerte con mayúscula o número.
    ['abc', 'Débil', 'debil', 1],
    ['Abcdef1', 'Débil', 'debil', 1],
    ['abcdefgh', 'Media', 'media', 2],
    ['Abcdefgh', 'Fuerte', 'fuerte', 3],
    ['abcdefg1', 'Fuerte', 'fuerte', 3],
    ['Abcdefg1', 'Fuerte', 'fuerte', 3],
  ])('«%s» es %s, con su tono y %i barras encendidas', (password, nivel, tono, barras) => {
    const { container } = render(<PasswordStrength password={password} />)
    expect(container.firstElementChild).toHaveClass('st-password-strength', `st-password-strength--${tono}`)
    expect(barrasEncendidas(container)).toBe(barras)
    // El nivel va en texto, nunca solo en color.
    expect(screen.getByText(nivel)).toHaveClass('st-password-strength__label')
  })

  it('las barras son decorativas y el nivel se lee completo y se anuncia con cortesía', () => {
    const { container } = render(<PasswordStrength password="abcdefgh" id="fuerza" />)
    expect(container.querySelector('.st-password-strength__bars')).toHaveAttribute('aria-hidden', 'true')
    const nivel = container.querySelector('#fuerza')
    expect(nivel).toHaveTextContent('Seguridad de la contraseña: Media')
    expect(nivel).toHaveAttribute('aria-live', 'polite')
  })

  it('se exporta también con nombre y acepta una clase extra', () => {
    const { container } = render(<PasswordStrengthConNombre password="abc" className="extra" />)
    expect(container.firstElementChild).toHaveClass('st-password-strength', 'extra')
  })
})
