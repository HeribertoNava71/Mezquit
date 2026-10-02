import { render, screen } from '@testing-library/react'
import { createRef } from 'react'
import { describe, expect, it } from 'vitest'
import { TopBar } from './TopBar'

describe('TopBar', () => {
  it('es un header (banner) sticky con la fila centrada adentro', () => {
    render(
      <TopBar aria-label="Barra de RR. HH." innerClassName="fila" below={<div>Panel móvil</div>}>
        <nav className="st-topbar__nav">Navegación</nav>
      </TopBar>,
    )
    const barra = screen.getByRole('banner', { name: 'Barra de RR. HH.' })
    expect(barra).toHaveClass('st-topbar')
    expect(barra).not.toHaveClass('st-topbar--home')

    const fila = barra.firstElementChild
    expect(fila).toHaveClass('st-topbar__inner', 'fila')
    expect(fila).toContainElement(screen.getByText('Navegación'))
    // El contenido de below va dentro de la barra, después de la fila.
    expect(fila?.nextElementSibling).toHaveTextContent('Panel móvil')
  })

  it('variante home y ref al header', () => {
    const ref = createRef<HTMLElement>()
    render(
      <TopBar ref={ref} variant="home" className="extra">
        Inicio
      </TopBar>,
    )
    expect(ref.current).toBe(screen.getByRole('banner'))
    expect(ref.current).toHaveClass('st-topbar', 'st-topbar--home', 'extra')
  })
})
