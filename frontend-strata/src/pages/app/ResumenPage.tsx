import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCredits, listAssessments, type AssessmentSummary } from '@/api/rh'
import './ResumenPage.css'

export default function ResumenPage() {
  const [balance, setBalance] = useState<number | null>(null)
  const [assessments, setAssessments] = useState<AssessmentSummary[]>([])

  useEffect(() => {
    getCredits().then(c => setBalance(c.balance)).catch(() => {})
    listAssessments().then(setAssessments).catch(() => {})
  }, [])

  const activas = assessments.filter(a => a.counts.completada < a.counts.total).length

  return (
    <div className="resumen">
      <h1 className="resumen__title">Resumen</h1>
      <div className="resumen__cards">
        <div className="resumen__card">
          <span className="resumen__card-label">Créditos disponibles</span>
          <span className="resumen__card-value">{balance ?? '—'}</span>
          <Link to="/app/creditos" className="resumen__link">Ver créditos</Link>
        </div>
        <div className="resumen__card">
          <span className="resumen__card-label">Evaluaciones activas</span>
          <span className="resumen__card-value">{activas}</span>
          <Link to="/app/evaluaciones" className="resumen__link">Ver evaluaciones</Link>
        </div>
      </div>
    </div>
  )
}
