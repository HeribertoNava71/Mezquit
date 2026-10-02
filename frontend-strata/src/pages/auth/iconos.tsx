import type { SVGProps } from 'react'

// Íconos de /login y /registro con los trazos del prototipo: correo del acceso
// del candidato (Strata.dc.html:1058), candado de la franja de garantías
// (:1101) y flecha de los CTA que avanzan (:1079). Son decorativos
// (aria-hidden): el rótulo del campo o el texto del botón dan el significado.
// Toman el color de currentColor.

export type IconoProps = SVGProps<SVGSVGElement>

const base = {
  fill: 'none',
  stroke: 'currentColor',
  'aria-hidden': true,
  focusable: false,
} as const

/** Sobre: campo de correo (Strata.dc.html:1058). */
export function IconoCorreo(props: IconoProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" strokeWidth="1.6" {...base} {...props}>
      <rect x="2.4" y="4" width="13.2" height="10" rx="2.2" />
      <path d="m3.4 5.4 5.6 4.2 5.6-4.2" />
    </svg>
  )
}

/** Candado: campo de contraseña (Strata.dc.html:1101). */
export function IconoCandado(props: IconoProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" strokeWidth="1.6" {...base} {...props}>
      <rect x="3.4" y="7.8" width="11.2" height="7" rx="1.8" />
      <path d="M6.1 7.8V5.9a2.9 2.9 0 0 1 5.8 0v1.9" />
    </svg>
  )
}

/** Flecha de «Entrar» y «Crear cuenta» (Strata.dc.html:1079). */
export function IconoFlecha(props: IconoProps) {
  return (
    <svg width="15" height="15" viewBox="0 0 18 18" strokeWidth="1.9" {...base} {...props}>
      <path d="M3.4 9h11.2M10.4 4.8 14.6 9l-4.2 4.2" />
    </svg>
  )
}
