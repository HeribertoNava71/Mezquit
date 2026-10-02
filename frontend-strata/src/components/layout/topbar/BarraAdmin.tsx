import { useLocation } from 'react-router-dom'
import { Marca } from '@/components/layout/Marca'
import { TopBar } from '@/components/layout/TopBar'
import { useAuth } from '@/context/AuthContext'
import { useSolicitudesPendientes } from './datosBarra'
import { ErrorSalida } from './ErrorSalida'
import { MobileMenu } from './MobileMenu'
import { ENLACES_ADMIN, nombreVisible, opcionesDeCuenta, type CuentaMenu } from './navegacion'
import { NavLinks } from './NavLinks'
import { PendingIndicator } from './PendingIndicator'
import { UserMenu } from './UserMenu'
import { useSalir } from './useSalir'

const NAV_LABEL = 'Operación'

/**
 * Barra de super admin (Strata.dc.html:52-58 y 74-87; mapa.md, SA-1 y sección 3):
 * - Logo salamandra → «/».
 * - Solicitudes · Usuarios. Test Builder, Reactivos y Algoritmos no se
 *   muestran hasta que exista su API (PB-20).
 * - Contador «N solicitudes pendientes» (GET /api/admin/credit-requests).
 * - Pastilla con las iniciales y el nombre. Menú: Mi perfil de operador,
 *   Panel de RR. HH. (con organización), Sitio público y Salir.
 * - Menú móvil con los mismos enlaces y opciones.
 */
export function BarraAdmin() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const salida = useSalir('/login')
  const pendientes = useSolicitudesPendientes(Boolean(user?.is_platform_admin), pathname)

  let cuenta: CuentaMenu | null = null
  if (user) {
    const nombre = nombreVisible(user)
    cuenta = {
      nombre,
      etiqueta: nombre,
      detalle: user.email,
      opciones: opcionesDeCuenta('admin', user),
      onSalir: salida.salir,
      saliendo: salida.saliendo,
    }
  }

  return (
    <TopBar
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
      <NavLinks label={NAV_LABEL} enlaces={ENLACES_ADMIN} />
      <div className="st-topbar__actions">
        <PendingIndicator pendientes={pendientes} />
        {cuenta && <UserMenu cuenta={cuenta} />}
        <MobileMenu navLabel={NAV_LABEL} enlaces={ENLACES_ADMIN} cuenta={cuenta} />
      </div>
    </TopBar>
  )
}

export default BarraAdmin
