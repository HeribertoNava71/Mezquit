import Header from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { PageLayout } from '@/components/layout/PageLayout'
import { RouteTransition } from '@/components/layout/RouteTransition'

/**
 * Layout del sitio público: /, páginas públicas, /perfil y 404.
 *
 * - Barra: <Header /> es la barra pública (D-06). La rediseña la Fase 2 ·
 *   barras en Header.tsx; este layout solo la monta en el hueco topbar de
 *   PageLayout, que la deja como hija directa del lienzo (sticky).
 * - Contenido: RouteTransition anima cada cambio de ruta; PageLayout pone los
 *   halos, el contenedor de 1200 px, el enlace de salto y ScrollToTop.
 * - Home: sigue con la variante default hasta la Fase 6, que la pasa a
 *   variant="home" (halos propios) con la barra dentro del contenido.
 */
export default function RootLayout() {
  return (
    <PageLayout topbar={<Header />} footer={<Footer />}>
      <RouteTransition />
    </PageLayout>
  )
}
