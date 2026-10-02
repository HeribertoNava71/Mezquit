import { useId, type ReactNode } from 'react'
import { Card, cx } from '@/components/ui'
import { EncabezadoSeccion } from '@/pages/publicas/EncabezadoSeccion'
import { IconoBaremos, IconoConfiabilidad, IconoEstandarizacion, IconoValidez } from '@/pages/publicas/iconos'
import './Methodology.css'

interface Concepto {
  title: string
  body: string
  icono: ReactNode
}

/** Los cuatro conceptos de metodología del sitio (2026-09-10-multipage-site.md:846-885), sin cambios de texto. */
const CONCEPTS: readonly Concepto[] = [
  {
    title: 'Validez',
    body: 'Una prueba es válida cuando mide lo que dice medir. Cada instrumento se construye a partir de un marco teórico claro y se revisa para que sus reactivos correspondan al rasgo que se evalúa.',
    icono: <IconoValidez />,
  },
  {
    title: 'Confiabilidad',
    body: 'La confiabilidad es la consistencia de los resultados: si una persona responde en condiciones similares, el puntaje debe ser estable. Se cuida con reactivos redundantes y controles internos.',
    icono: <IconoConfiabilidad />,
  },
  {
    title: 'Estandarización',
    body: 'Todos los candidatos responden en las mismas condiciones: mismo orden, mismas instrucciones, sin distracciones. Esto permite comparar resultados de forma justa.',
    icono: <IconoEstandarizacion />,
  },
  {
    title: 'Baremos y normas',
    body: 'Un puntaje directo cobra sentido al compararse con un grupo de referencia. Los baremos convierten el puntaje en un percentil, para ubicar a la persona respecto a una población.',
    icono: <IconoBaremos />,
  },
]

export interface MethodologyProps {
  /** Clase extra; la página que la usa pone el espacio de arriba. */
  className?: string
}

/**
 * Metodología de /como-funciona (mapa.md, sección 2): eyebrow, H2 y cuatro
 * tarjetas de vidrio con ícono, que entran escalonadas (55 ms). Sin numeración:
 * los números quedan para los pasos de «Cómo funciona».
 */
export function Methodology({ className }: MethodologyProps) {
  const tituloId = useId()
  return (
    <section className={cx('st-metodologia', className)} id="metodologia" aria-labelledby={tituloId}>
      <EncabezadoSeccion id={tituloId} eyebrow="Metodología" title="Cómo se construyen las pruebas" />
      <ul className="st-metodologia__grid">
        {CONCEPTS.map((concepto, i) => (
          <Card
            as="li"
            key={concepto.title}
            variant="glass"
            hover="lift"
            staggerIndex={i}
            className="st-metodologia__card"
          >
            <span className="st-metodologia__icono">{concepto.icono}</span>
            <h3 className="st-metodologia__titulo">{concepto.title}</h3>
            <p className="st-metodologia__texto">{concepto.body}</p>
          </Card>
        ))}
      </ul>
    </section>
  )
}

export default Methodology
