import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Correo } from './Correo'

describe('Correo', () => {
  it('deja un punto de corte justo después de la arroba sin cambiar el texto', () => {
    const { container } = render(<Correo valor="analucia.trevino@example.com" className="x" />)
    const span = container.querySelector('span.x') as HTMLElement
    expect(span).toHaveTextContent('analucia.trevino@example.com')
    const corte = span.querySelector('wbr')
    expect(corte).not.toBeNull()
    expect(corte?.previousSibling?.textContent).toBe('analucia.trevino@')
    expect(corte?.nextSibling?.textContent).toBe('example.com')
  })

  it('sin una arroba con texto a los dos lados, lo muestra tal cual', () => {
    for (const valor of ['sin-arroba', '@dominio.com', 'usuario@']) {
      const { container, unmount } = render(<Correo valor={valor} />)
      expect(container.querySelector('wbr')).toBeNull()
      expect(container).toHaveTextContent(valor)
      unmount()
    }
  })
})
