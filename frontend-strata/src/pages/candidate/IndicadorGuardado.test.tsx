import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { IndicadorGuardado } from './IndicadorGuardado'

describe('IndicadorGuardado', () => {
  it.each([
    ['inicial', 'Guardado automático'],
    ['guardando', 'Guardando…'],
    ['guardado', 'Guardado'],
  ] as const)('%s: «%s», sin alerta ni botón', (estado, texto) => {
    render(<IndicadorGuardado estado={estado} onReintentar={() => {}} />)
    expect(screen.getByText(texto)).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('la región de estado está montada desde el inicio y solo anuncia el guardado confirmado', () => {
    const { rerender } = render(<IndicadorGuardado estado="inicial" onReintentar={() => {}} />)
    const region = screen.getByRole('status')
    expect(region).toHaveTextContent('Guardado automático')

    // «Guardando…» es solo visual: la región queda vacía para los lectores de pantalla.
    rerender(<IndicadorGuardado estado="guardando" onReintentar={() => {}} />)
    expect(screen.getByRole('status')).toBe(region)
    expect(screen.getByText('Guardando…')).toHaveAttribute('aria-hidden', 'true')

    rerender(<IndicadorGuardado estado="guardado" onReintentar={() => {}} />)
    expect(screen.getByRole('status')).toBe(region)
    expect(region).toHaveTextContent('Guardado')
  })

  it('error: lo anuncia con ícono y texto y ofrece «Reintentar»', async () => {
    const onReintentar = vi.fn()
    const { rerender } = render(<IndicadorGuardado estado="guardando" onReintentar={onReintentar} />)
    rerender(<IndicadorGuardado estado="error" onReintentar={onReintentar} />)
    const alerta = screen.getByRole('alert')
    expect(alerta).toHaveTextContent('No se pudo guardar')
    expect(alerta.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    // La región de estado se oculta mientras dura el error.
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(onReintentar).toHaveBeenCalledTimes(1)

    // Al recuperarse, la alerta se va y la región de estado vuelve.
    rerender(<IndicadorGuardado estado="guardado" onReintentar={onReintentar} />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Guardado')
  })
})
