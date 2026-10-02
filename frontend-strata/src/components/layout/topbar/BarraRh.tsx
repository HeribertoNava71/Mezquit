import { useLocation } from 'react-router-dom'
import { Marca } from '@/components/layout/Marca'
import { TopBar } from '@/components/layout/TopBar'
import { useAuth } from '@/context/AuthContext'
import { BalanceIndicator } from './BalanceIndicator'
import { useNombreOrganizacion, useSaldoCreditos } from './datosBarra'
import { ErrorSalida } from './ErrorSalida'
import { MobileMenu } from './MobileMenu'
import { ENLACES_RH, nombreVisible, opcionesDeCuenta, type CuentaMenu } from './navegacion'
import { NavLinks } from './NavLinks'
import { UserMenu } from './UserMenu'
import { useSalir } from './useSalir'

const NAV_LABEL = 'Panel de RR. HH.'

/**
 * Barra del portal de RR. HH. (Strata.dc.html:52-73; mapa.md, RH-1 y sección 3):
 * - Logo salamandra → «/».
 * - Tests · Créditos · Candidatos · Resultados (D-06 A).
 * - Saldo «{n} créditos» → /app/creditos (GET /api/credits, solo con organización).
 * - Pastilla con las iniciales de la persona y el nombre de la organización
 *   (GET /api/user/profile; si falla, el nombre de la persona). Menú: Mi perfil,
 *   Operación (solo con is_platform_admin), Sitio público y Salir.
 * - Menú móvil con los mismos enlaces y opciones.
 */
export function BarraRh() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const salida = useSalir('/login')
  const saldo = useSaldoCreditos(user?.organization_id, pathname)
  const organizacion = useNombreOrganizacion(user?.id)

  let cuenta: CuentaMenu | null = null
  if (user) {
    const nombre = nombreVisible(user)
    cuenta = {
      nombre,
      etiqueta: organizacion.cargando ? null : (organizacion.nombre ?? nombre),
      detalle: user.email,
      opciones: opcionesDeCuenta('rh', user),
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
      <NavLinks label={NAV_LABEL} enlaces={ENLACES_RH} />
      <div className="st-topbar__actions">
        {user?.organization_id ? <BalanceIndicator saldo={saldo} /> : null}
        {cuenta && <UserMenu cuenta={cuenta} />}
        <MobileMenu navLabel={NAV_LABEL} enlaces={ENLACES_RH} cuenta={cuenta} />
      </div>
    </TopBar>
  )
}

export default BarraRh
