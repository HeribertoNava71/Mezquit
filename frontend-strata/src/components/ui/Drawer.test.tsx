import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Drawer, type DrawerProps } from './Drawer'

type DemoProps = Partial<Omit<DrawerProps, 'open' | 'onClose'>> & { alCerrar?: () => void }

function Demo({ alCerrar, ...props }: DemoProps) {
  const [abierto, setAbierto] = useState(false)
  const cerrar = () => {
    alCerrar?.()
    setAbierto(false)
  }
  return (
    <>
      <button type="button" onClick={() => setAbierto(true)}>
        Solicitar créditos
      </button>
      <Drawer
        open={abierto}
        onClose={cerrar}
        title="Solicitar créditos"
        description="Un asesor revisará tu solicitud."
        footer={<button type="button">Enviar solicitud</button>}
        footerNote="El saldo cambia cuando se aprueba."
        {...props}
      >
        <input aria-label="Cantidad" />
      </Drawer>
    </>
  )
}

const boton = (nombre: string) => screen.getByRole('button', { name: nombre })

describe('Drawer', () => {
  it('abre un diálogo modal con nombre y descripción, a la derecha y en un portal', async () => {
    const user = userEvent.setup()
    const { container } = render(<Demo />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(boton('Solicitar créditos'))
    const panel = screen.getByRole('dialog', { name: 'Solicitar créditos' })
    expect(panel).toHaveAttribute('aria-modal', 'true')
    expect(panel).toHaveAccessibleDescription('Un asesor revisará tu solicitud.')
    expect(panel).toHaveClass('st-drawer')
    expect(container).not.toContainElement(panel)
    expect(panel.parentElement).toHaveClass('st-overlay', 'st-overlay--end')
    expect(screen.getByText('El saldo cambia cuando se aprueba.')).toBeInTheDocument()
  })

  it('enfoca la X al abrir y atrapa el foco con Tab y Mayús+Tab', async () => {
    const user = userEvent.setup()
    render(<Demo />)
    await user.click(boton('Solicitar créditos'))

    expect(boton('Cerrar')).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('textbox', { name: 'Cantidad' })).toHaveFocus()
    await user.tab()
    expect(boton('Enviar solicitud')).toHaveFocus()
    await user.tab()
    expect(boton('Cerrar')).toHaveFocus()
    await user.tab({ shift: true })
    expect(boton('Enviar solicitud')).toHaveFocus()
  })

  it('Escape cierra y devuelve el foco al disparador', async () => {
    const user = userEvent.setup()
    const alCerrar = vi.fn()
    render(<Demo alCerrar={alCerrar} />)
    await user.click(boton('Solicitar créditos'))

    await user.keyboard('{Escape}')
    expect(alCerrar).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(boton('Solicitar créditos')).toHaveFocus()
  })

  it('cierra con la X y con el fondo; bloquea el scroll mientras está abierto', async () => {
    const user = userEvent.setup()
    const alCerrar = vi.fn()
    render(<Demo alCerrar={alCerrar} />)

    await user.click(boton('Solicitar créditos'))
    expect(document.body.style.overflow).toBe('hidden')
    await user.click(boton('Cerrar'))
    expect(alCerrar).toHaveBeenCalledTimes(1)
    expect(document.body.style.overflow).toBe('')

    await user.click(boton('Solicitar créditos'))
    await user.click(document.querySelector<HTMLElement>('.st-overlay__scrim')!)
    expect(alCerrar).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('sin showClose no dibuja la X y el foco va al primer control', async () => {
    const user = userEvent.setup()
    render(<Demo showClose={false} />)
    await user.click(boton('Solicitar créditos'))

    expect(screen.queryByRole('button', { name: 'Cerrar' })).not.toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Cantidad' })).toHaveFocus()
  })

  it('un cuerpo largo sin controles se vuelve enfocable', () => {
    vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockImplementation(function (this: Element) {
      return this.classList.contains('st-drawer__body') ? 900 : 0
    })
    vi.spyOn(Element.prototype, 'clientHeight', 'get').mockImplementation(function (this: Element) {
      return this.classList.contains('st-drawer__body') ? 300 : 0
    })
    render(
      <Drawer open onClose={() => {}} title="Movimientos">
        <p>Historial largo sin controles.</p>
      </Drawer>,
    )
    expect(document.querySelector('.st-drawer__body')).toHaveAttribute('tabindex', '0')
  })

  it('un modal abierto desde el drawer atiende Escape primero y conserva el bloqueo del scroll', async () => {
    const user = userEvent.setup()

    function Anidados() {
      const [drawer, setDrawer] = useState(true)
      const [confirmar, setConfirmar] = useState(false)
      return (
        <Drawer open={drawer} onClose={() => setDrawer(false)} title="Solicitudes">
          <button type="button" onClick={() => setConfirmar(true)}>
            Rechazar
          </button>
          <Drawer open={confirmar} onClose={() => setConfirmar(false)} title="Confirmar rechazo" showClose={false}>
            <button type="button">Sí, rechazar</button>
          </Drawer>
        </Drawer>
      )
    }

    render(<Anidados />)
    await user.click(boton('Rechazar'))
    expect(boton('Sí, rechazar')).toHaveFocus()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Confirmar rechazo' })).not.toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Solicitudes' })).toBeInTheDocument()
    expect(boton('Rechazar')).toHaveFocus()
    expect(document.body.style.overflow).toBe('hidden')

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.body.style.overflow).toBe('')
  })
})
