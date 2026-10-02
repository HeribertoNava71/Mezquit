import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import EvaluarLanding from './EvaluarLanding'

function PortalFalso() {
  const { token } = useParams()
  return <h1>Portal {token}</h1>
}

function montar() {
  render(
    <MemoryRouter initialEntries={['/evaluar']}>
      <Routes>
        <Route path="/evaluar" element={<EvaluarLanding />} />
        <Route path="/evaluar/:token" element={<PortalFalso />} />
      </Routes>
    </MemoryRouter>,
  )
  return userEvent.setup()
}

const campo = () => screen.getByRole('textbox', { name: 'Enlace o código' })

describe('EvaluarLanding (/evaluar)', () => {
  it('un solo campo «Enlace o código», mono y sin forzar mayúsculas; sin el toggle del prototipo', () => {
    montar()
    expect(screen.getByRole('heading', { level: 1, name: 'Ingresa tu enlace o código' })).toBeInTheDocument()
    const input = campo()
    expect(input.closest('.st-input')).toHaveClass('st-input--token')
    expect(input).toHaveAttribute('autocapitalize', 'none')
    expect(screen.queryByText(/Tengo un enlace/)).not.toBeInTheDocument()
    expect(screen.queryByText(/licencia/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continuar' })).toBeInTheDocument()
  })

  it('acepta el enlace completo y conserva mayúsculas y minúsculas del token', async () => {
    const user = montar()
    await user.type(campo(), 'https://strata.app/evaluar/AbCdEf123XyZ?utm=correo')
    await user.click(screen.getByRole('button', { name: 'Continuar' }))
    expect(await screen.findByRole('heading', { name: 'Portal AbCdEf123XyZ' })).toBeInTheDocument()
  })

  it('acepta el código solo y envía con Enter', async () => {
    const user = montar()
    await user.type(campo(), '  Lvpx1u6OcvNbil7ZnhYu  {Enter}')
    expect(await screen.findByRole('heading', { name: 'Portal Lvpx1u6OcvNbil7ZnhYu' })).toBeInTheDocument()
  })

  it.each([
    ['vacío', ''],
    ['con espacios y guiones', 'mi código 9B2X-88K1'],
  ])('con un valor que no sirve (%s) muestra el error en línea y no navega', async (_caso, valor) => {
    const user = montar()
    if (valor) await user.type(campo(), valor)
    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    const error = screen.getByRole('alert')
    expect(error).toHaveTextContent('Pega el enlace completo o el código que te dieron.')
    expect(error.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    expect(campo()).toHaveAttribute('aria-invalid', 'true')
    expect(campo()).toHaveAccessibleDescription('Pega el enlace completo o el código que te dieron.')
    expect(campo()).toHaveFocus()
    expect(screen.getByRole('heading', { level: 1, name: 'Ingresa tu enlace o código' })).toBeInTheDocument()

    // Al escribir, el error se va.
    await user.type(campo(), 'a')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('va dentro del marco del acceso: marca de Strata sin enlace y fila de enlaces', () => {
    montar()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Strata/ })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Aviso de privacidad' })).toHaveAttribute('href', '/aviso-de-privacidad')
    expect(screen.getByRole('link', { name: '¿Problemas con la prueba?' })).toHaveAttribute('href', '/ayuda')
  })
})
