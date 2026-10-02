import { gsap } from 'gsap'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import { ATRIBUTO_OBJETIVO } from './atributos'
import {
  GIRO,
  acotar,
  cajaDeMascota,
  chocaConTitular,
  circuitoDesde,
  curvaDeEnlace,
  destinoCarrera,
  easeHermite,
  giroMasCorto,
  largoDeCurva,
  largoDeSegmento,
  posicionBurbuja,
  rutaMascota,
  tangenteEnVertice,
  verticeAdelante,
  type Caja,
  type Medidas,
  type Punto,
} from './geometria'

// Motor de la mascota: porta iniciarMascota, nadarLibre, entrarEnEscena,
// correrHacia, brincarMascota, vigilarTitular y pararMascota
// (Strata.dc.html:1585-1755) con las correcciones de auditoria.md, «Mascota»:
// GSAP por npm, todo dentro de gsap.context(), limpieza completa al parar,
// objetivos por atributo, giros por el lado corto, entrada y regreso al nado
// sin marcha atrás ni giros de golpe, y pausa con la pestaña oculta.

gsap.registerPlugin(MotionPathPlugin)

declare global {
  interface Window {
    /**
     * Solo en desarrollo: la instancia de GSAP de la app, para la prueba de
     * fugas (entrar y salir de «/» y revisar gsap.globalTimeline.getChildren()).
     */
    __stGsap?: typeof gsap
  }
}

if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.__stGsap = gsap
}

/** Espera antes de entrar en escena (Strata.dc.html:1629), contada con la pestaña visible. */
export const RETARDO_ENTRADA_MS = 6000
/** Una vuelta al circuito (Strata.dc.html:1664). */
export const DURACION_VUELTA_S = 42
/** curviness del nado (Strata.dc.html:1665). */
export const CURVATURA = 1.35
/** Opacidad al nadar (Strata.dc.html:1677). */
export const OPACIDAD_NADO = 0.8
/** Opacidad sobre el titular (Strata.dc.html:1703). */
export const OPACIDAD_TITULAR = 0.26
/** El titular se vuelve a medir cada 500 ms como mínimo (Strata.dc.html:1695). */
export const INTERVALO_TITULAR_MS = 500

/** Medidas de reserva mientras el botón no tiene caja: 100 px y la proporción del PNG (594 × 846). */
const ANCHO_BASE = 100
const ALTO_BASE = (ANCHO_BASE * 846) / 594
const ANCHO_BURBUJA_BASE = 232
/** Espera desde el último resize antes de rehacer la ruta. */
const ESPERA_RESIZE_MS = 150
/**
 * Cambio de alto que rehace la ruta si el ancho no cambió. La barra del
 * navegador móvil cambia el alto unos 60 px al desplazarse y no debe sacar a
 * la mascota de su vuelta en cada gesto.
 */
const CAMBIO_ALTO_MINIMO = 0.15
/** La entrada llega a este vértice: desde ahí el circuito baja por el borde derecho. */
const VERTICE_ENTRADA = 1

const RAD = Math.PI / 180

/** espera → entrada → nado ⇄ carrera → regreso → nado. Queda en el atributo data-fase del botón. */
export type FaseMascota = 'espera' | 'entrada' | 'nado' | 'carrera' | 'regreso'

export interface OpcionesMascota {
  /** Botón que se desplaza: el motor escribe su transform en cada cuadro. */
  boton: HTMLElement
  /** Imagen dentro del botón: opacidad y respiración. */
  cuerpo: HTMLElement
  /** Burbuja, si está montada: se coloca junto a la mascota en cada cuadro. */
  burbuja: () => HTMLElement | null
  /** H1 que vigila la mascota (vigilarTitular). */
  titular: () => Element | null
  /** Espera antes de entrar, en ms. Por defecto, RETARDO_ENTRADA_MS. */
  retardoEntrada?: number
}

export interface MotorMascota {
  /** Fase actual. */
  fase(): FaseMascota
  /** Brinco al tocarla (Strata.dc.html:1749-1755). */
  brincarMascota(): void
  /** Coloca la burbuja junto a la mascota sin esperar al siguiente cuadro. */
  colocarBurbuja(): void
  /** Con el foco del teclado encima, la mascota deja de desplazarse; al salir, sigue. */
  detenerPorFoco(activo: boolean): void
  /** Deshace todo: tweens, ticker, listeners y timers. El motor queda inservible. */
  pararMascota(): void
}

function redondear(valor: number, decimales = 2): number {
  const factor = 10 ** decimales
  return Math.round(valor * factor) / factor
}

function medirVentana(): Medidas {
  return { ancho: window.innerWidth, alto: window.innerHeight }
}

/** Velocidad del nado en px/s: el largo real del circuito curvado entre los 42 s de la vuelta. */
function velocidadNado(ruta: Punto[]): number {
  const [segmento] = MotionPathPlugin.arrayToRawPath(ruta, { curviness: CURVATURA })
  return largoDeSegmento(segmento) / DURACION_VUELTA_S
}

/**
 * iniciarMascota (Strata.dc.html:1619-1635): deja la mascota fuera de escena,
 * programa la entrada y escucha clics, resize y visibilidad. Devuelve el
 * motor; pararMascota() lo limpia todo.
 */
export function iniciarMascota({
  boton,
  cuerpo,
  burbuja,
  titular,
  retardoEntrada = RETARDO_ENTRADA_MS,
}: OpcionesMascota): MotorMascota {
  // Posición (centro, en px de la ventana), giro y escala. Los tweens animan
  // estos objetos y cuadro() los escribe en el transform del botón una vez
  // por cuadro. El brinco va aparte, en pantalla y hacia arriba, para no
  // pelear con el nado por «y» ni con la carrera por la escala.
  const pos = { x: 0, y: 0, rotation: 0, escala: 1 }
  const brinco = { y: 0, escala: 1 }
  // Todo tween nace dentro de este contexto (animar) y ctx.revert() los deshace al parar.
  const ctx = gsap.context(() => {})

  let fase: FaseMascota = 'espera'
  let parado = false
  let enEscena = false
  let oculta = document.visibilityState === 'hidden'
  let enfocada = false
  let tickerActivo = false
  let ventana = medirVentana()
  let ventanaDeRuta = ventana
  let ruta = rutaMascota(ventana)
  let tamano: Medidas = { ancho: ANCHO_BASE, alto: ALTO_BASE }

  let movimiento: gsap.core.Animation | null = null // entrada, nado, carrera o regreso
  let flex: gsap.core.Animation | null = null // respiración (Strata.dc.html:1679)
  let salto: gsap.core.Animation | null = null // brinco
  let fundido: gsap.core.Animation | null = null // opacidad de la entrada
  let atenuar: gsap.QuickToFunc | null = null // opacidad sobre el titular: un solo tween reutilizado
  let pausadasAlOcultar: gsap.core.Animation[] = []
  let entrando = false
  let opacidadMeta = OPACIDAD_NADO

  let titularCaja: Caja | null = null
  let ultimaMedicion = -Infinity
  let ultimoTransform = ''
  let ultimaBurbuja = ''

  let timerEntrada: number | undefined
  let timerRuta: number | undefined
  let esperaRestante = retardoEntrada
  let esperaDesde = 0

  /** Crea animaciones dentro del contexto. */
  function animar<T>(crear: () => T): T {
    return ctx.add(crear)
  }

  function matar(animacion: gsap.core.Animation | null) {
    animacion?.kill()
  }

  function ponerFase(nueva: FaseMascota) {
    fase = nueva
    boton.dataset.fase = nueva
  }

  // ── Ticker: un latido por cuadro (Strata.dc.html:1707-1716) ─────────────
  // Sin la doble vía del prototipo: la entrada solo la dispara el timer.

  function activarTicker() {
    if (tickerActivo || parado) return
    tickerActivo = true
    gsap.ticker.add(cuadro)
  }

  function desactivarTicker() {
    tickerActivo = false
    gsap.ticker.remove(cuadro)
  }

  /** Corre después de que GSAP renderiza el cuadro: transform, burbuja y titular. */
  function cuadro() {
    aplicar()
    colocarBurbuja()
    vigilarTitular()
  }

  function aplicar() {
    const transform =
      `translate3d(${redondear(pos.x)}px, ${redondear(pos.y + brinco.y)}px, 0) translate(-50%, -50%) ` +
      `rotate(${redondear(pos.rotation)}deg) scale(${redondear(pos.escala * brinco.escala, 3)})`
    if (transform === ultimoTransform) return
    ultimoTransform = transform
    boton.style.transform = transform
  }

  function centro(): Punto {
    return { x: pos.x, y: pos.y + brinco.y }
  }

  /** colocarBurbuja (Strata.dc.html:1682-1689): a la derecha o a la izquierda según la mitad de la ventana. */
  function colocarBurbuja() {
    const elemento = burbuja()
    if (parado || !enEscena || !elemento?.firstElementChild) return
    const caja = cajaDeMascota(centro(), tamano, pos.rotation, pos.escala * brinco.escala)
    const medidas = { ancho: elemento.offsetWidth || ANCHO_BURBUJA_BASE, alto: elemento.offsetHeight }
    const lugar = posicionBurbuja(caja, medidas, ventana)
    const transform = `translate3d(${lugar.x}px, ${lugar.y}px, 0)`
    if (transform !== ultimaBurbuja) {
      ultimaBurbuja = transform
      elemento.style.transform = transform
    }
    if (elemento.dataset.lado !== lugar.lado) elemento.dataset.lado = lugar.lado
  }

  /**
   * vigilarTitular (Strata.dc.html:1691-1705): sobre el H1 ampliado ±70/±50 px
   * la opacidad baja a .26; fuera, vuelve a .8. Mide el H1 cada 500 ms o más.
   */
  function vigilarTitular() {
    const ahora = performance.now()
    if (ahora - ultimaMedicion >= INTERVALO_TITULAR_MS) {
      ultimaMedicion = ahora
      titularCaja = titular()?.getBoundingClientRect() ?? null
    }
    if (entrando) return
    const meta = chocaConTitular(centro(), titularCaja) ? OPACIDAD_TITULAR : OPACIDAD_NADO
    if (meta === opacidadMeta) return
    opacidadMeta = meta
    if (!atenuar) {
      // Sin return: ctx.add() guarda como limpieza cualquier función que devuelva
      // el callback, y quickTo devuelve una (al revertir, volvería a animar).
      animar(() => {
        atenuar = gsap.quickTo(cuerpo, 'opacity', { duration: 0.7 })
      })
    }
    atenuar?.(meta)
  }

  // ── Pausas ─────────────────────────────────────────────────────────────

  /** El desplazamiento se detiene con la pestaña oculta o con el foco del teclado encima. */
  function aplicarPausa() {
    if (!movimiento) return
    if (oculta) {
      if (!movimiento.paused()) {
        movimiento.pause()
        pausadasAlOcultar.push(movimiento)
      }
      return
    }
    movimiento.paused(enfocada)
  }

  function animacionesVivas(): gsap.core.Animation[] {
    const todas = [movimiento, flex, salto, fundido, atenuar?.tween ?? null]
    // Sin parent ya terminó o se mató: reanudarla la volvería a meter en la línea de tiempo.
    return todas.filter((a): a is gsap.core.Animation => a !== null && a.parent !== null)
  }

  const alCambiarVisibilidad = () => {
    const ahoraOculta = document.visibilityState === 'hidden'
    if (parado || ahoraOculta === oculta) return
    oculta = ahoraOculta
    if (oculta) {
      suspenderEntrada()
      desactivarTicker()
      pausadasAlOcultar = animacionesVivas().filter((a) => !a.paused())
      pausadasAlOcultar.forEach((a) => a.pause())
      return
    }
    pausadasAlOcultar.forEach((a) => {
      if (a.parent) a.resume()
    })
    pausadasAlOcultar = []
    aplicarPausa()
    if (enEscena) activarTicker()
    else programarEntrada()
  }

  // ── Entrada ────────────────────────────────────────────────────────────

  function programarEntrada() {
    if (parado || enEscena || oculta || timerEntrada !== undefined) return
    esperaDesde = performance.now()
    timerEntrada = window.setTimeout(entrarEnEscena, Math.max(0, esperaRestante))
  }

  /** Con la pestaña oculta, la cuenta de 6 s se detiene y guarda lo que falta. */
  function suspenderEntrada() {
    if (timerEntrada === undefined) return
    window.clearTimeout(timerEntrada)
    timerEntrada = undefined
    esperaRestante -= performance.now() - esperaDesde
  }

  /**
   * entrarEnEscena (Strata.dc.html:1672-1680): llega desde fuera de la pantalla
   * por la derecha, a .8 de opacidad, y empieza a respirar. En el prototipo
   * entraba de reversa (cabeza a la derecha mientras avanzaba a la izquierda) y
   * al empezar el nado giraba de golpe. Aquí sigue una curva con autoRotate
   * que sale de cabeza hacia la izquierda y llega al vértice con la dirección y
   * la velocidad del nado, así que el empalme no se nota.
   */
  function entrarEnEscena() {
    timerEntrada = undefined
    if (parado || enEscena) return
    enEscena = true
    ventana = medirVentana()
    ventanaDeRuta = ventana
    ruta = rutaMascota(ventana)
    tamano = { ancho: boton.offsetWidth || ANCHO_BASE, alto: boton.offsetHeight || ALTO_BASE }

    // Fuera de la pantalla, a la derecha y al 40 % del alto (Strata.dc.html:1625).
    const inicio = { x: ventana.ancho + 160, y: ventana.alto * 0.4 }
    const camino = curvaDeEnlace(inicio, Math.PI, ruta[VERTICE_ENTRADA], tangenteEnVertice(ruta, VERTICE_ENTRADA))
    const largo = largoDeCurva(camino)
    const velocidad = velocidadNado(ruta)
    const duracion = acotar(largo / velocidad, 1.6, 3.2)
    // Pendiente final = velocidad del nado / velocidad media del tramo: llega a la velocidad de la vuelta.
    const final = acotar((velocidad * duracion) / largo, 0.3, 1.7)

    Object.assign(pos, { x: inicio.x, y: inicio.y, rotation: 180 + GIRO, escala: 1 })
    ultimoTransform = ''
    aplicar()
    ponerFase('entrada')
    entrando = true
    opacidadMeta = OPACIDAD_NADO

    animar(() => {
      fundido = gsap.to(cuerpo, {
        opacity: OPACIDAD_NADO,
        duration: 1.4,
        ease: 'power2.out',
        onComplete: () => {
          entrando = false
          fundido = null
        },
      })
      flex = gsap.to(cuerpo, { scaleY: 1.04, scaleX: 0.97, duration: 0.4, yoyo: true, repeat: -1, ease: 'sine.inOut' })
      movimiento = gsap.to(pos, {
        duration: duracion,
        ease: easeHermite(2 - final, final),
        motionPath: { path: camino, type: 'cubic', autoRotate: GIRO },
        onComplete: () => nadarLibre(VERTICE_ENTRADA),
      })
    })
    activarTicker()
    aplicarPausa()
  }

  // ── Nado ───────────────────────────────────────────────────────────────

  /**
   * nadarLibre (Strata.dc.html:1660-1668): vuelta de 42 s por el circuito,
   * con curviness 1.35 y autoRotate 90, empezando en el vértice k. Con
   * fromCurrent: false el circuito no incluye la posición de arranque, así que
   * cada vuelta empalma con la anterior.
   */
  function nadarLibre(k: number) {
    if (parado) return
    // Si la ventana cambió mientras llegaba, el vértice ya no está aquí: primero vuelve a la ruta.
    if (Math.hypot(pos.x - ruta[k].x, pos.y - ruta[k].y) > 2) {
      regresarALaRuta(false)
      return
    }
    matar(movimiento)
    ponerFase('nado')
    movimiento = animar(() =>
      gsap.to(pos, {
        duration: DURACION_VUELTA_S,
        repeat: -1,
        ease: 'none',
        motionPath: { path: circuitoDesde(ruta, k), curviness: CURVATURA, autoRotate: GIRO, fromCurrent: false },
      }),
    )
    aplicarPausa()
  }

  /**
   * Vuelve al circuito por una curva que sale con el rumbo actual y llega al
   * siguiente vértice con la dirección y la velocidad del nado. Sustituye al
   * nadarLibre() desde donde estuviera del prototipo, que repetía ese punto en
   * cada vuelta. Tras la carrera arranca desde el reposo; tras un resize, sin
   * frenar.
   */
  function regresarALaRuta(desdeReposo: boolean) {
    if (parado) return
    const rumbo = (pos.rotation - GIRO) * RAD
    const desde = { x: pos.x, y: pos.y }
    const k = verticeAdelante(ruta, desde, rumbo)
    const camino = curvaDeEnlace(desde, rumbo, ruta[k], tangenteEnVertice(ruta, k))
    const largo = largoDeCurva(camino)
    const velocidad = velocidadNado(ruta)
    const duracion = acotar(((desdeReposo ? 2 : 1) * largo) / velocidad, 0.6, 4)
    const pendiente = largo > 0 ? (velocidad * duracion) / largo : 1
    const ease = desdeReposo ? easeHermite(0, Math.min(3, pendiente)) : easeHermite(Math.min(2, pendiente), Math.min(2, pendiente))

    matar(movimiento)
    ponerFase('regreso')
    movimiento = animar(() =>
      gsap.to(pos, {
        duration: duracion,
        ease,
        motionPath: { path: camino, type: 'cubic', autoRotate: GIRO },
        onComplete: () => nadarLibre(k),
      }),
    )
    aplicarPausa()
  }

  const alRedimensionar = () => {
    window.clearTimeout(timerRuta)
    timerRuta = window.setTimeout(recalcularRuta, ESPERA_RESIZE_MS)
  }

  /** recalcularRuta (Strata.dc.html:1670), con espera tras el último resize y sin saltos. */
  function recalcularRuta() {
    timerRuta = undefined
    if (parado) return
    ventana = medirVentana()
    ultimaMedicion = -Infinity // el titular se movió con el layout
    if (!enEscena) return // la entrada calcula su ruta al empezar
    const cambioAncho = ventana.ancho !== ventanaDeRuta.ancho
    const cambioAlto = Math.abs(ventana.alto - ventanaDeRuta.alto) >= ventanaDeRuta.alto * CAMBIO_ALTO_MINIMO
    if (!cambioAncho && !cambioAlto) return
    ventanaDeRuta = ventana
    ruta = rutaMascota(ventana)
    // En la entrada, nadarLibre ve al llegar que el vértice se movió; la carrera regresa a la ruta nueva al terminar.
    if (fase === 'nado' || fase === 'regreso') regresarALaRuta(false)
  }

  // ── Carrera ────────────────────────────────────────────────────────────

  /**
   * correrHacia (Strata.dc.html:1731-1747): gira hacia el objetivo, corre,
   * da una vuelta con escala 1.12 y, 400 ms después, retoma el nado. El giro
   * va por el lado corto y la pausa vive en la línea de tiempo (no en un
   * setTimeout), así que se pausa y se limpia con lo demás.
   */
  function correrHacia(objetivo: Caja) {
    const destino = destinoCarrera(objetivo, ventana)
    const angulo = Math.atan2(destino.y - pos.y, destino.x - pos.x) / RAD
    matar(movimiento)
    ponerFase('carrera')
    movimiento = animar(() =>
      gsap
        .timeline()
        .to(pos, { rotation: giroMasCorto(pos.rotation, angulo + GIRO), duration: 0.32, ease: 'power2.out' })
        .to(pos, { x: destino.x, y: destino.y, duration: 1.2, ease: 'power3.inOut' }, '-=0.1')
        .to(pos, { rotation: '+=360', escala: 1.12, duration: 0.8, ease: 'power1.inOut' })
        .to(pos, { escala: 1, duration: 0.3 }, '-=0.3')
        .call(() => regresarALaRuta(true), undefined, '+=0.4'),
    )
    aplicarPausa()
  }

  /**
   * clicGlobal (Strata.dc.html:1718-1729): corre hacia el elemento con
   * data-mascota-objetivo más cercano al clic, no hacia textos. No cancela el
   * clic. Antes de terminar la entrada no hace nada, como el prototipo.
   */
  const alHacerClic = (evento: MouseEvent) => {
    if (parado || fase === 'espera' || fase === 'entrada') return
    const objetivo = evento.target instanceof Element ? evento.target.closest(`[${ATRIBUTO_OBJETIVO}]`) : null
    if (!objetivo || boton.contains(objetivo)) return
    correrHacia(objetivo.getBoundingClientRect())
  }

  // ── Brinco ─────────────────────────────────────────────────────────────

  /**
   * brincarMascota: escala 1.22 y 26 px hacia arriba, y de vuelta con rebote.
   * Valores absolutos: varios toques seguidos no la van subiendo.
   */
  function brincarMascota() {
    if (parado || !enEscena) return
    colocarBurbuja()
    matar(salto)
    salto = animar(() =>
      gsap
        .timeline({
          onComplete: () => {
            salto = null
          },
        })
        .to(brinco, { y: -26, escala: 1.22, duration: 0.26, ease: 'back.out(2.4)' })
        .to(brinco, { y: 0, escala: 1, duration: 0.42, ease: 'bounce.out' }),
    )
  }

  /** pararMascota (Strata.dc.html:1637-1648), más todo lo que el prototipo dejaba vivo. */
  function pararMascota() {
    if (parado) return
    parado = true
    window.clearTimeout(timerEntrada)
    window.clearTimeout(timerRuta)
    timerEntrada = undefined
    timerRuta = undefined
    window.removeEventListener('click', alHacerClic, true)
    window.removeEventListener('resize', alRedimensionar)
    document.removeEventListener('visibilitychange', alCambiarVisibilidad)
    desactivarTicker()
    ctx.revert()
    movimiento = flex = salto = fundido = null
    atenuar = null
    pausadasAlOcultar = []
  }

  // ── Arranque ───────────────────────────────────────────────────────────
  ponerFase('espera')
  window.addEventListener('click', alHacerClic, true)
  window.addEventListener('resize', alRedimensionar)
  document.addEventListener('visibilitychange', alCambiarVisibilidad)
  programarEntrada()

  return {
    fase: () => fase,
    brincarMascota,
    colocarBurbuja,
    detenerPorFoco(activo: boolean) {
      if (parado || enfocada === activo) return
      enfocada = activo
      aplicarPausa()
    },
    pararMascota,
  }
}
