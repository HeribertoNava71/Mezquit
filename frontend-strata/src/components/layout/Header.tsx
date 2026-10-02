import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { Marca } from './Marca'
import { TopBar, type TopBarVariant } from './TopBar'
import { ErrorSalida } from './topbar/ErrorSalida'
import { MobileMenu } from './topbar/MobileMenu'
import {
  ENLACE_AYUDA,
  ENLACE_CODIGO,
  ENLACES_PUBLICOS,
  nombreVisible,
  opcionesDeCuenta,
  type CuentaMenu,
} from './topbar/navegacion'
import { NavLinks } from './topbar/NavLinks'
import { UserMenu } from './topbar/UserMenu'
import { useSalir } from './topbar/useSalir'
import './Header.css'

const NAV_LABEL = 'Navegación principal'

/** En el menú móvil, Ayuda se suma a la navegación (sale de la barra; mapa.md, V-2). */
const ENLACES_MOVIL = [...ENLACES_PUBLICOS, ENLACE_AYUDA]
const SECUNDARIOS_MOVIL = [ENLACE_CODIGO]

export interface HeaderProps {
  /**
   * default: sticky y translúcida (páginas públicas, /perfil y 404).
   * home: dentro del contenido de la home (Fase 6). Por defecto, default.
   */
  variant?: TopBarVariant
}

/**
 * Barra pública (Strata.dc.html:110-125 con la barra del shell, :53-58;
 * mapa.md, V-2 y sección 3):
 * - Logo salamandra → «/».
 * - Tests · Para empresas · Cómo funciona · Precios, y «Tengo un código» → /evaluar.
 * - Sin sesión: «Entrar» (/login) y el botón tinta «Crear cuenta» (/registro),
 *   que sustituye a «Comprar un test» porque no hay compra (PB-09).
 * - Con sesión: la pastilla con el menú Mi perfil, Panel de RR. HH. (con
 *   organización), Operación (con is_platform_admin) y Salir. Salir hace
 *   POST /api/logout, setUser(null) y lleva al inicio, como antes.
 * - Por debajo de 768 px, todo pasa al menú móvil, con Ayuda, Salir y Operación (R-06).
 */
export function Header({ variant = 'default' }: HeaderProps) {
  const { user, loading } = useAuth()
  const salida = useSalir('/')

  let cuenta: CuentaMenu | null = null
  if (user) {
    const nombre = nombreVisible(user)
    cuenta = {
      nombre,
      etiqueta: nombre,
      detalle: user.email,
      opciones: opcionesDeCuenta('publica', user),
      onSalir: salida.salir,
      saliendo: salida.saliendo,
    }
  }

  // Mientras GET /api/user responde no se muestra nada de la sesión, para no
  // ofrecer «Entrar» a quien ya la tiene abierta.
  const sinSesion = !loading && !cuenta

  return (
    <TopBar
      variant={variant}
      below={
        salida.error && (
          <ErrorSalida
            tipo={salida.error}
            onReintentar={salida.salir}
            onDescartar={salida.descartarError}
            reintentando={salida.saliendo}
          />
        )
      }
    >
      <Marca to="/" />
      <NavLinks label={NAV_LABEL} enlaces={ENLACES_PUBLICOS} />
      <div className="st-topbar__actions">
        <Link to={ENLACE_CODIGO.to} className="st-public-bar__code">
          {ENLACE_CODIGO.label}
        </Link>
        {!loading && (
          <div className="st-public-bar__session">
            {cuenta ? (
              <UserMenu cuenta={cuenta} />
            ) : (
              <>
                <Link to="/login" className="st-public-bar__login">
                  Entrar
                </Link>
                <Button variant="ink" to="/registro">
                  Crear cuenta
                </Button>
              </>
            )}
          </div>
        )}
        <MobileMenu
          navLabel={NAV_LABEL}
          enlaces={ENLACES_MOVIL}
          secundarios={SECUNDARIOS_MOVIL}
          cuenta={loading ? null : cuenta}
          pie={
            sinSesion && (
              <>
                <Button variant="secondary" to="/login" fullWidth>
                  Entrar
                </Button>
                <Button variant="ink" to="/registro" fullWidth>
                  Crear cuenta
                </Button>
              </>
            )
          }
        />
      </div>
    </TopBar>
  )
}

export default Header
