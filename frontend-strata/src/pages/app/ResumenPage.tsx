import { useRef } from 'react'
import { Button, EstadoError, PageHeader, useFocoAlRecuperar } from '@/components/ui'
import { IconoAgregar } from '@/components/ui/Iconos'
import { EstadisticasResultados } from './resultados/EstadisticasResultados'
import { UltimasCompletadas } from './resultados/UltimasCompletadas'
import { useResultados } from './resultados/useResultados'
import './ResumenPage.css'

/**
 * «Resultados» en /app (R-15, D-06; mapa.md, sección 2). Antes «Resumen».
 * - PageHeader con el CTA «Invitar candidatos» → asistente (D-10).
 * - StatCards: créditos disponibles (GET /api/credits), evaluaciones activas y
 *   candidatos completados (GET /api/assessments), con «Ver créditos» y «Ver
 *   evaluaciones» del Resumen anterior.
 * - «Últimas completadas»: detalle de hasta 5 evaluaciones con completadas
 *   (agregación limitada de PB-05) y «Ver reporte» de cada candidato.
 * Si falla GET /api/credits o GET /api/assessments, EstadoError con
 * «Reintentar» en lugar de las cifras (antes se ignoraba).
 */
export default function ResumenPage() {
  const { resumen, completadas, reintentar, reintentarCompletadas } = useResultados()
  const listo = resumen.fase === 'listo' ? resumen : null

  // Tras un «Reintentar» que trae los datos, el botón desaparece y el foco
  // caería en <body>: se lleva a las cifras.
  const cifrasRef = useRef<HTMLUListElement>(null)
  useFocoAlRecuperar(resumen.fase === 'error', resumen.fase === 'listo', cifrasRef)

  return (
    <div className="st-resultados">
      <PageHeader
        eyebrow="Panel de RR. HH."
        title="Resultados"
        lede="Consulta tu saldo, el avance de tus evaluaciones y el reporte de cada candidato que ya terminó."
        actions={
          <Button to="/app/evaluaciones/nueva" iconLeft={<IconoAgregar />}>
            Invitar candidatos
          </Button>
        }
      />

      {resumen.fase === 'error' ? (
        <EstadoError
          kind={resumen.tipo}
          titleAs="h2"
          title={resumen.tipo === 'sesion' || resumen.tipo === 'permiso' ? undefined : 'No pudimos cargar tus resultados'}
          onRetry={reintentar}
          retrying={resumen.reintentando}
        />
      ) : (
        <>
          <EstadisticasResultados ref={cifrasRef} estado={resumen} />
          <UltimasCompletadas
            estado={completadas}
            totalEvaluaciones={listo ? listo.totalEvaluaciones : null}
            totalCompletados={listo ? listo.candidatosCompletados : null}
            onReintentar={reintentarCompletadas}
          />
        </>
      )}
    </div>
  )
}
