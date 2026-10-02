import { useId } from 'react'
import type { ReportScale } from '@/api/report'
import { cx, VisuallyHidden } from '@/components/ui'
import { etiquetaDeCategoria, puntajeDe } from './escalas'
import {
  ANILLOS_RADAR,
  RADIO_HALO,
  RADIO_RADAR,
  cajaDelRadar,
  etiquetaDelEje,
  puntoDelEje,
  puntosDelPoligono,
  radioDelValor,
} from './radar'
import './RadarEscalas.css'

export interface RadarEscalasProps {
  /** Nombre de la prueba: da nombre a la gráfica y a su tabla. */
  prueba: string
  /** Escalas con puntaje, en el orden del reporte. Quien lo usa garantiza 3 o más (D-14). */
  escalas: readonly ReportScale[]
  /** Índice (dentro de escalas) de la escala elegida en la lista: se marca con un halo. */
  seleccionada?: number
}

/**
 * Radar de una prueba (Strata.dc.html:894-913) con los puntajes reales de 0 a
 * 100 (normalized). Sin «rango esperado del puesto» ni comparación con una
 * población (P-16, PB-18): un solo polígono, el del candidato.
 *
 * Accesibilidad: el SVG es role="img" con nombre y descripción, y la tabla
 * alternativa (solo para lectores de pantalla) trae los mismos datos. Las
 * etiquetas largas se parten en dos líneas; el nombre completo está en la
 * lista de escalas y en la tabla.
 */
export function RadarEscalas({ prueba, escalas, seleccionada }: RadarEscalasProps) {
  const idDescripcion = useId()
  const total = escalas.length
  const etiquetas = escalas.map((escala, indice) => etiquetaDelEje(indice, total, escala.name))
  const caja = cajaDelRadar(etiquetas, total)
  const extremos = escalas.map((_, indice) => puntoDelEje(indice, total, RADIO_RADAR))
  const vertices = escalas.map((escala, indice) => puntoDelEje(indice, total, radioDelValor(escala.normalized)))
  const elegido = seleccionada == null ? undefined : vertices[seleccionada]

  return (
    <div className="st-radar">
      <svg
        className="st-radar__svg"
        viewBox={`${caja.x} ${caja.y} ${caja.ancho} ${caja.alto}`}
        // Ancho máximo = ancho del viewBox: a ese tamaño 1 unidad mide 1 px y las etiquetas, 11 px.
        style={{ maxWidth: `${caja.ancho}px` }}
        role="img"
        aria-label={`Perfil por escala de ${prueba}`}
        aria-describedby={idDescripcion}
      >
        <polygon className="st-radar__fondo" points={puntosDelPoligono(extremos.map(() => RADIO_RADAR))} />
        {ANILLOS_RADAR.slice(0, -1).map((fraccion) => (
          <polygon
            key={fraccion}
            className="st-radar__anillo"
            points={puntosDelPoligono(extremos.map(() => RADIO_RADAR * fraccion))}
          />
        ))}
        {extremos.map((punto, indice) => (
          <line key={indice} className="st-radar__eje" x1={0} y1={0} x2={punto.x} y2={punto.y} />
        ))}
        <polygon className="st-radar__datos" points={vertices.map((punto) => `${punto.x},${punto.y}`).join(' ')} />
        {elegido && <circle className="st-radar__halo" cx={elegido.x} cy={elegido.y} r={RADIO_HALO} />}
        {vertices.map((punto, indice) => (
          <circle key={indice} className="st-radar__vertice" cx={punto.x} cy={punto.y} r={4} />
        ))}
        {etiquetas.map((etiqueta, indice) => (
          <text
            key={indice}
            className={cx('st-radar__etiqueta', indice === seleccionada && 'st-radar__etiqueta--activa')}
            textAnchor={etiqueta.ancla}
          >
            {etiqueta.lineas.map((linea, renglon) => (
              <tspan key={renglon} x={etiqueta.x} y={etiqueta.ys[renglon]}>
                {linea}
              </tspan>
            ))}
          </text>
        ))}
      </svg>

      <VisuallyHidden as="p" id={idDescripcion}>
        Gráfica de radar de {total} escalas con puntajes de 0 a 100. La tabla siguiente tiene los mismos datos.
      </VisuallyHidden>
      <VisuallyHidden as="div">
        <table>
          <caption>Puntajes de {prueba}</caption>
          <thead>
            <tr>
              <th scope="col">Escala</th>
              <th scope="col">Puntaje de 0 a 100</th>
              <th scope="col">Categoría</th>
            </tr>
          </thead>
          <tbody>
            {escalas.map((escala, indice) => (
              <tr key={`${escala.code}-${indice}`}>
                <th scope="row">{escala.name}</th>
                <td>{puntajeDe(escala.normalized) ?? 'Sin datos'}</td>
                <td>{etiquetaDeCategoria(escala.category) ?? 'Sin categoría'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </VisuallyHidden>
    </div>
  )
}
