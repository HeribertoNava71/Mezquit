import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { ESPERA_ANCLA_MS, ScrollToTop } from './ScrollToTop'

function Enlaces() {
  return (
    <nav>
      <Link to="/a">a</Link>
      <Link to="/b">b</Link>
      <Link to="/b?pagina=2">b con búsqueda</Link>
      <Link to="/b#seccion">b con ancla</Link>
      <Link to="/b#no-existe">b con ancla inexistente</Link>
      <Link to="/c#tardia">c con ancla tardía</Link>
      <Link to="/d#secci%C3%B3n">d con ancla codificada</Link>
    </nav>
  )
}

/** Pantalla cuyo ancla aparece después (como un contenido que llega de la API). */
function Tardia() {
  const [visible, setVisible] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setVisible(true)}>
        Cargar
      </button>
      {visible && <section id="tardia">Sección tardía</section>}
    </>
  )
}

function montar(inicial = '/a') {
  return render(
    <MemoryRouter initialEntries={[inicial]}>
      <ScrollToTop />
      <Enlaces />
      <Routes>
        <Route path="/a" element={<p>Página A</p>} />
        <Route path="/b" element={<section id="seccion">Sección B</section>} />
        <Route path="/c" element={<Tardia />} />
        <Route path="/d" element={<section id="sección">Sección D</section>} />
      </Routes>
    </MemoryRouter>,
  )
}

const ARRIBA_AL_INSTANTE = { top: 0, left: 0, behavior: 'instant' }

describe('ScrollToTop', () => {
  let scrollTo: MockInstance<typeof window.scrollTo>
  let scrollIntoView: MockInstance<Element['scrollIntoView']>

  beforeEach(() => {
    scrollTo = vi.spyOn(window, 'scrollTo')
    scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView')
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('sube al inicio al instante al montar y en cada ruta nueva', async () => {
    const user = userEvent.setup()
    montar('/a')
    expect(scrollTo).toHaveBeenCalledTimes(1)
    expect(scrollTo).toHaveBeenLastCalledWith(ARRIBA_AL_INSTANTE)

    await user.click(screen.getByRole('link', { name: 'b' }))
    expect(scrollTo).toHaveBeenCalledTimes(2)
    expect(scrollTo).toHaveBeenLastCalledWith(ARRIBA_AL_INSTANTE)
    expect(scrollIntoView).not.toHaveBeenCalled()
  })

  it('salta al #hash de una ruta nueva al instante, sin subir antes', async () => {
    const user = userEvent.setup()
    montar('/a')
    scrollTo.mockClear()

    await user.click(screen.getByRole('link', { name: 'b con ancla' }))
    expect(scrollIntoView).toHaveBeenCalledTimes(1)
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start', behavior: 'instant' })
    expect(scrollIntoView.mock.contexts[0]).toBe(screen.getByText('Sección B'))
    expect(scrollTo).not.toHaveBeenCalled()
  })

  it('en la misma ruta, un #hash nuevo usa el scroll de html (suave salvo con movimiento reducido)', async () => {
    const user = userEvent.setup()
    montar('/b')
    scrollTo.mockClear()

    await user.click(screen.getByRole('link', { name: 'b con ancla' }))
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start', behavior: 'auto' })
    expect(scrollTo).not.toHaveBeenCalled()
  })

  it('no mueve el scroll si solo cambia la búsqueda', async () => {
    const user = userEvent.setup()
    montar('/b')
    scrollTo.mockClear()

    await user.click(screen.getByRole('link', { name: 'b con búsqueda' }))
    expect(scrollTo).not.toHaveBeenCalled()
    expect(scrollIntoView).not.toHaveBeenCalled()
  })

  it('en la misma ruta, un ancla que no existe no mueve nada', async () => {
    const user = userEvent.setup()
    montar('/b')
    scrollTo.mockClear()

    await user.click(screen.getByRole('link', { name: 'b con ancla inexistente' }))
    expect(scrollTo).not.toHaveBeenCalled()
    expect(scrollIntoView).not.toHaveBeenCalled()
  })

  it('encuentra un ancla con el id codificado en la URL (acentos)', async () => {
    const user = userEvent.setup()
    montar('/a')

    await user.click(screen.getByRole('link', { name: 'd con ancla codificada' }))
    expect(scrollIntoView).toHaveBeenCalledTimes(1)
    expect(scrollIntoView.mock.contexts[0]).toBe(screen.getByText('Sección D'))
  })

  it('espera un ancla que aparece después y salta a ella', async () => {
    const user = userEvent.setup()
    montar('/a')
    scrollTo.mockClear()

    await user.click(screen.getByRole('link', { name: 'c con ancla tardía' }))
    // Mientras llega el ancla, la página nueva empieza arriba.
    expect(scrollTo).toHaveBeenCalledWith(ARRIBA_AL_INSTANTE)
    expect(scrollIntoView).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Cargar' }))
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledTimes(1))
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start', behavior: 'instant' })
    expect(scrollIntoView.mock.contexts[0]).toBe(screen.getByText('Sección tardía'))
  })

  it(`deja de esperar el ancla después de ${ESPERA_ANCLA_MS} ms`, async () => {
    vi.useFakeTimers()
    montar('/c#tardia')
    expect(scrollTo).toHaveBeenCalledWith(ARRIBA_AL_INSTANTE)

    act(() => {
      vi.advanceTimersByTime(ESPERA_ANCLA_MS)
    })
    fireEvent.click(screen.getByRole('button', { name: 'Cargar' }))
    await act(async () => {})

    expect(screen.getByText('Sección tardía')).toBeInTheDocument()
    expect(scrollIntoView).not.toHaveBeenCalled()
  })
})
