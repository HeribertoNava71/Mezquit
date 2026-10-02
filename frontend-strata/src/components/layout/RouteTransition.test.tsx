import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { Link, MemoryRouter, Route, Routes, useParams } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { RouteTransition } from './RouteTransition'

/** Pantalla con estado propio: si se vuelve a montar, la cuenta regresa a 0. */
function Contador() {
  const { id } = useParams()
  const [cuenta, setCuenta] = useState(0)
  return (
    <>
      <h1>Prueba {id}</h1>
      <button type="button" onClick={() => setCuenta((n) => n + 1)}>
        Cuenta: {cuenta}
      </button>
    </>
  )
}

function montar(inicial: string) {
  return render(
    <MemoryRouter initialEntries={[inicial]}>
      <nav>
        <Link to="/p/1">uno</Link>
        <Link to="/p/1?orden=nombre">uno con búsqueda</Link>
        <Link to="/p/1#ancla">uno con ancla</Link>
        <Link to="/p/2">dos</Link>
      </nav>
      <Routes>
        <Route element={<RouteTransition />}>
          <Route path="/p/:id" element={<Contador />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

function envoltorio() {
  return screen.getByRole('heading', { level: 1 }).parentElement
}

describe('RouteTransition', () => {
  it('envuelve el Outlet con la entrada de pantalla', () => {
    montar('/p/1')
    expect(screen.getByRole('heading', { name: 'Prueba 1' })).toBeInTheDocument()
    expect(envoltorio()).toHaveClass('st-route')
    expect(envoltorio()).not.toHaveClass('st-route--anchor')
  })

  it('vuelve a montar la pantalla solo cuando cambia el pathname', async () => {
    const user = userEvent.setup()
    montar('/p/1')
    await user.click(screen.getByRole('button', { name: 'Cuenta: 0' }))
    const pantalla = envoltorio()

    // Ni la búsqueda ni el #ancla reinician la pantalla (ni su animación).
    await user.click(screen.getByRole('link', { name: 'uno con búsqueda' }))
    await user.click(screen.getByRole('link', { name: 'uno con ancla' }))
    expect(screen.getByRole('button', { name: 'Cuenta: 1' })).toBeInTheDocument()
    expect(envoltorio()).toBe(pantalla)
    expect(envoltorio()).not.toHaveClass('st-route--anchor')

    // Otra ruta: pantalla nueva, estado nuevo y animación otra vez.
    await user.click(screen.getByRole('link', { name: 'dos' }))
    expect(screen.getByRole('heading', { name: 'Prueba 2' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cuenta: 0' })).toBeInTheDocument()
    expect(envoltorio()).not.toBe(pantalla)
  })

  it('si la pantalla llega con #ancla solo funde, y lo conserva aunque el hash cambie', async () => {
    const user = userEvent.setup()
    montar('/p/1#ancla')
    expect(envoltorio()).toHaveClass('st-route', 'st-route--anchor')

    await user.click(screen.getByRole('link', { name: 'uno' }))
    expect(envoltorio()).toHaveClass('st-route--anchor')

    await user.click(screen.getByRole('link', { name: 'dos' }))
    expect(envoltorio()).toHaveClass('st-route')
    expect(envoltorio()).not.toHaveClass('st-route--anchor')
  })

  it('acepta children en lugar del Outlet y una clase extra', () => {
    render(
      <MemoryRouter>
        <RouteTransition className="extra">
          <h1>Contenido directo</h1>
        </RouteTransition>
      </MemoryRouter>,
    )
    expect(envoltorio()).toHaveClass('st-route', 'extra')
  })
})
