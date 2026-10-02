import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthUser } from '@/api/auth'
import { Hero } from './Hero'

const sesion = vi.hoisted(() => ({ user: null as AuthUser | null, loading: false }))

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: sesion.user, loading: sesion.loading, setUser: vi.fn() }),
}))

const RR_HH: AuthUser = {
  id: 3,
  name: 'Mariana',
  last_name: 'Ruiz',
  email: 'mariana@empresa.mx',
  role: 'admin',
  organization_id: 4,
  is_platform_admin: false,
}

function montar(props: Partial<Parameters<typeof Hero>[0]> = {}) {
  render(
    <MemoryRouter>
      <Hero duracion="10–25 min por prueba" {...props} />
    </MemoryRouter>,
  )
  return userEvent.setup()
}

const acciones = () => screen.getByRole('link', { name: /tengo un código|crear cuenta de empresa/i }).parentElement as HTMLElement

beforeEach(() => {
  sesion.user = null
  sesion.loading = false
})

describe('Hero', () => {
  it('titular de 52 px con su ref y la marca para la mascota', () => {
    const tituloRef = createRef<HTMLHeadingElement>()
    montar({ tituloRef })
    const titulo = screen.getByRole('heading', { level: 1 })
    expect(titulo).toHaveTextContent('Descubre lo que llevas dentro. O encuentra a quien lo tiene.')
    expect(titulo).toHaveClass('st-hero__title')
    expect(titulo).toHaveAttribute('data-mascota-titular')
    expect(tituloRef.current).toBe(titulo)
    expect(screen.getByRole('region', { name: /descubre lo que llevas dentro/i })).toContainElement(titulo)
  })

  it('empieza en «Para mí»: «Tengo un código» → /evaluar y «Cómo funciona» → /como-funciona', () => {
    montar()
    expect(screen.getByRole('radio', { name: 'Para mí' })).toBeChecked()
    expect(screen.getByText(/te invitó una empresa\? responde con el enlace que te envió, sin crear cuenta/i)).toBeInTheDocument()
    const enlaces = within(acciones()).getAllByRole('link')
    expect(enlaces.map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
      ['Tengo un código', '/evaluar'],
      ['Cómo funciona', '/como-funciona'],
    ])
  })

  it('el selector cambia la entradilla, el CTA y el enlace al modo empresa, y regresa', async () => {
    const user = montar()
    await user.click(screen.getByRole('radio', { name: 'Para mi empresa' }))
    expect(screen.getByRole('radio', { name: 'Para mi empresa' })).toBeChecked()
    expect(screen.getByText(/crea evaluaciones, envía enlaces únicos a tus candidatos/i)).toBeInTheDocument()
    expect(within(acciones()).getAllByRole('link').map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
      ['Crear cuenta de empresa', '/registro'],
      ['Entrar al portal de RR. HH.', '/login'],
    ])

    await user.click(screen.getByRole('radio', { name: 'Para mí' }))
    expect(screen.getByRole('link', { name: 'Tengo un código' })).toHaveAttribute('href', '/evaluar')
    expect(screen.queryByRole('link', { name: 'Crear cuenta de empresa' })).not.toBeInTheDocument()
  })

  it('las flechas también cambian de modo (radios nativos)', async () => {
    const user = montar()
    screen.getByRole('radio', { name: 'Para mí' }).focus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('radio', { name: 'Para mi empresa' })).toBeChecked()
    expect(screen.getByRole('link', { name: 'Crear cuenta de empresa' })).toBeInTheDocument()
  })

  it('con sesión, «Entrar al portal de RR. HH.» lleva a /app', async () => {
    sesion.user = RR_HH
    const user = montar()
    await user.click(screen.getByRole('radio', { name: 'Para mi empresa' }))
    expect(screen.getByRole('link', { name: 'Entrar al portal de RR. HH.' })).toHaveAttribute('href', '/app')
  })

  it('anuncia la entradilla nueva en una región viva', async () => {
    const user = montar()
    const region = screen.getByText(/te invitó una empresa/i).parentElement
    expect(region).toHaveAttribute('aria-live', 'polite')
    await user.click(screen.getByRole('radio', { name: 'Para mi empresa' }))
    expect(region).toHaveTextContent(/crea evaluaciones/i)
  })

  it('marca los CTA y el selector como objetivos de la mascota', () => {
    montar()
    expect(screen.getByRole('radiogroup', { name: '¿Para quién es?' })).toHaveAttribute('data-mascota-objetivo')
    expect(screen.getByRole('link', { name: 'Tengo un código' })).toHaveAttribute('data-mascota-objetivo')
    expect(screen.getByRole('link', { name: 'Cómo funciona' })).toHaveAttribute('data-mascota-objetivo')
  })

  it('fila de confianza con tres afirmaciones verdaderas y la duración recibida', () => {
    montar()
    const items = screen.getAllByRole('listitem').map((li) => li.textContent)
    expect(items).toEqual(['10–25 min por prueba', 'Reporte para RR. HH.', 'Guardado automático'])
  })

  it('no promete compras, precios, correo al candidato ni cifrado (D-13, D-16, D-18)', async () => {
    const user = montar()
    const textos = () => document.body.textContent ?? ''
    for (const modo of ['Para mí', 'Para mi empresa']) {
      await user.click(screen.getByRole('radio', { name: modo }))
      expect(textos()).not.toMatch(/\$|USD|comprar|pago|correo|email|PDF|cifrad|sin registro/i)
    }
  })

  it('pinta la columna derecha que recibe', () => {
    render(
      <MemoryRouter>
        <Hero duracion="Duración según la prueba" aside={<p>Demo del examen</p>} />
      </MemoryRouter>,
    )
    expect(screen.getByText('Demo del examen').parentElement).toHaveClass('st-hero__aside')
    expect(screen.getByText('Duración según la prueba')).toBeInTheDocument()
  })
})
