import { render, screen, within } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { SITE } from '@/config/site'
import { Footer } from './Footer'

function montar(ui: ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

const AÑO = new Date().getFullYear()

const CORREO_PENDIENTE = SITE.email
const sitio = SITE as { email: string }

afterEach(() => {
  sitio.email = CORREO_PENDIENTE
})

describe('Footer', () => {
  it('conserva los cinco enlaces del pie actual con el layout del prototipo', () => {
    sitio.email = 'hola@strata.mx'
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
      ['Contacto', 'mailto:hola@strata.mx'],
    ])
    expect(within(pie).queryByRole('link', { name: 'Acceso interno' })).not.toBeInTheDocument()
  })

  it('con el correo [PENDIENTE], Contacto muestra el marcador sin mailto (como /ayuda, /demo y /perfil)', () => {
    montar(<Footer />)
    const pie = screen.getByRole('contentinfo')
    expect(within(pie).queryByRole('link', { name: 'Contacto' })).not.toBeInTheDocument()
    expect(pie.querySelector('a[href^="mailto:"]')).toBeNull()
    const marcador = within(pie).getByText(CORREO_PENDIENTE)
    expect(marcador.closest('.st-pendiente')).not.toBeNull()
    expect(marcador.closest('.st-footer__contacto')).toHaveTextContent(`Contacto: ${CORREO_PENDIENTE}`)
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
    sitio.email = 'hola@strata.mx'
    montar(<Footer variant="home" />)
    const pie = screen.getByRole('contentinfo')
    expect(pie).toHaveClass('st-footer', 'st-footer--home')
    expect(within(pie).getByRole('link', { name: 'Acceso interno' })).toHaveAttribute('href', '/login')
    expect(within(pie).getAllByRole('link')).toHaveLength(6)
  })

  it('trailing va al final de la lista de enlaces (el control de la mascota en la home)', () => {
    montar(<Footer variant="home" trailing={<button type="button">Ocultar mascota</button>} />)
    const lista = within(screen.getByRole('navigation', { name: 'Pie de página' })).getByRole('list')
    const elementos = within(lista).getAllByRole('listitem')
    expect(elementos.at(-1)).toContainElement(screen.getByRole('button', { name: 'Ocultar mascota' }))
  })

  it('variante compacta: aviso de privacidad y soporte con el correo, para el candidato', () => {
    sitio.email = 'hola@strata.mx'
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
    expect(elementos[2]).toHaveTextContent('Soporte: hola@strata.mx')
    expect(within(pie).getByRole('link', { name: 'hola@strata.mx' })).toHaveAttribute('href', 'mailto:hola@strata.mx')
    expect(within(pie).queryByRole('link', { name: 'Términos y condiciones' })).not.toBeInTheDocument()
  })

  it('variante compacta con el correo [PENDIENTE]: Soporte muestra el marcador, sin mailto', () => {
    montar(<Footer variant="compact" />)
    const pie = screen.getByRole('contentinfo')
    expect(pie.querySelector('a[href^="mailto:"]')).toBeNull()
    expect(within(pie).getByText(CORREO_PENDIENTE).closest('.st-pendiente')).not.toBeNull()
    expect(within(pie).getAllByRole('listitem').at(-1)).toHaveTextContent(`Soporte: ${CORREO_PENDIENTE}`)
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
