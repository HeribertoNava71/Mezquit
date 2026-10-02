import type { SVGProps } from 'react'

// Íconos de la comparativa que no están en los componentes base. Son
// decorativos (aria-hidden): el texto del botón da el significado. Toman el
// color de currentColor.

type IconoProps = SVGProps<SVGSVGElement>

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
} as const

/** Descarga: el trazo de «Descargar diagnóstico (PDF)» (Strata.dc.html:983). */
export function IconoDescargar(props: IconoProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" strokeWidth="1.9" {...base} {...props}>
      <path d="M9 2.6v9M5.4 8.4 9 12l3.6-3.6M3 14.8h12" />
    </svg>
  )
}

/** Regreso: la flecha de «Continuar» (Strata.dc.html:1079) hacia la izquierda. */
export function IconoVolver(props: IconoProps) {
  return (
    <svg width="15" height="15" viewBox="0 0 18 18" strokeWidth="1.9" {...base} {...props}>
      <path d="M14.6 9H3.4M7.6 4.8 3.4 9l4.2 4.2" />
    </svg>
  )
}
