import type { ButtonHTMLAttributes, Ref } from 'react'
import { cx } from './cx'
import './SelectableListRow.css'

export interface SelectableListRowProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  /** Fila elegida: fondo celeste suave (Strata.dc.html:1961) y marcador izquierdo de 3 px. */
  selected?: boolean
  ref?: Ref<HTMLButtonElement>
}

/**
 * Fila seleccionable de una lista (Strata.dc.html:935): toda la fila es un
 * botón con radio de 14 px que se pinta de celeste suave cuando está elegida.
 * Como ese fondo casi no se distingue del blanco, la elegida lleva también el
 * marcador de 3 px de las listas del builder (:455, :538), para que el estado
 * no dependa de un contraste de 1.02:1 (WCAG 1.4.11).
 * La semántica la pone la lista que la usa (por ejemplo, role="tab" con
 * aria-selected y tabIndex itinerante). Como es un <button>, su contenido debe
 * ser de frase: usa span con display block, no div.
 */
export function SelectableListRow({ selected = false, className, ref, ...rest }: SelectableListRowProps) {
  return (
    <button
      ref={ref}
      type="button"
      className={cx('st-select-row', selected && 'st-select-row--selected', className)}
      {...rest}
    />
  )
}
