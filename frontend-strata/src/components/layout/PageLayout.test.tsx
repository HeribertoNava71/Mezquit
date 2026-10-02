import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { PageLayout, type PageLayoutProps } from './PageLayout'

function montar(props: Partial<PageLayoutProps> = {}) {
  return render(
    <MemoryRouter>
      <PageLayout {...props}>{props.children ?? <h1>Contenido</h1>}</PageLayout>
    </MemoryRouter>,
  )
}

describe('PageLayout', () => {
  it('pone el contenido en main#main-content, dentro del contenedor de 1200 px', () => {
    montar({ contentClassName: 'extra' })
    const main = screen.getByRole('main')
    expect(main).toHaveAttribute('id', 'main-content')
    expect(main).toHaveClass('st-page__main')
    const contenedor = screen.getByRole('heading', { name: 'Contenido' }).parentElement
    expect(contenedor).toHaveClass('st-page__content', 'st-page__content--default', 'extra')
    expect(contenedor?.parentElement).toBe(main)
  })

  it('dibuja los tres halos globales como decoración oculta', () => {
    const { container } = montar()
    const raiz = container.firstElementChild
    expect(raiz).toHaveClass('st-page', 'st-page--default')
    const halos = container.querySelector('.st-page__halos')
    expect(halos).toHaveAttribute('aria-hidden', 'true')
    expect(halos).not.toHaveClass('st-page__halos--home')
    expect(halos?.querySelectorAll('.st-page__halo')).toHaveLength(3)
    expect(halos?.querySelector('.st-page__halo--coral')).not.toBeNull()
    expect(halos?.querySelector('.st-page__halo--sky')).not.toBeNull()
    expect(halos?.querySelector('.st-page__halo--navy')).not.toBeNull()
  })

  it('monta la barra como hija directa del lienzo y el pie después de main', () => {
    const { container } = montar({ topbar: <header>Barra</header>, footer: <footer>Pie</footer> })
    const raiz = container.firstElementChild
    const barra = screen.getByRole('banner')
    expect(barra.parentElement).toBe(raiz)

    const pie = screen.getByRole('contentinfo')
    expect(pie.parentElement).toHaveClass('st-page__footer')
    expect(pie.parentElement?.parentElement).toBe(raiz)

    const main = screen.getByRole('main')
    expect(barra.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(main.compareDocumentPosition(pie) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('sin barra no agrega el enlace de salto ni el envoltorio del pie', () => {
    const { container } = montar()
    expect(screen.queryByRole('link', { name: 'Saltar al contenido' })).not.toBeInTheDocument()
    expect(container.querySelector('.st-page__footer')).toBeNull()
  })

  it('con barra, «Saltar al contenido» es lo primero y lleva el foco a main sin cambiar la URL', async () => {
    const user = userEvent.setup()
    montar({ topbar: <header><a href="/pruebas">Tests</a></header> })
    const salto = screen.getByRole('link', { name: 'Saltar al contenido' })
    expect(salto).toHaveAttribute('href', '#main-content')
    expect(salto).toHaveClass('st-skip-link')

    await user.tab()
    expect(salto).toHaveFocus()
    await user.keyboard('{Enter}')
    const main = screen.getByRole('main')
    expect(main).toHaveFocus()
    expect(main).toHaveAttribute('tabindex', '-1')

    // Al salir de main, el tabindex temporal se retira: un clic en el contenido no lo enfoca.
    await user.tab()
    expect(main).not.toHaveFocus()
    expect(main).not.toHaveAttribute('tabindex')
  })

  it('variante home: halos de la home y barra, contenido y pie dentro del marco', () => {
    const { container } = montar({
      variant: 'home',
      topbar: <header>Barra</header>,
      footer: <footer>Pie</footer>,
    })
    expect(container.firstElementChild).toHaveClass('st-page--home')
    expect(container.querySelector('.st-page__halos')).toHaveClass('st-page__halos--home')

    const marco = container.querySelector('.st-page__frame')
    expect(marco).toContainElement(screen.getByRole('banner'))
    expect(marco).toContainElement(screen.getByRole('main'))
    expect(marco).toContainElement(screen.getByRole('contentinfo'))
    expect(screen.getByRole('heading', { name: 'Contenido' }).parentElement).toHaveClass('st-page__content--home')
  })

  it('variante candidate: halos globales y contenido sin contenedor', () => {
    const { container } = montar({ variant: 'candidate' })
    expect(container.firstElementChild).toHaveClass('st-page--candidate')
    expect(container.querySelector('.st-page__halos')).not.toHaveClass('st-page__halos--home')
    expect(container.querySelector('.st-page__frame')).toBeNull()
    expect(screen.getByRole('heading', { name: 'Contenido' }).parentElement).toHaveClass(
      'st-page__content',
      'st-page__content--candidate',
    )
  })

  it('monta ScrollToTop: sube al inicio al montar', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo')
    montar()
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'instant' })
  })
})
