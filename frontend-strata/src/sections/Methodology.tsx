import './Methodology.css'

const CONCEPTS = [
  {
    title: 'Validez',
    body: 'Una prueba es válida cuando mide lo que dice medir. Cada instrumento se construye a partir de un marco teórico claro y se revisa para que sus reactivos correspondan al rasgo que se evalúa.',
  },
  {
    title: 'Confiabilidad',
    body: 'La confiabilidad es la consistencia de los resultados: si una persona responde en condiciones similares, el puntaje debe ser estable. Se cuida con reactivos redundantes y controles internos.',
  },
  {
    title: 'Estandarización',
    body: 'Todos los candidatos responden en las mismas condiciones: mismo orden, mismas instrucciones, sin distracciones. Esto permite comparar resultados de forma justa.',
  },
  {
    title: 'Baremos y normas',
    body: 'Un puntaje directo cobra sentido al compararse con un grupo de referencia. Los baremos convierten el puntaje en un percentil, para ubicar a la persona respecto a una población.',
  },
]

export default function Methodology() {
  return (
    <section className="methodology" id="metodologia" aria-labelledby="method-title">
      <div className="methodology__inner">
        <h2 className="methodology__title" id="method-title">Cómo se construyen las pruebas</h2>
        <div className="methodology__grid">
          {CONCEPTS.map(c => (
            <div key={c.title} className="method-card">
              <h3 className="method-card__title">{c.title}</h3>
              <p className="method-card__body">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
