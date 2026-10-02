import { useEffect, useLayoutEffect, useRef, useState, type FocusEvent, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { useReducedMotion } from '@/components/ui'
import { SITE } from '@/config/site'
import { ATRIBUTO_TITULAR } from './atributos'
import { DURACION_BURBUJA_MS, ETIQUETA_MASCOTA, TEXTO_OCULTAR, mensajeDelToque } from './mensajes'
import type { MotorMascota } from './motor'
import { guardarMascotaOculta, reaparecioHaceUnMomento, useMascotaOculta } from './preferencia'
import { RETARDO_REAPARICION_MS } from './tiempos'
import './Mascota.css'

export interface MascotaProps {
  /**
   * H1 del hero: al pasar por encima (ampliado ±70/±50 px), la mascota baja su
   * opacidad a .26 para no estorbar la lectura. Sin esta ref, busca el
   * elemento con data-mascota-titular.
   */
  tituloRef?: RefObject<HTMLElement | null>
  /**
   * Espera antes de entrar en escena, en ms. Por defecto, la del motor (6 s).
   * MascotaDiferida le pasa lo que falta de los 6 s desde que se montó la home.
   */
  retardoEntrada?: number
}

/** Foco que llegó por teclado. Si el navegador no entiende :focus-visible, se trata como tal. */
function esFocoDeTeclado(elemento: HTMLElement): boolean {
  try {
    return elemento.matches(':focus-visible')
  } catch {
    return true
  }
}

/**
 * Lleva el foco al contenido principal sin desplazar la página, como «Saltar al
 * contenido» (PageLayout): el tabindex es temporal.
 */
function enfocarContenido() {
  const main = document.getElementById('main-content')
  if (!main) return
  main.setAttribute('tabindex', '-1')
  main.addEventListener('blur', () => main.removeAttribute('tabindex'), { once: true })
  main.focus({ preventScroll: true })
}

/**
 * Salamandra de la home (Strata.dc.html:101-106; mapa.md, V-8).
 *
 * - Se monta en un portal en el body, en una capa propia por encima del
 *   contenido de la home: no queda debajo de la columna (z-index 1 frente a 2
 *   en el prototipo) y ningún transform de la página la desplaza.
 * - No roba clics (D-27): la capa y el cuadro del botón dejan pasar el puntero;
 *   solo una zona sobre el cuerpo de la salamandra lo recibe (::before en
 *   Mascota.css). Un clic en lo transparente llega al contenido de abajo.
 * - Entra a los 6 s desde fuera de la pantalla y nada en bucle por el borde
 *   de la ventana. Corre hacia los elementos con data-mascota-objetivo cuando
 *   se hace clic en ellos y retoma el nado.
 * - Sobre el titular (tituloRef o data-mascota-titular) baja a .26 de opacidad.
 * - Es un botón: al tocarla brinca y muestra un consejo en una burbuja que se
 *   anuncia por aria-live y se oculta a los 5.4 s o con Escape. Junto al
 *   consejo va «Ocultar mascota»; con el puntero o el foco encima, la burbuja
 *   espera. Con el foco del teclado sobre la mascota, deja de desplazarse.
 * - Oculta (WCAG 2.2.2; D-27: «Ocultar mascota» aquí o en el pie de la home)
 *   no se monta: sin tweens, ticker, listeners ni timers. La preferencia se
 *   guarda en localStorage (preferencia.ts).
 * - Con prefers-reduced-motion no se monta (T-17): quieta en una esquina
 *   taparía siempre el mismo contenido. Si la preferencia cambia con la
 *   página abierta, se monta o se desmonta.
 * - Con la pestaña oculta, todo se pausa. Al desmontarse limpia tweens,
 *   ticker, listeners y timers (T-18).
 * - GSAP llega en su propio chunk (import dinámico del motor al montarse). La
 *   home no importa este archivo: usa MascotaDiferida, que lo descarga después
 *   de la carga inicial (D-28).
 *
 * @example
 * const tituloRef = useRef<HTMLHeadingElement>(null)
 * <h1 ref={tituloRef}>…</h1>
 * <Button data-mascota-objetivo to="/evaluar">Tengo un código</Button>
 * <Mascota tituloRef={tituloRef} />
 */
export function Mascota({ tituloRef, retardoEntrada }: MascotaProps) {
  const reducir = useReducedMotion()
  const oculta = useMascotaOculta()
  if (reducir || oculta || typeof document === 'undefined') return null
  return <MascotaAnimada tituloRef={tituloRef} retardoEntrada={retardoEntrada} />
}

function MascotaAnimada({ tituloRef, retardoEntrada }: MascotaProps) {
  const raizRef = useRef<HTMLDivElement>(null)
  const botonRef = useRef<HTMLButtonElement>(null)
  const cuerpoRef = useRef<HTMLImageElement>(null)
  const burbujaRef = useRef<HTMLDivElement>(null)
  const motorRef = useRef<MotorMascota | null>(null)
  const tituloActual = useRef(tituloRef)
  const retardoInicial = useRef(retardoEntrada)
  const [toques, setToques] = useState(0)
  const [hablando, setHablando] = useState(false)
  // Con el puntero o el foco sobre «Ocultar mascota», la burbuja no se va sola.
  const [conPuntero, setConPuntero] = useState(false)
  const [conFoco, setConFoco] = useState(false)
  const retenida = conPuntero || conFoco

  useEffect(() => {
    tituloActual.current = tituloRef
  }, [tituloRef])

  // El motor vive lo que vive el componente. Efecto de layout, como useGSAP:
  // al desmontar, todo se revierte antes de que React quite los nodos. El
  // motor (con GSAP) se descarga aquí; si el componente se desmonta antes de
  // que llegue, no se inicia.
  useLayoutEffect(() => {
    const boton = botonRef.current
    const cuerpo = cuerpoRef.current
    if (!boton || !cuerpo) return
    let motor: MotorMascota | null = null
    let desmontada = false
    // Si la persona la acaba de volver a mostrar, entra casi de inmediato.
    const retardo = reaparecioHaceUnMomento() ? RETARDO_REAPARICION_MS : retardoInicial.current
    import('./motor')
      .then(({ iniciarMascota }) => {
        if (desmontada) return
        motor = iniciarMascota({
          boton,
          cuerpo,
          // Solo con un consejo a la vista: la burbuja vacía no se coloca.
          burbuja: () => (burbujaRef.current?.querySelector('.st-mascota__globo') ? burbujaRef.current : null),
          titular: () => tituloActual.current?.current ?? document.querySelector(`[${ATRIBUTO_TITULAR}]`),
          retardoEntrada: retardo,
        })
        motorRef.current = motor
      })
      .catch((error: unknown) => {
        // Es decorativa: sin el chunk de GSAP, el botón sigue oculto y la página funciona igual.
        if (import.meta.env.DEV) console.warn('No se pudo cargar la mascota.', error)
      })
    return () => {
      desmontada = true
      motor?.pararMascota()
      motorRef.current = null
    }
  }, [])

  // La burbuja se coloca antes de pintarse: sin un cuadro en la esquina (0, 0).
  useLayoutEffect(() => {
    if (hablando) motorRef.current?.colocarBurbuja()
  }, [hablando, toques])

  // Se oculta sola 5.4 s después de cada toque, salvo mientras se retiene.
  useEffect(() => {
    if (!hablando || retenida) return
    const temporizador = window.setTimeout(() => setHablando(false), DURACION_BURBUJA_MS)
    return () => window.clearTimeout(temporizador)
  }, [hablando, toques, retenida])

  // Escape la cierra, tenga el foco quien lo tenga.
  useEffect(() => {
    if (!hablando) return
    const alPulsar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') setHablando(false)
    }
    document.addEventListener('keydown', alPulsar)
    return () => document.removeEventListener('keydown', alPulsar)
  }, [hablando])

  function tocar() {
    motorRef.current?.brincarMascota()
    setToques((previos) => previos + 1)
    setHablando(true)
  }

  function alEnfocar(evento: FocusEvent<HTMLButtonElement>) {
    motorRef.current?.detenerPorFoco(esFocoDeTeclado(evento.currentTarget))
  }

  function alDesenfocar() {
    motorRef.current?.detenerPorFoco(false)
  }

  /**
   * «Ocultar mascota»: la desmonta (el motor se detiene por completo) y lo
   * recuerda. El foco, que estaba en el botón que desaparece, pasa al contenido;
   * el pie de la home anuncia el cambio y ofrece «Mostrar mascota».
   */
  function ocultar() {
    if (raizRef.current?.contains(document.activeElement)) enfocarContenido()
    guardarMascotaOculta(true)
  }

  return createPortal(
    <div ref={raizRef} className="st-mascota">
      <button
        ref={botonRef}
        type="button"
        className="st-mascota__boton"
        aria-label={ETIQUETA_MASCOTA}
        onClick={tocar}
        onFocus={alEnfocar}
        onBlur={alDesenfocar}
      >
        <img
          ref={cuerpoRef}
          className="st-mascota__cuerpo"
          src={SITE.brand.mascota}
          alt=""
          width={594}
          height={846}
          draggable={false}
          decoding="async"
          fetchPriority="low"
        />
      </button>
      <div ref={burbujaRef} className="st-mascota__burbuja">
        {/* Región viva que existe desde el inicio: cada consejo nuevo se anuncia. El
            botón queda fuera de ella para no leerse con cada consejo. */}
        <div role="status" aria-live="polite">
          {hablando && (
            <p key={toques} className="st-mascota__globo">
              {mensajeDelToque(toques)}
            </p>
          )}
        </div>
        {hablando && (
          <button
            type="button"
            className="st-mascota__ocultar"
            onClick={ocultar}
            onMouseEnter={() => setConPuntero(true)}
            onMouseLeave={() => setConPuntero(false)}
            onFocus={() => setConFoco(true)}
            onBlur={() => setConFoco(false)}
          >
            {TEXTO_OCULTAR}
          </button>
        )}
      </div>
    </div>,
    document.body,
  )
}

export default Mascota
