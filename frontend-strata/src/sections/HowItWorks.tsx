import './HowItWorks.css'

const STEPS = [
  {
    title: 'Elige las pruebas',
    desc: 'Selecciona las pruebas adecuadas para el puesto desde el catálogo.',
  },
  {
    title: 'Envía el enlace al candidato',
    desc: 'El sistema genera un enlace único. Lo envías por correo o WhatsApp.',
  },
  {
    title: 'El candidato responde desde su celular',
    desc: 'Interfaz ligera, optimizada para móvil. Sin descargas ni registro previo.',
  },
  {
    title: 'Recibes el reporte',
    desc: 'Resultados con interpretación listos en minutos, en tu correo y en el panel.',
  },
] as const

export default function HowItWorks() {
  return (
    <section className="how-it-works" id="como-funciona" aria-labelledby="how-title">
      <div className="how-it-works__inner">
        <h2 className="how-it-works__title" id="how-title">Cómo funciona</h2>

        <ol className="steps" aria-label="Pasos del proceso">
          {STEPS.map((step, i) => (
            <li key={i} className="step">
              <span className="step__number" aria-hidden="true">{i + 1}</span>
              <div className="step__content">
                <h3 className="step__title">{step.title}</h3>
                <p className="step__desc">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
