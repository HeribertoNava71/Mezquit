import { render, screen } from '@testing-library/react'
import { useRef } from 'react'
import { describe, expect, it } from 'vitest'
import { useFocoAlRecuperar } from './useFocoAlRecuperar'

type Fase = 'carga' | 'error' | 'listo'

function Pantalla({ fase }: { fase: Fase }) {
  const destino = useRef<HTMLElement>(null)
  useFocoAlRecuperar(fase === 'error', fase === 'listo', destino)
  if (fase === 'error') return <button type="button">Reintentar</button>
  return (
    <section ref={destino} tabIndex={-1} aria-label="Contenido">
      <button type="button">Otro control</button>
    </section>
  )
}

describe('useFocoAlRecuperar', () => {
  it('al pasar de error a listo, lleva el foco al destino si había caído en <body>', () => {
    const { rerender } = render(<Pantalla fase="error" />)
    screen.getByRole('button', { name: 'Reintentar' }).focus()
    rerender(<Pantalla fase="carga" />)
    rerender(<Pantalla fase="listo" />)
    expect(screen.getByRole('region', { name: 'Contenido' })).toHaveFocus()
  })

  it('en la primera carga no mueve el foco', () => {
    const { rerender } = render(<Pantalla fase="carga" />)
    rerender(<Pantalla fase="listo" />)
    expect(document.body).toHaveFocus()
  })

  it('respeta el foco si la persona ya lo movió a otra parte', () => {
    const { rerender } = render(
      <>
        <button type="button">Afuera</button>
        <Pantalla fase="error" />
      </>,
    )
    screen.getByRole('button', { name: 'Afuera' }).focus()
    rerender(
      <>
        <button type="button">Afuera</button>
        <Pantalla fase="listo" />
      </>,
    )
    expect(screen.getByRole('button', { name: 'Afuera' })).toHaveFocus()
  })
})
