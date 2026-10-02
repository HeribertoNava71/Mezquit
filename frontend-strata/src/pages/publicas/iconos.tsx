import type { SVGProps } from 'react'

// Íconos de las páginas públicas (Fase 7). Decorativos: aria-hidden y sin foco;
// el texto junto a ellos da el significado. Trazo de 1.6 en currentColor, como
// los íconos del prototipo (Strata.dc.html:640-646, :1043, :1058, :1088-1103).

type IconoProps = SVGProps<SVGSVGElement>

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
} as const

/** Reloj: duración (Strata.dc.html:641). */
export function IconoReloj(props: IconoProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" strokeWidth="1.6" {...base} {...props}>
      <circle cx="8" cy="8" r="6" />
      <path d="M8 4.8V8l2.2 1.6" />
    </svg>
  )
}

/** Hoja con renglones: reactivos (Strata.dc.html:645). */
export function IconoReactivos(props: IconoProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" strokeWidth="1.6" {...base} {...props}>
      <rect x="3" y="2" width="10" height="12" rx="1.8" />
      <path d="M5.6 6h4.8M5.6 9h3" />
    </svg>
  )
}

/** Flecha a la derecha de los CTA (Strata.dc.html:1078). */
export function IconoFlechaDerecha(props: IconoProps) {
  return (
    <svg width="15" height="15" viewBox="0 0 18 18" strokeWidth="1.9" {...base} {...props}>
      <path d="M3.4 9h11.2M10.4 4.8 14.6 9l-4.2 4.2" />
    </svg>
  )
}

/** Flecha a la izquierda: «Volver al catálogo». */
export function IconoFlechaIzquierda(props: IconoProps) {
  return (
    <svg width="15" height="15" viewBox="0 0 18 18" strokeWidth="1.9" {...base} {...props}>
      <path d="M14.6 9H3.4M7.6 4.8 3.4 9l4.2 4.2" />
    </svg>
  )
}

/** Palomita de las inclusiones de un plan (Strata.dc.html:267). */
export function IconoIncluye(props: IconoProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" strokeWidth="1.9" {...base} {...props}>
      <path d="M3.2 8.4 6 11.2l6.6-6.8" />
    </svg>
  )
}

/** Persona: campo Nombre y grupo «Soy candidato» (Strata.dc.html:1043). */
export function IconoPersona(props: IconoProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" strokeWidth="1.6" {...base} {...props}>
      <circle cx="9" cy="6.4" r="2.9" />
      <path d="M3.4 15.2c0-2.7 2.5-4.4 5.6-4.4s5.6 1.7 5.6 4.4" />
    </svg>
  )
}

/** Edificio: campo Empresa y grupo «Soy empresa». */
export function IconoEdificio(props: IconoProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" strokeWidth="1.6" {...base} {...props}>
      <path d="M3.6 15.4V3.4h6.8v12" />
      <path d="M10.4 7.2h4v8.2" />
      <path d="M2.4 15.4h13.2" />
      <path d="M6 6.2h2M6 9h2M6 11.8h2" />
    </svg>
  )
}

/** Sobre: campo Correo electrónico (Strata.dc.html:1058). */
export function IconoCorreo(props: IconoProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" strokeWidth="1.6" {...base} {...props}>
      <rect x="2.4" y="4" width="13.2" height="10" rx="2.2" />
      <path d="m3.4 5.4 5.6 4.2 5.6-4.2" />
    </svg>
  )
}

/** Calendario: bloque de agenda. */
export function IconoCalendario(props: IconoProps) {
  return (
    <svg width="19" height="19" viewBox="0 0 20 20" strokeWidth="1.6" {...base} {...props}>
      <rect x="3" y="4.2" width="14" height="12.6" rx="2.4" />
      <path d="M3 8.4h14M7 2.6v3.2M13 2.6v3.2" />
      <path d="M7 12h2M11 12h2" />
    </svg>
  )
}

/** Diana: validez (mide lo que dice medir). */
export function IconoValidez(props: IconoProps) {
  return (
    <svg width="19" height="19" viewBox="0 0 20 20" strokeWidth="1.6" {...base} {...props}>
      <circle cx="10" cy="10" r="6.8" />
      <circle cx="10" cy="10" r="3.6" />
      <path d="M10 9.2v1.6M9.2 10h1.6" />
    </svg>
  )
}

/** Flechas en ciclo: confiabilidad (resultados estables al repetir). */
export function IconoConfiabilidad(props: IconoProps) {
  return (
    <svg width="19" height="19" viewBox="0 0 20 20" strokeWidth="1.6" {...base} {...props}>
      <path d="M15.6 8.4A5.9 5.9 0 0 0 5 6.2" />
      <path d="M4.4 11.6A5.9 5.9 0 0 0 15 13.8" />
      <path d="M4.8 3.2v3.2H8M15.2 16.8v-3.2H12" />
    </svg>
  )
}

/** Controles alineados: estandarización (mismas condiciones para todos). */
export function IconoEstandarizacion(props: IconoProps) {
  return (
    <svg width="19" height="19" viewBox="0 0 20 20" strokeWidth="1.6" {...base} {...props}>
      <path d="M3.4 5.4h7.3M14.1 5.4h2.5M3.4 10h7.3M14.1 10h2.5M3.4 14.6h7.3M14.1 14.6h2.5" />
      <circle cx="12.4" cy="5.4" r="1.7" />
      <circle cx="12.4" cy="10" r="1.7" />
      <circle cx="12.4" cy="14.6" r="1.7" />
    </svg>
  )
}

/** Curva de distribución: baremos y normas. */
export function IconoBaremos(props: IconoProps) {
  return (
    <svg width="19" height="19" viewBox="0 0 20 20" strokeWidth="1.6" {...base} {...props}>
      <path d="M2.8 15.6h14.4" />
      <path d="M3.6 15.2c2.6 0 3.2-9 6.4-9s3.8 9 6.4 9" />
      <path d="M10 8.2v5.6" strokeDasharray="1.4 1.8" />
    </svg>
  )
}

/** Lupa sin resultado: página no encontrada (receta del ícono del fin, Strata.dc.html:1202). */
export function IconoNoEncontrado(props: IconoProps) {
  return (
    <svg width="34" height="34" viewBox="0 0 36 36" strokeWidth="3" {...base} {...props}>
      <circle cx="15.4" cy="15.4" r="8.6" />
      <path d="m21.8 21.8 6.8 6.8" />
      <path d="M11.8 15.4h7.2" />
    </svg>
  )
}

/** Reloj de arena: dato pendiente de definir. */
export function IconoPendiente(props: IconoProps) {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" strokeWidth="1.6" {...base} {...props}>
      <path d="M4.4 2.4h7.2M4.4 13.6h7.2" />
      <path d="M5.2 2.4c0 3 5.6 3.4 5.6 5.6s-5.6 2.6-5.6 5.6M10.8 2.4c0 3-5.6 3.4-5.6 5.6s5.6 2.6 5.6 5.6" />
    </svg>
  )
}
