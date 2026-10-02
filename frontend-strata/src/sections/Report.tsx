import { useId, type ReactNode, type Ref } from 'react'
import type { ReportData } from '@/api/report'
import { Callout, Card, DotSeparator, EstadoVacio, Tag, VisuallyHidden, cx } from '@/components/ui'
import type { EstadoTitleAs } from '@/components/ui'
import { IconoInfo } from '@/components/ui/Iconos'
import { SeccionPrueba } from './report/SeccionPrueba'
import { IconoPreguntas } from './report/iconos'
import { nivelDeTitulo } from './report/titulos'
import './Report.css'

export interface ReportProps {
  /** Respuesta de GET /api/invitations/{id}/report, o los datos del ejemplo. */
  data: ReportData
  /**
   * Reporte de ejemplo: muestra el badge «Ejemplo» (R-14). Sin definir, usa
   * data.sample, como el reporte de ejemplo que ya existía.
   */
  sample?: boolean
  /** Nivel del título principal (el nombre del candidato): 1 en la página del reporte, 2 por defecto. */
  headingLevel?: 1 | 2 | 3 | 4
  /** Ref del título principal; con ella el título acepta el foco (tabIndex −1), por ejemplo tras «Reintentar». */
  headingRef?: Ref<HTMLHeadingElement>
  /** Acciones de la página en el banner («Descargar PDF», «Volver»). Envuélvelas en .no-print. */
  actions?: ReactNode
  className?: string
}

/** Pie legal fijo del reporte: es texto del componente, no del endpoint (2026-09-11-fase1-nucleo.md:3075-3078). */
const PIE_LEGAL =
  'Este reporte describe tendencias medidas por la prueba; no mide todas las dimensiones de una persona. Apoya la decisión de contratación, no la sustituye.'

/** Dato del banner con su rótulo para lectores de pantalla («Puesto: Ejecutivo de ventas»). */
function DatoBanner({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <span className="st-report-banner__dato">
      <VisuallyHidden>{rotulo} </VisuallyHidden>
      {children}
    </span>
  )
}

/**
 * Reporte individual del candidato: diagnóstico interactivo del prototipo
 * (Strata.dc.html:872-992) con los datos reales del reporte (D-14, C-07).
 * Es el mismo componente para el reporte real, el ejemplo público (sample) y la
 * impresión (@media print en este archivo y en src/sections/report/).
 *
 * - Banner tinta con candidato, evaluación, puesto, empresa y fecha (en lugar
 *   del código del prototipo) y las acciones de la página.
 * - Una sección por prueba de tests[] (título = test.name) con radar (solo con
 *   3 o más escalas), puntuaciones con interpretación e integridad.
 * - Al final, una sola vez: preguntas sugeridas para entrevista y pie legal.
 * - Sin índice global, rango esperado del puesto, comparación con una población,
 *   envío automático ni «Ver respuestas» (P-13, P-16, P-17; PB-18, PB-19, PB-30).
 */
export default function Report({ data, sample, headingLevel = 2, headingRef, actions, className }: ReportProps) {
  const idTitulo = useId()
  const idPreguntas = useId()
  const esEjemplo = sample ?? data.sample ?? false
  const Titulo = `h${headingLevel}` as const
  const nivelSeccion = nivelDeTitulo(headingLevel + 1)
  const TituloSeccion = `h${nivelSeccion}` as const
  const tituloDelVacio: EstadoTitleAs = nivelSeccion <= 4 ? (`h${nivelSeccion}` as EstadoTitleAs) : 'p'

  return (
    <article className={cx('st-report', esEjemplo && 'st-report--ejemplo', className)} aria-labelledby={idTitulo}>
      <Callout tone="dark" className="st-report-banner" actions={actions}>
        <div className="st-report-banner__kicker">
          <p className="st-report-banner__eyebrow">Examen finalizado · Reporte generado</p>
          {esEjemplo && (
            <Tag tone="coral" size="sm" bordered>
              Ejemplo
            </Tag>
          )}
        </div>
        <Titulo
          id={idTitulo}
          ref={headingRef}
          tabIndex={headingRef ? -1 : undefined}
          className="st-report-banner__titulo"
        >
          {data.candidate}
        </Titulo>
        <p className="st-report-banner__meta">
          <DatoBanner rotulo="Evaluación:">{data.assessment}</DatoBanner>
          <DotSeparator tone="on-dark" />
          <DatoBanner rotulo="Puesto:">{data.position ?? 'Sin puesto'}</DatoBanner>
          <DotSeparator tone="on-dark" />
          <DatoBanner rotulo="Empresa:">{data.organization}</DatoBanner>
          {data.completed_at && (
            <>
              <DotSeparator tone="on-dark" />
              <DatoBanner rotulo="Completada el">{data.completed_at}</DatoBanner>
            </>
          )}
        </p>
      </Callout>

      {data.tests.length > 0 ? (
        <div className="st-report__pruebas">
          {data.tests.map((test, indice) => (
            <SeccionPrueba key={indice} test={test} nivel={nivelSeccion} />
          ))}
        </div>
      ) : (
        <EstadoVacio
          titleAs={tituloDelVacio}
          title="Este reporte no tiene pruebas calificadas"
          description="La evaluación está completada, pero el reporte no trae puntajes de ninguna prueba."
        />
      )}

      {data.interview_questions.length > 0 && (
        <Card as="section" variant="white" className="st-report-preguntas" aria-labelledby={idPreguntas}>
          <div className="st-report-preguntas__cabeza">
            <IconoPreguntas className="st-report-preguntas__icono" />
            <TituloSeccion id={idPreguntas} className="st-report-preguntas__titulo">
              Preguntas sugeridas para entrevista
            </TituloSeccion>
          </div>
          <p className="st-report-preguntas__nota">Surgen de las escalas con puntajes en los extremos.</p>
          {/* role="list": Safari quita la semántica de lista con list-style: none. */}
          <ul className="st-report-preguntas__lista" role="list">
            {data.interview_questions.map((pregunta, indice) => (
              <li key={indice} className="st-report-preguntas__item">
                {pregunta}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <footer className="st-report__legal">
        <IconoInfo className="st-report__legal-icono" width={15} height={15} strokeWidth={1.6} />
        <p>{PIE_LEGAL}</p>
      </footer>
    </article>
  )
}
