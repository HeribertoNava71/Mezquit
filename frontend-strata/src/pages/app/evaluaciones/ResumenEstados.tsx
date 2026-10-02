import { useId } from 'react'
import type { AssessmentSummary } from '@/api/rh'
import { INVITATION_STATUSES, StatCard, VisuallyHidden, type InvitationStatus } from '@/components/ui'
import { sumarConteos } from './conteos'
import './ResumenEstados.css'

export interface ResumenEstadosProps {
  /** Evaluaciones de GET /api/assessments. null mientras carga: las cifras van en esqueleto. */
  evaluaciones: readonly AssessmentSummary[] | null
}

/** Rótulo y ayuda breve de cada estado, en minúscula como «aplicadas este mes» (Strata.dc.html:804). */
const TEXTOS: Record<InvitationStatus, { rotulo: string; ayuda: string }> = {
  pendiente: { rotulo: 'Pendientes', ayuda: 'aún no empiezan su evaluación' },
  iniciada: { rotulo: 'Iniciadas', ayuda: 'empezaron y no han terminado' },
  completada: { rotulo: 'Completadas', ayuda: 'con reporte listo para revisar' },
  expirada: { rotulo: 'Expiradas', ayuda: 'pasó su fecha límite' },
}

function invitados(n: number): string {
  return `de ${n} ${n === 1 ? 'invitado' : 'invitados'}`
}

/**
 * Candidatos por estado sobre todas las evaluaciones: la fila de saldos del
 * panel de candidatos del prototipo (Strata.dc.html:790-807) adaptada al modelo
 * del repo (brechas.md P-12): no hay saldo por prueba, así que cada tarjeta es
 * uno de los cuatro estados, con su cifra, «de N invitados» y la barra de su
 * parte del total. Sale de los conteos de GET /api/assessments, sin otra
 * llamada; el saldo de créditos ya está en la barra superior.
 */
export function ResumenEstados({ evaluaciones }: ResumenEstadosProps) {
  const tituloId = useId()
  const cargando = evaluaciones === null
  const { conteo, total } = sumarConteos(evaluaciones ?? [])

  return (
    <section className="st-evaluaciones-estados" aria-labelledby={tituloId} aria-busy={cargando || undefined}>
      <VisuallyHidden as="h2" id={tituloId}>
        Candidatos por estado
      </VisuallyHidden>
      {INVITATION_STATUSES.map((estado, indice) => (
        <StatCard
          key={estado}
          label={TEXTOS[estado].rotulo}
          value={conteo[estado]}
          unit={invitados(total)}
          // La barra es decorativa: la cifra y «de N invitados» ya lo dicen en texto.
          progress={{ value: conteo[estado], max: total }}
          help={TEXTOS[estado].ayuda}
          loading={cargando}
          staggerIndex={indice}
          data-estado={estado}
        />
      ))}
    </section>
  )
}
