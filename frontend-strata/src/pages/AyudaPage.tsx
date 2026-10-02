import { useId, type ReactNode } from 'react'
import { Button, Card, PageHeader } from '@/components/ui'
import { SITE } from '@/config/site'
import { IconoEdificio, IconoFlechaDerecha, IconoPersona } from './publicas/iconos'
import { Pendiente } from './publicas/Pendiente'
import { esCorreoReal } from './publicas/marcadores'
import './AyudaPage.css'

interface Pregunta {
  q: string
  a: string
}

/** Preguntas de siempre (2026-09-11-fase3-sitio-ventas.md:823-833), sin cambios de texto. */
const CANDIDATO: readonly Pregunta[] = [
  { q: 'No me llegó el enlace de la evaluación', a: 'Revisa tu carpeta de spam. Si tienes el código, pégalo en la página de acceso a tu evaluación.' },
  { q: 'Se me cerró la prueba a la mitad', a: 'Vuelve a abrir el mismo enlace: tus respuestas se guardan y continúas donde ibas.' },
  { q: 'Me pide datos que no quiero dar', a: 'Solo pedimos lo mínimo para generar tu reporte. El consentimiento es explícito antes de empezar.' },
]

const EMPRESA: readonly Pregunta[] = [
  { q: '¿Cómo invito candidatos?', a: 'Desde tu panel creas una evaluación, agregas los correos y el sistema genera un enlace por candidato.' },
  { q: '¿Cómo leo el reporte?', a: 'Cada reporte incluye la interpretación de cada escala y preguntas sugeridas para la entrevista.' },
  { q: '¿Cómo funciona la facturación?', a: 'Se factura por paquetes de créditos o suscripción. Escríbenos para los detalles.' },
]

/**
 * Flecha de los enlaces del pie: va en la misma línea que el texto, también
 * cuando el texto se parte en dos líneas a 360 px (con iconRight quedaría en
 * el borde derecho, lejos del texto).
 */
function FlechaEnLinea() {
  return (
    <span className="st-ayuda__flecha" aria-hidden="true">
      <IconoFlechaDerecha />
    </span>
  )
}

interface GrupoProps {
  titulo: string
  icono: ReactNode
  preguntas: readonly Pregunta[]
  indice: number
  /** Acción al pie de la tarjeta. */
  pie: ReactNode
}

function Grupo({ titulo, icono, preguntas, indice, pie }: GrupoProps) {
  const tituloId = useId()
  return (
    <Card
      as="section"
      variant="glass"
      padding="lg"
      staggerIndex={indice}
      className="st-ayuda__grupo"
      aria-labelledby={tituloId}
    >
      <div className="st-ayuda__cabeza">
        <span className="st-ayuda__icono">{icono}</span>
        <h2 id={tituloId} className="st-ayuda__titulo">
          {titulo}
        </h2>
      </div>
      <ul className="st-ayuda__preguntas">
        {preguntas.map((pregunta) => (
          <li key={pregunta.q} className="st-ayuda__pregunta">
            <h3 className="st-ayuda__q">{pregunta.q}</h3>
            <p className="st-ayuda__a">{pregunta.a}</p>
          </li>
        ))}
      </ul>
      <div className="st-ayuda__pie">{pie}</div>
    </Card>
  )
}

/**
 * /ayuda (mapa.md, sección 2): dos tarjetas de vidrio, «Soy candidato» y «Soy
 * empresa», con las preguntas de siempre. El candidato va a /evaluar; la
 * empresa escribe a SITE.email. Mientras el correo sea «[PENDIENTE]», se ve el
 * marcador y no hay un mailto a una dirección que no existe.
 */
export default function AyudaPage() {
  const correo = esCorreoReal(SITE.email) ? SITE.email.trim() : null

  return (
    <div className="st-ayuda">
      <PageHeader eyebrow="Soporte" title="Ayuda" lede={`Encuentra respuestas según cómo usas ${SITE.name}.`} />
      <div className="st-ayuda__grid">
        <Grupo
          titulo="Soy candidato"
          icono={<IconoPersona />}
          preguntas={CANDIDATO}
          indice={0}
          pie={
            <Button variant="ghost" to="/evaluar" className="st-ayuda__cta">
              ¿Te invitaron a una evaluación? Accede aquí
              <FlechaEnLinea />
            </Button>
          }
        />
        <Grupo
          titulo="Soy empresa"
          icono={<IconoEdificio />}
          preguntas={EMPRESA}
          indice={1}
          pie={
            correo ? (
              <Button variant="ghost" href={`mailto:${correo}`} className="st-ayuda__cta">
                Escríbenos: {correo}
                <FlechaEnLinea />
              </Button>
            ) : (
              <p className="st-ayuda__correo">
                <span>Escríbenos:</span> <Pendiente>{SITE.email}</Pendiente>
              </p>
            )
          }
        />
      </div>
    </div>
  )
}
