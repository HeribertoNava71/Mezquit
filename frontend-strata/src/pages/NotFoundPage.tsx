import { useId } from 'react'
import { Button } from '@/components/ui'
import { IconoNoEncontrado } from './publicas/iconos'
import './NotFoundPage.css'

/**
 * 404 (mapa.md, sección 2): pantalla centrada con el ícono en el cuadro tinta
 * del fin del examen (Strata.dc.html:1201-1203), «404», el texto de siempre y
 * «Volver al inicio». También atrapa las subrutas desconocidas de /app y /admin.
 */
export default function NotFoundPage() {
  const tituloId = useId()
  return (
    <section className="st-404" aria-labelledby={tituloId}>
      <span className="st-404__icono" aria-hidden="true">
        <IconoNoEncontrado />
      </span>
      <h1 id={tituloId} className="st-404__codigo">
        404
      </h1>
      <p className="st-404__texto">Esta página no existe o fue movida.</p>
      <Button to="/" className="st-404__cta">
        Volver al inicio
      </Button>
    </section>
  )
}
