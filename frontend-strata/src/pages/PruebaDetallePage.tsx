import { useParams } from 'react-router-dom'
import { Button, EstadoCarga, EstadoError, PageHeader, VisuallyHidden } from '@/components/ui'
import { IconoFlechaIzquierda, IconoReactivos, IconoReloj } from './publicas/iconos'
import { ReporteEjemplo } from './publicas/ReporteEjemplo'
import { usePruebaDetalle } from './publicas/usePruebaDetalle'
import './PruebaDetallePage.css'

/**
 * «Volver al catálogo»: enlace de texto con flecha, siempre arriba
 * (Strata.dc.html:1117), del mismo tamaño que «Volver a candidatos» del
 * detalle de la evaluación.
 */
function VolverAlCatalogo() {
  return (
    <Button variant="ghost" size="sm" to="/pruebas" iconLeft={<IconoFlechaIzquierda />} className="st-detalle__volver">
      Volver al catálogo
    </Button>
  )
}

function reactivos(cantidad: number): string {
  return cantidad === 1 ? 'reactivo' : 'reactivos'
}

/**
 * /pruebas/:slug (mapa.md, sección 2; R-11): datos de la prueba desde
 * GET /api/catalog/{slug} y el reporte de ejemplo.
 * - PageHeader: eyebrow = categoría, H1 = nombre y entradilla = descripción;
 *   debajo, la duración y «[ n ] reactivos» en mono.
 * - El reporte de ejemplo va en tarjeta de vidrio con la etiqueta «Ejemplo».
 * - Estados: carga; 404 «Prueba no encontrada», sin reintento; y error de red
 *   o del servidor con «Reintentar». Antes todo error se mostraba como 404.
 */
export default function PruebaDetallePage() {
  const { slug = '' } = useParams()
  const detalle = usePruebaDetalle(slug)

  if (detalle.estado !== 'listo') {
    return (
      <div className="st-detalle">
        <VolverAlCatalogo />
        {/* Sin la prueba no hay título visible: este H1 nombra la página para los lectores de pantalla. */}
        <VisuallyHidden as="h1">Detalle de la prueba</VisuallyHidden>
        {detalle.estado === 'cargando' ? (
          <EstadoCarga variant="bloque" count={4} label="Cargando la prueba…" className="st-detalle__carga" />
        ) : detalle.kind === 'no-encontrado' ? (
          <EstadoError
            kind="no-encontrado"
            titleAs="h2"
            title="Prueba no encontrada"
            message="Esta prueba no existe o no está disponible."
            className="st-detalle__estado"
          />
        ) : (
          <EstadoError
            kind={detalle.kind}
            titleAs="h2"
            title={detalle.kind === 'servidor' ? 'No pudimos cargar la prueba' : undefined}
            onRetry={detalle.reintentar}
            retrying={detalle.reintentando}
            className="st-detalle__estado"
          />
        )}
      </div>
    )
  }

  const { prueba } = detalle
  return (
    <div className="st-detalle">
      <VolverAlCatalogo />
      <PageHeader
        eyebrow={prueba.category_label}
        title={prueba.name}
        lede={prueba.description || undefined}
        className="st-detalle__header"
      />
      <ul className="st-detalle__meta" aria-label="Datos de la prueba">
        <li className="st-detalle__dato">
          <IconoReloj className="st-detalle__icono" />
          <span>
            <VisuallyHidden>Duración estimada: </VisuallyHidden>
            {prueba.duration_min} min
          </span>
        </li>
        <li className="st-detalle__dato">
          <IconoReactivos className="st-detalle__icono" />
          <span>
            [ {prueba.item_count} ] {reactivos(prueba.item_count)}
          </span>
        </li>
      </ul>
      <ReporteEjemplo className="st-detalle__ejemplo" />
    </div>
  )
}
