import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode, useRef, useState, type ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { useFocusTrap, type UseFocusTrapOptions } from './useFocusTrap'

function Panel({ etiqueta, children, ...opciones }: UseFocusTrapOptions & { etiqueta: string; children?: ReactNode }) {
  const ref = useFocusTrap<HTMLDivElement>(opciones)
  return (
    <div ref={ref} role="dialog" aria-modal="true" aria-label={etiqueta}>
      {children}
    </div>
  )
}

function Demo({ alCerrar }: { alCerrar?: () => void }) {
  const [abierto, setAbierto] = useState(false)
  const cerrar = () => {
    alCerrar?.()
    setAbierto(false)
  }
  return (
    <>
      <button type="button" onClick={() => setAbierto(true)}>Abrir</button>
      <button type="button">Fuera</button>
      {abierto && (
        <Panel etiqueta="Panel" onClose={cerrar}>
          <button type="button">Primero</button>
          <input aria-label="Correo" />
          <button type="button" disabled>Inactivo</button>
          <button type="button" onClick={() => setAbierto(false)}>Último</button>
        </Panel>
      )}
    </>
  )
}

const boton = (nombre: string) => screen.getByRole('button', { name: nombre })

describe('useFocusTrap', () => {
  it('lleva el foco al primer elemento enfocable al activarse', async () => {
    const user = userEvent.setup()
    render(<Demo />)
    await user.click(boton('Abrir'))
    expect(boton('Primero')).toHaveFocus()
  })

  it('Tab y Mayús+Tab circulan dentro del contenedor y saltan los deshabilitados', async () => {
    const user = userEvent.setup()
    render(<Demo />)
    await user.click(boton('Abrir'))

    await user.tab()
    expect(screen.getByRole('textbox', { name: 'Correo' })).toHaveFocus()
    await user.tab()
    expect(boton('Último')).toHaveFocus()
    await user.tab()
    expect(boton('Primero')).toHaveFocus()
    await user.tab({ shift: true })
    expect(boton('Último')).toHaveFocus()
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

  it('Escape durante una composición de IME no cierra', async () => {
    const user = userEvent.setup()
    const alCerrar = vi.fn()
    render(<Demo alCerrar={alCerrar} />)
    await user.click(boton('Abrir'))
    const correo = screen.getByRole('textbox', { name: 'Correo' })
    correo.focus()

    fireEvent.keyDown(correo, { key: 'Escape', isComposing: true })
    expect(alCerrar).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    fireEvent.keyDown(correo, { key: 'Escape' })
    expect(alCerrar).toHaveBeenCalledTimes(1)
  })

  it('devuelve el foco al disparador al cerrar desde dentro, también en StrictMode', async () => {
    const user = userEvent.setup()
    render(
      <StrictMode>
        <Demo />
      </StrictMode>,
    )
    await user.click(boton('Abrir'))
    expect(boton('Primero')).toHaveFocus()

    await user.click(boton('Último'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(boton('Abrir')).toHaveFocus()
  })

  it('regresa el foco al contenedor si se escapa', async () => {
    const user = userEvent.setup()
    render(<Demo />)
    await user.click(boton('Abrir'))

    boton('Fuera').focus()
    expect(boton('Primero')).toHaveFocus()
  })

  it('respeta initialFocus y, sin enfocables, enfoca el contenedor', async () => {
    function ConInicial() {
      const correo = useRef<HTMLInputElement>(null)
      return (
        <Panel etiqueta="Con inicial" initialFocus={correo}>
          <button type="button">Cancelar</button>
          <input ref={correo} aria-label="Nombre" />
        </Panel>
      )
    }
    const { unmount } = render(<ConInicial />)
    expect(screen.getByRole('textbox', { name: 'Nombre' })).toHaveFocus()
    unmount()

    render(
      <Panel etiqueta="Vacío">
        <p>Sin controles</p>
      </Panel>,
    )
    const vacio = screen.getByRole('dialog', { name: 'Vacío' })
    expect(vacio).toHaveFocus()
    expect(vacio).toHaveAttribute('tabindex', '-1')
  })

  it('con trampas anidadas solo la de arriba atiende Escape', async () => {
    const user = userEvent.setup()
    const cerrarExterna = vi.fn()

    function Anidadas() {
      const [interna, setInterna] = useState(true)
      return (
        <Panel etiqueta="Externa" onClose={cerrarExterna}>
          <button type="button">Botón externo</button>
          {interna && (
            <Panel etiqueta="Interna" onClose={() => setInterna(false)}>
              <button type="button">Botón interno</button>
            </Panel>
          )}
        </Panel>
      )
    }

    render(<Anidadas />)
    expect(boton('Botón interno')).toHaveFocus()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Interna' })).not.toBeInTheDocument()
    expect(cerrarExterna).not.toHaveBeenCalled()

    await user.keyboard('{Escape}')
    expect(cerrarExterna).toHaveBeenCalledTimes(1)
  })

  it('sin onClose no consume la tecla Escape', async () => {
    const user = userEvent.setup()
    const escapes: boolean[] = []
    const registrar = (event: KeyboardEvent) => {
      if (event.key === 'Escape') escapes.push(event.defaultPrevented)
    }
    // En window: al burbujear, corre después del oyente de la trampa en document.
    window.addEventListener('keydown', registrar)
    render(
      <Panel etiqueta="Sin cierre">
        <button type="button">Dentro</button>
      </Panel>,
    )
    await user.keyboard('{Escape}')
    window.removeEventListener('keydown', registrar)
    expect(escapes).toEqual([false])
  })

  it('no hace nada mientras active es false', async () => {
    const user = userEvent.setup()
    const alCerrar = vi.fn()
    render(
      <>
        <button type="button">Antes</button>
        <Panel etiqueta="Inactivo" active={false} onClose={alCerrar}>
          <button type="button">Dentro</button>
        </Panel>
      </>,
    )
    expect(boton('Dentro')).not.toHaveFocus()
    await user.keyboard('{Escape}')
    expect(alCerrar).not.toHaveBeenCalled()
  })
})
