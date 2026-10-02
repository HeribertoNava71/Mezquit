import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { fetchUser, type AuthUser } from '@/api/auth'
import { EVENTO_SESION_VENCIDA, marcarSesion } from '@/api/axios'

interface AuthState {
  user: AuthUser | null
  loading: boolean
  setUser: (u: AuthUser | null) => void
  /**
   * true cuando la sesión se cerró porque venció (un 401 o un 419 de una petición
   * hecha con sesión; D-07, punto 8). Las guardas la usan para mandar a /login con
   * el aviso. setUser la regresa a false. Sin definir equivale a false.
   */
  sesionVencida?: boolean
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [sesionVencida, setSesionVencida] = useState(false)
  // Copia de user para el listener del evento (se lee fuera del render).
  const userRef = useRef<AuthUser | null>(null)

  useEffect(() => {
    let vigente = true
    fetchUser().then((u) => {
      if (!vigente) return
      userRef.current = u
      marcarSesion(u !== null)
      setUserState(u)
      setLoading(false)
    })
    return () => {
      vigente = false
    }
  }, [])

  const setUser = useCallback((u: AuthUser | null) => {
    userRef.current = u
    // Al instante: las peticiones que salgan desde ahora llevan la marca correcta.
    marcarSesion(u !== null)
    // En transición, igual que la navegación de React Router: el cambio de sesión
    // y el navigate() que suele seguirle (Login, Registro, Salir) se pintan juntos.
    // Así ninguna guarda ve la sesión nueva con la ruta vieja; por ejemplo, Salir
    // en /perfil llega a / y no rebota a /login.
    startTransition(() => {
      setUserState(u)
      setSesionVencida(false)
    })
  }, [])

  useEffect(() => {
    function alVencerSesion() {
      if (!userRef.current) return
      userRef.current = null
      marcarSesion(false)
      // En transición, como el navigate() de SessionWatcher, que escucha el mismo evento.
      startTransition(() => {
        setUserState(null)
        setSesionVencida(true)
      })
    }
    window.addEventListener(EVENTO_SESION_VENCIDA, alVencerSesion)
    return () => window.removeEventListener(EVENTO_SESION_VENCIDA, alVencerSesion)
  }, [])

  const value = useMemo<AuthState>(
    () => ({ user, loading, setUser, sesionVencida }),
    [user, loading, setUser, sesionVencida],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- reconstrucción: el plan exporta el hook junto al provider; ver docs/rediseno/reconstruccion.md
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
