import { useId } from 'react'
import { Button, Card, PageHeader, VisuallyHidden } from '@/components/ui'
import { PLANS, type Plan } from '@/data/plans'
import { IconoFlechaDerecha, IconoIncluye } from './publicas/iconos'
import { Pendiente } from './publicas/Pendiente'
import { esPendiente } from './publicas/marcadores'
import './PreciosPage.css'

function TarjetaPlan({ plan, indice }: { plan: Plan; indice: number }) {
  const incluyeId = useId()
  return (
    <Card as="li" variant="glass" padding="lg" hover="lift" staggerIndex={indice} className="st-plan">
      <h2 className="st-plan__nombre">{plan.name}</h2>
      <p className="st-plan__precio">
        <VisuallyHidden>Precio: </VisuallyHidden>
        {esPendiente(plan.price) ? (
          <Pendiente size="xl">{plan.price}</Pendiente>
        ) : (
          <span className="st-plan__monto">{plan.price}</span>
        )}
      </p>
      <p className="st-plan__cadencia">{plan.cadence}</p>
      <h3 id={incluyeId} className="st-plan__incluye-titulo">
        Incluye
      </h3>
      <ul className="st-plan__incluye" aria-labelledby={incluyeId}>
        {plan.includes.map((inclusion, i) => (
          <li key={`${i}-${inclusion}`} className="st-plan__inclusion">
            <IconoIncluye className="st-plan__check" />
            {inclusion}
          </li>
        ))}
      </ul>
      {/* Como antes, a /demo: ahí están el formulario de leads y la agenda (R-38). */}
      <Button to="/demo" fullWidth className="st-plan__cta">
        Agenda una demo
      </Button>
    </Card>
  )
}

/**
 * /precios (mapa.md, sección 2): los planes de data/plans.ts en dos tarjetas
 * de vidrio, con el precio «[PENDIENTE]» a la vista (R-35), su cadencia e
 * inclusiones, y la fila «¿Más de 200 evaluaciones al mes?» → /demo. No hay
 * compra en línea (PB-09): cada plan lleva a agendar una demo.
 */
export default function PreciosPage() {
  const volumenId = useId()

  return (
    <div className="st-precios">
      <PageHeader
        eyebrow="Planes para empresas"
        title="Precios"
        lede="Elige el modelo que se ajuste a tu volumen de evaluaciones."
      />
      <ul className="st-precios__planes">
        {PLANS.map((plan, i) => (
          <TarjetaPlan key={plan.id} plan={plan} indice={i} />
        ))}
      </ul>
      <Card as="section" variant="secondary" className="st-precios__volumen" aria-labelledby={volumenId}>
        <div className="st-precios__volumen-texto">
          <h2 id={volumenId} className="st-precios__volumen-titulo">
            ¿Más de 200 evaluaciones al mes?
          </h2>
          <p className="st-precios__volumen-detalle">Armamos un plan a tu medida.</p>
        </div>
        <Button variant="secondary" to="/demo" iconRight={<IconoFlechaDerecha />}>
          Hablar con nosotros
        </Button>
      </Card>
    </div>
  )
}
