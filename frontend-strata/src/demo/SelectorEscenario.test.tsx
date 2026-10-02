import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthUser } from '@/api/auth'
import SelectorEscenario from './SelectorEscenario'

// Pastilla del modo demo (npm run dev:mock). GET /__mock se simula con fetch;
// la sesión, con useAuth.

const sesion = vi.hoisted(() => ({ user: null as AuthUser | null }))

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: sesion.user, loading: false, setUser: vi.fn() }),
}))

const ESTADO = {
  activo: 'rh',
  inicial: 'visitante',
  escenarios: [
    { nombre: 'visitante', descripcion: 'Visitante sin sesión' },
    { nombre: 'rh', descripcion: 'RR. HH.' },
    { nombre: 'candidato-404', descripcion: 'Token que no existe' },
  ],
  retardo: { min: 250, max: 400 },
}

type RespuestaSimulada = { ok: boolean; json: () => Promise<unknown> }
let respuesta: RespuestaSimulada
const fetchSimulado = vi.fn<(url: string, opciones?: RequestInit) => Promise<RespuestaSimulada>>(async () => respuesta)

beforeEach(() => {
  sesion.user = null
  respuesta = { ok: true, json: async () => structuredClone(ESTADO) }
  fetchSimulado.mockClear()
  vi.stubGlobal('fetch', fetchSimulado)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function montar(ruta = '/app/creditos?filtro=pendientes#tabla') {
  const vista = render(
    <MemoryRouter initialEntries={[ruta]}>
      <button type="button">Fuera</button>
      <Routes>
        <Route path="*" element={<SelectorEscenario />} />
      </Routes>
    </MemoryRouter>,
  )
  return { ...vista, user: userEvent.setup() }
}

const pastilla = () => screen.findByRole('button', { name: 'Modo demo, escenario rh' })

describe('SelectorEscenario', () => {
  it('muestra «Modo demo · <escenario>» con el escenario activo de GET /__mock', async () => {
    montar()
    const boton = await pastilla()
    expect(boton).toHaveTextContent(/^Modo demo · rh$/)
    expect(within(boton).getByText('rh')).toHaveClass('st-modo-demo__activo')
    expect(boton).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('complementary', { name: 'Modo demo' })).toContainElement(boton)
    expect(fetchSimulado).toHaveBeenCalledWith('/__mock', expect.objectContaining({ headers: { Accept: 'application/json' } }))
  })

  it('sin el servidor del modo demo no muestra nada', async () => {
    respuesta = { ok: false, json: async () => ({}) }
    montar()
    await waitFor(() => expect(fetchSimulado).toHaveBeenCalled())
    expect(screen.queryByRole('complementary', { name: 'Modo demo' })).not.toBeInTheDocument()
  })

  it('al abrir lista los escenarios con enlaces que recargan con ?escenario= en la misma ruta', async () => {
    const { user } = montar()
    await user.click(await pastilla())
    expect(await pastilla()).toHaveAttribute('aria-expanded', 'true')

    const escenarios = within(screen.getByRole('region', { name: 'Escenario' }))
    const visitante = escenarios.getByRole('link', { name: /visitante/ })
    expect(visitante).toHaveAttribute('href', '/app/creditos?filtro=pendientes&escenario=visitante#tabla')
    expect(visitante).toHaveTextContent('Visitante sin sesión')
    expect(visitante).not.toHaveAttribute('aria-current')
    expect(escenarios.getByRole('link', { name: /^rh/ })).toHaveAttribute('aria-current', 'true')
    // Las variantes del candidato abren el portal: solo cambian /evaluar.
    expect(escenarios.getByRole('link', { name: /candidato-404/ })).toHaveAttribute('href', '/evaluar/demo?escenario=candidato-404')
  })

  it('dentro del portal del candidato, las variantes recargan la misma invitación', async () => {
    const { user } = montar('/evaluar/abc123')
    await user.click(await pastilla())
    expect(screen.getByRole('link', { name: /candidato-404/ })).toHaveAttribute('href', '/evaluar/abc123?escenario=candidato-404')
  })

  it('trae los atajos a Inicio, /app, /admin/creditos y /evaluar/demo, y cómo entrar con cada rol', async () => {
    const { user } = montar()
    await user.click(await pastilla())
    const atajos = within(screen.getByRole('region', { name: 'Ir a' }))
    expect(atajos.getByRole('link', { name: /Inicio/ })).toHaveAttribute('href', '/')
    expect(atajos.getByRole('link', { name: /Panel de RR\. HH\./ })).toHaveAttribute('href', '/app')
    expect(atajos.getByRole('link', { name: /Super admin/ })).toHaveAttribute('href', '/admin/creditos')
    expect(atajos.getByRole('link', { name: /Candidato/ })).toHaveAttribute('href', '/evaluar/demo')
    expect(screen.getByText(/cualquier correo entra como RR\. HH\./)).toBeInTheDocument()
  })

  it('un atajo navega y cierra el panel', async () => {
    const { user } = montar()
    await user.click(await pastilla())
    await user.click(screen.getByRole('link', { name: /Super admin/ }))
    expect(await pastilla()).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('region', { name: 'Escenario' })).not.toBeInTheDocument()
  })

  it('Escape cierra y devuelve el foco a la pastilla; un clic fuera también cierra', async () => {
    const { user } = montar()
    await user.click(await pastilla())
    await user.tab()
    expect(screen.getByRole('link', { name: /visitante/ })).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('region', { name: 'Escenario' })).not.toBeInTheDocument()
    expect(await pastilla()).toHaveFocus()

    await user.click(await pastilla())
    await user.click(screen.getByRole('button', { name: 'Fuera' }))
    expect(screen.queryByRole('region', { name: 'Escenario' })).not.toBeInTheDocument()
  })

  it('vuelve a preguntar el escenario al abrir y cuando cambia la sesión (login, registro o salida)', async () => {
    const { user, rerender } = montar()
    await pastilla()
    expect(fetchSimulado).toHaveBeenCalledTimes(1)

    await user.click(await pastilla())
    await waitFor(() => expect(fetchSimulado).toHaveBeenCalledTimes(2))
    await user.keyboard('{Escape}')

    // Después de entrar como super admin, el servidor ya responde con «admin».
    respuesta = { ok: true, json: async () => ({ ...structuredClone(ESTADO), activo: 'admin' }) }
    sesion.user = { id: 1, name: 'Daniela', email: 'daniela@example.org', role: 'admin', organization_id: 1, is_platform_admin: true }
    await act(async () => {
      rerender(
        <MemoryRouter initialEntries={['/app/creditos']}>
          <button type="button">Fuera</button>
          <Routes>
            <Route path="*" element={<SelectorEscenario />} />
          </Routes>
        </MemoryRouter>,
      )
    })
    expect(await screen.findByRole('button', { name: 'Modo demo, escenario admin' })).toBeInTheDocument()
  })
})
