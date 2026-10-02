import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import type { PortalState, PortalTest } from '@/api/candidate'
import { AccesoVerificado, type AccesoVerificadoProps } from './AccesoVerificado'

const CON_REGRESO: PortalTest = { id: 1, name: 'Prueba de demostración', duration_min: 5, item_count: 12, allows_back: true }
const SIN_REGRESO: PortalTest = { id: 4, name: 'Estilos de trabajo', duration_min: 1, item_count: 1, allows_back: false }

function portalDe(parcial: Partial<PortalState> = {}): PortalState {
  return {
    status: 'pendiente',
    organization: 'Acme Talento',
    position: null,
    tests: [CON_REGRESO],
    consented: false,
    ...parcial,
  }
}

function montar(props: Partial<AccesoVerificadoProps> = {}) {
  const onIniciar = vi.fn()
  const onAceptaAvisoChange = vi.fn()
  render(
    <MemoryRouter>
      <AccesoVerificado
        portal={portalDe()}
        aceptaAviso={false}
        onAceptaAvisoChange={onAceptaAvisoChange}
        puedeIniciar={false}
        iniciando={false}
        error={null}
        onIniciar={onIniciar}
        {...props}
      />
    </MemoryRouter>,
  )
  return { user: userEvent.setup(), onIniciar, onAceptaAvisoChange }
}

describe('AccesoVerificado', () => {
  it('sin puesto, el título solo nombra a la organización', () => {
    montar()
    const titulo = screen.getByRole('heading', { level: 1 })
    expect(titulo).toHaveTextContent('Acme Talento te ha invitado a realizar una evaluación')
    expect(titulo.textContent).not.toMatch(/puesto/)
  })

  it('las instrucciones explican la escala con texto (sin reactivos de práctica, PB-31)', () => {
    montar()
    expect(screen.getByRole('heading', { level: 2, name: 'Antes de empezar' })).toBeInTheDocument()
    expect(screen.getByText(/escala de opciones/)).toBeInTheDocument()
    expect(screen.getByText('No hay respuestas correctas ni incorrectas.')).toBeInTheDocument()
    expect(screen.getByText('Puedes regresar a la pregunta anterior')).toBeInTheDocument()
  })

  it('sin allows_back, avisa que no se puede regresar; la duración usa el singular', () => {
    montar({ portal: portalDe({ tests: [SIN_REGRESO] }) })
    expect(screen.getByText('No podrás regresar a preguntas anteriores.')).toBeInTheDocument()
    expect(screen.getByText(/^1 minuto de duración estimada$/)).toBeInTheDocument()
    expect(screen.getByText('1 reactivo')).toBeInTheDocument()
  })

  it('con pruebas que permiten y no permiten regresar, lo advierte', () => {
    montar({ portal: portalDe({ tests: [CON_REGRESO, SIN_REGRESO] }) })
    expect(screen.getByText('En algunas pruebas no podrás regresar a la pregunta anterior.')).toBeInTheDocument()
    expect(screen.getByText(/Responderás 2 pruebas, una después de otra/)).toBeInTheDocument()
  })

  it('la casilla avisa del cambio; sin poder iniciar, el botón no hace nada', async () => {
    const { user, onAceptaAvisoChange, onIniciar } = montar()
    await user.click(screen.getByRole('checkbox', { name: /Acepto el tratamiento/ }))
    expect(onAceptaAvisoChange).toHaveBeenCalledWith(true)
    await user.click(screen.getByRole('button', { name: 'Iniciar evaluación' }))
    expect(onIniciar).not.toHaveBeenCalled()
  })

  it('sin pruebas, avisa y no ofrece iniciar', () => {
    montar({ portal: portalDe({ tests: [] }) })
    expect(screen.getByText(/Esta evaluación todavía no tiene pruebas/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /evaluación/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })
})
