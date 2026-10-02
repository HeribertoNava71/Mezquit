import { useCallback, useRef, useState } from 'react'
import { getCredits } from '@/api/rh'
import { getErrorKind, type EstadoErrorKind } from '@/components/ui'

/** Saldo de créditos (GET /api/credits → balance) para el paso Confirmar y la pantalla de enlaces. */
export type EstadoSaldo =
  | { estado: 'inactivo' }
  | { estado: 'cargando' }
  | { estado: 'listo'; valor: number }
  | { estado: 'error'; kind: EstadoErrorKind }

export interface Saldo {
  saldo: EstadoSaldo
  /** Pide el saldo. Una respuesta vieja (de una petición anterior) se descarta. */
  cargar: () => void
}

/**
 * Lee el saldo cuando se llama a cargar(): al entrar a Confirmar, al reintentar
 * y después de crear la evaluación (S-11). Un balance que no es número se
 * trata como error del servidor.
 */
export function useSaldo(): Saldo {
  const [saldo, setSaldo] = useState<EstadoSaldo>({ estado: 'inactivo' })
  const ultimaPeticion = useRef(0)

  const cargar = useCallback(() => {
    ultimaPeticion.current += 1
    const peticion = ultimaPeticion.current
    setSaldo({ estado: 'cargando' })
    getCredits()
      .then((datos) => {
        if (peticion !== ultimaPeticion.current) return
        const valor = datos?.balance
        if (typeof valor === 'number' && Number.isFinite(valor)) setSaldo({ estado: 'listo', valor })
        else setSaldo({ estado: 'error', kind: 'servidor' })
      })
      .catch((error: unknown) => {
        if (peticion !== ultimaPeticion.current) return
        setSaldo({ estado: 'error', kind: getErrorKind(error) })
      })
  }, [])

  return { saldo, cargar }
}
