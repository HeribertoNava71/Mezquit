import type { ReactNode } from 'react'
import { GuardaDeSesion } from './GuardaDeSesion'

/**
 * Guarda de sesión de /app y /perfil (D-07, puntos 4 y 6). Sin sesión manda a
 * /login y recuerda la ruta de origen en state.from; mientras carga la sesión
 * muestra el EstadoCarga del sistema.
 */
export default function RequireAuth({ children }: { children: ReactNode }) {
  return <GuardaDeSesion>{() => children}</GuardaDeSesion>
}
