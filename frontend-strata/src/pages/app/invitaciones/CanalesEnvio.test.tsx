import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CanalesEnvio } from './CanalesEnvio'

const INVITACION = {
  candidate: 'Karla Estrada',
  email: 'karla.estrada@example.com',
  link: 'http://localhost:5173/evaluar/8LtNq9s6T87PtfN6O5iQDAxrr5rRcxrN2YFvuxha',
}

function montar(fechaLimite: string | null = '2026-10-15') {
  const alCopiar = vi.fn()
  render(<CanalesEnvio invitacion={INVITACION} fechaLimite={fechaLimite} onCopiado={alCopiar} />)
  return { alCopiar }
}

describe('CanalesEnvio', () => {
  afterEach(() => {
    Reflect.deleteProperty(window.navigator, 'clipboard')
    Reflect.deleteProperty(document, 'execCommand')
  })

  it('ofrece Correo, WhatsApp y Copiar enlace como lista nombrada por «Enviar por»', () => {
    montar()
    const lista = screen.getByRole('list', { name: 'Enviar por' })
    expect(lista.querySelectorAll('li')).toHaveLength(3)

    const correo = screen.getByRole('link', { name: 'Enviar por Correo a Karla Estrada' })
    expect(correo.getAttribute('href')).toMatch(/^mailto:karla\.estrada@example\.com\?subject=/)
    expect(decodeURIComponent(correo.getAttribute('href') ?? '')).toContain('Responde antes del 15/10/2026.')
    expect(correo).not.toHaveAttribute('target')

    const whatsapp = screen.getByRole('link', { name: 'Enviar por WhatsApp a Karla Estrada (se abre en otra pestaña)' })
    expect(whatsapp.getAttribute('href')).toMatch(/^https:\/\/wa\.me\/\?text=/)
    expect(whatsapp.getAttribute('href')).toContain(encodeURIComponent(INVITACION.link))
    expect(whatsapp).toHaveAttribute('target', '_blank')
    expect(whatsapp).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('sin fecha límite, el mensaje no la menciona', () => {
    montar(null)
    const correo = screen.getByRole('link', { name: /Correo/ })
    expect(decodeURIComponent(correo.getAttribute('href') ?? '')).not.toContain('Responde antes')
  })

  it('copia el enlace real y avisa con onCopiado', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn(() => Promise.resolve())
    Object.defineProperty(window.navigator, 'clipboard', { value: { writeText }, configurable: true })
    const { alCopiar } = montar()

    await user.click(screen.getByRole('button', { name: 'Copiar enlace de Karla Estrada' }))
    expect(writeText).toHaveBeenCalledWith(INVITACION.link)
    expect(alCopiar).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('si no se puede copiar, lo dice aquí mismo con ícono y texto, sin confirmar (D-22)', async () => {
    const user = userEvent.setup()
    Object.defineProperty(window.navigator, 'clipboard', {
      value: { writeText: () => Promise.reject(new Error('Sin permiso')) },
      configurable: true,
    })
    Object.defineProperty(document, 'execCommand', { value: () => false, configurable: true })
    const { alCopiar } = montar()

    await user.click(screen.getByRole('button', { name: 'Copiar enlace de Karla Estrada' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos copiar el enlace.')
    expect(alCopiar).not.toHaveBeenCalled()
  })
})
