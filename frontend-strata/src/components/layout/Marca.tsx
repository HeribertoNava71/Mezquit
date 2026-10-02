import { Link } from 'react-router-dom'
import { cx } from '@/components/ui'
import { SITE } from '@/config/site'
import './Marca.css'

/** md: barras superiores. sm: pie de página. */
export type MarcaSize = 'md' | 'sm'

export interface MarcaProps {
  /**
   * - md: salamandra de 30 px y nombre en Satoshi de 17 px (Strata.dc.html:55-57).
   * - sm: salamandra de 20 px y nombre en versales de 12.5 px (:1231-1234).
   * Por defecto, md.
   */
  size?: MarcaSize
  /** Ruta a la que lleva (por ejemplo «/» en las barras). Sin ella, la marca no es enlace. */
  to?: string
  /** Nombre accesible del enlace. Por defecto, «{SITE.name}, inicio» cuando to es «/». */
  label?: string
  /** Solo la salamandra; el nombre queda como texto alternativo de la imagen. */
  hideName?: boolean
  className?: string
}

const LADO: Record<MarcaSize, number> = { md: 30, sm: 20 }

/**
 * Marca de Strata: salamandra y nombre. El nombre sale de SITE.name (D-03).
 * En el pie el nombre se ve en mayúsculas («STRATA») por CSS, así que los
 * lectores de pantalla lo leen como palabra y no letra por letra.
 */
export function Marca({ size = 'md', to, label, hideName = false, className }: MarcaProps) {
  const lado = LADO[size]
  const contenido = (
    <>
      <img
        className="st-marca__logo"
        src={SITE.brand.salamandra}
        alt={hideName ? SITE.name : ''}
        width={lado}
        height={lado}
      />
      {!hideName && <span className="st-marca__name">{SITE.name}</span>}
    </>
  )
  const clases = cx('st-marca', `st-marca--${size}`, className)

  if (to) {
    const nombre = label ?? (to === '/' ? `${SITE.name}, inicio` : undefined)
    return (
      <Link to={to} className={cx(clases, 'st-marca--link')} aria-label={nombre}>
        {contenido}
      </Link>
    )
  }
  return <span className={clases}>{contenido}</span>
}

export default Marca
