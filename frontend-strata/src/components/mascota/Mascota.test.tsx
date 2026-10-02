import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { gsap } from 'gsap'
import { useRef, type ReactElement } from 'react'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { Mascota } from './Mascota'
import { DURACION_BURBUJA_MS, MENSAJES_MASCOTA } from './mensajes'
import { OPACIDAD_NADO, OPACIDAD_TITULAR, RETARDO_ENTRADA_MS } from './motor'
import { CLAVE_MASCOTA_OCULTA, guardarMascotaOculta, reiniciarPreferenciaMascota } from './preferencia'
import { RETARDO_REAPARICION_MS } from './tiempos'

// GSAP real, movido a mano: sin updateRoot en el ticker, avanzarGsap() renderiza
// la línea de tiempo raíz al segundo pedido y luego corre los listeners del
// ticker una vez (el cuadro() de la mascota). Los timers de la mascota
// (entrada, resize y burbuja) son setTimeout falsos, y performance.now()
// avanza con ellos (la espera de 6 s guarda lo que falta al ocultar la pestaña).
// requestAnimationFrame sigue siendo el de jsdom: el ticker de GSAP no cuenta
// como timer de la mascota. El motor llega por import dinámico: montar() lo espera.

beforeAll(() => {
  gsap.ticker.remove(gsap.updateRoot)
})

afterAll(() => {
  gsap.ticker.add(gsap.updateRoot)
  gsap.ticker.sleep()
})

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] })
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  delete (document as { visibilityState?: unknown }).visibilityState
  restaurarVentana()
  window.localStorage.clear()
  reiniciarPreferenciaMascota()
})

/** Espera los import() pendientes (el motor de la mascota). */
async function esperarMotor() {
  await act(() => vi.dynamicImportSettled())
}

/** Renderiza y espera a que el motor arranque. */
async function montar(ui: ReactElement) {
  const resultado = render(ui)
  await esperarMotor()
  return resultado
}

function avanzarGsap(segundos: number) {
  act(() => {
    gsap.updateRoot(gsap.globalTimeline.time() + segundos)
    gsap.ticker.tick()
  })
}

function avanzarTimers(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

/** Tweens y líneas de tiempo vivos en la raíz de GSAP. */
function animacionesVivas() {
  return gsap.globalTimeline.getChildren(true, true, true)
}

function botonMascota() {
  return screen.getByRole('button', { name: /mascota de strata/i })
}

function cuerpoMascota() {
  return botonMascota().querySelector('img') as HTMLImageElement
}

function burbuja() {
  return screen.getByRole('status')
}

/** Contenedor que coloca el motor: la región viva y «Ocultar mascota». */
function contenedorBurbuja() {
  return document.querySelector('.st-mascota__burbuja') as HTMLElement
}

/** Lleva la mascota hasta el nado: 6 s de espera y la entrada (3.2 s como máximo). */
function hastaElNado() {
  avanzarTimers(RETARDO_ENTRADA_MS)
  avanzarGsap(4)
  expect(botonMascota()).toHaveAttribute('data-fase', 'nado')
}

function cajaFalsa(left: number, top: number, right: number, bottom: number) {
  return {
    left,
    top,
    right,
    bottom,
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
    toJSON: () => ({}),
  } as DOMRect
}

/** matchMedia controlable para prefers-reduced-motion. */
function simularMovimientoReducido(inicial: boolean) {
  let reducir = inicial
  const oyentes = new Set<() => void>()
  vi.stubGlobal(
    'matchMedia',
    vi.fn((consulta: string) => ({
      get matches() {
        return consulta.includes('prefers-reduced-motion') && reducir
      },
      media: consulta,
      onchange: null,
      addEventListener: (_tipo: string, oyente: () => void) => oyentes.add(oyente),
      removeEventListener: (_tipo: string, oyente: () => void) => oyentes.delete(oyente),
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })),
  )
  return {
    cambiar(valor: boolean) {
      reducir = valor
      act(() => oyentes.forEach((oyente) => oyente()))
    },
  }
}

function cambiarVisibilidad(estado: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => estado })
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'))
  })
}

const medidasOriginales = {
  innerWidth: Object.getOwnPropertyDescriptor(window, 'innerWidth'),
  innerHeight: Object.getOwnPropertyDescriptor(window, 'innerHeight'),
}

/** Cambia el tamaño de la ventana y avisa con resize. afterEach lo restaura. */
function redimensionar(ancho: number, alto: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: ancho })
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: alto })
  act(() => {
    window.dispatchEvent(new Event('resize'))
  })
}

function restaurarVentana() {
  for (const [clave, descriptor] of Object.entries(medidasOriginales)) {
    if (descriptor) Object.defineProperty(window, clave, descriptor)
    else delete (window as unknown as Record<string, unknown>)[clave]
  }
}

/** Centro y giro de la mascota, leídos de su transform. */
function leer(boton: HTMLElement) {
  const partes = /translate3d\(([-\d.]+)px, ([-\d.]+)px, 0\).*rotate\(([-\d.]+)deg\)/.exec(boton.style.transform)
  if (!partes) throw new Error(`transform inesperado: ${boton.style.transform}`)
  return { x: Number(partes[1]), y: Number(partes[2]), giro: Number(partes[3]) }
}

function diferenciaAngular(a: number, b: number) {
  return Math.abs(((((b - a) % 360) + 540) % 360) - 180)
}

/**
 * Avanza cuadro a cuadro (60 por segundo) y mide el mayor desplazamiento y el
 * mayor giro entre dos cuadros, y la peor alineación entre la cabeza y la
 * dirección en que avanza (1: de frente; −1: de reversa).
 */
function recorrer(boton: HTMLElement, segundos: number) {
  let previo = leer(boton)
  let maxPaso = 0
  let maxGiro = 0
  let peorAlineacion = 1
  for (let cuadro = 0; cuadro < Math.round(segundos * 60); cuadro++) {
    avanzarGsap(1 / 60)
    const actual = leer(boton)
    const dx = actual.x - previo.x
    const dy = actual.y - previo.y
    const paso = Math.hypot(dx, dy)
    maxPaso = Math.max(maxPaso, paso)
    maxGiro = Math.max(maxGiro, diferenciaAngular(previo.giro, actual.giro))
    if (paso > 0.3) {
      const rumbo = ((actual.giro - 90) * Math.PI) / 180
      peorAlineacion = Math.min(peorAlineacion, (dx * Math.cos(rumbo) + dy * Math.sin(rumbo)) / paso)
    }
    previo = actual
  }
  return { maxPaso, maxGiro, peorAlineacion }
}

describe('Mascota', () => {
  it('entra a los 6 s desde fuera de la pantalla y empieza a nadar a .8 de opacidad', async () => {
    render(<Mascota />)
    const boton = botonMascota()
    // Mientras llega el motor, sin fase: el CSS la deja oculta.
    expect(boton).not.toHaveAttribute('data-fase')
    expect(document.body.lastElementChild).toHaveClass('st-mascota')
    await esperarMotor()
    expect(boton).toHaveAttribute('data-fase', 'espera')

    avanzarTimers(RETARDO_ENTRADA_MS - 1)
    expect(boton).toHaveAttribute('data-fase', 'espera')
    avanzarTimers(1)
    expect(boton).toHaveAttribute('data-fase', 'entrada')
    // Arranca a la derecha, fuera de la ventana (1024 px en jsdom), con la cabeza hacia la izquierda.
    expect(boton.style.transform).toContain(`translate3d(${window.innerWidth + 160}px`)
    expect(boton.style.transform).toContain('rotate(270deg)')

    avanzarGsap(4)
    expect(boton).toHaveAttribute('data-fase', 'nado')
    expect(Number(cuerpoMascota().style.opacity)).toBeCloseTo(OPACIDAD_NADO)
  })

  describe('con prefers-reduced-motion', () => {
    it('no se monta ni anima: sin ticker, listeners, timers ni tweens', async () => {
      simularMovimientoReducido(true)
      const tickerAdd = vi.spyOn(gsap.ticker, 'add')
      const ventanaAdd = vi.spyOn(window, 'addEventListener')

      await montar(<Mascota />)
      avanzarTimers(RETARDO_ENTRADA_MS * 2)
      avanzarGsap(10)

      expect(screen.queryByRole('button', { name: /mascota/i })).not.toBeInTheDocument()
      expect(document.querySelector('.st-mascota')).toBeNull()
      expect(tickerAdd).not.toHaveBeenCalled()
      expect(ventanaAdd.mock.calls.filter(([tipo]) => tipo === 'click' || tipo === 'resize')).toHaveLength(0)
      expect(vi.getTimerCount()).toBe(0)
      expect(animacionesVivas()).toHaveLength(0)
    })

    it('escucha los cambios de la preferencia: aparece al quitarla y se limpia al volver a pedirla', async () => {
      const preferencia = simularMovimientoReducido(true)
      await montar(<Mascota />)
      expect(screen.queryByRole('button', { name: /mascota/i })).not.toBeInTheDocument()

      preferencia.cambiar(false)
      await esperarMotor()
      hastaElNado()
      expect(animacionesVivas().length).toBeGreaterThan(0)

      preferencia.cambiar(true)
      expect(screen.queryByRole('button', { name: /mascota/i })).not.toBeInTheDocument()
      expect(animacionesVivas()).toHaveLength(0)
      expect(vi.getTimerCount()).toBe(0)
    })
  })

  describe('al desmontar', () => {
    it('quita el ticker, los listeners de window y document, y limpia timers y tweens', async () => {
      const tickerAdd = vi.spyOn(gsap.ticker, 'add')
      const tickerRemove = vi.spyOn(gsap.ticker, 'remove')
      const ventanaAdd = vi.spyOn(window, 'addEventListener')
      const ventanaRemove = vi.spyOn(window, 'removeEventListener')
      const documentoAdd = vi.spyOn(document, 'addEventListener')
      const documentoRemove = vi.spyOn(document, 'removeEventListener')

      const { unmount } = await montar(<Mascota />)
      hastaElNado()
      // Deja algo pendiente de cada tipo: resize con espera, burbuja con su timer y Escape escuchando.
      act(() => {
        window.dispatchEvent(new Event('resize'))
      })
      fireEvent.click(botonMascota())
      expect(vi.getTimerCount()).toBeGreaterThanOrEqual(2)
      expect(animacionesVivas().length).toBeGreaterThan(0)

      const cuadro = tickerAdd.mock.calls[0][0]
      const delMotor = ventanaAdd.mock.calls.filter(([tipo]) => tipo === 'click' || tipo === 'resize')
      const deDocumento = documentoAdd.mock.calls.filter(([tipo]) => tipo === 'visibilitychange' || tipo === 'keydown')
      expect(delMotor).toHaveLength(2)
      expect(deDocumento).toHaveLength(2)

      unmount()

      expect(tickerRemove).toHaveBeenCalledWith(cuadro)
      for (const [tipo, oyente, opciones] of delMotor) {
        expect(ventanaRemove).toHaveBeenCalledWith(tipo, oyente, ...(opciones === undefined ? [] : [opciones]))
      }
      for (const [tipo, oyente] of deDocumento) {
        expect(documentoRemove).toHaveBeenCalledWith(tipo, oyente)
      }
      expect(vi.getTimerCount()).toBe(0)
      expect(animacionesVivas()).toHaveLength(0)
      expect(document.querySelector('.st-mascota')).toBeNull()
    })

    it('si se desmonta antes de que llegue el motor, no arranca nada', async () => {
      const ventanaAdd = vi.spyOn(window, 'addEventListener')
      const { unmount } = render(<Mascota />)
      unmount()
      await esperarMotor()
      avanzarTimers(RETARDO_ENTRADA_MS * 2)
      expect(ventanaAdd.mock.calls.filter(([tipo]) => tipo === 'click' || tipo === 'resize')).toHaveLength(0)
      expect(vi.getTimerCount()).toBe(0)
      expect(animacionesVivas()).toHaveLength(0)
    })

    it('entrar y salir veinte veces no deja tweens, ticker ni timers vivos', async () => {
      const tickerAdd = vi.spyOn(gsap.ticker, 'add')
      const tickerRemove = vi.spyOn(gsap.ticker, 'remove')
      for (let vuelta = 0; vuelta < 20; vuelta++) {
        const { unmount } = await montar(<Mascota />)
        if (vuelta % 2 === 0) hastaElNado()
        unmount()
        expect(animacionesVivas()).toHaveLength(0)
        expect(vi.getTimerCount()).toBe(0)
      }
      // Cada listener que entró al ticker salió.
      expect(tickerAdd).toHaveBeenCalled()
      for (const [cuadro] of tickerAdd.mock.calls) {
        expect(tickerRemove).toHaveBeenCalledWith(cuadro)
      }
    })
  })

  describe('carrera', () => {
    it('corre hacia el elemento con data-mascota-objetivo y retoma el nado', async () => {
      await montar(
        <>
          <button type="button" data-mascota-objetivo="">
            <span>Tengo un código</span>
          </button>
          <Mascota />
        </>,
      )
      const objetivo = screen.getByRole('button', { name: 'Tengo un código' })
      objetivo.getBoundingClientRect = () => cajaFalsa(200, 300, 300, 340)
      const boton = botonMascota()

      // Durante la entrada no reacciona, como el prototipo.
      avanzarTimers(RETARDO_ENTRADA_MS)
      fireEvent.click(objetivo)
      expect(boton).toHaveAttribute('data-fase', 'entrada')
      avanzarGsap(4)
      expect(boton).toHaveAttribute('data-fase', 'nado')

      // El clic en un hijo del objetivo también cuenta.
      fireEvent.click(objetivo.querySelector('span') as HTMLElement)
      expect(boton).toHaveAttribute('data-fase', 'carrera')

      // Llega al centro del objetivo + 66/+10 px (Strata.dc.html:1736-1737).
      avanzarGsap(1.5)
      expect(boton.style.transform).toContain('translate3d(316px, 330px, 0)')

      // Vuelta de festejo, 400 ms de pausa y regreso a la ruta.
      avanzarGsap(1.2)
      expect(boton).toHaveAttribute('data-fase', 'regreso')
      avanzarGsap(5)
      expect(boton).toHaveAttribute('data-fase', 'nado')
    })

    it('no corre hacia elementos sin el atributo, aunque su texto sea de un CTA', async () => {
      await montar(
        <>
          <button type="button">Tengo un código</button>
          <Mascota />
        </>,
      )
      hastaElNado()
      fireEvent.click(screen.getByRole('button', { name: 'Tengo un código' }))
      expect(botonMascota()).toHaveAttribute('data-fase', 'nado')
    })
  })

  describe('burbuja', () => {
    it('al tocarla brinca y muestra los consejos en rueda, en una región aria-live', async () => {
      await montar(<Mascota />)
      hastaElNado()
      const boton = botonMascota()
      const region = burbuja()
      expect(region).toHaveAttribute('aria-live', 'polite')
      expect(region).toBeEmptyDOMElement()

      fireEvent.click(boton)
      expect(region).toHaveTextContent(MENSAJES_MASCOTA[0])
      // Brinco: 26 px arriba y escala 1.22 en .26 s.
      avanzarGsap(0.26)
      expect(boton.style.transform).toContain('scale(1.22)')
      avanzarGsap(0.5)
      expect(boton.style.transform).toContain('scale(1)')

      fireEvent.click(boton)
      expect(region).toHaveTextContent(MENSAJES_MASCOTA[1])
      for (let i = 2; i < MENSAJES_MASCOTA.length; i++) fireEvent.click(boton)
      fireEvent.click(boton)
      expect(region).toHaveTextContent(MENSAJES_MASCOTA[0])
    })

    it('se coloca junto a la mascota: a la izquierda en la mitad derecha de la ventana', async () => {
      await montar(<Mascota />)
      hastaElNado()
      fireEvent.click(botonMascota())
      // Al empezar el nado está en el borde derecho.
      expect(contenedorBurbuja()).toContainElement(burbuja())
      expect(contenedorBurbuja()).toHaveAttribute('data-lado', 'izquierda')
      expect(contenedorBurbuja().style.transform).toMatch(/^translate3d\(\d+px, \d+px, 0\)$/)
    })

    it('se cierra con Escape y sola a los 5.4 s', async () => {
      await montar(<Mascota />)
      hastaElNado()
      fireEvent.click(botonMascota())
      expect(burbuja()).not.toBeEmptyDOMElement()
      fireEvent.keyDown(document, { key: 'Escape' })
      expect(burbuja()).toBeEmptyDOMElement()

      fireEvent.click(botonMascota())
      avanzarTimers(DURACION_BURBUJA_MS - 1)
      expect(burbuja()).not.toBeEmptyDOMElement()
      avanzarTimers(1)
      expect(burbuja()).toBeEmptyDOMElement()
    })
  })

  describe('ocultar (WCAG 2.2.2; D-27)', () => {
    it('la burbuja ofrece «Ocultar mascota», fuera de la región viva', async () => {
      await montar(<Mascota />)
      hastaElNado()
      expect(screen.queryByRole('button', { name: 'Ocultar mascota' })).not.toBeInTheDocument()
      fireEvent.click(botonMascota())
      const ocultar = screen.getByRole('button', { name: 'Ocultar mascota' })
      expect(contenedorBurbuja()).toContainElement(ocultar)
      expect(burbuja()).not.toContainElement(ocultar)
    })

    it('al ocultarla la detiene por completo: sin tweens, ticker, listeners ni timers, y lo recuerda', async () => {
      const tickerRemove = vi.spyOn(gsap.ticker, 'remove')
      const ventanaRemove = vi.spyOn(window, 'removeEventListener')
      await montar(<Mascota />)
      hastaElNado()
      fireEvent.click(botonMascota())
      expect(animacionesVivas().length).toBeGreaterThan(0)

      fireEvent.click(screen.getByRole('button', { name: 'Ocultar mascota' }))

      expect(document.querySelector('.st-mascota')).toBeNull()
      expect(animacionesVivas()).toHaveLength(0)
      expect(vi.getTimerCount()).toBe(0)
      expect(tickerRemove).toHaveBeenCalled()
      expect(ventanaRemove.mock.calls.map(([tipo]) => tipo)).toEqual(expect.arrayContaining(['click', 'resize']))
      expect(window.localStorage.getItem(CLAVE_MASCOTA_OCULTA)).toBe('1')
    })

    it('con el foco en «Ocultar mascota», al ocultarla el foco pasa al contenido sin desplazar', async () => {
      render(<main id="main-content" />)
      await montar(<Mascota />)
      hastaElNado()
      fireEvent.click(botonMascota())
      const ocultar = screen.getByRole('button', { name: 'Ocultar mascota' })
      act(() => ocultar.focus())
      fireEvent.click(ocultar)
      expect(document.activeElement).toBe(document.getElementById('main-content'))
    })

    it('oculta desde una visita anterior: no se monta ni descarga el motor', async () => {
      window.localStorage.setItem(CLAVE_MASCOTA_OCULTA, '1')
      const ventanaAdd = vi.spyOn(window, 'addEventListener')
      await montar(<Mascota />)
      avanzarTimers(RETARDO_ENTRADA_MS * 2)
      expect(document.querySelector('.st-mascota')).toBeNull()
      expect(ventanaAdd.mock.calls.filter(([tipo]) => tipo === 'click' || tipo === 'resize')).toHaveLength(0)
      expect(animacionesVivas()).toHaveLength(0)
    })

    it('al volver a mostrarla entra casi de inmediato', async () => {
      act(() => guardarMascotaOculta(true))
      await montar(<Mascota />)
      expect(document.querySelector('.st-mascota')).toBeNull()
      act(() => guardarMascotaOculta(false))
      await esperarMotor()
      expect(botonMascota()).toHaveAttribute('data-fase', 'espera')
      avanzarTimers(RETARDO_REAPARICION_MS)
      expect(botonMascota()).toHaveAttribute('data-fase', 'entrada')
    })

    it('sin localStorage (bloqueado) se muestra, y ocultarla vale para la pestaña', async () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('bloqueado')
      })
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('bloqueado')
      })
      await montar(<Mascota />)
      hastaElNado()
      fireEvent.click(botonMascota())
      fireEvent.click(screen.getByRole('button', { name: 'Ocultar mascota' }))
      expect(document.querySelector('.st-mascota')).toBeNull()
    })

    it('con el puntero o el foco en «Ocultar mascota», la burbuja espera', async () => {
      await montar(<Mascota />)
      hastaElNado()
      fireEvent.click(botonMascota())
      const ocultar = screen.getByRole('button', { name: 'Ocultar mascota' })
      fireEvent.focus(ocultar)
      avanzarTimers(DURACION_BURBUJA_MS * 2)
      expect(burbuja()).not.toBeEmptyDOMElement()
      fireEvent.blur(ocultar)
      avanzarTimers(DURACION_BURBUJA_MS)
      expect(burbuja()).toBeEmptyDOMElement()

      fireEvent.click(botonMascota())
      fireEvent.mouseEnter(screen.getByRole('button', { name: 'Ocultar mascota' }))
      avanzarTimers(DURACION_BURBUJA_MS * 2)
      expect(burbuja()).not.toBeEmptyDOMElement()
    })
  })

  describe('vigilarTitular', () => {
    it('baja a .26 sobre el H1 de la ref y vuelve a .8 al salir; mide cada 500 ms', async () => {
      const ahora = vi.spyOn(performance, 'now').mockReturnValue(10_000)
      function Home() {
        const tituloRef = useRef<HTMLHeadingElement>(null)
        return (
          <>
            {/* Señuelo: con tituloRef no se usa el selector. */}
            <p data-mascota-titular="">Otro texto</p>
            <h1 ref={tituloRef}>Descubre lo que llevas dentro.</h1>
            <Mascota tituloRef={tituloRef} />
          </>
        )
      }
      await montar(<Home />)
      const titular = screen.getByRole('heading', { level: 1 })
      const medir = vi.fn(() => cajaFalsa(0, 0, window.innerWidth, window.innerHeight))
      titular.getBoundingClientRect = medir

      hastaElNado()
      avanzarGsap(0.8)
      expect(Number(cuerpoMascota().style.opacity)).toBeCloseTo(OPACIDAD_TITULAR)

      // El H1 se va (scroll). Antes de 500 ms no se vuelve a medir.
      medir.mockReturnValue(cajaFalsa(-5000, -5000, -4000, -4900))
      const medidas = medir.mock.calls.length
      ahora.mockReturnValue(10_400)
      avanzarGsap(0.1)
      expect(medir.mock.calls.length).toBe(medidas)
      ahora.mockReturnValue(10_600)
      avanzarGsap(0.1)
      expect(medir.mock.calls.length).toBe(medidas + 1)
      avanzarGsap(0.8)
      expect(Number(cuerpoMascota().style.opacity)).toBeCloseTo(OPACIDAD_NADO)
    })

    it('sin ref, vigila el elemento con data-mascota-titular', async () => {
      await montar(
        <>
          <h1 data-mascota-titular="">Titular</h1>
          <Mascota />
        </>,
      )
      screen.getByRole('heading', { level: 1 }).getBoundingClientRect = () =>
        cajaFalsa(0, 0, window.innerWidth, window.innerHeight)
      hastaElNado()
      avanzarGsap(0.8)
      expect(Number(cuerpoMascota().style.opacity)).toBeCloseTo(OPACIDAD_TITULAR)
    })
  })

  describe('continuidad (sin entrada de reversa ni giros de golpe)', () => {
    it('entra de cabeza y empalma con el nado sin saltos', async () => {
      await montar(<Mascota />)
      const boton = botonMascota()
      avanzarTimers(RETARDO_ENTRADA_MS)
      // Entrada (3.2 s como máximo) y casi 3 s de nado.
      const { maxPaso, maxGiro, peorAlineacion } = recorrer(boton, 6)
      expect(boton).toHaveAttribute('data-fase', 'nado')
      expect(maxPaso).toBeLessThan(5)
      expect(maxGiro).toBeLessThan(6)
      expect(peorAlineacion).toBeGreaterThan(0.95)
    })

    it('cada vuelta de 42 s empalma con la siguiente', async () => {
      await montar(<Mascota />)
      const boton = botonMascota()
      hastaElNado()
      avanzarGsap(41.5)
      const { maxPaso, maxGiro, peorAlineacion } = recorrer(boton, 1)
      expect(maxPaso).toBeLessThan(5)
      expect(maxGiro).toBeLessThan(6)
      expect(peorAlineacion).toBeGreaterThan(0.95)
    })

    it('tras la carrera regresa a la ruta y retoma el nado sin saltos', async () => {
      await montar(
        <>
          <button type="button" data-mascota-objetivo="">
            Para mí
          </button>
          <Mascota />
        </>,
      )
      screen.getByRole('button', { name: 'Para mí' }).getBoundingClientRect = () => cajaFalsa(200, 300, 300, 340)
      hastaElNado()
      const boton = botonMascota()
      fireEvent.click(screen.getByRole('button', { name: 'Para mí' }))
      avanzarGsap(2.7)
      expect(boton).toHaveAttribute('data-fase', 'regreso')
      // Regreso (4 s como máximo) y 2 s de nado.
      const { maxPaso, maxGiro, peorAlineacion } = recorrer(boton, 6)
      expect(boton).toHaveAttribute('data-fase', 'nado')
      expect(maxPaso).toBeLessThan(5)
      expect(maxGiro).toBeLessThan(6)
      expect(peorAlineacion).toBeGreaterThan(0.95)
    })
  })

  describe('resize', () => {
    it('al cambiar el ancho vuelve a la ruta nueva sin saltar', async () => {
      await montar(<Mascota />)
      hastaElNado()
      const boton = botonMascota()
      redimensionar(700, 768)
      avanzarTimers(149)
      expect(boton).toHaveAttribute('data-fase', 'nado')
      avanzarTimers(1)
      expect(boton).toHaveAttribute('data-fase', 'regreso')

      const { maxPaso, maxGiro } = recorrer(boton, 6)
      expect(boton).toHaveAttribute('data-fase', 'nado')
      expect(maxPaso).toBeLessThan(5)
      expect(maxGiro).toBeLessThan(6)
      expect(leer(boton).x).toBeLessThan(700)
    })

    it('un cambio de alto menor al 15 % (barra del navegador móvil) no rehace la ruta', async () => {
      await montar(<Mascota />)
      hastaElNado()
      redimensionar(window.innerWidth, window.innerHeight - 60)
      avanzarTimers(200)
      expect(botonMascota()).toHaveAttribute('data-fase', 'nado')
    })

    it('si la ventana cambia durante la entrada, al llegar regresa a la ruta nueva', async () => {
      await montar(<Mascota />)
      const boton = botonMascota()
      avanzarTimers(RETARDO_ENTRADA_MS)
      redimensionar(800, 600)
      avanzarTimers(150)
      expect(boton).toHaveAttribute('data-fase', 'entrada')
      avanzarGsap(3.3)
      expect(boton).toHaveAttribute('data-fase', 'regreso')
      avanzarGsap(5)
      expect(boton).toHaveAttribute('data-fase', 'nado')
    })
  })

  describe('pausas', () => {
    it('con la pestaña oculta pausa todo y la espera de 6 s se detiene', async () => {
      await montar(<Mascota />)
      const boton = botonMascota()
      avanzarTimers(3000)
      cambiarVisibilidad('hidden')
      avanzarTimers(RETARDO_ENTRADA_MS * 2)
      expect(boton).toHaveAttribute('data-fase', 'espera')
      cambiarVisibilidad('visible')
      avanzarTimers(2999)
      expect(boton).toHaveAttribute('data-fase', 'espera')
      avanzarTimers(1)
      expect(boton).toHaveAttribute('data-fase', 'entrada')

      avanzarGsap(4)
      expect(boton).toHaveAttribute('data-fase', 'nado')
      cambiarVisibilidad('hidden')
      const vivas = animacionesVivas()
      expect(vivas.length).toBeGreaterThan(0)
      expect(vivas.every((animacion) => animacion.paused())).toBe(true)

      cambiarVisibilidad('visible')
      expect(animacionesVivas().some((animacion) => !animacion.paused())).toBe(true)
      const antes = boton.style.transform
      avanzarGsap(1)
      expect(boton.style.transform).not.toBe(antes)
    })

    /** :focus-visible a mano: el selector de jsdom adivina la modalidad con estado que queda entre pruebas. */
    function simularFocoVisible(boton: HTMLElement, visible: boolean) {
      const original = Element.prototype.matches
      vi.spyOn(boton, 'matches').mockImplementation(function (this: Element, selector: string) {
        return selector === ':focus-visible' ? visible : original.call(this, selector)
      })
    }

    it('con el foco del teclado encima deja de desplazarse', async () => {
      await montar(<Mascota />)
      hastaElNado()
      const boton = botonMascota()
      simularFocoVisible(boton, true)
      act(() => boton.focus())
      avanzarGsap(0.1)
      const quieta = boton.style.transform
      avanzarGsap(2)
      expect(boton.style.transform).toBe(quieta)

      act(() => boton.blur())
      avanzarGsap(2)
      expect(boton.style.transform).not.toBe(quieta)
    })

    it('con el foco de un clic sigue nadando, como el prototipo', async () => {
      await montar(<Mascota />)
      hastaElNado()
      const boton = botonMascota()
      simularFocoVisible(boton, false)
      act(() => boton.focus())
      const antes = boton.style.transform
      avanzarGsap(2)
      expect(boton.style.transform).not.toBe(antes)
    })
  })
})
