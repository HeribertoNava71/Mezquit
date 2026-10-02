import { useId, type ReactNode } from 'react'
import { Button, Callout, Card, DotSeparator, EstadoCarga, Tag, VisuallyHidden, type TagTone } from '@/components/ui'
import { pruebasDestacadas, type EstadoCatalogo, type PruebaDestacada } from './catalogoInicio'
import './CatalogoExpres.css'

/** Tono del tag de cada tarjeta, en el orden del prototipo (Strata.dc.html:2058-2060). */
const TONOS: readonly TagTone[] = ['sky', 'coral', 'navy']

function reactivos(cantidad: number): string {
  return `${cantidad} ${cantidad === 1 ? 'reactivo' : 'reactivos'}`
}

function TarjetaPrueba({ destacada, indice }: { destacada: PruebaDestacada; indice: number }) {
  const { prueba, categoria } = destacada
  return (
    <Card as="li" variant="glass" hover="lift" staggerIndex={indice} className="st-home-catalog__card">
      <Tag tone={TONOS[indice % TONOS.length]} dot className="st-home-catalog__tag">
        {categoria.label}
      </Tag>
      <h3 className="st-home-catalog__name">{prueba.name}</h3>
      <p className="st-home-catalog__meta">
        <span>{prueba.duration_min} min</span>
        <DotSeparator />
        <span>{reactivos(prueba.item_count)}</span>
      </p>
      {prueba.description && <p className="st-home-catalog__desc">{prueba.description}</p>}
      <div className="st-home-catalog__actions">
        <Button
          variant="secondary"
          to={`/pruebas/${encodeURIComponent(prueba.slug)}`}
          className="st-home-catalog__preview"
          data-mascota-objetivo="previsualizar"
        >
          Previsualizar test
          <VisuallyHidden>: {prueba.name}</VisuallyHidden>
        </Button>
      </div>
    </Card>
  )
}

export interface CatalogoExpresProps {
  /** Estado de GET /api/catalog (lo pide HomePage, que también calcula la duración del hero). */
  catalogo: EstadoCatalogo
}

/**
 * Catálogo exprés de la home (Strata.dc.html:228-261; mapa.md, V-5):
 * - Tres tarjetas de vidrio con la primera prueba de cada una de las tres
 *   primeras categorías: tag de categoría, nombre, duración, reactivos y descripción.
 * - «Previsualizar test» → /pruebas/:slug (P-04). Sin precios ni «Comprar en 1 clic» (P-02, P-03).
 * - Cargando: tres tarjetas esqueleto. Si la llamada falla o no hay pruebas, un
 *   aviso en lugar de las tarjetas; si hay menos categorías, las que haya.
 * - «Ver catálogo completo» → /pruebas siempre está.
 */
export function CatalogoExpres({ catalogo }: CatalogoExpresProps) {
  const tituloId = useId()

  let contenido: ReactNode
  if (catalogo.estado === 'cargando') {
    contenido = (
      <EstadoCarga
        variant="bloque"
        skeleton="tarjetas"
        count={3}
        label="Cargando pruebas destacadas…"
        className="st-home-catalog__carga"
      />
    )
  } else if (catalogo.estado === 'error') {
    contenido = (
      <Callout tone="warning" className="st-home-catalog__aviso">
        No pudimos cargar las pruebas destacadas. Consulta el catálogo completo para verlas todas.
      </Callout>
    )
  } else {
    const destacadas = pruebasDestacadas(catalogo.categorias)
    contenido =
      destacadas.length > 0 ? (
        <ul className="st-home-catalog__grid">
          {destacadas.map((destacada, i) => (
            <TarjetaPrueba key={destacada.prueba.slug} destacada={destacada} indice={i} />
          ))}
        </ul>
      ) : (
        <Callout tone="info" className="st-home-catalog__aviso">
          Aún no hay pruebas publicadas en el catálogo.
        </Callout>
      )
  }

  return (
    <section className="st-home-catalog" aria-labelledby={tituloId}>
      <div className="st-home-catalog__head">
        <div>
          <p className="st-home-catalog__eyebrow">Catálogo exprés</p>
          <h2 id={tituloId} className="st-home-catalog__title">
            Elige las pruebas de tu evaluación
          </h2>
        </div>
        <Button
          variant="ghost"
          to="/pruebas"
          iconRight={<span>→</span>}
          className="st-home-catalog__ver"
          data-mascota-objetivo="catalogo"
        >
          Ver catálogo completo
        </Button>
      </div>
      {contenido}
    </section>
  )
}

export default CatalogoExpres
