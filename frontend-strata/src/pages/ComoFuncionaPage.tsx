import { PageHeader } from '@/components/ui'
import { SITE } from '@/config/site'
import HowItWorks from '@/sections/HowItWorks'
import Methodology from '@/sections/Methodology'
import { ReporteEjemplo } from './publicas/ReporteEjemplo'
import './ComoFuncionaPage.css'

/**
 * /como-funciona (mapa.md, sección 2): los tres pasos de «Cómo funciona»
 * (HowItWorks, el mismo de la home; Fase 6), la metodología en cuatro tarjetas
 * de vidrio y el reporte de ejemplo, que salió de la home (D-24, opción A).
 */
export default function ComoFuncionaPage() {
  return (
    <div className="st-como">
      <PageHeader
        eyebrow="Cómo funciona"
        title="Del catálogo al reporte en tres pasos"
        lede={`Así se aplica una evaluación con ${SITE.name}, cómo se construyen las pruebas y cómo se ve el reporte que lees en tu panel.`}
      />
      <HowItWorks className="st-como__pasos" />
      <Methodology className="st-como__seccion" />
      <ReporteEjemplo className="st-como__seccion" />
    </div>
  )
}
