import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import ButtonPorDefecto, { Button } from './Button'

describe('Button', () => {
  it('es un <button type="button"> primario y mediano por defecto', () => {
    render(<Button>Guardar</Button>)
    const boton = screen.getByRole('button', { name: 'Guardar' })
    expect(boton).toHaveAttribute('type', 'button')
    expect(boton).toHaveClass('st-btn', 'st-btn--primary', 'st-btn--md')
    expect(boton).not.toHaveAttribute('aria-disabled')
  })

  it('conserva la exportación por defecto que usan las pantallas viejas', () => {
    expect(ButtonPorDefecto).toBe(Button)
  })

  it('con to es un Link del router y navega', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={
              <Button to="/demo" variant="ghost">
                Ver cómo funciona
              </Button>
            }
          />
          <Route path="/demo" element={<p>Página de demo</p>} />
        </Routes>
      </MemoryRouter>,
    )
    const enlace = screen.getByRole('link', { name: 'Ver cómo funciona' })
    expect(enlace).toHaveAttribute('href', '/demo')
    expect(enlace).toHaveClass('st-btn', 'st-btn--ghost')

    await user.click(enlace)
    expect(screen.getByText('Página de demo')).toBeInTheDocument()
  })

  it('con href es un <a> con sus atributos', () => {
    render(
      <Button href="https://cal.example.com/strata" target="_blank" rel="noreferrer" variant="secondary" size="lg">
        Reservar tiempo
      </Button>,
    )
    const enlace = screen.getByRole('link', { name: 'Reservar tiempo' })
    expect(enlace.tagName).toBe('A')
    expect(enlace).toHaveAttribute('href', 'https://cal.example.com/strata')
    expect(enlace).toHaveAttribute('target', '_blank')
    expect(enlace).toHaveAttribute('rel', 'noreferrer')
    expect(enlace).toHaveClass('st-btn--secondary', 'st-btn--lg')
  })

  it('con loading muestra el spinner, marca aria-busy y no ejecuta la acción', async () => {
    const user = userEvent.setup()
    const alHacerClic = vi.fn()
    render(
      <Button loading onClick={alHacerClic}>
        Enviar solicitud
      </Button>,
    )
    const boton = screen.getByRole('button', { name: 'Enviar solicitud' })
    expect(boton).toHaveAttribute('aria-busy', 'true')
    expect(boton).toHaveAttribute('aria-disabled', 'true')
    expect(boton).toHaveClass('st-btn--loading')
    expect(boton.querySelector('.st-spinner')).toHaveAttribute('aria-hidden', 'true')

    await user.click(boton)
    expect(alHacerClic).not.toHaveBeenCalled()
  })

  it('loadingText cambia el texto mientras carga', () => {
    render(
      <Button loading loadingText="Enviando…">
        Crear cuenta
      </Button>,
    )
    expect(screen.getByRole('button', { name: 'Enviando…' })).toBeInTheDocument()
  })

  it('deshabilitado sigue enfocable y no ejecuta onClick ni envía el formulario', async () => {
    const user = userEvent.setup()
    const alEnviar = vi.fn((evento: { preventDefault: () => void }) => evento.preventDefault())
    const alHacerClic = vi.fn()
    render(
      <form onSubmit={alEnviar}>
        <Button type="submit" disabled onClick={alHacerClic}>
          Continuar
        </Button>
      </form>,
    )
    const boton = screen.getByRole('button', { name: 'Continuar' })
    expect(boton).toHaveAttribute('aria-disabled', 'true')
    expect(boton).toHaveAttribute('type', 'submit')
    expect(boton).toHaveClass('st-btn--disabled')

    await user.tab()
    expect(boton).toHaveFocus()
    await user.keyboard('{Enter}')
    await user.click(boton)
    expect(alHacerClic).not.toHaveBeenCalled()
    expect(alEnviar).not.toHaveBeenCalled()
  })

  it('habilitado ejecuta onClick y envía el formulario', async () => {
    const user = userEvent.setup()
    const alEnviar = vi.fn((evento: { preventDefault: () => void }) => evento.preventDefault())
    render(
      <form onSubmit={alEnviar}>
        <Button type="submit">Entrar</Button>
      </form>,
    )
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(alEnviar).toHaveBeenCalledTimes(1)
  })

  it('un enlace deshabilitado pierde su destino y queda enfocable', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Button to="/app" disabled replace>
          Ir al panel
        </Button>
      </MemoryRouter>,
    )
    const enlace = screen.getByRole('link', { name: 'Ir al panel' })
    expect(enlace).not.toHaveAttribute('href')
    expect(enlace).not.toHaveAttribute('replace')
    expect(enlace).toHaveAttribute('aria-disabled', 'true')
    await user.tab()
    expect(enlace).toHaveFocus()
  })

  it('los íconos son decorativos y la variante, el tamaño y el ancho llegan como clases', () => {
    render(
      <Button
        variant="ink"
        size="sm"
        fullWidth
        iconLeft={<svg data-testid="icono-izquierdo" />}
        iconRight={<svg data-testid="icono-derecho" />}
      >
        Comprar un test
      </Button>,
    )
    const boton = screen.getByRole('button', { name: 'Comprar un test' })
    expect(boton).toHaveClass('st-btn--ink', 'st-btn--sm', 'st-btn--full')
    expect(screen.getByTestId('icono-izquierdo').parentElement).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByTestId('icono-derecho').parentElement).toHaveAttribute('aria-hidden', 'true')
  })

  it('pasa ref, className y atributos al elemento', () => {
    const ref = createRef<HTMLButtonElement>()
    render(
      <Button ref={ref} variant="danger" className="extra" aria-describedby="nota">
        Eliminar usuario
      </Button>,
    )
    const boton = screen.getByRole('button', { name: 'Eliminar usuario' })
    expect(ref.current).toBe(boton)
    expect(boton).toHaveClass('st-btn--danger', 'extra')
    expect(boton).toHaveAttribute('aria-describedby', 'nota')
  })
})
