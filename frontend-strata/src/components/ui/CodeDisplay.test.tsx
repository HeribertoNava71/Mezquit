import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CodeDisplay } from './CodeDisplay'
import { CopyField } from './CopyField'

const ENLACE = 'https://strata.app/evaluar/abc123'

describe('CodeDisplay', () => {
  it('pinta el rótulo, el código en mono y su contenido sobre la superficie oscura', () => {
    render(
      <CodeDisplay label="Código de invitación" code="9B2X-88K1">
        <CopyField value={ENLACE} label="enlace de invitación" />
      </CodeDisplay>,
    )
    const codigo = screen.getByText('9B2X-88K1')
    expect(codigo).toHaveClass('st-code-display__code')
    expect(codigo.closest('.st-code-display')).toHaveClass('st-on-dark')
    expect(screen.getByText('Código de invitación')).toHaveClass('st-code-display__label')
    expect(screen.getByRole('button', { name: 'Copiar enlace de invitación' })).toBeInTheDocument()
  })

  it('sin código muestra solo el rótulo y el contenido; acepta alineación al inicio y atributos', () => {
    const { container } = render(
      <CodeDisplay label="Enlace de invitación" align="start" className="extra" id="codigo">
        <CopyField value={ENLACE} label="enlace de invitación" />
      </CodeDisplay>,
    )
    const raiz = container.firstElementChild
    expect(raiz).toHaveClass('st-code-display', 'st-code-display--start', 'st-on-dark', 'extra')
    expect(raiz).toHaveAttribute('id', 'codigo')
    expect(container.querySelector('.st-code-display__code')).toBeNull()
    expect(container.querySelector('.st-code-display__body')).toContainElement(
      screen.getByRole('button', { name: 'Copiar enlace de invitación' }),
    )
  })
})
