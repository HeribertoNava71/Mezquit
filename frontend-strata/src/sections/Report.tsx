import type { ReportData } from '@/api/report'
import './Report.css'

const CATEGORY_COLOR: Record<string, string> = {
  bajo: 'var(--color-sage)',
  medio: 'var(--color-fern)',
  alto: 'var(--color-hunter)',
}

export default function Report({ data }: { data: ReportData }) {
  return (
    <div className="report">
      <div className="report__header">
        <div>
          <p className="report__candidate">{data.candidate}</p>
          <p className="report__meta">
            {data.position ?? 'Sin puesto'} · {data.assessment} · {data.organization}
            {data.completed_at ? ` · ${data.completed_at}` : ''}
          </p>
        </div>
        {data.sample && <span className="report__badge">Ejemplo</span>}
      </div>

      {data.tests.map((test, ti) => (
        <div key={ti} className="report__test">
          <h3 className="report__test-title">{test.name}</h3>
          {test.scales.map(scale => (
            <div key={scale.code} className="report__scale">
              <div className="report__scale-head">
                <span className="report__scale-name">{scale.name}</span>
                <span className="report__scale-cat" style={{ color: CATEGORY_COLOR[scale.category ?? 'medio'] }}>
                  {scale.category ?? '—'}{scale.percentile != null ? ` · pc ${scale.percentile}` : ''}
                </span>
              </div>
              <div className="report__bar-track">
                <div className="report__bar-fill" style={{ width: `${scale.normalized ?? 0}%`, backgroundColor: CATEGORY_COLOR[scale.category ?? 'medio'] }} />
              </div>
              <p className="report__interp">{scale.interpretation}</p>
            </div>
          ))}
          <p className="report__meta">Integridad de respuesta: {test.integrity.blur_count} vez(ces) que la pantalla perdió el foco.</p>
        </div>
      ))}

      {data.interview_questions.length > 0 && (
        <div className="report__questions">
          <h3 className="report__test-title">Preguntas sugeridas para entrevista</h3>
          {data.interview_questions.map((q, i) => <p key={i} className="report__q">· {q}</p>)}
        </div>
      )}

      <p className="report__foot">
        Este reporte describe tendencias medidas por la prueba; no mide todas las dimensiones de una persona.
        Apoya la decisión de contratación, no la sustituye.
      </p>
    </div>
  )
}
