import Report from '@/sections/Report'
import type { ReportData } from '@/api/report'
import './SampleReport.css'

const SAMPLE: ReportData = {
  candidate: 'Ejemplo · Candidato',
  position: 'Ejecutivo de ventas',
  assessment: 'Evaluación de muestra',
  organization: 'Mez',
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

export default function SampleReport() {
  return (
    <section className="sample-report" aria-labelledby="sample-title">
      <div className="sample-report__inner">
        <div className="sample-report__heading">
          <h2 className="sample-report__title" id="sample-title">Este es el reporte que recibes</h2>
        </div>
        <div className="report-card" style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', padding: 'var(--sp-8)' }}>
          <Report data={SAMPLE} />
        </div>
      </div>
    </section>
  )
}
