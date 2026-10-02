import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout } from '@/api/auth'
import { getErrorKind, type EstadoErrorKind } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'

export interface Salida {
  /** Cierra la sesión: POST /api/logout, setUser(null) y navegación al destino. */
  salir: () => Promise<void>
  /** La petición está en curso. */
  saliendo: boolean
  /**
   * Por qué no se pudo cerrar la sesión ('red' o 'servidor', entre otros); null
   * si no hubo error. La barra lo muestra en línea (D-22).
   */
  error: EstadoErrorKind | null
  /** Oculta el aviso de error. */
  descartarError: () => void
}

/**
 * «Salir» de las tres barras, como hoy: POST /api/logout, setUser(null) y
 * navegación (a «/» desde el sitio público y a /login desde /app y /admin).
 *
 * - 401 o 419: la sesión ya no existe en el servidor, así que también se
 *   termina en el navegador. (El cliente api ya reintenta una vez el 419 tras
 *   renovar la cookie CSRF.)
 * - Red, 500 u otro error: la sesión sigue abierta. No se finge que se cerró:
 *   error toma el tipo de falla para avisar en línea, con «Reintentar».
 */
export function useSalir(destino: string): Salida {
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const [saliendo, setSaliendo] = useState(false)
  const [error, setError] = useState<EstadoErrorKind | null>(null)
  // Evita dos POST si se pulsa Salir dos veces antes de que cambie el estado.
  const enCurso = useRef(false)

  async function salir() {
    if (enCurso.current) return
    enCurso.current = true
    setSaliendo(true)
    try {
      await logout()
    } catch (falla) {
      const tipo = getErrorKind(falla)
      if (tipo !== 'sesion') {
        enCurso.current = false
        setSaliendo(false)
        setError(tipo)
        return
      }
    }
    enCurso.current = false
    setSaliendo(false)
    setError(null)
    setUser(null)
    navigate(destino)
  }

  return { salir, saliendo, error, descartarError: () => setError(null) }
}
