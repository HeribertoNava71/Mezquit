import { useCallback, useEffect, useState } from 'react'
import { getCredits } from '@/api/rh'
import { getErrorKind, type EstadoErrorKind } from '@/components/ui'
import { prepararCreditos, type Creditos } from './movimientos'

/**
 * Estado de GET /api/credits:
 * - carga: primera petición en curso (StatCards y tabla en esqueleto).
 * - error: falló; reintentando marca un reintento en curso.
 * - listo: datos de la pantalla (con o sin movimientos).
 */
export type EstadoCreditos =
  | { fase: 'carga' }
  | { fase: 'error'; error: EstadoErrorKind; reintentando: boolean }
  | { fase: 'listo'; creditos: Creditos }

export interface UsoCreditos {
  estado: EstadoCreditos
  /** Vuelve a pedir GET /api/credits (botón «Reintentar»). */
  reintentar: () => void
}

/**
 * Saldo y movimientos de la organización. Cada intento descarta la respuesta
 * del anterior y la de una pantalla ya desmontada. Con un 401 o 419, el
 * cliente api avisa de la sesión vencida y SessionWatcher lleva a /login.
 */
export function useCreditos(): UsoCreditos {
  const [estado, setEstado] = useState<EstadoCreditos>({ fase: 'carga' })
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    getCredits()
      .then(prepararCreditos)
      .then(
        (creditos) => {
          if (vigente) setEstado({ fase: 'listo', creditos })
        },
        (error: unknown) => {
          if (vigente) setEstado({ fase: 'error', error: getErrorKind(error), reintentando: false })
        },
      )
    return () => {
      vigente = false
    }
  }, [intento])

  const reintentar = useCallback(() => {
    setEstado((actual) => (actual.fase === 'error' ? { ...actual, reintentando: true } : actual))
    setIntento((actual) => actual + 1)
  }, [])

  return { estado, reintentar }
}
