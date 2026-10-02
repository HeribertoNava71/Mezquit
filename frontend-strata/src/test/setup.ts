// Configuración común de Vitest (environment jsdom).
// - Matchers de jest-dom (toBeInTheDocument, toHaveAccessibleName…).
// - Limpieza del DOM después de cada prueba (no usamos globals de Vitest).
// - Dobles mínimos de APIs que jsdom no implementa.
import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})

// findBy* y waitFor esperan hasta 3 s (1 s por defecto). Con la suite completa en
// paralelo y la máquina cargada, dos pruebas que esperan una respuesta simulada
// se pasaban del segundo de vez en cuando (QA de la Fase 8). Solo tarda más una
// prueba que de todos modos iba a fallar.
configure({ asyncUtilTimeout: 3000 })

// jsdom no implementa matchMedia. Por defecto ninguna media query coincide
// (sin movimiento reducido). Una prueba puede reemplazarlo con vi.stubGlobal
// o asignando window.matchMedia.
if (typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })
}

// jsdom no implementa el scroll: window.scrollTo solo avisa «Not implemented»
// y Element.scrollIntoView no existe. ScrollToTop (en PageLayout) los usa en
// cada cambio de ruta. Una prueba puede espiarlos con vi.spyOn.
window.scrollTo = (() => {}) as typeof window.scrollTo
if (typeof Element.prototype.scrollIntoView !== 'function') {
  Element.prototype.scrollIntoView = function scrollIntoView() {}
}

// jsdom define <dialog> pero no showModal, show ni close.
if (typeof HTMLDialogElement !== 'undefined' && typeof HTMLDialogElement.prototype.showModal !== 'function') {
  HTMLDialogElement.prototype.show = function show(this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement, returnValue?: string) {
    if (!this.hasAttribute('open')) return
    if (returnValue !== undefined) this.returnValue = returnValue
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
}
