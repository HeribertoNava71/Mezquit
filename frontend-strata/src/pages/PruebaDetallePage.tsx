import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getTest, type TestDetail } from '@/api/catalog'
import Report from '@/sections/Report'
import type { ReportData } from '@/api/report'
import { SITE } from '@/config/site'
import './PruebaDetallePage.css'

const SAMPLE: ReportData = {
  candidate: 'Ejemplo · Candidato',
  position: 'Puesto de referencia',
  assessment: 'Evaluación de muestra',
  organization: SITE.name,
  completed_at: 'Sep 2026',
  sample: true,
  interview_questions: ['Cuéntame de una situación reciente relacionada con «Orientación a resultados».'],
  tests: [{
    name: 'Resultado de ejemplo',
    integrity: { blur_count: 0 },
    scales: [
      { code: 'A', name: 'Escala A', normalized: 74, percentile: 74, category: 'alto', interpretation: 'Puntaje alto: es una fortaleza marcada del candidato.' },
      { code: 'B', name: 'Escala B', normalized: 52, percentile: 52, category: 'medio', interpretation: 'Puntaje medio: dentro del promedio esperado.' },
      { code: 'C', name: 'Escala C', normalized: 28, percentile: 28, category: 'bajo', interpretation: 'Puntaje bajo: podría ser un área a explorar en entrevista.' },
    ],
  }],
}

export default function PruebaDetallePage() {
  const { slug = '' } = useParams()
  const [test, setTest] = useState<TestDetail | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reconstrucción: efecto de carga del plan tal cual; ver docs/rediseno/reconstruccion.md
    setTest(null)
    setError(false)
    getTest(slug).then(setTest).catch(() => setError(true))
  }, [slug])

  if (error) return (
    <section className="detalle"><div className="detalle__inner">
      <Link to="/pruebas" className="detalle__back">← Volver al catálogo</Link>
      <h1 className="detalle__title">Prueba no encontrada</h1>
      <p className="detalle__state">Esta prueba no existe o no está disponible.</p>
    </div></section>
  )

  if (!test) return (
    <section className="detalle"><div className="detalle__inner"><p className="detalle__state">Cargando…</p></div></section>
  )

  return (
    <section className="detalle">
      <div className="detalle__inner">
        <Link to="/pruebas" className="detalle__back">← Volver al catálogo</Link>
        <div>
          <p className="detalle__cat">{test.category_label}</p>
          <h1 className="detalle__title">{test.name}</h1>
        </div>
        <p className="detalle__desc">{test.description}</p>
        <div className="detalle__facts">
          <div className="detalle__fact">
            <span className="detalle__fact-label">Duración estimada</span>
            <span className="detalle__fact-value">{test.duration_min} min</span>
          </div>
          <div className="detalle__fact">
            <span className="detalle__fact-label">Reactivos</span>
            <span className="detalle__fact-value">[ {test.item_count} ]</span>
          </div>
        </div>
        <div className="detalle__report">
          <p className="detalle__report-intro">Así se ve un reporte de esta categoría:</p>
          <Report data={SAMPLE} />
        </div>
      </div>
    </section>
  )
}
