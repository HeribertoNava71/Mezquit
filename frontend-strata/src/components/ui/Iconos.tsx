import type { SVGProps } from 'react'

// Íconos de los componentes base: un solo módulo para controles, contenido y
// retroalimentación (antes IconosControles, IconosFeedback y copias en línea
// en CopyField y StepPills). Son decorativos (aria-hidden): el texto o el rol
// del control dan el significado. Toman el color de currentColor y el tamaño
// de sus atributos o del CSS del componente; cada uso puede cambiar width,
// height y strokeWidth. Uso interno; no se exportan desde el barril.

export type IconoProps = SVGProps<SVGSVGElement>

const base = {
  fill: 'none',
  stroke: 'currentColor',
  'aria-hidden': true,
  focusable: false,
} as const

const redondo = { strokeLinecap: 'round', strokeLinejoin: 'round' } as const

/* ── Controles ─────────────────────────────────────────────────────────── */

/**
 * Palomita (Strata.dc.html:1070). Por defecto, la de la casilla: 11 px, trazo 2.4
 * y puntas rectas, como el prototipo. CopyField («Copiado») y StepPills (paso
 * hecho) la usan con otro tamaño y puntas redondas.
 */
export function IconoPalomita(props: IconoProps) {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" strokeWidth="2.4" {...base} {...props}>
      <path d="M2.6 6.2 4.8 8.4l4.6-4.8" />
    </svg>
  )
}

/**
 * Campo válido: círculo relleno con palomita (Strata.dc.html:1047).
 * El círculo usa currentColor; la palomita, la clase st-icono-valido__palomita (Field.css).
 */
export function IconoValido(props: IconoProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden focusable={false} {...props}>
      <circle cx="8" cy="8" r="7" fill="currentColor" />
      <path
        className="st-icono-valido__palomita"
        d="M4.9 8.2 6.9 10.2l4.2-4.4"
        strokeWidth="1.9"
        {...redondo}
      />
    </svg>
  )
}

/** Flecha del select. */
export function IconoChevron(props: IconoProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" strokeWidth="1.8" {...base} {...redondo} {...props}>
      <path d="m4 6 4 4 4-4" />
    </svg>
  )
}

/** Signo menos del stepper (Strata.dc.html:666). */
export function IconoMenos(props: IconoProps) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" strokeWidth="1.9" {...base} {...redondo} {...props}>
      <path d="M2.5 6h7" />
    </svg>
  )
}

/** Signo más del stepper (Strata.dc.html:668). */
export function IconoMas(props: IconoProps) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" strokeWidth="1.9" {...base} {...redondo} {...props}>
      <path d="M2.5 6h7M6 2.5v7" />
    </svg>
  )
}

/** Copiar: dos hojas (Strata.dc.html:738). */
export function IconoCopiar(props: IconoProps) {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" strokeWidth="1.5" {...base} {...props}>
      <rect x="4.6" y="4.6" width="7.4" height="7.4" rx="1.4" />
      <path d="M9.4 2.4H3.2a1.2 1.2 0 0 0-1.2 1.2v6.2" />
    </svg>
  )
}

/* ── Retroalimentación ─────────────────────────────────────────────────── */

/** X de cerrar (Strata.dc.html:1258). */
export function IconoCerrar(props: IconoProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" strokeWidth="1.8" {...base} {...props}>
      <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" />
    </svg>
  )
}

/** Palomita del banner oscuro (Strata.dc.html:878). */
export function IconoCheck(props: IconoProps) {
  return (
    <svg width="19" height="19" viewBox="0 0 20 20" strokeWidth="2.2" {...base} {...props}>
      <path d="M4.6 10.4 8.2 14l7-7.4" />
    </svg>
  )
}

/** Información: «i» en círculo. */
export function IconoInfo(props: IconoProps) {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" strokeWidth="1.7" {...base} {...redondo} {...props}>
      <circle cx="9" cy="9" r="7.2" />
      <path d="M9 8.4v4.3M9 5.6v.1" />
    </svg>
  )
}

/** Éxito: palomita en círculo. */
export function IconoExito(props: IconoProps) {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" strokeWidth="1.7" {...base} {...redondo} {...props}>
      <circle cx="9" cy="9" r="7.2" />
      <path d="m5.9 9.3 2.2 2.2 4-4.3" />
    </svg>
  )
}

/**
 * Error: signo de exclamación en círculo. 17 px en avisos y estados; el error
 * de campo (FieldError) lo usa a 14 px con trazo 1.9 (D-22).
 */
export function IconoError(props: IconoProps) {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" strokeWidth="1.7" {...base} {...redondo} {...props}>
      <circle cx="9" cy="9" r="7.2" />
      <path d="M9 5.3v4.6M9 12.5v.1" />
    </svg>
  )
}

/** Advertencia: exclamación en triángulo. */
export function IconoAdvertencia(props: IconoProps) {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" strokeWidth="1.7" {...base} {...redondo} {...props}>
      <path d="M7.7 2.9 1.6 13.4a1.5 1.5 0 0 0 1.3 2.2h12.2a1.5 1.5 0 0 0 1.3-2.2L10.3 2.9a1.5 1.5 0 0 0-2.6 0Z" />
      <path d="M9 6.8v3.6M9 12.8v.1" />
    </svg>
  )
}

/** Candado (Strata.dc.html:1315): sin permiso. */
export function IconoCandado(props: IconoProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 14 14" strokeWidth="1.4" {...base} {...redondo} {...props}>
      <rect x="2.6" y="6" width="8.8" height="6.2" rx="1.4" />
      <path d="M4.6 6V4.4a2.4 2.4 0 0 1 4.8 0V6" />
    </svg>
  )
}

/** Lupa: no encontrado. */
export function IconoBuscar(props: IconoProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" strokeWidth="1.7" {...base} {...redondo} {...props}>
      <circle cx="8" cy="8" r="5.2" />
      <path d="m12 12 3.8 3.8" />
    </svg>
  )
}

/** Señal tachada: sin conexión. */
export function IconoSinRed(props: IconoProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" strokeWidth="1.7" {...base} {...redondo} {...props}>
      <path d="M1.8 6.9a10.6 10.6 0 0 1 14.4 0M4.4 9.7a6.8 6.8 0 0 1 9.2 0M7 12.4a3 3 0 0 1 4 0M9 15.2v.1" />
      <path d="m2.6 2.6 12.8 12.8" />
    </svg>
  )
}

/** Reloj: sesión vencida. */
export function IconoReloj(props: IconoProps) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" strokeWidth="1.7" {...base} {...redondo} {...props}>
      <circle cx="9" cy="9" r="7.2" />
      <path d="M9 5.2V9l2.6 1.7" />
    </svg>
  )
}

/** Flecha circular: reintentar. */
export function IconoReintentar(props: IconoProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 18 18" strokeWidth="1.8" {...base} {...redondo} {...props}>
      <path d="M15.4 11.2A6.6 6.6 0 1 1 13.9 4.6l1.9 1.8" />
      <path d="M15.8 2.6v3.8H12" />
    </svg>
  )
}
