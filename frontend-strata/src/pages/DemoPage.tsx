import { PageHeader } from '@/components/ui'
import ContactSection from '@/sections/ContactSection'

/**
 * /demo (mapa.md, sección 2): encabezado de página y el formulario de leads con
 * el bloque de agenda (ContactSection). «Para empresas» es el enlace de la barra
 * pública que trae aquí (mapa.md, sección 3).
 */
export default function DemoPage() {
  return (
    <>
      <PageHeader
        eyebrow="Para empresas"
        title="Agenda una demo"
        lede="Cuéntanos de tu empresa y te mostramos el sistema en acción. Te respondemos en un día hábil."
      />
      <ContactSection />
    </>
  )
}
