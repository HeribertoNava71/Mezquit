import { Link } from 'react-router-dom'
import { cx } from '@/components/ui'
import './PendingIndicator.css'

const numero = new Intl.NumberFormat('es-MX')

/** Texto completo y corto (teléfonos chicos) del contador. */
function textosPendientes(pendientes: number): { largo: string; corto: string } {
  if (pendientes === 0) return { largo: 'Sin solicitudes pendientes', corto: 'Sin pendientes' }
  const cifra = numero.format(pendientes)
  return pendientes === 1
    ? { largo: `${cifra} solicitud pendiente`, corto: `${cifra} pendiente` }
    : { largo: `${cifra} solicitudes pendientes`, corto: `${cifra} pendientes` }
}

export interface PendingIndicatorProps {
  /**
   * Solicitudes de créditos por resolver (longitud de GET /api/admin/credit-requests).
   * null mientras carga o si falló: no se muestra.
   */
  pendientes: number | null
  /** Destino. Por defecto, /admin/creditos. */
  to?: string
  className?: string
}

/**
 * Contador de la barra de super admin: «N solicitudes pendientes», que lleva a
 * Solicitudes. Ocupa el lugar de «14 tests publicados» (Strata.dc.html:81),
 * con su estilo: 13 px, 500 y texto secundario. En teléfonos chicos se acorta
 * a «N pendientes» y el texto completo queda para los lectores de pantalla.
 */
export function PendingIndicator({ pendientes, to = '/admin/creditos', className }: PendingIndicatorProps) {
  if (pendientes === null) return null
  const { largo, corto } = textosPendientes(pendientes)
  return (
    <Link to={to} className={cx('st-pending', className)}>
      <span className="st-pending__full">{largo}</span>
      <span className="st-pending__short" aria-hidden="true">
        {corto}
      </span>
    </Link>
  )
}

export default PendingIndicator
