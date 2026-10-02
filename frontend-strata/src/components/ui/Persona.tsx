import type { HTMLAttributes, ReactNode, Ref } from 'react'
import { Avatar } from './Avatar'
import { cx } from './cx'
import './Persona.css'

export interface PersonaProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Nombre visible. De aquí salen las iniciales del avatar. */
  name: string
  /** Segunda línea, por ejemplo el correo (11 px, terciario). */
  detail?: ReactNode
  ref?: Ref<HTMLDivElement>
}

/**
 * Persona en una tabla o una lista: avatar cuadrado celeste de 33 px, nombre
 * (13.5 px, 600) y una segunda línea, como la celda «Candidato» del prototipo
 * (Strata.dc.html:836-842). El avatar es decorativo: el nombre ya está al lado.
 */
export function Persona({ name, detail, className, ref, ...rest }: PersonaProps) {
  const conDetalle = detail != null && detail !== false && detail !== ''
  return (
    <div ref={ref} className={cx('st-persona', className)} {...rest}>
      <Avatar name={name} shape="square" tone="sky" size="md" />
      <div className="st-persona__texto">
        <span className="st-persona__nombre">{name}</span>
        {conDetalle && <span className="st-persona__detalle">{detail}</span>}
      </div>
    </div>
  )
}
