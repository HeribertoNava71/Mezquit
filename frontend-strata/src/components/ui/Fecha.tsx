import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from './cx'
import { formatearFecha } from './formatoFecha'
import { VisuallyHidden } from './VisuallyHidden'
import './Fecha.css'

export interface FechaProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** Fecha del backend: AAAA-MM-DD, «AAAA-MM-DD HH:mm» o ISO. */
  valor: string | null | undefined
  /**
   * Qué mostrar si no hay fecha («Sin fecha límite»). Por defecto, una raya
   * con «Sin fecha» para lectores de pantalla.
   */
  vacio?: ReactNode
  /** Agrega la hora si el valor la trae: «04 sep 2026, 10:15». */
  conHora?: boolean
}

/**
 * Fecha con el formato del prototipo («04 sep 2026», Strata.dc.html:848)
 * dentro de un <time> con su dateTime. Un valor que no es fecha se muestra tal
 * cual, sin <time>, para no perder el dato.
 */
export function Fecha({ valor, vacio, conHora = false, className, ...rest }: FechaProps) {
  const fecha = formatearFecha(valor)
  const clase = cx('st-fecha', className)

  if (!fecha) {
    return (
      <span className={clase} {...rest}>
        {vacio ?? (
          <>
            <span aria-hidden="true">—</span>
            <VisuallyHidden>Sin fecha</VisuallyHidden>
          </>
        )}
      </span>
    )
  }

  if (!fecha.iso) {
    return (
      <span className={clase} {...rest}>
        {fecha.texto}
      </span>
    )
  }

  return (
    <time className={clase} dateTime={fecha.iso} {...rest}>
      {conHora && fecha.hora ? `${fecha.texto}, ${fecha.hora}` : fecha.texto}
    </time>
  )
}
