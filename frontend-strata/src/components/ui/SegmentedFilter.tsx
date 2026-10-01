import type { HTMLAttributes, ReactNode, Ref } from 'react'
import { cx } from './cx'
import { useControlled } from './useControlled'
import './SegmentedFilter.css'

export interface SegmentedFilterOption {
  value: string
  label: ReactNode
  /** Conteo opcional después del texto («Disponible 12»). */
  count?: number
  disabled?: boolean
}

/** md: filtros del catálogo, 12.5 px (Strata.dc.html:621-624). sm: filtros de tabla, 11.5 px (:713-716, :814-817). */
export type SegmentedFilterSize = 'sm' | 'md'

export interface SegmentedFilterProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /** Nombre del grupo para lectores de pantalla («Filtrar por estado»). */
  'aria-label': string
  options: ReadonlyArray<SegmentedFilterOption>
  /** Opción activa (controlado). */
  value?: string
  /** Opción activa inicial (no controlado). Por defecto, la primera. */
  defaultValue?: string
  /** Recibe el value de la opción elegida (solo si cambia). */
  onChange?: (value: string) => void
  /** Por defecto, md. */
  size?: SegmentedFilterSize
  ref?: Ref<HTMLDivElement>
}

/**
 * Filtro segmentado: chips sobre la pista #F1EDE4; el activo va en blanco con
 * sombra (Strata.dc.html:1757-1761). Cada chip es un botón con aria-pressed.
 */
export function SegmentedFilter({
  options,
  value,
  defaultValue,
  onChange,
  size = 'md',
  className,
  ref,
  ...rest
}: SegmentedFilterProps) {
  const [current, setCurrent] = useControlled(value, defaultValue ?? options[0]?.value ?? '', onChange)

  return (
    <div {...rest} ref={ref} role="group" className={cx('st-segmented', `st-segmented--${size}`, className)}>
      {options.map((option) => {
        const active = option.value === current
        return (
          <button
            key={option.value}
            type="button"
            className="st-segmented__option"
            aria-pressed={active}
            disabled={option.disabled}
            onClick={() => {
              if (!active) setCurrent(option.value)
            }}
          >
            <span
              className="st-segmented__label"
              data-label={typeof option.label === 'string' ? option.label : undefined}
            >
              {option.label}
            </span>
            {option.count !== undefined && (
              <>
                {/* Espacio real para el nombre accesible («Disponible 12»); el flex lo ignora al pintar. */}{' '}
                <span className="st-segmented__count">{option.count}</span>
              </>
            )}
          </button>
        )
      })}
    </div>
  )
}
