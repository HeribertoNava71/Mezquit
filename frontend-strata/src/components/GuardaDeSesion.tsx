import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import type { AuthUser } from '@/api/auth'
import { useAuth } from '@/context/AuthContext'
import { CargaDeSesion } from './CargaDeSesion'
import { estadoHaciaLogin } from './rutasDeSesion'

export interface GuardaDeSesionProps {
  /** Lo que se muestra con sesión. Recibe el usuario para revisar empresa, super admin, etc. */
  children: (user: AuthUser) => ReactNode
}

/**
 * Base de RequireAuth, RequireOrganization y RequirePlatformAdmin (D-07):
 * - mientras carga la sesión, el EstadoCarga del sistema;
 * - sin sesión, /login con la ruta de origen en state.from y, si la sesión
 *   venció, el aviso «Tu sesión expiró. Vuelve a entrar.»;
 * - con sesión, lo que decida cada guarda.
 */
export function GuardaDeSesion({ children }: GuardaDeSesionProps) {
  const { user, loading, sesionVencida = false } = useAuth()
  const location = useLocation()

  if (loading) return <CargaDeSesion />
  if (!user) return <Navigate to="/login" replace state={estadoHaciaLogin(location, sesionVencida)} />
  return <>{children(user)}</>
}
