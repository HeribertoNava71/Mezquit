import { useId, type ReactNode } from 'react'
import { Card, Tag, cx } from '@/components/ui'
import './HowItWorks.css'

/** Lista con lupa: elegir las pruebas (Strata.dc.html:277). */
function IconoPruebas() {
  return (
    <svg width="19" height="19" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden focusable={false}>
      <path d="M3.4 5.2h13.2M3.4 10h8.6M3.4 14.8h5.6" />
      <circle cx="15.4" cy="13.4" r="2.6" />
    </svg>
  )
}

/** Celular: el candidato responde (Strata.dc.html:289). */
function IconoCelular() {
  return (
    <svg width="19" height="19" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden focusable={false}>
      <rect x="6.4" y="2.6" width="7.2" height="14.8" rx="2" />
      <path d="M9 15h2" />
    </svg>
  )
}

/** Documento: el reporte (Strata.dc.html:301). */
function IconoReporte() {
  return (
    <svg width="19" height="19" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden focusable={false}>
      <path d="M4.6 2.6h7l4 4v10.8H4.6z" />
      <path d="M11.4 2.6v4h4" />
      <path d="M7.4 11h5.2M7.4 13.8h3.4" />
    </svg>
  )
}

/** Palomita de la insignia (Strata.dc.html:267). */
function IconoPalomita() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden focusable={false}>
      <path d="M3.2 8.4 6 11.2l6.6-6.8" />
    </svg>
  )
}

interface Paso {
  titulo: string
  texto: string
  icono: ReactNode
}

/**
 * El flujo real en tres pasos (mapa.md, V-6). Reúne los cuatro pasos que tenía
 * el sitio (elegir las pruebas, enviar el enlace, responder desde el celular y
 * recibir el reporte) sin sus promesas falsas: el reporte no llega por correo
 * y el candidato no recibe resultados (C-09, D-16).
 * - Al crear la evaluación, el backend envía a cada candidato su enlace por
 *   correo, y RR. HH. puede copiarlo para compartirlo (correo o WhatsApp).
 * - Cada respuesta se guarda al elegirla y el mismo enlace retoma el avance.
 * - El reporte se califica al terminar y se imprime desde el panel.
 */
const PASOS: readonly Paso[] = [
  {
    titulo: 'Creas la evaluación',
    texto:
      'Eliges las pruebas del catálogo y a quién invitar. Cada candidato recibe por correo su enlace único; también puedes compartirlo por WhatsApp.',
    icono: <IconoPruebas />,
  },
  {
    titulo: 'El candidato responde con su enlace',
    texto:
      'Desde su celular o laptop, sin descargas ni crear cuenta. Sus respuestas se guardan solas y puede retomar con el mismo enlace.',
    icono: <IconoCelular />,
  },
  {
    titulo: 'Lees e imprimes el reporte',
    texto:
      'En cuanto el candidato termina, ves en tu panel sus resultados por escala con su interpretación, listos para imprimir.',
    icono: <IconoReporte />,
  },
]

export interface HowItWorksProps {
  /** Clase extra para la sección; la página que la usa pone el espacio de arriba y de abajo. */
  className?: string
}

/**
 * «Cómo funciona» (Strata.dc.html:263-310): H2 con la insignia del candidato y
 * tres tarjetas translúcidas unidas por un conector punteado. La usan la home y
 * /como-funciona. Sin margen exterior propio.
 */
export function HowItWorks({ className }: HowItWorksProps) {
  const tituloId = useId()

  return (
    <section className={cx('st-how', className)} id="como-funciona" aria-labelledby={tituloId}>
      <div className="st-how__head">
        <h2 id={tituloId} className="st-how__title">
          Cómo funciona
        </h2>
        <Tag tone="coral" size="xl" bordered icon={<IconoPalomita />}>
          El candidato responde sin crear cuenta
        </Tag>
      </div>

      <ol className="st-how__steps">
        {PASOS.map((paso, i) => (
          <Card as="li" key={paso.titulo} variant="step" hover="lift" className="st-how__step">
            <div className="st-how__step-top">
              <span className="st-how__icon">{paso.icono}</span>
              <span className="st-how__num" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
            </div>
            <div>
              <h3 className="st-how__step-title">{paso.titulo}</h3>
              <p className="st-how__step-text">{paso.texto}</p>
            </div>
          </Card>
        ))}
      </ol>
    </section>
  )
}

export default HowItWorks
