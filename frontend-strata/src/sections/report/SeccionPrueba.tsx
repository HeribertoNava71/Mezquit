import { useId, useState } from 'react'
import type { ReportTest } from '@/api/report'
import { Card, EstadoVacio } from '@/components/ui'
import { ListaEscalas } from './ListaEscalas'
import { RadarEscalas } from './RadarEscalas'
import { escalasConPuntaje, MINIMO_ESCALAS_RADAR } from './escalas'
import { IconoFoco } from './iconos'
import { nivelDeTitulo, type NivelTitulo } from './titulos'
import './SeccionPrueba.css'

export interface SeccionPruebaProps {
  /** Una prueba de tests[] (GET /api/invitations/{id}/report). */
  test: ReportTest
  /** Nivel del título de la prueba; los de sus tarjetas van un nivel abajo. */
  nivel: NivelTitulo
}

/**
 * Una sección por prueba del reporte (D-14, C-07): título = test.name, radar
 * (solo con 3 o más escalas con puntaje), puntuaciones con su interpretación e
 * integridad de respuesta (blur_count, que es por prueba) como dato neutro.
 * Rejilla del prototipo (Strata.dc.html:887-889): dos columnas de 320 px o más,
 * con 18 px entre tarjetas; con una sola columna, todo se apila.
 */
export function SeccionPrueba({ test, nivel }: SeccionPruebaProps) {
  const [seleccion, setSeleccion] = useState(0)
  const idTitulo = useId()
  const TituloPrueba = `h${nivel}` as const
  const TituloTarjeta = `h${nivelDeTitulo(nivel + 1)}` as const

  const conPuntaje = escalasConPuntaje(test.scales)
  const conRadar = conPuntaje.length >= MINIMO_ESCALAS_RADAR
  const hayEscalas = test.scales.length > 0
  // La lista y el radar marcan la misma escala aunque cambien los datos.
  const actual = Math.min(seleccion, Math.max(test.scales.length - 1, 0))
  const elegida = test.scales[actual]
  const enRadar = elegida ? conPuntaje.indexOf(elegida) : -1
  // Entrada escalonada de las tarjetas de la sección (55 ms entre una y otra).
  const orden = conRadar ? 1 : 0

  return (
    <section className="st-report-test" aria-labelledby={idTitulo}>
      <TituloPrueba id={idTitulo} className="st-report-test__titulo">
        {test.name}
      </TituloPrueba>

      <div className="st-report-test__grid">
        {conRadar && (
          <Card variant="white" className="st-report-card" staggerIndex={0}>
            <div className="st-report-card__cabeza">
              <TituloTarjeta className="st-report-card__titulo">Perfil por escala</TituloTarjeta>
              <p className="st-report-card__nota">Puntaje de 0 a 100; anillos cada 25</p>
            </div>
            <RadarEscalas prueba={test.name} escalas={conPuntaje} seleccionada={enRadar >= 0 ? enRadar : undefined} />
          </Card>
        )}

        <div className="st-report-test__columna">
          <Card variant="white" className="st-report-card" staggerIndex={orden}>
            <div className="st-report-card__cabeza st-report-card__cabeza--apilada">
              <TituloTarjeta className="st-report-card__titulo">Puntuaciones</TituloTarjeta>
              {hayEscalas && (
                <p className="st-report-card__nota st-report-card__nota--interactiva">
                  Toca una escala para ver su interpretación
                </p>
              )}
            </div>
            {hayEscalas ? (
              <ListaEscalas prueba={test.name} escalas={test.scales} seleccion={actual} onSeleccion={setSeleccion} />
            ) : (
              <EstadoVacio
                size="sm"
                className="st-report-card__vacio"
                title="Esta prueba no tiene escalas calificadas"
                description="El reporte no trae puntajes para esta prueba."
              />
            )}
          </Card>

          <Card variant="white" className="st-report-card st-report-integridad" staggerIndex={orden + 1}>
            <div className="st-report-integridad__cabeza">
              <IconoFoco className="st-report-integridad__icono" />
              <TituloTarjeta className="st-report-card__titulo st-report-integridad__titulo">
                Integridad de respuesta
              </TituloTarjeta>
            </div>
            <p className="st-report-integridad__dato">
              <span className="st-report-integridad__cifra">{test.integrity.blur_count}</span> vez(ces) que la
              pantalla perdió el foco
            </p>
            <p className="st-report-integridad__nota">
              Cuenta las veces que la prueba dejó de estar a la vista, por ejemplo al cambiar de pestaña o de
              aplicación.
            </p>
          </Card>
        </div>
      </div>
    </section>
  )
}
