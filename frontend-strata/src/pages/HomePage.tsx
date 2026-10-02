import { useRef } from 'react'
import { Mascota } from '@/components/mascota/Mascota'
import Hero from '@/sections/Hero'
import HowItWorks from '@/sections/HowItWorks'
import { CatalogoExpres } from './home/CatalogoExpres'
import { DemoExamen } from './home/DemoExamen'
import { duracionDelCatalogo } from './home/catalogoInicio'
import { useCatalogoInicio } from './home/useCatalogoInicio'
import './HomePage.css'

/**
 * Inicio (`/`, Fase 6; Strata.dc.html:94-329). RootLayout la monta con la
 * variante home: halos intensos, barra dentro del contenido y pie con
 * «Acceso interno» (T-23, D-06).
 * - Hero con selector (D-13) y la demo del examen en vivo (V-3, V-4).
 * - Catálogo exprés con pruebas reales de GET /api/catalog (V-5). La misma
 *   llamada da el rango de duración de la fila de confianza del hero (D-18).
 * - Cómo funciona (V-6), la misma sección que usa /como-funciona.
 * - Sin el reporte de ejemplo: queda en /pruebas/:slug (D-24).
 * - La mascota recibe la ref del H1 del hero para bajar su opacidad sobre él (V-8).
 */
export default function HomePage() {
  const tituloRef = useRef<HTMLHeadingElement>(null)
  const catalogo = useCatalogoInicio()

  return (
    <div className="st-home">
      <Hero tituloRef={tituloRef} duracion={duracionDelCatalogo(catalogo)} aside={<DemoExamen />} />
      <CatalogoExpres catalogo={catalogo} />
      <HowItWorks className="st-home__como" />
      <Mascota tituloRef={tituloRef} />
    </div>
  )
}
