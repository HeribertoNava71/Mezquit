import { useId, type FormEvent, type ReactNode } from 'react'
import { Callout, Card, cx } from '@/components/ui'
import { TITULO_ERROR_AL_GUARDAR } from './errores'
import './TarjetaFormulario.css'

export interface TarjetaFormularioProps {
  /** Título de la tarjeta (h2): también es el nombre accesible del formulario. */
  titulo: string
  /** Texto de apoyo bajo el título. */
  descripcion?: ReactNode
  onSubmit: (evento: FormEvent<HTMLFormElement>) => void
  /** Campos del formulario. */
  children: ReactNode
  /** Botón de envío y acciones. */
  acciones: ReactNode
  /** Error al guardar que no va junto a un campo (red, servidor, 422 sin campos). Se anuncia. */
  error?: string | null
  /**
   * Confirmación en línea tras guardar (D-22: ícono y texto). El anuncio lo
   * hace el toast; este aviso se queda hasta que la persona vuelve a editar.
   */
  exito?: string | null
  /** Posición entre las tarjetas de la página: entrada escalonada de 55 ms (riseIn). */
  indice?: number
  className?: string
}

/**
 * Tarjeta de vidrio con un formulario: título, descripción, campos, aviso de
 * error, acciones y confirmación. Receta de «Datos generales» del builder
 * (Strata.dc.html:353-357): vidrio con padding de 24 px, título de 16 px y
 * apoyo de 12.5 px. La validación es propia (noValidate): los errores van
 * junto a cada campo con el Input del sistema.
 */
export function TarjetaFormulario({
  titulo,
  descripcion,
  onSubmit,
  children,
  acciones,
  error,
  exito,
  indice,
  className,
}: TarjetaFormularioProps) {
  const tituloId = useId()
  return (
    <Card as="section" variant="glass" staggerIndex={indice} className={cx('st-perfil-form', className)}>
      <form className="st-perfil-form__form" aria-labelledby={tituloId} noValidate onSubmit={onSubmit}>
        <header className="st-perfil-form__cabecera">
          <h2 id={tituloId} className="st-perfil-form__titulo">
            {titulo}
          </h2>
          {descripcion && <p className="st-perfil-form__descripcion">{descripcion}</p>}
        </header>

        {children}

        {error && (
          <Callout tone="error" live="alert" title={TITULO_ERROR_AL_GUARDAR}>
            {error}
          </Callout>
        )}

        <div className="st-perfil-form__acciones">{acciones}</div>

        {exito && <Callout tone="success">{exito}</Callout>}
      </form>
    </Card>
  )
}
