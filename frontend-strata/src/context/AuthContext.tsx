import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { fetchUser, type AuthUser } from '@/api/auth'

interface AuthState {
  user: AuthUser | null
  loading: boolean
  setUser: (u: AuthUser | null) => void
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUser().then(u => { setUser(u); setLoading(false) })
  }, [])

  return <AuthContext.Provider value={{ user, loading, setUser }}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- reconstrucción: el plan exporta el hook junto al provider; ver docs/rediseno/reconstruccion.md
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
