import { Footer } from '@/components/layout/Footer'
import { PageLayout } from '@/components/layout/PageLayout'
import { RouteTransition } from '@/components/layout/RouteTransition'
import { BarraRh } from '@/components/layout/topbar/BarraRh'

/**
 * Layout del portal de RR. HH. (/app/*): barra de RR. HH. (BarraRh), lienzo
 * con halos y contenedor de 1200 px (PageLayout, que también monta
 * ScrollToTop), entrada de pantalla al cambiar de ruta (RouteTransition) y el
 * pie común (TR-3). La sesión la garantiza RequireAuth en App.tsx.
 */
export default function AppLayout() {
  return (
    <PageLayout topbar={<BarraRh />} footer={<Footer />}>
      <RouteTransition />
    </PageLayout>
  )
}
