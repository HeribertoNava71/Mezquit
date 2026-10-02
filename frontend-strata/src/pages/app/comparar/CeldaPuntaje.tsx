import { cx, VisuallyHidden } from '@/components/ui'
import {
  descripcionDeCelda,
  etiquetaDeCategoria,
  puntajeVisible,
  tonoDeCategoria,
  type PuntajeComparado,
} from './comparativa'
import './CeldaPuntaje.css'

export interface CeldaPuntajeProps {
  /** Puntaje del candidato en la escala; undefined si no tiene resultado en ella. */
  puntaje: PuntajeComparado | undefined
}

/**
 * Celda de la comparativa con el formato del reporte (D-14): «{normalized} · {categoría}»,
 * como «81 · Alto» (Strata.dc.html:938). Un punto con el color de la categoría la
 * acompaña (:947); la categoría siempre va en texto, así que el color nunca es lo
 * único que la distingue. Los lectores de pantalla oyen «81 de 100, categoría Alto».
 * Sin puntaje en la escala, «—» y «Sin resultado».
 */
export function CeldaPuntaje({ puntaje }: CeldaPuntajeProps) {
  if (!puntaje) {
    return (
      <span className="st-celda-puntaje st-celda-puntaje--vacia">
        <span aria-hidden="true">—</span>
        <VisuallyHidden>Sin resultado</VisuallyHidden>
      </span>
    )
  }

  const valor = puntajeVisible(puntaje)
  const categoria = etiquetaDeCategoria(puntaje.category)
  if (valor === null && !categoria) {
    return <span className="st-celda-puntaje st-celda-puntaje--vacia">Sin datos</span>
  }

  const tono = tonoDeCategoria(puntaje.category)
  return (
    <span className={cx('st-celda-puntaje', tono && `st-celda-puntaje--${tono}`)}>
      <span className="st-celda-puntaje__visible" aria-hidden="true">
        <span className="st-celda-puntaje__punto" />
        {valor !== null && <span className="st-celda-puntaje__valor">{valor}</span>}
        {valor !== null && categoria && <span className="st-celda-puntaje__sep"> · </span>}
        {categoria && <span className="st-celda-puntaje__categoria">{categoria}</span>}
      </span>
      <VisuallyHidden>{descripcionDeCelda(puntaje)}</VisuallyHidden>
    </span>
  )
}

export default CeldaPuntaje
