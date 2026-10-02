import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { GuardaDeSesion } from './GuardaDeSesion'
import { AVISO_SIN_ORGANIZACION, type EstadoDeRuta } from './rutasDeSesion'

const ESTADO_SIN_ORGANIZACION: EstadoDeRuta = { aviso: AVISO_SIN_ORGANIZACION }

/**
 * Guarda de organización de /app/* (D-07, punto 3). Una sesión sin
 * organization_id va a /perfil con un aviso en location.state, en lugar de
 * llegar a pantallas cuyas llamadas responden 500 sin empresa (PB-03).
 * Sin sesión se comporta como RequireAuth.
 */
export default function RequireOrganization({ children }: { children: ReactNode }) {
  return (
    <GuardaDeSesion>
      {(user) =>
        user.organization_id ? children : <Navigate to="/perfil" replace state={ESTADO_SIN_ORGANIZACION} />
      }
    </GuardaDeSesion>
  )
}
