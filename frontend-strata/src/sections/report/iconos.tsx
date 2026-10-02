import type { SVGProps } from 'react'

// Íconos del reporte que no están en los componentes base. Son decorativos
// (aria-hidden): el texto de al lado da el significado. Toman el color de
// currentColor. La palomita del banner sale de Callout (tono dark); descargar,
// volver y la «i» del pie legal, de '@/components/ui/Iconos'.

export type IconoProps = SVGProps<SVGSVGElement>

const base = {
  fill: 'none',
  stroke: 'currentColor',
  'aria-hidden': true,
  focusable: false,
} as const

const redondo = { strokeLinecap: 'round', strokeLinejoin: 'round' } as const

/** Ojo: integridad de respuesta (pérdidas de foco de la pantalla). */
export function IconoFoco(props: IconoProps) {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" strokeWidth="1.6" {...base} {...redondo} {...props}>
      <path d="M1.8 9s2.6-5 7.2-5 7.2 5 7.2 5-2.6 5-7.2 5-7.2-5-7.2-5Z" />
      <circle cx="9" cy="9" r="2.2" />
    </svg>
  )
}

/** Globo de diálogo: preguntas para la entrevista. */
export function IconoPreguntas(props: IconoProps) {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" strokeWidth="1.6" {...base} {...redondo} {...props}>
      <path d="M3 4.6A1.6 1.6 0 0 1 4.6 3h8.8A1.6 1.6 0 0 1 15 4.6v6a1.6 1.6 0 0 1-1.6 1.6H8.2L5 14.8v-2.6h-.4A1.6 1.6 0 0 1 3 10.6Z" />
      <path d="M6.4 6.8h5.2M6.4 9.2h3.4" />
    </svg>
  )
}
