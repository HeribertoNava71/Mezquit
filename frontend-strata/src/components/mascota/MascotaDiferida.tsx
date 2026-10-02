import { Suspense, lazy, useEffect, useState, type RefObject } from 'react'
import { useReducedMotion } from '@/components/ui'
import { reaparecioHaceUnMomento, useMascotaOculta } from './preferencia'
import { ESPERA_CARGA_MS, RETARDO_ENTRADA_MS, RETARDO_REAPARICION_MS } from './tiempos'

// La mascota y GSAP llegan en sus propios chunks (D-28): Mascota.tsx con su CSS
// y, al montarse, motor.ts con GSAP y MotionPathPlugin. Ninguno pesa en la
// carga de la home ni de las demás rutas.
const MascotaPerezosa = lazy(() => import('./Mascota'))

export interface MascotaDiferidaProps {
  /** H1 del hero (vigilarTitular); sin ella, el elemento con data-mascota-titular. */
  tituloRef?: RefObject<HTMLElement | null>
}

type ConIdle = Window & {
  requestIdleCallback?: (callback: () => void, opciones?: { timeout: number }) => number
  cancelIdleCallback?: (id: number) => void
}

/**
 * Mascota de la home, descargada después de la carga inicial (D-28). Espera
 * ESPERA_CARGA_MS y un momento libre del navegador, descarga el chunk y le
 * pasa lo que falta de los 6 s: entra a la misma hora que si se hubiera
 * cargado al principio. Si la persona la vuelve a mostrar desde el pie, se
 * descarga y entra casi de inmediato.
 * Con prefers-reduced-motion o con la mascota oculta no descarga nada.
 */
export function MascotaDiferida({ tituloRef }: MascotaDiferidaProps) {
  const reducir = useReducedMotion()
  const oculta = useMascotaOculta()
  const activa = !reducir && !oculta
  // Espera de entrada que recibirá la mascota; null mientras no se descarga.
  const [retardo, setRetardo] = useState<number | null>(null)

  useEffect(() => {
    if (!activa || retardo !== null) return
    const inicio = performance.now()
    const inmediata = reaparecioHaceUnMomento()
    const ventana = window as ConIdle
    let idle: number | undefined
    const cargar = () =>
      setRetardo(inmediata ? RETARDO_REAPARICION_MS : Math.max(0, RETARDO_ENTRADA_MS - (performance.now() - inicio)))
    const temporizador = window.setTimeout(
      () => {
        if (inmediata || typeof ventana.requestIdleCallback !== 'function') cargar()
        else idle = ventana.requestIdleCallback(cargar, { timeout: 1500 })
      },
      inmediata ? 0 : ESPERA_CARGA_MS,
    )
    return () => {
      window.clearTimeout(temporizador)
      if (idle !== undefined) ventana.cancelIdleCallback?.(idle)
    }
  }, [activa, retardo])

  if (!activa || retardo === null) return null
  return (
    <Suspense fallback={null}>
      <MascotaPerezosa tituloRef={tituloRef} retardoEntrada={retardo} />
    </Suspense>
  )
}

export default MascotaDiferida
