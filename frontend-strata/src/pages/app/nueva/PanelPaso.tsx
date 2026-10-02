import type { FormEvent, ReactNode } from 'react'
import { cx } from '@/components/ui'
import './PanelPaso.css'

export interface PanelPasoProps {
  /** id del título (h2). Recibe el foco al cambiar de paso (tabIndex -1). */
  tituloId: string
  titulo: ReactNode
  /** Texto bajo el título (12.5 px, terciario). */
  descripcion?: ReactNode
  /** Aviso al inicio del cuerpo (por ejemplo, el error del envío). */
  aviso?: ReactNode
  /** Nota del pie, a la izquierda de las acciones (Strata.dc.html:1368, :1412). */
  nota?: ReactNode
  /** Botones del pie, a la derecha. */
  acciones: ReactNode
  /**
   * Con onSubmit, el cuerpo y el pie van en un <form noValidate>: Enter en un
   * campo avanza y la validación es la del asistente, no la del navegador.
   */
  onSubmit?: () => void
  /** Hay una petición en curso (aria-busy). */
  ocupado?: boolean
  className?: string
  children: ReactNode
}

/**
 * Panel del asistente con el lenguaje de los modales de asignación
 * (Strata.dc.html:1376-1418): cabecera con título de 18 px y texto de apoyo,
 * cuerpo en columna y pie beige con nota y acciones. Es parte de la página,
 * no un diálogo (D-10, opción A).
 */
export function PanelPaso({
  tituloId,
  titulo,
  descripcion,
  aviso,
  nota,
  acciones,
  onSubmit,
  ocupado = false,
  className,
  children,
}: PanelPasoProps) {
  const descripcionId = `${tituloId}-descripcion`

  function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    onSubmit?.()
  }

  const contenido = (
    <>
      <div className="st-nueva-panel__cuerpo">
        {aviso}
        {children}
      </div>
      <div className="st-nueva-panel__pie">
        {nota && <p className="st-nueva-panel__nota">{nota}</p>}
        <div className="st-nueva-panel__acciones">{acciones}</div>
      </div>
    </>
  )

  return (
    <section
      className={cx('st-nueva-panel', className)}
      aria-labelledby={tituloId}
      aria-describedby={descripcion ? descripcionId : undefined}
      aria-busy={ocupado || undefined}
    >
      <header className="st-nueva-panel__cabecera">
        <h2 id={tituloId} className="st-nueva-panel__titulo" tabIndex={-1}>
          {titulo}
        </h2>
        {descripcion && (
          <p id={descripcionId} className="st-nueva-panel__descripcion">
            {descripcion}
          </p>
        )}
      </header>
      {onSubmit ? (
        <form className="st-nueva-panel__contenido" noValidate onSubmit={alEnviar}>
          {contenido}
        </form>
      ) : (
        <div className="st-nueva-panel__contenido">{contenido}</div>
      )}
    </section>
  )
}
