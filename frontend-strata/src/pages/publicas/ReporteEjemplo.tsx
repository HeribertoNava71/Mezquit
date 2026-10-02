import { useId } from 'react'
import { cx } from '@/components/ui'
import SampleReport from '@/sections/SampleReport'
import { EncabezadoSeccion } from './EncabezadoSeccion'

export interface ReporteEjemploProps {
  /** Título de la sección (H2). Por defecto, «Así se ve un reporte». */
  title?: string
  className?: string
}

/**
 * Reporte de ejemplo de las páginas públicas (mapa.md, sección 2; R-11 y R-14).
 * La sección pone el H2 y la entradilla; <SampleReport /> (Fase 4) pone la
 * tarjeta de vidrio y el Report de muestra con su badge «Ejemplo» en el banner,
 * sin título propio y con sus encabezados un nivel abajo (H3). Lo usan
 * /pruebas/:slug y /como-funciona, que reciben el ejemplo que salió de la home (D-24).
 */
export function ReporteEjemplo({ title = 'Así se ve un reporte', className }: ReporteEjemploProps) {
  const tituloId = useId()
  return (
    <section className={cx('st-ejemplo', className)} aria-labelledby={tituloId}>
      <EncabezadoSeccion
        id={tituloId}
        title={title}
        lede="Datos ficticios para mostrar el formato: cada reporte incluye la interpretación de cada escala y preguntas sugeridas para la entrevista."
      />
      <SampleReport title={null} headingLevel={3} />
    </section>
  )
}

export default ReporteEjemplo
