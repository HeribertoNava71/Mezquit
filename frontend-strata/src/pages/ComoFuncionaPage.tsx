import PageHeader from '@/sections/PageHeader'
import HowItWorks from '@/sections/HowItWorks'
import Methodology from '@/sections/Methodology'

export default function ComoFuncionaPage() {
  return (
    <>
      <PageHeader title="Cómo funciona" intro="Del catálogo al reporte en tres pasos, y cómo se construyen las pruebas que aplicamos." />
      <HowItWorks />
      <Methodology />
    </>
  )
}
