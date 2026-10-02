import { useId, useState } from 'react'
import { Button, LiveDot, ProgressBar, VisuallyHidden } from '@/components/ui'
import './DemoExamen.css'

/** Opciones de la pregunta de ejemplo (Strata.dc.html:2043-2046). */
const OPCIONES = [
  'Escucho a las partes y busco el punto medio',
  'Decido rápido con la información que tengo',
  'Convoco al equipo y construimos la salida juntos',
] as const

/** Empieza marcada la segunda, como en el prototipo (demoOpcion: 1, Strata.dc.html:1509). */
const OPCION_INICIAL = 1

/** Radar mini (Strata.dc.html:215-222): retícula, ejes y tres perfiles que se alternan. */
const RETICULA = [
  '60.0,16.0 101.8,46.4 85.9,95.6 34.1,95.6 18.2,46.4',
  '60.0,31.0 87.6,51.0 77.1,83.5 42.9,83.5 32.4,51.0',
  '60.0,45.0 74.3,55.4 68.8,72.1 51.2,72.1 45.7,55.4',
] as const
const EJES = 'M60 60 60 16M60 60 101.8 46.4M60 60 85.9 95.6M60 60 34.1 95.6M60 60 18.2 46.4'
const PERFILES = [
  '60.0,22.2 85.9,51.6 79.1,86.3 45.8,79.6 30.7,50.5',
  '60.0,29.2 93.5,49.1 75.0,80.6 41.4,85.6 37.0,52.5',
  '60.0,25.7 83.0,52.5 82.0,90.3 44.0,82.1 26.5,49.1',
] as const

/** Palomita del aro de la opción elegida (Strata.dc.html:185). */
function IconoPalomita() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden focusable={false}>
      <path d="M2.6 6.2 4.8 8.4l4.6-4.8" />
    </svg>
  )
}

/** Flecha de «Siguiente» (Strata.dc.html:195). */
function IconoFlecha() {
  return (
    <svg width="13" height="13" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden focusable={false}>
      <path d="M3.4 9h11.2M10.4 4.8 14.6 9l-4.2 4.2" />
    </svg>
  )
}

/** Palomita de la insignia «Respuesta guardada». */
function IconoGuardada() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable={false}>
      <path d="M4.4 9.4 7.5 12.4l6.1-6.6" />
    </svg>
  )
}

/** Radar mini con los tres perfiles que se alternan (polyCycle). Decorativo. */
function RadarMini() {
  return (
    <svg className="st-demo__radar" width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden focusable={false}>
      {RETICULA.map((puntos) => (
        <polygon key={puntos} points={puntos} className="st-demo__radar-grid" />
      ))}
      <path d={EJES} className="st-demo__radar-axis" />
      {PERFILES.map((puntos, i) => (
        <polygon key={puntos} points={puntos} className={`st-demo__poly st-demo__poly--${i + 1}`} />
      ))}
    </svg>
  )
}

/**
 * Demo del examen en vivo de la home (Strata.dc.html:168-225; mapa.md, V-4).
 * Es un ejemplo sin API:
 * - La selección es estado local y empieza en la segunda opción.
 * - El contador, el progreso y «Guardado» son ilustrativos (aria-hidden).
 * - «Siguiente» lleva a /evaluar, donde el candidato escribe su enlace o código.
 * - Las insignias no prometen nada por correo al candidato (D-16).
 * Las animaciones (floatCard, floatBadge, polyCycle y livePulse) se apagan con
 * prefers-reduced-motion.
 */
export function DemoExamen() {
  const [elegida, setElegida] = useState(OPCION_INICIAL)
  const base = useId()
  const tituloId = `${base}-titulo`
  const preguntaId = `${base}-pregunta`
  const grupo = `${base}-opciones`

  return (
    <section className="st-demo" aria-labelledby={tituloId}>
      <VisuallyHidden as="h2" id={tituloId}>
        Ejemplo de una pregunta del examen
      </VisuallyHidden>

      <div className="st-demo__card">
        <div className="st-demo__meta" aria-hidden="true">
          <span className="st-demo__counter">Pregunta 12 / 68</span>
          <span className="st-demo__saved">
            <LiveDot tone="success" size={6} tempo="slow" />
            Guardado
          </span>
        </div>
        <ProgressBar decorative value={18} size={5} className="st-demo__progress" />

        <p id={preguntaId} className="st-demo__question">
          ¿Cómo prefieres resolver un conflicto complejo?
        </p>

        <div role="radiogroup" aria-labelledby={preguntaId} className="st-demo__options">
          {OPCIONES.map((texto, i) => (
            <label key={texto} className="st-demo__option">
              <input
                type="radio"
                name={grupo}
                value={i}
                checked={elegida === i}
                onChange={() => setElegida(i)}
                className="st-demo__input"
              />
              <span className="st-demo__ring" aria-hidden="true">
                <IconoPalomita />
              </span>
              <span className="st-demo__label">{texto}</span>
            </label>
          ))}
        </div>

        <div className="st-demo__foot">
          <p className="st-demo__note">No hay respuestas correctas</p>
          <Button to="/evaluar" className="st-demo__next" iconRight={<IconoFlecha />}>
            Siguiente
            <VisuallyHidden>: responde tu evaluación con tu enlace o código</VisuallyHidden>
          </Button>
        </div>
      </div>

      <div className="st-demo__badge st-demo__badge--saved" aria-hidden="true">
        <span className="st-demo__badge-icon">
          <IconoGuardada />
        </span>
        <span className="st-demo__badge-text">
          <span className="st-demo__badge-title">Respuesta guardada</span>
          <span className="st-demo__badge-sub">Puedes pausar y retomar</span>
        </span>
      </div>

      <div className="st-demo__badge st-demo__badge--radar" aria-hidden="true">
        <span className="st-demo__radar-head">
          <LiveDot tone="sky-strong" size={6} tempo="fast" />
          <span className="st-demo__radar-label">Reporte listo para RR. HH.</span>
        </span>
        <RadarMini />
      </div>
    </section>
  )
}

export default DemoExamen
