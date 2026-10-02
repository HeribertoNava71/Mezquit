import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Avatar, VisuallyHidden, cx, useFocusTrap } from '@/components/ui'
import { IconoCerrar } from '@/components/ui/Iconos'
import { useScrollLock } from '@/components/ui/useScrollLock'
import { EnlaceNavegacion } from './NavLinks'
import type { CuentaMenu, EnlaceNav } from './navegacion'
import './MobileMenu.css'

/** Desde este ancho la barra muestra todo y el menú móvil se cierra (768 px, design-tokens.md, regla 17). */
const ESCRITORIO = '(min-width: 768px)'

/** Tres líneas: abre el menú. */
function IconoMenu() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden
      focusable={false}
    >
      <path d="M3.5 6h13M3.5 10h13M3.5 14h13" />
    </svg>
  )
}

export interface MobileMenuProps {
  /** Nombre de la navegación del panel; el mismo que el de la barra de escritorio. */
  navLabel: string
  /** Enlaces de la barra del rol. */
  enlaces: readonly EnlaceNav[]
  /** Enlaces extra después de la navegación (en la pública, «Tengo un código»). */
  secundarios?: readonly EnlaceNav[]
  /** Sesión: identidad y opciones de la pastilla, incluidos Salir y Operación (R-06). */
  cuenta?: CuentaMenu | null
  /** Final del panel cuando no hay sesión (en la pública, Entrar y Crear cuenta). */
  pie?: ReactNode
  className?: string
}

/**
 * Menú móvil de las barras (por debajo de 768 px; el prototipo solo hace wrap).
 * Un botón con aria-expanded abre un panel que cubre el resto de la pantalla
 * con los enlaces del rol y las opciones de la pastilla (mapa.md, sección 3).
 *
 * - El foco queda atrapado entre el botón y el panel; Tab y Mayús+Tab circulan.
 * - Escape cierra y devuelve el foco al botón.
 * - Navegar, volver a pulsar el botón o pasar a escritorio lo cierran.
 * - Mientras está abierto, la página de fondo no se desplaza.
 */
export function MobileMenu({ navLabel, enlaces, secundarios = [], cuenta, pie, className }: MobileMenuProps) {
  const { key } = useLocation()
  // Entrada del historial en la que se abrió. Al navegar (también con Atrás o
  // Adelante) deja de coincidir y se olvida en el mismo render: volver a esa
  // entrada no reabre el panel.
  const [abiertoEn, setAbiertoEn] = useState<string | null>(null)
  if (abiertoEn !== null && abiertoEn !== key) setAbiertoEn(null)
  const abierto = abiertoEn === key
  const botonRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  function cerrarConEscape() {
    setAbiertoEn(null)
    botonRef.current?.focus()
  }

  // La trampa abarca el botón y el panel: el botón sigue al alcance para cerrar.
  const trampaRef = useFocusTrap<HTMLDivElement>({ active: abierto, onClose: cerrarConEscape })
  useScrollLock(abierto)

  // Si la ventana pasa a escritorio, el panel se cierra: su botón deja de verse
  // y la trampa no debe retener el foco en elementos ocultos.
  useEffect(() => {
    if (!abierto || typeof window.matchMedia !== 'function') return
    const consulta = window.matchMedia(ESCRITORIO)
    const alCambiar = () => {
      if (consulta.matches) setAbiertoEn(null)
    }
    consulta.addEventListener('change', alCambiar)
    return () => consulta.removeEventListener('change', alCambiar)
  }, [abierto])

  function salir() {
    if (!cuenta || cuenta.saliendo) return
    setAbiertoEn(null)
    cuenta.onSalir()
  }

  const organizacion = cuenta && cuenta.etiqueta && cuenta.etiqueta !== cuenta.nombre ? cuenta.etiqueta : null

  return (
    <div ref={trampaRef} className={cx('st-mobile-menu', className)}>
      <button
        ref={botonRef}
        type="button"
        className="st-mobile-menu__toggle"
        aria-expanded={abierto}
        aria-controls={abierto ? panelId : undefined}
        onClick={() => setAbiertoEn(abierto ? null : key)}
      >
        {abierto ? <IconoCerrar width={18} height={18} /> : <IconoMenu />}
        <VisuallyHidden>Menú</VisuallyHidden>
      </button>

      {abierto && (
        <div id={panelId} className="st-mobile-menu__panel">
          <nav aria-label={navLabel} className="st-mobile-menu__section">
            <ul className="st-mobile-menu__list">
              {enlaces.map((enlace) => (
                <li key={enlace.to}>
                  <EnlaceNavegacion enlace={enlace} className="st-mobile-menu__link" />
                </li>
              ))}
            </ul>
          </nav>

          {secundarios.length > 0 && (
            <ul className="st-mobile-menu__section st-mobile-menu__list">
              {secundarios.map((enlace) => (
                <li key={enlace.to}>
                  <EnlaceNavegacion
                    enlace={enlace}
                    className={cx('st-mobile-menu__link', enlace.destacado && 'st-mobile-menu__link--accent')}
                  />
                </li>
              ))}
            </ul>
          )}

          {cuenta ? (
            <div className="st-mobile-menu__section">
              <div className="st-mobile-menu__who">
                <Avatar name={cuenta.nombre} />
                <div className="st-mobile-menu__identity">
                  <p className="st-mobile-menu__name">{cuenta.nombre}</p>
                  {organizacion && <p className="st-mobile-menu__detail">{organizacion}</p>}
                  {cuenta.detalle && <p className="st-mobile-menu__detail">{cuenta.detalle}</p>}
                </div>
              </div>
              <ul className="st-mobile-menu__list">
                {cuenta.opciones.map((opcion) =>
                  opcion.tipo === 'salir' ? (
                    <li key="salir">
                      <button
                        type="button"
                        className="st-mobile-menu__link"
                        aria-disabled={cuenta.saliendo || undefined}
                        onClick={salir}
                      >
                        {cuenta.saliendo ? 'Saliendo…' : opcion.label}
                      </button>
                    </li>
                  ) : (
                    <li key={opcion.to}>
                      <NavLink to={opcion.to} end={opcion.to === '/'} className="st-mobile-menu__link">
                        {opcion.label}
                      </NavLink>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ) : (
            pie && <div className="st-mobile-menu__section st-mobile-menu__access">{pie}</div>
          )}
        </div>
      )}
    </div>
  )
}

export default MobileMenu
