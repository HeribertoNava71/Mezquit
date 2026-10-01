import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CopyField } from './CopyField'

const ENLACE = 'https://strata.app/evaluar/abc123'

/** Reemplaza el portapapeles (después de userEvent.setup, que instala el suyo). */
function simularPortapapeles(writeText: (texto: string) => Promise<void>) {
  Object.defineProperty(window.navigator, 'clipboard', { value: { writeText }, configurable: true })
}

function simularExecCommand(resultado: boolean) {
  const execCommand = vi.fn(() => resultado)
  Object.defineProperty(document, 'execCommand', { value: execCommand, configurable: true })
  return execCommand
}

describe('CopyField', () => {
  afterEach(() => {
    Reflect.deleteProperty(window.navigator, 'clipboard')
    Reflect.deleteProperty(document, 'execCommand')
  })

  it('copia con navigator.clipboard y llama a onCopied con el valor', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn(() => Promise.resolve())
    simularPortapapeles(writeText)
    const alCopiar = vi.fn()

    render(<CopyField value={ENLACE} label="enlace de invitación" onCopied={alCopiar} />)
    await user.click(screen.getByRole('button', { name: 'Copiar enlace de invitación' }))

    expect(writeText).toHaveBeenCalledWith(ENLACE)
    expect(alCopiar).toHaveBeenCalledWith(ENLACE)
    expect(screen.getByRole('button', { name: 'Copiado: enlace de invitación' })).toHaveTextContent('Copiado')
    // Con onCopied, el anuncio del éxito queda a cargo del toast: sin región propia.
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('con onCopied, un fallo se avisa inline con role="alert" y se repite en cada intento', async () => {
    const user = userEvent.setup()
    simularPortapapeles(() => Promise.reject(new Error('Sin permiso')))
    simularExecCommand(false)
    const alCopiar = vi.fn()

    render(<CopyField value={ENLACE} label="enlace de invitación" onCopied={alCopiar} />)
    await user.click(screen.getByRole('button', { name: 'Copiar enlace de invitación' }))

    expect(alCopiar).not.toHaveBeenCalled()
    const primerAviso = screen.getByRole('alert')
    expect(primerAviso).toHaveTextContent('No se pudo copiar.')
    const reintentar = screen.getByRole('button', { name: 'Reintentar copiar enlace de invitación' })
    expect(reintentar.parentElement).toHaveClass('st-copy--error')

    // Un segundo fallo vuelve a montar el aviso para que el lector lo repita.
    await user.click(reintentar)
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo copiar.')
    expect(screen.getByRole('alert')).not.toBe(primerAviso)
  })

  it('vuelve a «Copiar» después de 2 s', async () => {
    const user = userEvent.setup()
    simularPortapapeles(() => Promise.resolve())
    const temporizador = vi.spyOn(window, 'setTimeout')
    render(<CopyField value={ENLACE} label="enlace de invitación" onCopied={() => {}} />)

    await user.click(screen.getByRole('button', { name: 'Copiar enlace de invitación' }))
    expect(screen.getByRole('button', { name: 'Copiado: enlace de invitación' })).toBeInTheDocument()

    const llamada = temporizador.mock.calls.find(([, ms]) => ms === 2000)
    expect(llamada).toBeDefined()
    act(() => {
      ;(llamada?.[0] as () => void)()
    })
    expect(screen.getByRole('button', { name: 'Copiar enlace de invitación' })).toHaveTextContent('Copiar')
  })

  it('usa el respaldo con execCommand si no hay navigator.clipboard', async () => {
    const user = userEvent.setup()
    Reflect.deleteProperty(window.navigator, 'clipboard')
    const execCommand = simularExecCommand(true)
    const alCopiar = vi.fn()

    render(<CopyField value="8F2A-4471" label="código" variant="inline" onCopied={alCopiar} />)
    const boton = screen.getByRole('button', { name: 'Copiar código' })
    await user.click(boton)

    expect(execCommand).toHaveBeenCalledWith('copy')
    expect(alCopiar).toHaveBeenCalledWith('8F2A-4471')
    // El respaldo devuelve el foco al botón y no deja el textarea temporal.
    expect(screen.getByRole('button', { name: 'Copiado: código' })).toHaveFocus()
    expect(document.querySelector('textarea')).toBeNull()
  })

  it('si no se puede copiar, avisa, ofrece reintentar y deja el valor seleccionado', async () => {
    const user = userEvent.setup()
    simularPortapapeles(() => Promise.reject(new Error('Sin permiso')))
    simularExecCommand(false)
    const alFallar = vi.fn()

    render(<CopyField value={ENLACE} label="enlace de invitación" onCopyError={alFallar} />)
    await user.click(screen.getByRole('button', { name: 'Copiar enlace de invitación' }))

    expect(alFallar).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Reintentar copiar enlace de invitación' })).toHaveTextContent('Reintentar')
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo copiar.')
    // La región de éxito sigue vacía: el error va solo en el aviso.
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
    expect(document.getSelection()?.toString()).toBe(ENLACE)
  })

  it('sin onCopied anuncia la copia por su cuenta', async () => {
    const user = userEvent.setup()
    simularPortapapeles(() => Promise.resolve())
    render(<CopyField value={ENLACE} label="enlace de invitación" />)
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
    await user.click(screen.getByRole('button', { name: 'Copiar enlace de invitación' }))
    expect(screen.getByRole('status')).toHaveTextContent('Copiado al portapapeles.')
  })

  it('la variante link muestra el enlace en mono y «Copiar» como texto, en tono claro', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn(() => Promise.resolve())
    simularPortapapeles(writeText)
    const alCopiar = vi.fn()
    render(
      <CopyField value={ENLACE} label="enlace" variant="link" onCopied={alCopiar}>
        strata.app/e/abc123
      </CopyField>,
    )
    const valor = screen.getByText('strata.app/e/abc123')
    expect(valor).toHaveClass('st-copy__value')
    expect(valor.parentElement).toHaveClass('st-copy--link', 'st-copy--light')
    expect(valor.parentElement).not.toHaveClass('st-on-dark')

    const boton = screen.getByRole('button', { name: 'Copiar enlace' })
    expect(boton).toHaveTextContent('Copiar')
    await user.click(boton)
    expect(writeText).toHaveBeenCalledWith(ENLACE)
    expect(alCopiar).toHaveBeenCalledWith(ENLACE)
    expect(screen.getByRole('button', { name: 'Copiado: enlace' })).toHaveTextContent('Copiado')
  })

  it('muestra el texto que recibe y usa el tono oscuro con su foco en field', () => {
    render(
      <CopyField value={ENLACE} label="enlace de invitación">
        strata.app/evaluar/abc123
      </CopyField>,
    )
    const valor = screen.getByText('strata.app/evaluar/abc123')
    expect(valor.parentElement).toHaveClass('st-copy--field', 'st-copy--dark', 'st-on-dark')
    // En field toda la fila es el área del botón: el título con el valor completo va en la raíz.
    expect(valor.parentElement).toHaveAttribute('title', ENLACE)
    expect(valor).not.toHaveAttribute('title')
  })

  it('en las variantes de tabla el título con el valor completo va en el valor', () => {
    render(
      <CopyField value={ENLACE} label="enlace" variant="link">
        strata.app/e/abc…
      </CopyField>,
    )
    const valor = screen.getByText('strata.app/e/abc…')
    expect(valor).toHaveAttribute('title', ENLACE)
    expect(valor.parentElement).not.toHaveAttribute('title')
  })
})
