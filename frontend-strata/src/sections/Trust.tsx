import './Trust.css'

const CLAIMS = [
  {
    statement: 'Pruebas estandarizadas',
    detail: 'Instrumentos con normas de calificación definidas, aplicados en condiciones idénticas para todos los candidatos.',
  },
  {
    statement: 'Reportes con interpretación',
    detail: 'Cada reporte incluye el contexto para leer los resultados, sin requerir formación en psicometría.',
  },
  {
    statement: 'Resultados en minutos',
    detail: 'El reporte está disponible en cuanto el candidato termina la evaluación.',
  },
  {
    statement: '[PENDIENTE: afirmación verificable #1]',
    detail: '[PENDIENTE: descripción de la afirmación]',
  },
  {
    statement: '[PENDIENTE: afirmación verificable #2]',
    detail: '[PENDIENTE: descripción de la afirmación]',
  },
] as const

export default function Trust() {
  return (
    <section className="trust" aria-labelledby="trust-title">
      <div className="trust__inner">
        <h2 className="trust__title" id="trust-title">Por qué Mezquit</h2>
        <div className="trust__grid">
          {CLAIMS.map((claim, i) => (
            <div key={i} className="trust-card">
              <p className="trust-card__statement">{claim.statement}</p>
              <p className="trust-card__detail">{claim.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
