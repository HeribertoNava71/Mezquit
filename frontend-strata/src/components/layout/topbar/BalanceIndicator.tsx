import { Link } from 'react-router-dom'
import { LiveDot, VisuallyHidden, cx } from '@/components/ui'
import './BalanceIndicator.css'

const numero = new Intl.NumberFormat('es-MX')

export interface BalanceIndicatorProps {
  /** Saldo de GET /api/credits. null mientras carga o si falló: se muestra sin cifra. */
  saldo: number | null
  /** Destino. Por defecto, /app/creditos. */
  to?: string
  className?: string
}

/**
 * Saldo de la barra de RR. HH.: punto celeste y «{saldo} créditos», que lleva a
 * Créditos (Strata.dc.html:67; «licencias» pasa a «créditos», D-08). Sin cifra
 * (carga o error) dice solo «Créditos». Se ve también en móvil.
 */
export function BalanceIndicator({ saldo, to = '/app/creditos', className }: BalanceIndicatorProps) {
  const uno = saldo === 1
  return (
    <Link to={to} className={cx('st-balance', className)}>
      <LiveDot tone="sky" size={7} pulse="none" />
      {saldo === null ? (
        <span>Créditos</span>
      ) : (
        <span>
          {numero.format(saldo)} {uno ? 'crédito' : 'créditos'}{' '}
          <VisuallyHidden>{uno ? 'disponible' : 'disponibles'}</VisuallyHidden>
        </span>
      )}
    </Link>
  )
}

export default BalanceIndicator
