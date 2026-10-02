import { useId, type HTMLAttributes, type ReactNode } from 'react'
import type { ReportData } from '@/api/report'
import { Card, cx } from '@/components/ui'
import { SITE } from '@/config/site'
import Report from '@/sections/Report'
import './SampleReport.css'

/** Datos del reporte de ejemplo (R-14). Son de muestra y siempre van con el badge «Ejemplo». */
const SAMPLE: ReportData = {
  candidate: 'Ejemplo · Candidato',
  position: 'Ejecutivo de ventas',
  assessment: 'Evaluación de muestra',
  organization: SITE.name,
  completed_at: 'Sep 2026',
  sample: true,
  interview_questions: ['Cuéntame de una situación reciente relacionada con «Orientación a resultados».'],
  tests: [{
    name: 'Perfil de conducta',
    integrity: { blur_count: 0 },
    scales: [
      { code: 'RES', name: 'Orientación a resultados', normalized: 78, percentile: 78, category: 'alto', interpretation: 'Puntaje alto: es una fortaleza marcada del candidato.' },
      { code: 'COL', name: 'Colaboración', normalized: 55, percentile: 55, category: 'medio', interpretation: 'Puntaje medio: dentro del promedio esperado.' },
      { code: 'ADA', name: 'Adaptabilidad', normalized: 30, percentile: 30, category: 'bajo', interpretation: 'Puntaje bajo: podría ser un área a explorar en entrevista.' },
    ],
  }],
}

export interface SampleReportProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Título de la sección. Por defecto, «Este es el reporte que recibes»; null lo quita. */
  title?: ReactNode
  /** Nivel del título de la sección; el reporte empieza un nivel abajo. Por defecto, 2. */
  headingLevel?: 2 | 3
}

/**
 * Reporte de ejemplo: el mismo Report del panel, en modo sample (badge
 * «Ejemplo»), dentro de una tarjeta de vidrio (mapa.md, /pruebas/:slug). Se
 * puede incrustar en cualquier página pública; D-24 lo quitó de la home.
 */
export default function SampleReport({
  title = 'Este es el reporte que recibes',
  headingLevel = 2,
  className,
  ...rest
}: SampleReportProps) {
  const idTitulo = useId()
  const conTitulo = title != null && title !== false
  const Titulo = `h${headingLevel}` as const

  return (
    <section
      {...rest}
      className={cx('st-sample-report', className)}
      aria-labelledby={conTitulo ? idTitulo : rest['aria-labelledby']}
    >
      {conTitulo && (
        <Titulo id={idTitulo} className="st-sample-report__title">
          {title}
        </Titulo>
      )}
      <Card variant="glass" padding="lg" className="st-sample-report__card">
        <Report data={SAMPLE} sample headingLevel={conTitulo ? ((headingLevel + 1) as 3 | 4) : headingLevel} />
      </Card>
    </section>
  )
}
