import { useId, useRef, type KeyboardEvent } from 'react'
import type { ReportScale } from '@/api/report'
import { Callout, SelectableListRow, cx } from '@/components/ui'
import {
  anchoDeBarra,
  descripcionEscala,
  etiquetaDeCategoria,
  puntajeDe,
  textoPuntaje,
  tonoDeCategoria,
} from './escalas'
import './ListaEscalas.css'

export interface ListaEscalasProps {
  /** Nombre de la prueba: da nombre a la lista («Escalas de …»). */
  prueba: string
  escalas: readonly ReportScale[]
  /** Índice de la escala elegida. */
  seleccion: number
  onSeleccion: (indice: number) => void
}

/**
 * Puntuaciones de una prueba (Strata.dc.html:934-953): una fila seleccionable
 * por escala con «{puntaje} · {categoría}» y su barra, y debajo el panel con la
 * interpretación de la escala elegida.
 *
 * Accesibilidad: pestañas verticales (patrón tabs de la APG). Las flechas, Inicio
 * y Fin mueven la selección; Tab pasa al panel. El color de la barra y del
 * puntaje sigue la categoría del backend y siempre va con su texto.
 * Impresión: se ocultan la selección y el panel, y cada fila muestra su
 * interpretación (Report.css y ListaEscalas.css).
 */
export function ListaEscalas({ prueba, escalas, seleccion, onSeleccion }: ListaEscalasProps) {
  const base = useId()
  const filas = useRef<(HTMLButtonElement | null)[]>([])
  const total = escalas.length
  const actual = Math.min(Math.max(seleccion, 0), total - 1)
  const escala = escalas[actual]
  const idPanel = `${base}panel`
  const idFila = (indice: number) => `${base}fila-${indice}`

  /** Elige la escala (con vuelta al inicio o al final) y le pasa el foco. */
  function elegir(indice: number) {
    const destino = (indice + total) % total
    onSeleccion(destino)
    filas.current[destino]?.focus()
  }

  function alTeclear(evento: KeyboardEvent<HTMLButtonElement>, indice: number) {
    switch (evento.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        elegir(indice + 1)
        break
      case 'ArrowUp':
      case 'ArrowLeft':
        elegir(indice - 1)
        break
      case 'Home':
        elegir(0)
        break
      case 'End':
        elegir(total - 1)
        break
      default:
        return
    }
    evento.preventDefault()
  }

  if (!escala) return null

  const categoria = etiquetaDeCategoria(escala.category)
  const puntaje = puntajeDe(escala.normalized)

  return (
    <>
      <div role="tablist" aria-label={`Escalas de ${prueba}`} aria-orientation="vertical" className="st-escalas">
        {escalas.map((item, indice) => {
          const elegida = indice === actual
          return (
            <SelectableListRow
              key={`${item.code}-${indice}`}
              ref={(nodo) => {
                filas.current[indice] = nodo
              }}
              role="tab"
              id={idFila(indice)}
              aria-selected={elegida}
              aria-controls={idPanel}
              aria-label={descripcionEscala(item)}
              tabIndex={elegida ? 0 : -1}
              selected={elegida}
              className={cx('st-escala', `st-escala--${tonoDeCategoria(item.category)}`)}
              onClick={() => onSeleccion(indice)}
              onKeyDown={(evento) => alTeclear(evento, indice)}
            >
              <span className="st-escala__cabeza">
                <span className="st-escala__nombre">{item.name}</span>
                <span className="st-escala__puntaje">{textoPuntaje(item)}</span>
              </span>
              <span className="st-escala__barra" aria-hidden="true">
                <span className="st-escala__relleno" style={{ width: `${anchoDeBarra(item.normalized)}%` }} />
              </span>
              {/* Solo en papel: la interpretación de cada escala va en su fila. */}
              <span className="st-escala__impresa">{item.interpretation}</span>
            </SelectableListRow>
          )
        })}
      </div>

      <Callout
        tone="neutral"
        icon={null}
        role="tabpanel"
        id={idPanel}
        aria-labelledby={idFila(actual)}
        tabIndex={0}
        className={cx('st-escala-panel', `st-escala--${tonoDeCategoria(escala.category)}`)}
        title={
          <span className="st-escala-panel__cabeza">
            <span className="st-escala-panel__punto" aria-hidden="true" />
            <span className="st-escala-panel__nombre">{categoria ? `${escala.name} · ${categoria}` : escala.name}</span>
            {puntaje != null && <span className="st-escala-panel__puntaje">{puntaje}/100</span>}
          </span>
        }
      >
        <p>{escala.interpretation}</p>
      </Callout>
    </>
  )
}
