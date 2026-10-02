import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { InvitationRow } from '@/api/rh'
import { ToastProvider } from '@/components/ui'
import { ASUNTO_INVITACION, mensajeInvitacion } from '../invitaciones/mensaje'
import { ModalCompartir, type ModalCompartirProps } from './ModalCompartir'

const ENLACE = 'http://localhost:5173/evaluar/Lvpx1u6OcvNbil7ZnhYuLFbhCbZ1PGcQ42CVRM9p'

const INVITACION: InvitationRow = {
  id: 41,
  candidate: 'Ana Torres',
  email: 'ana.torres@acme.mx',
  status: 'pendiente',
  link: ENLACE,
}

function montar(props: Partial<ModalCompartirProps> = {}) {
  const user = userEvent.setup()
  const onClose = vi.fn()
  render(
    <ToastProvider>
      <ModalCompartir invitacion={INVITACION} fechaLimite="2026-10-15" onClose={onClose} {...props} />
    </ToastProvider>,
  )
  return { user, onClose }
}

/** Parámetros decodificados de un mailto:. */
function parametrosDe(href: string) {
  const [destino, consulta = ''] = href.slice('mailto:'.length).split('?')
  const pares = consulta.split('&').map((par) => par.split('='))
  return {
    destinatario: decodeURIComponent(destino),
    ...Object.fromEntries(pares.map(([clave, valor = '']) => [clave, decodeURIComponent(valor)])),
  } as { destinatario: string; subject?: string; body?: string }
}

const nota = () => screen.getByText(/La invitación ya se envió por correo/)
const enlaceCorreo = () => screen.getByRole('link', { name: 'Enviar por Correo a Ana Torres' })

describe('ModalCompartir', () => {
  afterEach(() => {
    Reflect.deleteProperty(window.navigator, 'clipboard')
  })

  it('muestra el enlace real en la tarjeta oscura, para quién es y el pie con la fecha límite', () => {
    montar()
    const dialogo = screen.getByRole('dialog', { name: 'Enlace de invitación' })
    expect(dialogo).toHaveAccessibleDescription(
      'Es el enlace personal de Ana Torres (ana.torres@acme.mx). Compártelo por el canal que prefieras.',
    )
    expect(within(dialogo).getByText(ENLACE)).toBeInTheDocument()
    expect(within(dialogo).getByRole('button', { name: 'Copiar enlace de invitación' })).toBeInTheDocument()
    expect(within(dialogo).getByRole('list', { name: 'Enviar por' })).toBeInTheDocument()
    expect(nota()).toHaveTextContent('La invitación ya se envió por correo. Fecha límite: 15 oct 2026.')
    expect(nota().querySelector('time')).toHaveAttribute('datetime', '2026-10-15')
    // Nada de lo que el prototipo simulaba: ni registro de licencias ni vencimiento fijo.
    expect(screen.queryByText(/Registrar en candidatos|licencia|14 días/)).not.toBeInTheDocument()
  })

  it('«Correo» abre un borrador al correo del candidato con asunto, el enlace y «Responde antes del…»', () => {
    montar()
    const href = enlaceCorreo().getAttribute('href') ?? ''
    expect(href.startsWith('mailto:ana.torres@acme.mx?')).toBe(true)
    const { destinatario, subject, body } = parametrosDe(href)
    expect(destinatario).toBe('ana.torres@acme.mx')
    expect(subject).toBe(ASUNTO_INVITACION)
    expect(body).toContain(ENLACE)
    expect(body).toContain('Hola, Ana Torres:')
    expect(body).toContain('Responde antes del 15/10/2026.')
    expect(enlaceCorreo()).not.toHaveAttribute('target')
  })

  it('«WhatsApp» abre wa.me con el mensaje y el enlace, en otra pestaña', () => {
    montar()
    const whatsapp = screen.getByRole('link', { name: 'Enviar por WhatsApp a Ana Torres (se abre en otra pestaña)' })
    expect(whatsapp).toHaveAttribute(
      'href',
      `https://wa.me/?text=${encodeURIComponent(mensajeInvitacion(INVITACION, '2026-10-15').join('\n'))}`,
    )
    expect(whatsapp).toHaveAttribute('target', '_blank')
    expect(whatsapp).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('«Copiar enlace» copia el enlace real y lo confirma con un toast', async () => {
    const { user } = montar()
    await user.click(screen.getByRole('button', { name: 'Copiar enlace de Ana Torres' }))
    await expect(navigator.clipboard.readText()).resolves.toBe(ENLACE)
    expect(await screen.findByText('Enlace copiado')).toBeInTheDocument()
  })

  it('la fila oscura también copia y confirma con el mismo toast', async () => {
    const { user } = montar()
    await user.click(screen.getByRole('button', { name: 'Copiar enlace de invitación' }))
    await expect(navigator.clipboard.readText()).resolves.toBe(ENLACE)
    expect(await screen.findByText('Enlace copiado')).toBeInTheDocument()
  })

  it('si el portapapeles falla, lo dice inline con ícono y texto, sin toast', async () => {
    const { user } = montar()
    Object.defineProperty(window.navigator, 'clipboard', {
      value: { writeText: () => Promise.reject(new Error('Sin permiso')) },
      configurable: true,
    })
    await user.click(screen.getByRole('button', { name: 'Copiar enlace de Ana Torres' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos copiar el enlace.')
    expect(screen.queryByText('Enlace copiado')).not.toBeInTheDocument()
  })

  it('sin fecha límite, el pie lo dice y el mensaje no la menciona', () => {
    montar({ fechaLimite: null })
    expect(nota()).toHaveTextContent('La invitación ya se envió por correo. Sin fecha límite.')
    const { body } = parametrosDe(enlaceCorreo().getAttribute('href') ?? '')
    expect(body).not.toContain('Responde antes')
  })

  it('si no se pudo saber la fecha límite, el pie no afirma nada sobre ella', () => {
    montar({ fechaLimite: undefined })
    expect(nota()).toHaveTextContent(/^La invitación ya se envió por correo\.$/)
  })

  it('«Cerrar» y Escape cierran el modal', async () => {
    const { user, onClose } = montar()
    await user.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(onClose).toHaveBeenCalledTimes(1)
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('sin invitación no se pinta nada', () => {
    montar({ invitacion: null })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
