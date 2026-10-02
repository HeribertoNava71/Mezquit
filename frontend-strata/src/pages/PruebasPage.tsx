import { useEffect, useRef, type ReactNode } from 'react'
import { useMatch } from 'react-router-dom'
import { Button, EstadoCarga, EstadoError, EstadoVacio, PageHeader, estadoErrorTextos } from '@/components/ui'
import { IconoAgregar } from '@/components/ui/Iconos'
// Destino de «Solicitar créditos» en el panel (RH-3, D-09): Créditos con su drawer abierto.
import { RUTA_SOLICITAR_CREDITOS } from '@/pages/app/creditos/solicitud'
import { CatalogoPruebas } from './catalogo/CatalogoPruebas'
import { useCatalogo } from './catalogo/useCatalogo'
import './PruebasPage.css'

/** Dónde se muestra el catálogo: el sitio público (/pruebas) o el panel de RR. HH. (/app/pruebas). */
export type ContextoCatalogo = 'publico' | 'panel'

export interface PruebasPageProps {
  /** Sin valor se deduce de la ruta: /app/pruebas es el panel (D-07, punto 1). */
  contexto?: ContextoCatalogo
}

const ENTRADILLA_BASE = 'Explora el catálogo por categoría o busca por nombre.'

/**
 * Entradilla sin «instrumentos validados y baremados» (D-18). En el panel, la
 * licencia del prototipo pasa a crédito (D-08): un crédito por candidato invitado.
 */
const ENTRADILLA: Record<ContextoCatalogo, string> = {
  publico: `${ENTRADILLA_BASE} Cada prueba mide un aspecto distinto del candidato.`,
  panel: `${ENTRADILLA_BASE} Cada crédito te permite invitar a un candidato.`,
}

/**
 * Catálogo de pruebas (Strata.dc.html:603-679; mapa.md, RH-2 y RH-3) en dos
 * contextos con el mismo contenido: /pruebas en RootLayout y /app/pruebas en el panel.
 * - Encabezado con eyebrow, H1 y entradilla. En el panel, el lugar del botón
 *   «Carrito · N» lo ocupa «Solicitar créditos» (RH-3, D-09). En el sitio
 *   público no hay acción: no hay compra (PB-09).
 * - GET /api/catalog con EstadoCarga (barra y tarjetas esqueleto), EstadoError
 *   «No pudimos cargar el catálogo.» con «Reintentar» (antes no había reintento,
 *   R-34) y EstadoVacio si no hay pruebas publicadas.
 * - Al cargar tras «Reintentar», el foco pasa al filtro activo: el botón ya no existe.
 */
export default function PruebasPage({ contexto }: PruebasPageProps) {
  const enPanel = useMatch({ path: '/app', end: false }) !== null
  const donde: ContextoCatalogo = contexto ?? (enPanel ? 'panel' : 'publico')
  const { catalogo, reintentando, reintentar } = useCatalogo()

  const contenidoRef = useRef<HTMLDivElement>(null)
  const enfocarAlCargar = useRef(false)

  function alReintentar() {
    enfocarAlCargar.current = true
    reintentar()
  }

  // Tras «Reintentar», el botón desaparece: el foco pasa al filtro activo o,
  // si no hay pruebas, al contenido (tabindex temporal, como «Saltar al contenido»).
  useEffect(() => {
    const zona = contenidoRef.current
    if (catalogo.estado !== 'listo' || !enfocarAlCargar.current || !zona) return
    enfocarAlCargar.current = false
    const filtroActivo = zona.querySelector<HTMLElement>('[aria-pressed="true"]')
    if (filtroActivo) {
      filtroActivo.focus()
      return
    }
    zona.setAttribute('tabindex', '-1')
    zona.addEventListener('blur', () => zona.removeAttribute('tabindex'), { once: true })
    zona.focus()
  }, [catalogo.estado])

  let contenido: ReactNode
  if (catalogo.estado === 'cargando') {
    contenido = (
      <div className="st-pruebas__carga">
        <div className="st-pruebas__barra-esqueleto" aria-hidden="true">
          <span className="st-pruebas__esqueleto st-pruebas__esqueleto--filtro" />
          <span className="st-pruebas__esqueleto st-pruebas__esqueleto--busqueda" />
        </div>
        <EstadoCarga
          variant="bloque"
          skeleton="tarjetas"
          count={6}
          label="Cargando catálogo…"
          className="st-pruebas__tarjetas-esqueleto"
        />
      </div>
    )
  } else if (catalogo.estado === 'error') {
    contenido = (
      <EstadoError
        kind={catalogo.tipo}
        titleAs="h2"
        title="No pudimos cargar el catálogo."
        message={estadoErrorTextos[catalogo.tipo].message}
        onRetry={alReintentar}
        retrying={reintentando}
      />
    )
  } else if (catalogo.categorias.length === 0) {
    contenido = (
      <EstadoVacio
        titleAs="h2"
        title="Aún no hay pruebas publicadas."
        description="Cuando haya pruebas disponibles, las verás aquí."
      />
    )
  } else {
    contenido = <CatalogoPruebas categorias={catalogo.categorias} />
  }

  return (
    <div className="st-pruebas">
      <PageHeader
        eyebrow="Evaluación de candidatos"
        title="Catálogo de tests psicométricos"
        lede={ENTRADILLA[donde]}
        actions={
          donde === 'panel' && (
            <Button variant="secondary" to={RUTA_SOLICITAR_CREDITOS} iconLeft={<IconoAgregar />}>
              Solicitar créditos
            </Button>
          )
        }
      />
      <div ref={contenidoRef} className="st-pruebas__contenido">
        {contenido}
      </div>
    </div>
  )
}
