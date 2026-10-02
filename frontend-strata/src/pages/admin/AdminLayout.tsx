import { Footer } from '@/components/layout/Footer'
import { PageLayout } from '@/components/layout/PageLayout'
import { RouteTransition } from '@/components/layout/RouteTransition'
import { BarraAdmin } from '@/components/layout/topbar/BarraAdmin'

/**
 * Layout de operación (/admin/*): barra de super admin (BarraAdmin), el mismo
 * lienzo, transición y pie que el resto (PageLayout, RouteTransition y Footer).
 * Ya no depende de AppLayout.css (riesgo 19). El acceso lo controla
 * RequirePlatformAdmin en App.tsx.
 */
export default function AdminLayout() {
  return (
    <PageLayout topbar={<BarraAdmin />} footer={<Footer />}>
      <RouteTransition />
    </PageLayout>
  )
}
