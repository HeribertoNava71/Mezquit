import type { HTMLAttributes, Ref } from 'react'
import { cx } from './cx'
import { Spinner } from './Spinner'
import { VisuallyHidden } from './VisuallyHidden'
import './EstadoCarga.css'

/** inline: spinner y texto. bloque: esqueleto que ocupa el lugar del contenido. */
export type EstadoCargaVariant = 'inline' | 'bloque'

/** Forma del esqueleto en la variante bloque. */
export type EstadoCargaSkeleton = 'lineas' | 'tarjetas'

export interface EstadoCargaProps extends HTMLAttributes<HTMLDivElement> {
  /** Variante. Por defecto, inline. */
  variant?: EstadoCargaVariant
  /** Texto que se anuncia. Visible en inline; solo para lectores de pantalla en bloque. Por defecto, «Cargando…». */
  label?: string
  /** Esqueleto de la variante bloque: líneas de texto o tarjetas. Por defecto, lineas. */
  skeleton?: EstadoCargaSkeleton
  /** Cuántas líneas o tarjetas dibuja el esqueleto (1 a 12). Por defecto, 3. */
  count?: number
  ref?: Ref<HTMLDivElement>
}

/**
 * Estado de carga con role="status". El prototipo no diseña la carga
 * (auditoria.md §2): spinner celeste en línea o esqueleto con pulso suave.
 * Con movimiento reducido, el spinner y el pulso quedan quietos.
 *
 * @example
 * {cargando && <EstadoCarga />}
 * {cargando && <EstadoCarga variant="bloque" skeleton="tarjetas" count={3} label="Cargando pruebas…" />}
 */
export function EstadoCarga({
  variant = 'inline',
  label = 'Cargando…',
  skeleton = 'lineas',
  count = 3,
  className,
  ...rest
}: EstadoCargaProps) {
  if (variant === 'inline') {
    return (
      <div {...rest} role="status" className={cx('st-carga', 'st-carga--inline', className)}>
        <Spinner size="sm" className="st-carga__spinner" />
        <span className="st-carga__label">{label}</span>
      </div>
    )
  }

  const total = Math.min(12, Math.max(1, Math.round(count)))
  const piezas = Array.from({ length: total }, (_, i) => i)

  return (
    <div {...rest} role="status" className={cx('st-carga', 'st-carga--bloque', className)}>
      <VisuallyHidden>{label}</VisuallyHidden>
      {skeleton === 'lineas' ? (
        <div className="st-carga__lineas" aria-hidden="true">
          {piezas.map((i) => (
            <span key={i} className="st-carga__linea" />
          ))}
        </div>
      ) : (
        <div className="st-carga__tarjetas" aria-hidden="true">
          {piezas.map((i) => (
            <div key={i} className="st-carga__tarjeta">
              <span className="st-carga__linea st-carga__linea--titulo" />
              <span className="st-carga__linea" />
              <span className="st-carga__linea st-carga__linea--corta" />
              <span className="st-carga__linea st-carga__linea--pastilla" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
