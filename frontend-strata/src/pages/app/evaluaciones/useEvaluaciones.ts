import { useCallback, useEffect, useReducer, useRef } from 'react'
import { listAssessments, type AssessmentSummary } from '@/api/rh'
import { getErrorKind, type EstadoErrorKind } from '@/components/ui'

/** Carga de GET /api/assessments: cargando, error (distinto del vacío) o la lista, que puede venir vacía. */
export type CargaEvaluaciones =
  | { fase: 'cargando' }
  | { fase: 'error'; error: EstadoErrorKind }
  | { fase: 'lista'; evaluaciones: AssessmentSummary[] }

export interface EvaluacionesConCarga {
  carga: CargaEvaluaciones
  /** «Reintentar» en curso tras un error de carga: el EstadoError sigue a la vista. */
  reintentando: boolean
  /** «Actualizar» en curso: la lista anterior sigue a la vista. */
  actualizando: boolean
  /** Falla de «Actualizar». La lista anterior sigue visible y el aviso va inline. */
  errorActualizar: EstadoErrorKind | null
  /** Vuelve a pedir la lista después de un error de carga. */
  reintentar: () => void
  /** Vuelve a pedir la lista (P-14). Resuelve true si llegó la lista nueva. */
  actualizar: () => Promise<boolean>
}

type Modo = 'carga' | 'actualizar'

interface Estado {
  carga: CargaEvaluaciones
  reintentando: boolean
  actualizando: boolean
  errorActualizar: EstadoErrorKind | null
}

type Accion =
  | { tipo: 'pedir'; modo: Modo }
  | { tipo: 'lista'; evaluaciones: AssessmentSummary[] }
  | { tipo: 'error'; modo: Modo; error: EstadoErrorKind }

const INICIAL: Estado = { carga: { fase: 'cargando' }, reintentando: false, actualizando: false, errorActualizar: null }

function transicion(estado: Estado, accion: Accion): Estado {
  switch (accion.tipo) {
    case 'pedir':
      return accion.modo === 'carga' ? { ...estado, reintentando: true } : { ...estado, actualizando: true }
    case 'lista':
      return {
        carga: { fase: 'lista', evaluaciones: accion.evaluaciones },
        reintentando: false,
        actualizando: false,
        errorActualizar: null,
      }
    case 'error':
      // Al actualizar, la lista anterior se conserva y el error va inline.
      if (accion.modo === 'actualizar') return { ...estado, actualizando: false, errorActualizar: accion.error }
      return { ...estado, carga: { fase: 'error', error: accion.error }, reintentando: false, actualizando: false }
  }
}

/**
 * Lista de evaluaciones de la organización (GET /api/assessments, sin cambios
 * de contrato). Una respuesta que llega tarde, de una petición anterior, se ignora.
 */
export function useEvaluaciones(): EvaluacionesConCarga {
  const [estado, dispatch] = useReducer(transicion, INICIAL)
  const vigente = useRef(0)

  const pedir = useCallback(async (modo: Modo): Promise<boolean> => {
    const peticion = ++vigente.current
    try {
      const evaluaciones = await listAssessments()
      if (peticion !== vigente.current) return false
      dispatch({ tipo: 'lista', evaluaciones })
      return true
    } catch (error) {
      if (peticion === vigente.current) dispatch({ tipo: 'error', modo, error: getErrorKind(error) })
      return false
    }
  }, [])

  useEffect(() => {
    void pedir('carga')
  }, [pedir])

  const reintentar = useCallback(() => {
    dispatch({ tipo: 'pedir', modo: 'carga' })
    void pedir('carga')
  }, [pedir])

  const actualizar = useCallback(() => {
    dispatch({ tipo: 'pedir', modo: 'actualizar' })
    return pedir('actualizar')
  }, [pedir])

  return { ...estado, reintentar, actualizar }
}
