import { useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import type { AuthUser } from '@/api/auth'
import { useAuth } from '@/context/AuthContext'
import { CargaDeSesion } from './CargaDeSesion'
import { destinoTrasLogin, leerEstadoDeRuta } from './rutasDeSesion'

/**
 * Guarda de /login y /registro (D-07, punto 5): quien llega con sesión va a /app
 * si tiene empresa o a /perfil si no; si trae una ruta de origen permitida en
 * state.from, a esa ruta. Mientras carga la sesión muestra el EstadoCarga del
 * sistema.
 */
export default function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <CargaDeSesion />
  return (
    <SesionAlLlegar key={location.pathname} user={user} state={location.state}>
      {children}
    </SesionAlLlegar>
  )
}

interface SesionAlLlegarProps {
  user: AuthUser | null
  state: unknown
  children: ReactNode
}

/**
 * Decide una sola vez, al llegar a la pantalla: si ya había sesión, redirige.
 * Quien entra o se registra aquí mismo no dispara la guarda, porque la pantalla
 * navega sola a su destino (Registro, por ejemplo, a /app/evaluaciones/nueva).
 */
function SesionAlLlegar({ user, state, children }: SesionAlLlegarProps) {
  const [conSesionAlLlegar] = useState(() => user !== null)

  if (conSesionAlLlegar && user) {
    return <Navigate to={destinoTrasLogin(user, leerEstadoDeRuta(state).from)} replace />
  }
  return <>{children}</>
}
