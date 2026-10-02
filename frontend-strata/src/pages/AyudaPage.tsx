import { Link } from 'react-router-dom'
import { SITE } from '@/config/site'
import PageHeader from '@/sections/PageHeader'
import './AyudaPage.css'

const CANDIDATO = [
  { q: 'No me llegó el enlace de la evaluación', a: 'Revisa tu carpeta de spam. Si tienes el código, pégalo en la página de acceso a tu evaluación.' },
  { q: 'Se me cerró la prueba a la mitad', a: 'Vuelve a abrir el mismo enlace: tus respuestas se guardan y continúas donde ibas.' },
  { q: 'Me pide datos que no quiero dar', a: 'Solo pedimos lo mínimo para generar tu reporte. El consentimiento es explícito antes de empezar.' },
]

const EMPRESA = [
  { q: '¿Cómo invito candidatos?', a: 'Desde tu panel creas una evaluación, agregas los correos y el sistema genera un enlace por candidato.' },
  { q: '¿Cómo leo el reporte?', a: 'Cada reporte incluye la interpretación de cada escala y preguntas sugeridas para la entrevista.' },
  { q: '¿Cómo funciona la facturación?', a: 'Se factura por paquetes de créditos o suscripción. Escríbenos para los detalles.' },
]

export default function AyudaPage() {
  return (
    <>
      <PageHeader title="Ayuda" intro={`Encuentra respuestas según cómo usas ${SITE.name}.`} />
      <section className="ayuda">
        <div className="ayuda__inner">
          <div className="ayuda__group">
            <h2 className="ayuda__group-title">Soy candidato</h2>
            {CANDIDATO.map((item, i) => (
              <div key={i} className="ayuda__q">
                <p className="ayuda__q-title">{item.q}</p>
                <p className="ayuda__q-body">{item.a}</p>
              </div>
            ))}
            <Link to="/evaluar" className="ayuda__cta">¿Te invitaron a una evaluación? Accede aquí →</Link>
          </div>
          <div className="ayuda__group">
            <h2 className="ayuda__group-title">Soy empresa</h2>
            {EMPRESA.map((item, i) => (
              <div key={i} className="ayuda__q">
                <p className="ayuda__q-title">{item.q}</p>
                <p className="ayuda__q-body">{item.a}</p>
              </div>
            ))}
            <a href={`mailto:${SITE.email}`} className="ayuda__cta">Escríbenos: {SITE.email}</a>
          </div>
        </div>
      </section>
    </>
  )
}
