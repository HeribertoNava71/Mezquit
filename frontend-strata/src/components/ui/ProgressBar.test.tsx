import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ProgressBar } from './ProgressBar'

describe('ProgressBar', () => {
  it('expone role progressbar con nombre y valores', () => {
    render(<ProgressBar label="Progreso del examen" value={3} max={12} valueText="Pregunta 3 de 12" size={4} />)
    const barra = screen.getByRole('progressbar', { name: 'Progreso del examen' })
    expect(barra).toHaveAttribute('aria-valuenow', '3')
    expect(barra).toHaveAttribute('aria-valuemin', '0')
    expect(barra).toHaveAttribute('aria-valuemax', '12')
    expect(barra).toHaveAttribute('aria-valuetext', 'Pregunta 3 de 12')
    expect(barra).toHaveClass('st-progress--size-4')
  })

  it('limita el valor entre 0 y max y desplaza el relleno según el porcentaje', () => {
    const { rerender, container } = render(<ProgressBar label="Saldo" value={150} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
    expect(container.querySelector<HTMLElement>('.st-progress__fill')?.style.transform).toBe('translateX(0%)')

    rerender(<ProgressBar label="Saldo" value={-4} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
    expect(container.querySelector<HTMLElement>('.st-progress__fill')?.style.transform).toBe('translateX(-100%)')

    rerender(<ProgressBar label="Saldo" value={30} max={40} />)
    expect(container.querySelector<HTMLElement>('.st-progress__fill')?.style.transform).toBe('translateX(-25%)')
  })

  it('acepta aria-labelledby como nombre', () => {
    render(
      <>
        <span id="rotulo">Comunicación</span>
        <ProgressBar aria-labelledby="rotulo" value={85} tone="navy" size={8} />
      </>,
    )
    expect(screen.getByRole('progressbar', { name: 'Comunicación' })).toHaveClass('st-progress--navy')
  })

  it('en modo decorativo se oculta a los lectores y no lleva role', () => {
    const { container } = render(<ProgressBar decorative value={40} />)
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
    expect(container.firstElementChild).not.toHaveAttribute('aria-valuenow')
  })

  it('aplica pista, tono y barra pegada al borde', () => {
    render(<ProgressBar label="Avance" value={50} track="divider" tone="sky-strong" flush />)
    expect(screen.getByRole('progressbar')).toHaveClass(
      'st-progress--track-divider',
      'st-progress--sky-strong',
      'st-progress--flush',
    )
  })

  it('usa 6 px y pista muted por defecto; acepta 7 px sobre oscuro', () => {
    const { rerender } = render(<ProgressBar label="Saldo" value={10} />)
    expect(screen.getByRole('progressbar')).toHaveClass('st-progress--size-6', 'st-progress--track-muted', 'st-progress--sky')

    rerender(<ProgressBar label="Puntaje de prueba" value={76} size={7} track="on-dark" />)
    expect(screen.getByRole('progressbar')).toHaveClass('st-progress--size-7', 'st-progress--track-on-dark')
  })
})
