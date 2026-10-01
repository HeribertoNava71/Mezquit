// Piezas de la galería de desarrollo (showcase.html). No entran al build de producción.
import type { ReactNode, SVGProps } from 'react'
import { cx } from '@/components/ui'

interface SeccionProps {
  id: string
  titulo: string
  /** Qué partes del prototipo reproduce la sección (Strata.dc.html:…). */
  nota?: ReactNode
  children: ReactNode
}

/** Sección de la galería: título, nota con las referencias del prototipo y su rejilla de muestras. */
export function Seccion({ id, titulo, nota, children }: SeccionProps) {
  return (
    <section id={id} className="st-showcase__seccion" aria-labelledby={`${id}-titulo`}>
      <header className="st-showcase__seccion-cabecera">
        <h2 id={`${id}-titulo`} className="st-showcase__seccion-titulo">
          {titulo}
        </h2>
        {nota && <p className="st-showcase__seccion-nota">{nota}</p>}
      </header>
      <div className="st-showcase__rejilla">{children}</div>
    </section>
  )
}

interface MuestraProps {
  titulo: string
  /** completa: ocupa toda la fila de la rejilla. */
  ancho?: 'normal' | 'completo'
  /**
   * Fondo de la muestra: vidrio (por defecto, como las tarjetas donde viven los
   * controles en el prototipo), ninguno (directo sobre la página y los halos) o tinta.
   */
  fondo?: 'vidrio' | 'ninguno' | 'oscuro'
  children: ReactNode
}

/** Una muestra con su rótulo. */
export function Muestra({ titulo, ancho = 'normal', fondo = 'vidrio', children }: MuestraProps) {
  return (
    <figure
      className={cx(
        'st-showcase__muestra',
        `st-showcase__muestra--${fondo}`,
        ancho === 'completo' && 'st-showcase__muestra--completa',
        fondo === 'oscuro' && 'st-on-dark',
      )}
    >
      <figcaption className="st-showcase__rotulo">{titulo}</figcaption>
      <div className="st-showcase__lienzo">{children}</div>
    </figure>
  )
}

/** Fila que se ajusta. */
export function Fila({ children, alinear = 'centro' }: { children: ReactNode; alinear?: 'centro' | 'base' | 'arriba' }) {
  return <div className={cx('st-showcase__fila', `st-showcase__fila--${alinear}`)}>{children}</div>
}

/** Columna con separación uniforme. */
export function Pila({ children, separacion = 'md' }: { children: ReactNode; separacion?: 'sm' | 'md' | 'lg' }) {
  return <div className={cx('st-showcase__pila', `st-showcase__pila--${separacion}`)}>{children}</div>
}

/* ── Íconos de muestra (trazos del prototipo, en currentColor) ───────────── */

type Icono = SVGProps<SVGSVGElement>

function Svg({ children, ...props }: Icono) {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" focusable="false" {...props}>
      {children}
    </svg>
  )
}

/** Carrito (Strata.dc.html:614). */
export function IconoCarrito(props: Icono) {
  return (
    <Svg {...props}>
      <path d="M2 2.6h2.2l2 8.6h7.4l1.8-6H5.2" />
      <circle cx="7" cy="15" r="1.2" />
      <circle cx="13" cy="15" r="1.2" />
    </Svg>
  )
}

/** Enlace (Strata.dc.html:691). */
export function IconoEnlace(props: Icono) {
  return (
    <Svg strokeWidth="1.7" {...props}>
      <path d="M11.4 6.6a2.6 2.6 0 1 1 3.7 3.7l-1.5 1.5" />
      <path d="M6.6 11.4a2.6 2.6 0 1 0 3.7 3.7" />
      <path d="M7.2 10.8 10.8 7.2" />
    </Svg>
  )
}

/** Más (Strata.dc.html:784). */
export function IconoAgregar(props: Icono) {
  return (
    <Svg strokeWidth="1.8" {...props}>
      <path d="M9 3.4v11.2M3.4 9h11.2" />
    </Svg>
  )
}

/** Flecha de los CTA (Strata.dc.html:1079). */
export function IconoFlecha(props: Icono) {
  return (
    <Svg width="15" height="15" strokeWidth="1.9" {...props}>
      <path d="M3.4 9h11.2M10.4 4.8 14.6 9l-4.2 4.2" />
    </Svg>
  )
}

/** Descarga (Strata.dc.html:983). */
export function IconoDescarga(props: Icono) {
  return (
    <Svg width="17" height="17" strokeWidth="1.9" {...props}>
      <path d="M9 2.6v9M5.4 8.4 9 12l3.6-3.6M3 14.8h12" />
    </Svg>
  )
}

/** Persona del input del candidato (Strata.dc.html:1043). */
export function IconoPersona(props: Icono) {
  return (
    <Svg {...props}>
      <circle cx="9" cy="6.4" r="2.9" />
      <path d="M3.4 15.2c0-2.7 2.5-4.4 5.6-4.4s5.6 1.7 5.6 4.4" />
    </Svg>
  )
}

/** Sobre del input del candidato (Strata.dc.html:1058). */
export function IconoSobre(props: Icono) {
  return (
    <Svg {...props}>
      <rect x="2.4" y="4" width="13.2" height="10" rx="2.2" />
      <path d="m3.4 5.4 5.6 4.2 5.6-4.2" />
    </Svg>
  )
}

/** Candado del pie de tabla y del drawer (Strata.dc.html:765, 1315). */
export function IconoCandadoMuestra(props: Icono) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" focusable="false" {...props}>
      <rect x="2.6" y="6" width="8.8" height="6.2" rx="1.4" />
      <path d="M4.6 6V4.4a2.4 2.4 0 0 1 4.8 0V6" />
    </svg>
  )
}

/** Copiar (Strata.dc.html:739). */
export function IconoCopiarMuestra(props: Icono) {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" focusable="false" {...props}>
      <rect x="4.6" y="4.6" width="7.4" height="7.4" rx="1.4" />
      <path d="M9.4 2.4H3.2a1.2 1.2 0 0 0-1.2 1.2v6.2" />
    </svg>
  )
}

/** Cerrar (Strata.dc.html:1258). */
export function IconoCerrarMuestra(props: Icono) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" focusable="false" {...props}>
      <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" />
    </svg>
  )
}

/** Palomita de la insignia coral (Strata.dc.html:267). */
export function IconoPalomitaMuestra(props: Icono) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true" focusable="false" {...props}>
      <path d="M3.2 8.4 6 11.2l6.6-6.8" />
    </svg>
  )
}

/** Correo del envío automático y del aviso del fin (Strata.dc.html:958, 1218). */
export function IconoCorreo(props: Icono) {
  return (
    <Svg width="17" height="17" strokeWidth="1.7" {...props}>
      <rect x="1.8" y="3.4" width="14.4" height="11.2" rx="2" />
      <path d="m2.4 4.6 6.6 5 6.6-5" />
    </Svg>
  )
}

/** Palomita del banner oscuro (Strata.dc.html:878). */
export function IconoListo(props: Icono) {
  return (
    <svg width="19" height="19" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true" focusable="false" {...props}>
      <path d="M4.6 10.4 8.2 14l7-7.4" />
    </svg>
  )
}
