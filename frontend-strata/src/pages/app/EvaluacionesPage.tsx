import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listAssessments, type AssessmentSummary } from '@/api/rh'
import Button from '@/components/ui/Button'
import './EvaluacionesPage.css'

export default function EvaluacionesPage() {
  const [items, setItems] = useState<AssessmentSummary[] | null>(null)

  useEffect(() => { listAssessments().then(setItems).catch(() => setItems([])) }, [])

  return (
    <div className="evals">
      <div className="evals__head">
        <h1 className="evals__title">Evaluaciones</h1>
        <Button to="/app/evaluaciones/nueva">Nueva evaluación</Button>
      </div>
      {items === null && <p className="evals__empty">Cargando…</p>}
      {items && items.length === 0 && <p className="evals__empty">Aún no tienes evaluaciones. Crea la primera.</p>}
      {items && items.length > 0 && (
        <table className="evals__table">
          <thead>
            <tr><th>Nombre</th><th>Puesto</th><th>Avance</th><th>Fecha</th><th></th></tr>
          </thead>
          <tbody>
            {items.map(a => (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td>{a.position ?? '—'}</td>
                <td className="evals__progress">{a.counts.completada} de {a.counts.total} completadas</td>
                <td>{a.created_at ?? '—'}</td>
                <td><Link to={`/app/evaluaciones/${a.id}`} className="evals__link">Ver</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
