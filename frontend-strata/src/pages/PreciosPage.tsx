import PageHeader from '@/sections/PageHeader'
import Button from '@/components/ui/Button'
import { PLANS } from '@/data/plans'
import './PreciosPage.css'

export default function PreciosPage() {
  return (
    <>
      <PageHeader title="Precios" intro="Elige el modelo que se ajuste a tu volumen de evaluaciones." />
      <section className="precios">
        <div className="precios__inner">
          <div className="precios__grid">
            {PLANS.map(plan => (
              <div key={plan.id} className="plan">
                <h2 className="plan__name">{plan.name}</h2>
                <p className="plan__price">{plan.price}</p>
                <p className="plan__cadence">{plan.cadence}</p>
                <ul className="plan__includes">
                  {plan.includes.map((item, i) => (
                    <li key={i} className="plan__item"><span className="plan__dot" aria-hidden="true">›</span>{item}</li>
                  ))}
                </ul>
                <Button to="/demo">Agenda una demo</Button>
              </div>
            ))}
          </div>
          <div className="precios__enterprise">
            <h2 className="precios__enterprise-title">¿Más de 200 evaluaciones al mes?</h2>
            <p>Armamos un plan a tu medida.</p>
            <Button to="/demo" variant="ghost">Hablar con nosotros</Button>
          </div>
        </div>
      </section>
    </>
  )
}
