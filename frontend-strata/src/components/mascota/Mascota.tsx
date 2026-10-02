import { useEffect, useLayoutEffect, useRef, useState, type FocusEvent, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { useReducedMotion } from '@/components/ui'
import { SITE } from '@/config/site'
import { ATRIBUTO_TITULAR } from './atributos'
import { DURACION_BURBUJA_MS, ETIQUETA_MASCOTA, mensajeDelToque } from './mensajes'
import type { MotorMascota } from './motor'
import './Mascota.css'

export interface MascotaProps {
  /**
   * H1 del hero: al pasar por encima (ampliado ±70/±50 px), la mascota baja su
   * opacidad a .26 para no estorbar la lectura. Sin esta ref, busca el
   * elemento con data-mascota-titular.
   */
  tituloRef?: RefObject<HTMLElement | null>
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
 * Salamandra de la home (Strata.dc.html:101-106; mapa.md, V-8).
 *
 * - Se monta en un portal en el body, en una capa propia por encima del
 *   contenido de la home: no queda debajo de la columna (z-index 1 frente a 2
 *   en el prototipo) y ningún transform de la página la desplaza. La capa no
 *   recibe clics; solo la mascota.
 * - Entra a los 6 s desde fuera de la pantalla y nada en bucle por el borde
 *   de la ventana. Corre hacia los elementos con data-mascota-objetivo cuando
 *   se hace clic en ellos y retoma el nado.
 * - Sobre el titular (tituloRef o data-mascota-titular) baja a .26 de opacidad.
 * - Es un botón: al tocarla brinca y muestra un consejo en una burbuja que se
 *   anuncia por aria-live y se oculta a los 5.4 s o con Escape. Con el foco
 *   del teclado encima deja de desplazarse.
 * - Con prefers-reduced-motion no se monta (T-17): quieta en una esquina
 *   taparía siempre el mismo contenido. Si la preferencia cambia con la
 *   página abierta, se monta o se desmonta.
 * - Con la pestaña oculta, todo se pausa. Al desmontarse limpia tweens,
 *   ticker, listeners y timers (T-18).
 * - GSAP llega en su propio chunk (import dinámico del motor al montarse):
 *   no pesa en el bundle de las demás rutas ni retrasa el primer pintado.
 *
 * @example
 * const tituloRef = useRef<HTMLHeadingElement>(null)
 * <h1 ref={tituloRef}>…</h1>
 * <Button data-mascota-objetivo to="/evaluar">Tengo un código</Button>
 * <Mascota tituloRef={tituloRef} />
 */
export function Mascota({ tituloRef }: MascotaProps) {
  const reducir = useReducedMotion()
  if (reducir || typeof document === 'undefined') return null
  return <MascotaAnimada tituloRef={tituloRef} />
}

function MascotaAnimada({ tituloRef }: MascotaProps) {
  const botonRef = useRef<HTMLButtonElement>(null)
  const cuerpoRef = useRef<HTMLImageElement>(null)
  const burbujaRef = useRef<HTMLDivElement>(null)
  const motorRef = useRef<MotorMascota | null>(null)
  const tituloActual = useRef(tituloRef)
  const [toques, setToques] = useState(0)
  const [hablando, setHablando] = useState(false)

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
    import('./motor')
      .then(({ iniciarMascota }) => {
        if (desmontada) return
        motor = iniciarMascota({
          boton,
          cuerpo,
          burbuja: () => burbujaRef.current,
          titular: () => tituloActual.current?.current ?? document.querySelector(`[${ATRIBUTO_TITULAR}]`),
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

  // Se oculta sola 5.4 s después de cada toque.
  useEffect(() => {
    if (!hablando) return
    const temporizador = window.setTimeout(() => setHablando(false), DURACION_BURBUJA_MS)
    return () => window.clearTimeout(temporizador)
  }, [hablando, toques])

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

  return createPortal(
    <div className="st-mascota">
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
      {/* Región viva que existe desde el inicio: cada consejo nuevo se anuncia. */}
      <div ref={burbujaRef} className="st-mascota__burbuja" role="status" aria-live="polite">
        {hablando && (
          <p key={toques} className="st-mascota__globo">
            {mensajeDelToque(toques)}
          </p>
        )}
      </div>
    </div>,
    document.body,
  )
}

export default Mascota
