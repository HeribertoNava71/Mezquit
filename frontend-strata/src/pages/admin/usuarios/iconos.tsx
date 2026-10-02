import type { SVGProps } from 'react'

// Íconos de las pantallas de usuarios que no están en los componentes base.
// Son decorativos (aria-hidden): el texto de al lado da el significado. Toman
// el color de currentColor. Los genéricos (lupa, error, reintentar) salen de
// '@/components/ui/Iconos'.

export type IconoProps = SVGProps<SVGSVGElement>

/** Flecha de «Volver a usuarios»: la de los CTA del prototipo, hacia la izquierda (Strata.dc.html:1079). */
export function IconoVolver(props: IconoProps) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable={false}
      {...props}
    >
      <path d="M14.6 9H3.4M7.6 4.8 3.4 9l4.2 4.2" />
    </svg>
  )
}
