import type { CatalogCategory, CatalogTest } from '@/api/catalog'
import { Button, Card, VisuallyHidden } from '@/components/ui'
import { minutosDePrueba, reactivosDePrueba, unidadDeReactivos } from './catalogo'
import { IconoDuracion, IconoReactivos } from './iconos'
import './TarjetaPrueba.css'

export interface TarjetaPruebaProps {
  prueba: CatalogTest
  /** Categoría de la prueba: su nombre va arriba, en mayúsculas. */
  categoria: Pick<CatalogCategory, 'id' | 'label'>
  /** Posición en la grilla para la entrada escalonada (55 ms). Sin índice no se anima. */
  indice?: number
}

/**
 * Tarjeta de vidrio del catálogo (Strata.dc.html:630-675): categoría en
 * mayúsculas, nombre, descripción, duración y reactivos con sus íconos, y
 * «Ver detalle» → /pruebas/:slug.
 * - Sin código, saldo, precio, descuento, stepper ni «Añadir · Comprar
 *   licencias»: la compra no tiene backend (P-02, PB-09, PB-10).
 * - Sin «responder» ni «asignar»: los reactivos son un dato declarado (R-10, PB-04).
 */
export function TarjetaPrueba({ prueba, categoria, indice }: TarjetaPruebaProps) {
  const minutos = minutosDePrueba(prueba)
  const reactivos = reactivosDePrueba(prueba)
  const descripcion = prueba.description?.trim()
  const conDatos = minutos !== null || reactivos !== null

  return (
    <Card as="li" variant="glass" padding="none" hover="outline" staggerIndex={indice} className="st-catalogo-tarjeta">
      <div className="st-catalogo-tarjeta__cuerpo">
        <div className="st-catalogo-tarjeta__principal">
          <div className="st-catalogo-tarjeta__cabecera">
            <p className="st-catalogo-tarjeta__categoria">{categoria.label}</p>
          </div>
          <h2 className="st-catalogo-tarjeta__nombre">{prueba.name}</h2>
          {descripcion && <p className="st-catalogo-tarjeta__descripcion">{descripcion}</p>}
        </div>
        {conDatos && (
          <p className="st-catalogo-tarjeta__datos">
            {minutos !== null && (
              <span className="st-catalogo-tarjeta__dato">
                <IconoDuracion className="st-catalogo-tarjeta__icono" />
                <span>{minutos} min</span>
              </span>
            )}
            {minutos !== null && reactivos !== null && <VisuallyHidden>, </VisuallyHidden>}
            {reactivos !== null && (
              <span className="st-catalogo-tarjeta__dato">
                <IconoReactivos className="st-catalogo-tarjeta__icono" />
                <span>
                  {reactivos} {unidadDeReactivos(reactivos)}
                </span>
              </span>
            )}
          </p>
        )}
      </div>
      <div className="st-catalogo-tarjeta__pie">
        <Button variant="secondary" fullWidth to={`/pruebas/${encodeURIComponent(prueba.slug)}`}>
          Ver detalle{' '}
          <VisuallyHidden>de {prueba.name}</VisuallyHidden>
        </Button>
      </div>
    </Card>
  )
}

export default TarjetaPrueba
