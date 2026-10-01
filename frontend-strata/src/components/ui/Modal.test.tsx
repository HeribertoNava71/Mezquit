import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Modal, type ModalProps } from './Modal'

/** jsdom no calcula layout: simula un elemento con la clase dada que desborda (600 de contenido en 200 de alto). */
function simularDesborde(clase: string) {
  vi.spyOn(Element.prototype, 'scrollHeight', 'get').mockImplementation(function (this: Element) {
    return this.classList.contains(clase) ? 600 : 0
  })
  vi.spyOn(Element.prototype, 'clientHeight', 'get').mockImplementation(function (this: Element) {
    return this.classList.contains(clase) ? 200 : 0
  })
}

type DemoProps = Partial<Omit<ModalProps, 'open' | 'onClose'>> & { alCerrar?: () => void }

function Demo({ alCerrar, ...props }: DemoProps) {
  const [abierto, setAbierto] = useState(false)
  const cerrar = () => {
    alCerrar?.()
    setAbierto(false)
  }
  return (
    <>
      <button type="button" onClick={() => setAbierto(true)}>
        Abrir
      </button>
      <Modal
        open={abierto}
        onClose={cerrar}
        title="Asignar test por email"
        description="Strata envía el enlace al candidato."
        footerNote="Vence en 14 días si no se inicia."
        footer={
          <>
            <button type="button" onClick={cerrar}>
              Cancelar
            </button>
            <button type="button">Enviar invitación</button>
          </>
        }
        {...props}
      >
        <input aria-label="Correo del candidato" />
      </Modal>
    </>
  )
}

const boton = (nombre: string) => screen.getByRole('button', { name: nombre })
const fondo = () => document.querySelector<HTMLElement>('.st-overlay__scrim')!

describe('Modal', () => {
  it('cerrado no renderiza nada', () => {
    render(<Demo />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('abre un diálogo modal con nombre, descripción y pie, en un portal del body', async () => {
    const user = userEvent.setup()
    const { container } = render(<Demo />)
    await user.click(boton('Abrir'))

    const dialogo = screen.getByRole('dialog', { name: 'Asignar test por email' })
    expect(dialogo).toHaveAttribute('aria-modal', 'true')
    expect(dialogo).toHaveAccessibleDescription('Strata envía el enlace al candidato.')
    expect(screen.getByRole('heading', { level: 2, name: 'Asignar test por email' })).toBeInTheDocument()
    expect(screen.getByText('Vence en 14 días si no se inicia.')).toBeInTheDocument()
    expect(container).not.toContainElement(dialogo)
    expect(document.body).toContainElement(dialogo)
    expect(dialogo).toHaveClass('st-modal', 'st-modal--md')
  })

  it('lleva el foco al primer enfocable y lo atrapa con Tab y Mayús+Tab', async () => {
    const user = userEvent.setup()
    render(<Demo />)
    await user.click(boton('Abrir'))

    const correo = screen.getByRole('textbox', { name: 'Correo del candidato' })
    expect(correo).toHaveFocus()
    await user.tab()
    expect(boton('Cancelar')).toHaveFocus()
    await user.tab()
    expect(boton('Enviar invitación')).toHaveFocus()
    await user.tab()
    expect(correo).toHaveFocus()
    await user.tab({ shift: true })
    expect(boton('Enviar invitación')).toHaveFocus()
  })

  it('Escape llama a onClose y el foco vuelve al disparador', async () => {
    const user = userEvent.setup()
    const alCerrar = vi.fn()
    render(<Demo alCerrar={alCerrar} />)
    await user.click(boton('Abrir'))

    await user.keyboard('{Escape}')
    expect(alCerrar).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(boton('Abrir')).toHaveFocus()
  })

  it('cierra con un clic en el fondo, salvo con closeOnScrim={false}', async () => {
    const user = userEvent.setup()
    const alCerrar = vi.fn()
    const { unmount } = render(<Demo alCerrar={alCerrar} />)
    await user.click(boton('Abrir'))
    await user.click(fondo())
    expect(alCerrar).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    unmount()

    const otro = vi.fn()
    render(<Demo alCerrar={otro} closeOnScrim={false} />)
    await user.click(boton('Abrir'))
    await user.click(fondo())
    expect(otro).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Correo del candidato' })).toHaveFocus()
  })

  it('bloquea el scroll del body mientras está abierto y lo restaura al cerrar', async () => {
    const user = userEvent.setup()
    render(<Demo />)
    expect(document.body.style.overflow).toBe('')

    await user.click(boton('Abrir'))
    expect(document.body.style.overflow).toBe('hidden')

    await user.click(boton('Cancelar'))
    expect(document.body.style.overflow).toBe('')
    expect(boton('Abrir')).toHaveFocus()
  })

  it('respeta initialFocusRef', async () => {
    function ConFocoInicial() {
      const enviar = useRef<HTMLButtonElement>(null)
      return (
        <Modal open onClose={() => {}} title="Confirmar" footer={<button ref={enviar} type="button">Confirmar envío</button>} initialFocusRef={enviar}>
          <input aria-label="Nota" />
        </Modal>
      )
    }
    render(<ConFocoInicial />)
    expect(boton('Confirmar envío')).toHaveFocus()
  })

  it('role="alertdialog" para confirmar una acción que no se deshace, con foco en «Cancelar»', () => {
    function Confirmar() {
      const cancelar = useRef<HTMLButtonElement>(null)
      return (
        <Modal
          open
          onClose={() => {}}
          role="alertdialog"
          title="Eliminar usuario"
          description="Esta acción no se puede deshacer."
          initialFocusRef={cancelar}
          footer={
            <>
              <button ref={cancelar} type="button">
                Cancelar
              </button>
              <button type="button">Eliminar</button>
            </>
          }
        />
      )
    }
    render(<Confirmar />)
    const dialogo = screen.getByRole('alertdialog', { name: 'Eliminar usuario' })
    expect(dialogo).toHaveAttribute('aria-modal', 'true')
    expect(dialogo).toHaveAccessibleDescription('Esta acción no se puede deshacer.')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(boton('Cancelar')).toHaveFocus()
  })

  it('un cuerpo largo sin controles entra al ciclo de Tab; con controles dentro, no', async () => {
    simularDesborde('st-modal__body')
    const user = userEvent.setup()
    const { rerender } = render(
      <Modal open onClose={() => {}} title="Detalle" footer={<button type="button">Entendido</button>}>
        <p>Texto largo que no cabe en el cuerpo.</p>
      </Modal>,
    )
    const cuerpo = document.querySelector<HTMLElement>('.st-modal__body')!
    expect(cuerpo).toHaveAttribute('tabindex', '0')
    expect(boton('Entendido')).toHaveFocus()
    await user.tab()
    expect(cuerpo).toHaveFocus()

    rerender(
      <Modal open onClose={() => {}} title="Detalle" footer={<button type="button">Entendido</button>}>
        <p>Texto largo que no cabe en el cuerpo.</p>
        <input aria-label="Comentario" />
      </Modal>,
    )
    await waitFor(() => expect(cuerpo).not.toHaveAttribute('tabindex'))
  })

  it('showClose agrega la X con nombre accesible, size lg cambia el ancho y pasa className', async () => {
    const user = userEvent.setup()
    const alCerrar = vi.fn()
    render(<Demo alCerrar={alCerrar} showClose closeLabel="Cerrar invitación" size="lg" className="extra" />)
    await user.click(boton('Abrir'))

    expect(screen.getByRole('dialog')).toHaveClass('st-modal--lg', 'extra')
    // La X es el IconButton md de los controles (mismo botón del prototipo, :1257).
    expect(boton('Cerrar invitación')).toHaveClass('st-icon-btn', 'st-icon-btn--md', 'st-overlay__close')
    await user.click(boton('Cerrar invitación'))
    expect(alCerrar).toHaveBeenCalledTimes(1)
  })
})
