import type { SVGProps } from 'react'

// Íconos del flujo del candidato que no están en los componentes base. Trazos
// del prototipo (Strata.dc.html:1016, :1079, :1089-1101, :1202). Son
// decorativos (aria-hidden): el texto de al lado da el significado. Toman el
// color de currentColor. Los genéricos (reloj, error, éxito, búsqueda, sin red)
// salen de '@/components/ui/Iconos'.

export type IconoProps = SVGProps<SVGSVGElement>

const base = {
  fill: 'none',
  stroke: 'currentColor',
  'aria-hidden': true,
  focusable: false,
} as const

const redondo = { strokeLinecap: 'round', strokeLinejoin: 'round' } as const

/** Flecha de los botones que avanzan: «Continuar», «Iniciar evaluación», «Siguiente» (Strata.dc.html:1079). */
export function IconoFlecha(props: IconoProps) {
  return (
    <svg width="15" height="15" viewBox="0 0 18 18" strokeWidth="1.9" {...base} {...props}>
      <path d="M3.4 9h11.2M10.4 4.8 14.6 9l-4.2 4.2" />
    </svg>
  )
}

/**
 * Insignia «Invitación verificada»: círculo relleno con palomita (Strata.dc.html:1016).
 * El círculo toma currentColor; la palomita, la clase st-icono-verificado__palomita
 * (AccesoVerificado.css), del color de la superficie tinta.
 */
export function IconoVerificado(props: IconoProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden focusable={false} {...props}>
      <circle cx="8" cy="8" r="7" fill="currentColor" />
      <path className="st-icono-verificado__palomita" d="M4.9 8.2 6.9 10.2l4.2-4.4" strokeWidth="1.9" {...redondo} />
    </svg>
  )
}

/** Reloj de la duración estimada (Strata.dc.html:1089). */
export function IconoDuracion(props: IconoProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 18 18" strokeWidth="1.6" {...base} {...props}>
      <circle cx="9" cy="9" r="6.6" />
      <path d="M9 5.4V9l2.5 1.8" />
    </svg>
  )
}

/** Guardado automático: disquete (Strata.dc.html:1095). */
export function IconoGuardar(props: IconoProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 18 18" strokeWidth="1.6" {...base} {...props}>
      <path d="M3.2 4.6a1.4 1.4 0 0 1 1.4-1.4h6.6L14.8 6.6v6.8a1.4 1.4 0 0 1-1.4 1.4H4.6a1.4 1.4 0 0 1-1.4-1.4z" />
      <path d="M6.2 3.2v4h5.4" />
    </svg>
  )
}

/** Eslabones: pausar y retomar con el mismo enlace (sustituye al candado de «Tus datos viajan cifrados», D-18). */
export function IconoEnlace(props: IconoProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 18 18" strokeWidth="1.6" {...base} {...redondo} {...props}>
      <path d="M7.7 10.3a3 3 0 0 0 4.2 0l2.3-2.3a3 3 0 0 0-4.2-4.2l-1 1" />
      <path d="M10.3 7.7a3 3 0 0 0-4.2 0L3.8 10a3 3 0 0 0 4.2 4.2l1-1" />
    </svg>
  )
}

/** Palomita grande del fin (36 px, trazo 3.2; Strata.dc.html:1202). */
export function IconoPalomitaFin(props: IconoProps) {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" strokeWidth="3.2" {...base} {...props}>
      <path d="M9 18.6 15 24.6 27 12" />
    </svg>
  )
}
