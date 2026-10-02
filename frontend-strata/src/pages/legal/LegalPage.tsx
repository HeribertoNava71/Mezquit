import { Card, PageHeader } from '@/components/ui'
import { Pendiente } from '@/pages/publicas/Pendiente'
import { esPendiente } from '@/pages/publicas/marcadores'
import './LegalPage.css'

export interface LegalPageProps {
  /** Título del documento (H1). */
  title: string
  /**
   * Texto del documento. Una línea en blanco separa los párrafos. Mientras sea
   * un marcador «[PENDIENTE: …]», se muestra como pendiente (R-35).
   */
  body: string
}

/**
 * Plantilla de /aviso-de-privacidad y /terminos (mapa.md, sección 2):
 * PageHeader y el documento en ancho de lectura, sobre la tarjeta secundaria.
 */
export default function LegalPage({ title, body }: LegalPageProps) {
  const pendiente = esPendiente(body)
  const parrafos = pendiente
    ? []
    : body
        .split(/\n\s*\n/)
        .map((parrafo) => parrafo.trim())
        .filter(Boolean)

  return (
    <div className="st-legal">
      <PageHeader eyebrow="Legal" title={title} />
      <Card as="article" variant="secondary" padding="lg" className="st-legal__documento" aria-label={title}>
        {pendiente ? (
          <Pendiente>{body}</Pendiente>
        ) : (
          parrafos.map((parrafo, i) => (
            <p key={i} className="st-legal__parrafo">
              {parrafo}
            </p>
          ))
        )}
      </Card>
    </div>
  )
}
