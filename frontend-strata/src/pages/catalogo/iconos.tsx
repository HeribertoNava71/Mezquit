import type { SVGProps } from 'react'

// Íconos del catálogo que no están en los componentes base, con los trazos del
// prototipo. Son decorativos (aria-hidden): el texto de al lado da el
// significado. Toman el color de currentColor. La lupa de la búsqueda y el
// más de «Solicitar créditos» salen de '@/components/ui/Iconos'.

export type IconoProps = SVGProps<SVGSVGElement>

const base = {
  fill: 'none',
  stroke: 'currentColor',
  'aria-hidden': true,
  focusable: false,
} as const

/** Reloj de la duración (Strata.dc.html:646). */
export function IconoDuracion(props: IconoProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" strokeWidth="1.6" {...base} {...props}>
      <circle cx="8" cy="8" r="6" />
      <path d="M8 4.8V8l2.2 1.6" />
    </svg>
  )
}

/** Hoja con renglones: reactivos de la prueba (Strata.dc.html:650). */
export function IconoReactivos(props: IconoProps) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" strokeWidth="1.6" {...base} {...props}>
      <rect x="3" y="2" width="10" height="12" rx="1.8" />
      <path d="M5.6 6h4.8M5.6 9h3" />
    </svg>
  )
}
