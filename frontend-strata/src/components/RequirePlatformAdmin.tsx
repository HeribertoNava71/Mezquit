import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import type { ReactNode } from 'react'

export default function RequirePlatformAdmin({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <p style={{ padding: '2rem' }}>Cargando…</p>
  if (!user) return <Navigate to="/login" replace />
  if (!user.is_platform_admin) return <Navigate to="/app" replace />
  return <>{children}</>
}
