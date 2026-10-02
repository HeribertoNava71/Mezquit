import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ControlMascota } from './ControlMascota'
import { AVISO_OCULTA, AVISO_VISIBLE } from './mensajes'
import { CLAVE_MASCOTA_OCULTA, guardarMascotaOculta, mascotaOculta, reiniciarPreferenciaMascota } from './preferencia'

afterEach(() => {
  vi.unstubAllGlobals()
  window.localStorage.clear()
  reiniciarPreferenciaMascota()
})

function conMovimientoReducido(reducir: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((consulta: string) => ({
      matches: consulta.includes('prefers-reduced-motion') && reducir,
      media: consulta,
      addEventListener: () => {},
      removeEventListener: () => {},
    })),
  )
}

describe('ControlMascota (WCAG 2.2.2; D-27)', () => {
  it('oculta la mascota, lo recuerda y anuncia el cambio; el mismo botón la vuelve a mostrar', async () => {
    const user = userEvent.setup()
    render(<ControlMascota className="st-footer__link" />)
    const estado = screen.getByRole('status')
    expect(estado).toBeEmptyDOMElement()

    const boton = screen.getByRole('button', { name: 'Ocultar mascota' })
    expect(boton).toHaveClass('st-footer__link')
    await user.click(boton)
    expect(mascotaOculta()).toBe(true)
    expect(window.localStorage.getItem(CLAVE_MASCOTA_OCULTA)).toBe('1')
    expect(screen.getByRole('button', { name: 'Mostrar mascota' })).toBe(boton)
    expect(estado).toHaveTextContent(AVISO_OCULTA)

    await user.click(boton)
    expect(mascotaOculta()).toBe(false)
    expect(window.localStorage.getItem(CLAVE_MASCOTA_OCULTA)).toBeNull()
    expect(screen.getByRole('button', { name: 'Ocultar mascota' })).toBe(boton)
    expect(estado).toHaveTextContent(AVISO_VISIBLE)
  })

  it('también anuncia cuando se ocultó desde la burbuja', () => {
    render(<ControlMascota />)
    act(() => guardarMascotaOculta(true))
    expect(screen.getByRole('button', { name: 'Mostrar mascota' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(AVISO_OCULTA)
  })

  it('arranca con la preferencia guardada, sin anunciar nada', () => {
    window.localStorage.setItem(CLAVE_MASCOTA_OCULTA, '1')
    render(<ControlMascota />)
    expect(screen.getByRole('button', { name: 'Mostrar mascota' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('con prefers-reduced-motion no se muestra: la mascota no existe', () => {
    conMovimientoReducido(true)
    const { container } = render(<ControlMascota />)
    expect(container).toBeEmptyDOMElement()
  })
})
