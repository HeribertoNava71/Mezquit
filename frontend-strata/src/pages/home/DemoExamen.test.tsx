import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { DemoExamen } from './DemoExamen'

function montar() {
  const { container } = render(
    <MemoryRouter>
      <DemoExamen />
    </MemoryRouter>,
  )
  return { container, user: userEvent.setup() }
}

describe('DemoExamen', () => {
  it('es una región de ejemplo con la pregunta como nombre del grupo de opciones', () => {
    montar()
    expect(screen.getByRole('region', { name: 'Ejemplo de una pregunta del examen' })).toBeInTheDocument()
    const grupo = screen.getByRole('radiogroup', { name: '¿Cómo prefieres resolver un conflicto complejo?' })
    expect(within(grupo).getAllByRole('radio')).toHaveLength(3)
  })

  it('empieza con la segunda opción marcada y cambia con clic y con flechas (estado local)', async () => {
    const { user } = montar()
    const segunda = screen.getByRole('radio', { name: 'Decido rápido con la información que tengo' })
    expect(segunda).toBeChecked()

    await user.click(screen.getByText('Escucho a las partes y busco el punto medio'))
    expect(screen.getByRole('radio', { name: 'Escucho a las partes y busco el punto medio' })).toBeChecked()
    expect(segunda).not.toBeChecked()

    await user.keyboard('{ArrowDown}')
    expect(segunda).toBeChecked()
  })

  it('«Siguiente» lleva a /evaluar y dice a dónde va', () => {
    montar()
    const siguiente = screen.getByRole('link', { name: /^Siguiente/ })
    expect(siguiente).toHaveAttribute('href', '/evaluar')
    expect(siguiente).toHaveAccessibleName('Siguiente: responde tu evaluación con tu enlace o código')
  })

  it('el contador, el progreso y las insignias son ilustrativos (aria-hidden)', () => {
    const { container } = montar()
    expect(screen.getByText('Pregunta 12 / 68').closest('[aria-hidden="true"]')).not.toBeNull()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(container.querySelector('.st-progress')).toHaveAttribute('aria-hidden', 'true')
    for (const insignia of container.querySelectorAll('.st-demo__badge')) {
      expect(insignia).toHaveAttribute('aria-hidden', 'true')
    }
  })

  it('las insignias no prometen correo al candidato (D-16)', () => {
    const { container } = montar()
    expect(screen.getByText('Respuesta guardada')).toBeInTheDocument()
    expect(screen.getByText('Reporte listo para RR. HH.')).toBeInTheDocument()
    expect(container).not.toHaveTextContent(/correo|email|enviado/i)
  })

  it('el radar mini tiene tres perfiles que se alternan', () => {
    const { container } = montar()
    expect(container.querySelectorAll('.st-demo__poly')).toHaveLength(3)
    expect(container.querySelector('.st-demo__radar')).toHaveAttribute('aria-hidden', 'true')
  })
})
