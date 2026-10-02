import { useId, type Ref } from 'react'
import { StatCard, VisuallyHidden, type StatCardTone } from '@/components/ui'
import { formatearCreditos, type Creditos } from './movimientos'
import './ResumenCreditos.css'

export interface ResumenCreditosProps {
  /** Datos de GET /api/credits. null mientras carga: las cifras quedan en esqueleto. */
  creditos: Creditos | null
  /** La página mueve aquí el foco cuando un «Reintentar» trae los datos. */
  ref?: Ref<HTMLElement>
}

interface Tarjeta {
  clave: string
  label: string
  help: string
  tone: StatCardTone
  valor: number | null
}

/**
 * Resumen del inventario adaptado a créditos (Strata.dc.html:697-706; D-08):
 * tres StatCards con el cuadro numérico de 38 px. Disponibles es el balance de
 * la API; recibidos y consumidos suman los movimientos positivos y negativos.
 * Mientras carga, los rótulos ya se ven y cada cifra es un esqueleto: la
 * rejilla no salta cuando llegan los datos.
 */
export function ResumenCreditos({ creditos, ref }: ResumenCreditosProps) {
  const tituloId = useId()
  const cargando = creditos === null
  const tarjetas: Tarjeta[] = [
    { clave: 'disponibles', label: 'Disponibles', help: 'para invitar candidatos', tone: 'navy', valor: creditos?.saldo ?? null },
    { clave: 'recibidos', label: 'Recibidos', help: 'compras, cortesías y ajustes', tone: 'sky', valor: creditos?.recibidos ?? null },
    { clave: 'consumidos', label: 'Consumidos', help: 'invitaciones y ajustes', tone: 'neutral', valor: creditos?.consumidos ?? null },
  ]

  return (
    <section
      ref={ref}
      tabIndex={-1}
      className="st-cr-resumen"
      aria-labelledby={tituloId}
      aria-busy={cargando || undefined}
    >
      <VisuallyHidden as="h2" id={tituloId}>
        Resumen de créditos
      </VisuallyHidden>
      {tarjetas.map((tarjeta, indice) => (
        <StatCard
          key={tarjeta.clave}
          layout="inline"
          tone={tarjeta.tone}
          label={tarjeta.label}
          help={tarjeta.help}
          staggerIndex={indice}
          loading={cargando}
          value={
            tarjeta.valor === null ? (
              <>
                <span aria-hidden="true">—</span>
                <VisuallyHidden>Sin dato</VisuallyHidden>
              </>
            ) : (
              formatearCreditos(tarjeta.valor)
            )
          }
        />
      ))}
    </section>
  )
}
