import { useLocation } from 'react-router-dom'
import Header from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { PageLayout } from '@/components/layout/PageLayout'
import { RouteTransition } from '@/components/layout/RouteTransition'
import { ControlMascota } from '@/components/mascota/ControlMascota'

/**
 * Layout del sitio público: /, páginas públicas, /perfil y 404.
 *
 * - Barra: <Header /> es la barra pública (D-06). Este layout la monta en el
 *   hueco topbar de PageLayout, que la deja como hija directa del lienzo (sticky).
 * - Contenido: RouteTransition anima cada cambio de ruta; PageLayout pone los
 *   halos, el contenedor de 1200 px, el enlace de salto y ScrollToTop.
 * - Home (`/`, Fase 6): variante home de los tres (T-23, D-06; Strata.dc.html:96-125,
 *   :312-324): halos propios, más intensos, que se desplazan con la página; la
 *   barra dentro del contenido, sin sticky ni fondo, y el pie con «Acceso interno»
 *   y «Ocultar mascota» (WCAG 2.2.2; D-27).
 */
export default function RootLayout() {
  const { pathname } = useLocation()
  const variant = pathname === '/' ? 'home' : 'default'

  return (
    <PageLayout
      variant={variant}
      topbar={<Header variant={variant} />}
      footer={<Footer variant={variant} trailing={variant === 'home' && <ControlMascota className="st-footer__link" />} />}
    >
      <RouteTransition />
    </PageLayout>
  )
}
