import { Fragment, useEffect, useId, useRef, useState, type FocusEvent, type KeyboardEvent } from 'react'
import { flushSync } from 'react-dom'
import { NavLink, useLocation } from 'react-router-dom'
import { Avatar, VisuallyHidden, cx } from '@/components/ui'
import type { CuentaMenu } from './navegacion'
import './UserMenu.css'

/** Opciones del menú, en orden. */
function opcionesDe(menu: HTMLElement | null): HTMLElement[] {
  if (!menu) return []
  return Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"]'))
}

/** Texto comparable para buscar por letra: sin acentos ni mayúsculas. */
function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('es-MX').trim()
}

export interface UserMenuProps {
  /** Nombre, texto de la pastilla, opciones y salida (navegacion.ts). */
  cuenta: CuentaMenu
  className?: string
}

/**
 * Pastilla de usuario (Strata.dc.html:68-71) convertida en botón de menú
 * accesible (R-05): avatar con las iniciales de la persona y, al lado, la
 * organización (RR. HH.) o el nombre (pública y super admin).
 *
 * Teclado, como el patrón «menu button» de WAI-ARIA:
 * - En el botón: Enter, Espacio y ↓ abren y enfocan la primera opción; ↑, la última.
 * - En el menú: ↑ ↓ circulan, Inicio y Fin van a los extremos, una letra salta
 *   a la opción que empieza con ella, Espacio y Enter eligen, Escape cierra y
 *   devuelve el foco al botón, y Tab cierra y sigue el orden normal.
 * - Un clic fuera o un cambio de ruta lo cierran.
 *
 * Por debajo del corte de su barra (768 px; 900 en RR. HH. y 960 en la pública)
 * se oculta: sus opciones viven en el menú móvil.
 */
export function UserMenu({ cuenta, className }: UserMenuProps) {
  const { nombre, etiqueta, detalle, opciones, onSalir, saliendo = false } = cuenta
  const { key } = useLocation()
  // Entrada del historial en la que se abrió. Al navegar (también con Atrás o
  // Adelante) deja de coincidir y se olvida en el mismo render: volver a esa
  // entrada no reabre el menú.
  const [abiertoEn, setAbiertoEn] = useState<string | null>(null)
  if (abiertoEn !== null && abiertoEn !== key) setAbiertoEn(null)
  const abierto = abiertoEn === key

  const raizRef = useRef<HTMLDivElement>(null)
  const botonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLUListElement>(null)
  const botonId = useId()
  const menuId = useId()

  /** Enfoca la opción del índice dado; los índices fuera de rango dan la vuelta (-1 es la última). */
  function enfocar(indice: number) {
    const items = opcionesDe(menuRef.current)
    if (items.length === 0) return
    items[((indice % items.length) + items.length) % items.length].focus()
  }

  function abrir(destino: 'primero' | 'ultimo') {
    // El menú se pinta antes de mover el foco a una de sus opciones.
    flushSync(() => setAbiertoEn(key))
    enfocar(destino === 'primero' ? 0 : -1)
  }

  function cerrar(devolverFoco: boolean) {
    setAbiertoEn(null)
    if (devolverFoco) botonRef.current?.focus()
  }

  // Un clic o un toque fuera del menú lo cierra sin mover el foco.
  useEffect(() => {
    if (!abierto) return
    function alPresionar(event: PointerEvent) {
      const raiz = raizRef.current
      if (raiz && !(event.target instanceof Node && raiz.contains(event.target))) setAbiertoEn(null)
    }
    document.addEventListener('pointerdown', alPresionar)
    return () => document.removeEventListener('pointerdown', alPresionar)
  }, [abierto])

  // Si el foco pasa a otro elemento de la página sin Tab ni clic (por ejemplo,
  // desde un lector de pantalla), el menú se cierra.
  function alPerderFoco(event: FocusEvent<HTMLDivElement>) {
    const siguiente = event.relatedTarget
    if (abierto && siguiente instanceof Node && !event.currentTarget.contains(siguiente)) setAbiertoEn(null)
  }

  function alTeclearBoton(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    event.preventDefault()
    abrir(event.key === 'ArrowDown' ? 'primero' : 'ultimo')
  }

  function alTeclearMenu(event: KeyboardEvent<HTMLUListElement>) {
    const items = opcionesDe(menuRef.current)
    const actual = items.findIndex((item) => item === document.activeElement)

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        enfocar(actual + 1)
        return
      case 'ArrowUp':
        event.preventDefault()
        enfocar(actual < 0 ? -1 : actual - 1)
        return
      case 'Home':
      case 'PageUp':
        event.preventDefault()
        enfocar(0)
        return
      case 'End':
      case 'PageDown':
        event.preventDefault()
        enfocar(-1)
        return
      case 'Escape':
        event.preventDefault()
        cerrar(true)
        return
      case 'Tab':
        // Sin preventDefault: el foco sigue el orden de la página y el menú se cierra.
        cerrar(false)
        return
      case ' ':
        // Espacio también elige los enlaces del menú, como en un botón.
        if (event.target instanceof HTMLAnchorElement) {
          event.preventDefault()
          event.target.click()
        }
        return
      default: {
        if (event.key.length !== 1 || event.altKey || event.ctrlKey || event.metaKey) return
        const letra = normalizar(event.key)
        if (!letra) return
        const orden = [...items.slice(actual + 1), ...items.slice(0, actual + 1)]
        const siguiente = orden.find((item) => normalizar(item.textContent ?? '').startsWith(letra))
        if (siguiente) {
          event.preventDefault()
          siguiente.focus()
        }
      }
    }
  }

  // Nombre del botón: lo visible primero (WCAG 2.5.3) y después qué abre.
  const muestraOrganizacion = etiqueta !== null && etiqueta !== nombre
  const complemento =
    etiqueta === null
      ? `Menú de cuenta de ${nombre}`
      : muestraOrganizacion
        ? `, menú de cuenta de ${nombre}`
        : ', menú de cuenta'

  return (
    <div ref={raizRef} className={cx('st-user-menu', className)} onBlur={alPerderFoco}>
      <button
        ref={botonRef}
        id={botonId}
        type="button"
        className="st-user-menu__trigger"
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-controls={abierto ? menuId : undefined}
        aria-busy={saliendo || undefined}
        onClick={() => (abierto ? cerrar(false) : abrir('primero'))}
        onKeyDown={alTeclearBoton}
      >
        <Avatar name={nombre} />
        {etiqueta === null ? (
          <span className="st-user-menu__label st-user-menu__label--loading" aria-hidden="true" />
        ) : (
          <span className="st-user-menu__label">{etiqueta}</span>
        )}
        <VisuallyHidden>{complemento}</VisuallyHidden>
      </button>

      {abierto && (
        <div className="st-user-menu__panel">
          <div className="st-user-menu__who">
            <p className="st-user-menu__name">{nombre}</p>
            {muestraOrganizacion && <p className="st-user-menu__org">{etiqueta}</p>}
            {detalle && <p className="st-user-menu__detail">{detalle}</p>}
          </div>
          <ul
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-labelledby={botonId}
            className="st-user-menu__list"
            onKeyDown={alTeclearMenu}
          >
            {opciones.map((opcion) =>
              opcion.tipo === 'salir' ? (
                <Fragment key="salir">
                  <li role="separator" className="st-user-menu__separator" />
                  <li role="none">
                    <button
                      type="button"
                      role="menuitem"
                      tabIndex={-1}
                      className="st-user-menu__item"
                      aria-disabled={saliendo || undefined}
                      onClick={() => {
                        cerrar(true)
                        if (!saliendo) onSalir()
                      }}
                    >
                      {saliendo ? 'Saliendo…' : opcion.label}
                    </button>
                  </li>
                </Fragment>
              ) : (
                <li key={opcion.to} role="none">
                  <NavLink
                    to={opcion.to}
                    end={opcion.to === '/'}
                    role="menuitem"
                    tabIndex={-1}
                    className="st-user-menu__item"
                    onClick={() => cerrar(true)}
                  >
                    {opcion.label}
                  </NavLink>
                </li>
              ),
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

export default UserMenu
