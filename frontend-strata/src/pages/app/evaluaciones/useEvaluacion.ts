import { useCallback, useEffect, useReducer, useRef } from 'react'
import { getAssessment, listAssessments, type AssessmentDetail, type AssessmentSummary } from '@/api/rh'
import { getErrorKind, type EstadoErrorKind } from '@/components/ui'

/** Carga de GET /api/assessments/{id}: cargando, error (403, 404, red…) o la evaluación. */
export type CargaEvaluacion =
  | { fase: 'cargando' }
  | { fase: 'error'; error: EstadoErrorKind }
  | { fase: 'lista'; evaluacion: AssessmentDetail }

/**
 * Fechas de la evaluación. GET /api/assessments/{id} no las devuelve (PB-06):
 * salen de su fila en GET /api/assessments, el mismo contrato de la lista.
 * - cargando: la lista aún no llega.
 * - sin-dato: la lista falló o no trae la evaluación. La pantalla no afirma nada.
 * - lista: fecha límite (null = sin fecha límite) y fecha de creación.
 */
export type FechasEvaluacion =
  | { estado: 'cargando' }
  | { estado: 'sin-dato' }
  | { estado: 'lista'; fechaLimite: string | null; creada: string | null }

export interface EvaluacionConCarga {
  carga: CargaEvaluacion
  fechas: FechasEvaluacion
  /** «Reintentar» en curso tras un error de carga. */
  reintentando: boolean
  /** «Actualizar» en curso: la evaluación anterior sigue a la vista. */
  actualizando: boolean
  /** Falla de «Actualizar» por red o servidor; un 403 o un 404 pasan a la pantalla de error. */
  errorActualizar: EstadoErrorKind | null
  reintentar: () => void
  /** Vuelve a pedir la evaluación y sus fechas (P-14). Resuelve true si llegó la evaluación. */
  actualizar: () => Promise<boolean>
}

/** Id de la URL: un entero positivo. Cualquier otra cosa es null (no se llama a la API). */
export function idDeEvaluacion(valor: string | undefined): number | null {
  if (!valor || !/^\d+$/.test(valor)) return null
  const id = Number(valor)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

type Modo = 'carga' | 'actualizar'

interface Estado {
  carga: CargaEvaluacion
  fechas: FechasEvaluacion
  reintentando: boolean
  actualizando: boolean
  errorActualizar: EstadoErrorKind | null
}

type Accion =
  | { tipo: 'pedir'; modo: Modo }
  | {
      tipo: 'respuesta'
      modo: Modo
      /** La evaluación, o el tipo de error de GET /api/assessments/{id}. */
      detalle: { evaluacion: AssessmentDetail } | { error: EstadoErrorKind }
      /** Fechas de GET /api/assessments; null si esa llamada falló. */
      fechas: FechasEvaluacion | null
    }

function inicial(id: number | null): Estado {
  return {
    carga: id === null ? { fase: 'error', error: 'no-encontrado' } : { fase: 'cargando' },
    fechas: { estado: 'cargando' },
    reintentando: false,
    actualizando: false,
    errorActualizar: null,
  }
}

function transicion(estado: Estado, accion: Accion): Estado {
  if (accion.tipo === 'pedir') {
    return accion.modo === 'carga' ? { ...estado, reintentando: true } : { ...estado, actualizando: true }
  }

  const { modo, detalle } = accion
  // Al actualizar, una falla de la lista conserva las fechas que ya había.
  const fechas = accion.fechas ?? (modo === 'carga' ? { estado: 'sin-dato' as const } : estado.fechas)
  const base = { ...estado, fechas, reintentando: false, actualizando: false }

  if ('evaluacion' in detalle) {
    return { ...base, carga: { fase: 'lista', evaluacion: detalle.evaluacion }, errorActualizar: null }
  }
  // Sin acceso o sin evaluación no hay nada que mostrar, aunque ya hubiera datos.
  if (modo === 'carga' || detalle.error === 'permiso' || detalle.error === 'no-encontrado') {
    return { ...base, carga: { fase: 'error', error: detalle.error }, errorActualizar: null }
  }
  return { ...base, errorActualizar: detalle.error }
}

function fechasDe(lista: AssessmentSummary[], id: number): FechasEvaluacion {
  const fila = lista.find((evaluacion) => evaluacion.id === id)
  if (!fila) return { estado: 'sin-dato' }
  return { estado: 'lista', fechaLimite: fila.deadline ?? null, creada: fila.created_at ?? null }
}

/**
 * Detalle de una evaluación (GET /api/assessments/{id}) y sus fechas
 * (GET /api/assessments), en paralelo y sin cambiar ningún contrato.
 * Una respuesta que llega tarde, de una petición anterior, se ignora.
 * Monta el componente con key={id}: otro id empieza de cero.
 */
export function useEvaluacion(id: number | null): EvaluacionConCarga {
  const [estado, dispatch] = useReducer(transicion, id, inicial)
  const vigente = useRef(0)

  const pedir = useCallback(
    async (modo: Modo): Promise<boolean> => {
      if (id === null) return false
      const peticion = ++vigente.current
      const [detalle, lista] = await Promise.allSettled([getAssessment(id), listAssessments()])
      if (peticion !== vigente.current) return false
      dispatch({
        tipo: 'respuesta',
        modo,
        detalle:
          detalle.status === 'fulfilled' ? { evaluacion: detalle.value } : { error: getErrorKind(detalle.reason) },
        fechas: lista.status === 'fulfilled' ? fechasDe(lista.value, id) : null,
      })
      return detalle.status === 'fulfilled'
    },
    [id],
  )

  useEffect(() => {
    void pedir('carga')
  }, [pedir])

  const reintentar = useCallback(() => {
    if (id === null) return
    dispatch({ tipo: 'pedir', modo: 'carga' })
    void pedir('carga')
  }, [id, pedir])

  const actualizar = useCallback(async () => {
    if (id === null) return false
    dispatch({ tipo: 'pedir', modo: 'actualizar' })
    return pedir('actualizar')
  }, [id, pedir])

  return { ...estado, reintentar, actualizar }
}
