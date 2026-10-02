import { render, screen, within } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { SITE } from '@/config/site'
import { Footer } from './Footer'

function montar(ui: ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

const AÑO = new Date().getFullYear()

describe('Footer', () => {
  it('conserva los cinco enlaces del pie actual con el layout del prototipo', () => {
    montar(<Footer />)
    const pie = screen.getByRole('contentinfo')
    expect(pie).toHaveClass('st-footer')

    const nav = within(pie).getByRole('navigation', { name: 'Pie de página' })
    const enlaces = within(nav).getAllByRole('link')
    expect(enlaces.map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
      ['Aviso de privacidad', '/aviso-de-privacidad'],
      ['Términos y condiciones', '/terminos'],
      ['Soporte', '/ayuda'],
      ['¿Te invitaron a una evaluación?', '/evaluar'],
      ['Contacto', `mailto:${SITE.email}`],
    ])
    expect(within(pie).queryByRole('link', { name: 'Acceso interno' })).not.toBeInTheDocument()
  })

  it('muestra la marca, el lema pendiente (D-18) y el titular legal pendiente', () => {
    montar(<Footer />)
    const pie = screen.getByRole('contentinfo')
    expect(within(pie).getByText(SITE.name)).toHaveClass('st-marca__name')
    expect(within(pie).getByText('[PENDIENTE: afirmación verificable]')).toHaveClass('st-footer__claim')
    expect(within(pie).getByText(`© ${AÑO} [PENDIENTE: razón social del titular]`)).toHaveClass('st-footer__legal')
    expect(pie).not.toHaveTextContent('Psicometría validada para Latinoamérica')
  })

  it('variante home: agrega «Acceso interno» hacia /login', () => {
    montar(<Footer variant="home" />)
    const pie = screen.getByRole('contentinfo')
    expect(pie).toHaveClass('st-footer', 'st-footer--home')
    expect(within(pie).getByRole('link', { name: 'Acceso interno' })).toHaveAttribute('href', '/login')
    expect(within(pie).getAllByRole('link')).toHaveLength(6)
  })

  it('variante compacta: aviso de privacidad y soporte con el correo, para el candidato', () => {
    montar(
      <Footer variant="compact">
        <button type="button">Ingresar mi código manualmente</button>
      </Footer>,
    )
    const pie = screen.getByRole('contentinfo')
    expect(pie).toHaveClass('st-footer', 'st-footer--compact')

    const elementos = within(pie).getAllByRole('listitem')
    expect(elementos).toHaveLength(3)
    expect(elementos[0]).toContainElement(screen.getByRole('button', { name: 'Ingresar mi código manualmente' }))
    expect(within(pie).getByRole('link', { name: 'Aviso de privacidad' })).toHaveAttribute('href', '/aviso-de-privacidad')
    expect(elementos[2]).toHaveTextContent(`Soporte: ${SITE.email}`)
    expect(within(pie).getByRole('link', { name: SITE.email })).toHaveAttribute('href', `mailto:${SITE.email}`)
    expect(within(pie).queryByRole('link', { name: 'Términos y condiciones' })).not.toBeInTheDocument()
  })

  it('pone children al inicio de la lista de enlaces y acepta className', () => {
    montar(
      <Footer className="extra">
        <a href="/ayuda#empresa">Primero</a>
      </Footer>,
    )
    const pie = screen.getByRole('contentinfo')
    expect(pie).toHaveClass('st-footer', 'extra')
    expect(within(pie).getAllByRole('link')[0]).toHaveTextContent('Primero')
  })
})
