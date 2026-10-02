import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { GuardaDeSesion } from './GuardaDeSesion'

/**
 * Guarda de /admin/*. Sin sesión manda a /login con la ruta de origen
 * (D-07, punto 6); sin is_platform_admin, a /app, como siempre. El backend
 * repite el control con el middleware platform_admin.
 */
export default function RequirePlatformAdmin({ children }: { children: ReactNode }) {
  return (
    <GuardaDeSesion>{(user) => (user.is_platform_admin ? children : <Navigate to="/app" replace />)}</GuardaDeSesion>
  )
}
