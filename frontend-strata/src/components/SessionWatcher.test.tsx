import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { EVENTO_SESION_VENCIDA } from '@/api/axios'
import { AVISO_SESION_VENCIDA } from './rutasDeSesion'
import SessionWatcher from './SessionWatcher'

function Ubicacion() {
  const { pathname, search, hash, state } = useLocation()
  return <pre data-testid="ubicacion">{JSON.stringify({ ruta: `${pathname}${search}${hash}`, state: state ?? null })}</pre>
}

function ubicacion(): { ruta: string; state: unknown } {
  return JSON.parse(screen.getByTestId('ubicacion').textContent ?? '{}')
}

function Atras() {
  const navigate = useNavigate()
  return (
    <button type="button" onClick={() => navigate(-1)}>
      Atrás
    </button>
  )
}

function montar(entradas: string[]) {
  return render(
    <MemoryRouter initialEntries={entradas} initialIndex={entradas.length - 1}>
      <SessionWatcher />
      <Routes>
        <Route path="*" element={<p>Pantalla</p>} />
      </Routes>
      <Ubicacion />
      <Atras />
    </MemoryRouter>,
  )
}

function vencerSesion() {
  act(() => {
    window.dispatchEvent(new CustomEvent(EVENTO_SESION_VENCIDA))
  })
}

describe('SessionWatcher', () => {
  it.each(['/app/creditos?pagina=2#movimientos', '/admin/usuarios', '/perfil'])(
    'en %s lleva a /login con la ruta de origen y el aviso',
    (ruta) => {
      montar([ruta])
      vencerSesion()
      expect(ubicacion()).toEqual({ ruta: '/login', state: { from: ruta, aviso: AVISO_SESION_VENCIDA } })
    },
  )

  it('en una página pública no navega', () => {
    montar(['/pruebas'])
    vencerSesion()
    expect(ubicacion()).toEqual({ ruta: '/pruebas', state: null })
  })

  it('reemplaza la entrada del historial: «Atrás» no regresa a la pantalla que falló', async () => {
    const user = userEvent.setup()
    montar(['/', '/app/evaluaciones/3'])
    vencerSesion()
    expect(ubicacion().ruta).toBe('/login')

    await user.click(screen.getByRole('button', { name: 'Atrás' }))
    expect(ubicacion().ruta).toBe('/')
  })

  it('deja de escuchar al desmontarse', () => {
    const { unmount } = montar(['/app'])
    unmount()
    expect(() => vencerSesion()).not.toThrow()
  })
})
