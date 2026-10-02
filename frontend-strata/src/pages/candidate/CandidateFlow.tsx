import { useParams } from 'react-router-dom'
import { PageLayout } from '@/components/layout/PageLayout'
import { EstadoCarga } from '@/components/ui'
import { AccesoVerificado } from './AccesoVerificado'
import { BloqueoCandidato } from './BloqueoCandidato'
import { CandidateFrame } from './CandidateFrame'
import { ExamenFoco } from './ExamenFoco'
import { FinEvaluacion } from './FinEvaluacion'
import { useCandidateFlow } from './useCandidateFlow'

/**
 * /evaluar/:token: portal del candidato (mapa.md, CA-1 a CA-6). La URL y los
 * contratos de src/api/candidate.ts no cambian. Un token nuevo vuelve a montar
 * el flujo desde cero.
 */
export default function CandidateFlow() {
  const { token = '' } = useParams()
  return <FlujoCandidato key={token} token={token} />
}

/**
 * Cada etapa de useCandidateFlow con su pantalla:
 * - carga, error, bloqueo y acceso, dentro del marco del acceso (CandidateFrame);
 * - examen y fin, con su propio layout sobre los halos (PageLayout candidate).
 * La key por etapa vuelve a montar la pantalla: entra con screenIn, sube al
 * inicio y el foco pasa a su título.
 */
function FlujoCandidato({ token }: { token: string }) {
  const flujo = useCandidateFlow(token)
  const { etapa, portal } = flujo

  switch (etapa) {
    case 'carga':
      return (
        <CandidateFrame key="carga">
          <div className="st-cand-frame__estado">
            <EstadoCarga label="Verificando tu invitación…" />
          </div>
        </CandidateFrame>
      )

    case 'error':
      return (
        <CandidateFrame key="error">
          <BloqueoCandidato
            tipo={flujo.errorCarga === 'red' ? 'error-red' : 'error-servidor'}
            onReintentar={flujo.reintentarCarga}
          />
        </CandidateFrame>
      )

    case 'bloqueo':
      return (
        <CandidateFrame key="bloqueo" organization={portal?.organization}>
          <BloqueoCandidato tipo={flujo.motivoBloqueo ?? 'no-disponible'} organization={portal?.organization} />
        </CandidateFrame>
      )

    case 'acceso':
      if (!portal) return null
      return (
        <CandidateFrame key="acceso" organization={portal.organization}>
          <AccesoVerificado
            portal={portal}
            aceptaAviso={flujo.aceptaAviso}
            onAceptaAvisoChange={flujo.marcarAviso}
            puedeIniciar={flujo.puedeIniciar}
            iniciando={flujo.iniciando}
            error={flujo.errorInicio}
            onIniciar={flujo.iniciar}
          />
        </CandidateFrame>
      )

    case 'examen':
      if (!portal || !flujo.examen) return null
      return (
        <PageLayout key="examen" variant="candidate">
          <ExamenFoco
            examen={flujo.examen}
            organization={portal.organization}
            guardado={flujo.guardado}
            cerrando={flujo.cerrando}
            errorCierre={flujo.errorCierre}
            onResponder={flujo.responder}
            onSiguiente={flujo.siguiente}
            onAnterior={flujo.anterior}
            onReintentarPrueba={flujo.reintentarPrueba}
            onReintentarGuardado={flujo.reintentarGuardado}
            onReintentarCierre={flujo.reintentarCierre}
          />
        </PageLayout>
      )

    case 'fin':
      if (!flujo.resumen) return null
      return (
        <PageLayout key="fin" variant="candidate">
          <FinEvaluacion resumen={flujo.resumen} />
        </PageLayout>
      )
  }
}
