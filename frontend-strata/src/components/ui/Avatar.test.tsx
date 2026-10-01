import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Avatar } from './Avatar'
import { getInitials } from './initials'

describe('getInitials', () => {
  it.each([
    ['Valentina Ríos', 'VR'],
    ['Dr. Luis Ordóñez', 'LO'],
    ['  ángel   núñez  ', 'ÁN'],
    ['Acme', 'A'],
    ['(Sofía) Navarro', 'SN'],
    ['', ''],
  ])('«%s» → «%s»', (nombre, iniciales) => {
    expect(getInitials(nombre)).toBe(iniciales)
  })

  it('respeta el máximo de letras', () => {
    expect(getInitials('Acme Talento', 1)).toBe('A')
  })
})

describe('Avatar', () => {
  it('es decorativo por defecto: círculo navy con las iniciales, oculto a lectores', () => {
    const { container } = render(<Avatar name="Mariana Robles" />)
    const avatar = container.firstElementChild
    expect(avatar).toHaveTextContent('MR')
    expect(avatar).toHaveAttribute('aria-hidden', 'true')
    expect(avatar).toHaveClass('st-avatar--circle', 'st-avatar--navy', 'st-avatar--sm')
  })

  it('con decorative={false} se anuncia como imagen con el nombre completo', () => {
    render(<Avatar name="Valentina Ríos" decorative={false} shape="square" tone="sky" size="md" />)
    const avatar = screen.getByRole('img', { name: 'Valentina Ríos' })
    expect(avatar).toHaveTextContent('VR')
    expect(avatar).toHaveClass('st-avatar--square', 'st-avatar--sky', 'st-avatar--md')
  })

  it('con una sola inicial usa la variante de marca', () => {
    const { container } = render(<Avatar name="Acme Talento" initials="A" shape="square" />)
    expect(container.firstElementChild).toHaveClass('st-avatar--single')
    expect(container.firstElementChild).toHaveTextContent('A')
  })
})
