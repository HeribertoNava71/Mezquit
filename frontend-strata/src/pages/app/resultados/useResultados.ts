import { useCallback, useEffect, useState } from 'react'
import { getAssessment, getCredits, listAssessments, type AssessmentSummary, type CreditsData } from '@/api/rh'
import { getErrorKind, type EstadoErrorKind } from '@/components/ui'
import {
  agregarCompletadas,
  contarCandidatosCompletados,
  contarEvaluacionesActivas,
  seleccionarEvaluaciones,
  type AgregadoCompletadas,
  type FilaCompletada,
} from './resultados'

// Datos de «Resultados» (/app):
// 1. GET /api/credits y GET /api/assessments, en paralelo. Si falla cualquiera
//    de las dos, la página muestra EstadoError con «Reintentar» (antes se
//    ignoraba y se veían «—» y 0).
// 2. Con la lista, GET /api/assessments/{id} de hasta TOPE_EVALUACIONES
//    evaluaciones con completadas (agregación limitada de PB-05).
// Las respuestas que llegan después de desmontar o de un intento nuevo se
// descartan. Mientras se reintenta, el error anterior sigue a la vista con
// «Reintentando…» para no perder el foco del botón.

/** StatCards: saldo, evaluaciones activas y candidatos completados. */
export type EstadoResumen =
  | { fase: 'cargando' }
  | { fase: 'error'; tipo: EstadoErrorKind; reintentando: boolean }
  | {
      fase: 'listo'
      /** balance de GET /api/credits; null si no llegó un número. */
      saldo: number | null
      evaluacionesActivas: number
      candidatosCompletados: number
      /** Evaluaciones de la organización: sin ninguna, el vacío de la tabla invita a crear la primera. */
      totalEvaluaciones: number
    }

/** Tabla «Últimas completadas». */
export type EstadoCompletadas =
  | { fase: 'cargando' }
  /** Ningún detalle se pudo cargar. */
  | { fase: 'error'; tipo: EstadoErrorKind; reintentando: boolean }
  | {
      fase: 'listo'
      filas: FilaCompletada[]
      /** Evaluaciones cuyo detalle no se pudo cargar: sus candidatos faltan en la tabla. */
      fallidas: number
      /** Tipo del primer error de las que fallaron; null si no falló ninguna. */
      tipoFalla: EstadoErrorKind | null
      /** Se están volviendo a pedir los detalles que fallaron. */
      reintentando: boolean
    }

export interface Resultados {
  resumen: EstadoResumen
  completadas: EstadoCompletadas
  /** Vuelve a pedir el saldo y las evaluaciones, y después los detalles. */
  reintentar: () => void
  /** Vuelve a pedir solo los detalles (como mucho TOPE_EVALUACIONES peticiones). */
  reintentarCompletadas: () => void
}

/** Lo que dejó la última carga del resumen, con el intento al que pertenece. */
interface ResumenGuardado {
  intento: number
  datos:
    | {
        fase: 'listo'
        saldo: number | null
        evaluacionesActivas: number
        candidatosCompletados: number
        totalEvaluaciones: number
        /** Evaluaciones cuyo detalle se pide (PB-05). */
        seleccion: AssessmentSummary[]
      }
    | { fase: 'error'; error: unknown }
}

/** Lo que dejó la última carga de detalles. */
interface DetallesGuardados {
  intento: number
  intentoDetalles: number
  agregado: AgregadoCompletadas
}

function saldoDe(creditos: CreditsData | null | undefined): number | null {
  const balance = creditos?.balance
  return typeof balance === 'number' && Number.isFinite(balance) ? balance : null
}

function evaluacionesDe(lista: unknown): AssessmentSummary[] {
  if (!Array.isArray(lista)) return []
  return lista.filter((item): item is AssessmentSummary => typeof item === 'object' && item !== null)
}

export function useResultados(): Resultados {
  // Cada «Reintentar» sube su contador y vuelve a disparar la carga.
  const [intento, setIntento] = useState(0)
  const [intentoDetalles, setIntentoDetalles] = useState(0)
  const [resumen, setResumen] = useState<ResumenGuardado | null>(null)
  const [detalles, setDetalles] = useState<DetallesGuardados | null>(null)

  useEffect(() => {
    let vigente = true
    Promise.all([getCredits(), listAssessments()])
      .then(([creditos, lista]) => {
        if (!vigente) return
        const evaluaciones = evaluacionesDe(lista)
        setResumen({
          intento,
          datos: {
            fase: 'listo',
            saldo: saldoDe(creditos),
            evaluacionesActivas: contarEvaluacionesActivas(evaluaciones),
            candidatosCompletados: contarCandidatosCompletados(evaluaciones),
            totalEvaluaciones: evaluaciones.length,
            seleccion: seleccionarEvaluaciones(evaluaciones),
          },
        })
      })
      .catch((error: unknown) => {
        if (vigente) setResumen({ intento, datos: { fase: 'error', error } })
      })
    return () => {
      vigente = false
    }
  }, [intento])

  const listo = resumen?.intento === intento && resumen.datos.fase === 'listo' ? resumen.datos : null
  const seleccion = listo ? listo.seleccion : null

  useEffect(() => {
    if (!seleccion || seleccion.length === 0) return
    let vigente = true
    Promise.allSettled(seleccion.map((evaluacion) => getAssessment(evaluacion.id)))
      .then((resultados) => agregarCompletadas(seleccion, resultados))
      .catch(
        (error: unknown): AgregadoCompletadas => ({
          filas: [],
          pedidas: seleccion.length,
          fallidas: seleccion.length,
          error,
        }),
      )
      .then((agregado) => {
        if (vigente) setDetalles({ intento, intentoDetalles, agregado })
      })
    return () => {
      vigente = false
    }
  }, [seleccion, intento, intentoDetalles])

  const reintentar = useCallback(() => setIntento((actual) => actual + 1), [])
  const reintentarCompletadas = useCallback(() => setIntentoDetalles((actual) => actual + 1), [])

  return {
    resumen: estadoDelResumen(resumen, intento),
    completadas: estadoDeCompletadas(seleccion, detalles, intento, intentoDetalles),
    reintentar,
    reintentarCompletadas,
  }
}

function estadoDelResumen(resumen: ResumenGuardado | null, intento: number): EstadoResumen {
  if (resumen?.intento === intento) {
    const { datos } = resumen
    if (datos.fase === 'error') return { fase: 'error', tipo: getErrorKind(datos.error), reintentando: false }
    return {
      fase: 'listo',
      saldo: datos.saldo,
      evaluacionesActivas: datos.evaluacionesActivas,
      candidatosCompletados: datos.candidatosCompletados,
      totalEvaluaciones: datos.totalEvaluaciones,
    }
  }
  // Intento nuevo en curso: un error anterior sigue a la vista mientras se reintenta.
  if (resumen?.datos.fase === 'error') {
    return { fase: 'error', tipo: getErrorKind(resumen.datos.error), reintentando: true }
  }
  return { fase: 'cargando' }
}

function estadoDeCompletadas(
  seleccion: readonly AssessmentSummary[] | null,
  detalles: DetallesGuardados | null,
  intento: number,
  intentoDetalles: number,
): EstadoCompletadas {
  if (!seleccion) return { fase: 'cargando' }
  // Ninguna evaluación tiene completadas: no se pide ningún detalle.
  if (seleccion.length === 0) return { fase: 'listo', filas: [], fallidas: 0, tipoFalla: null, reintentando: false }
  if (!detalles || detalles.intento !== intento) return { fase: 'cargando' }

  const { filas, pedidas, fallidas, error } = detalles.agregado
  const reintentando = detalles.intentoDetalles !== intentoDetalles
  if (fallidas > 0 && fallidas >= pedidas) return { fase: 'error', tipo: getErrorKind(error), reintentando }
  return { fase: 'listo', filas, fallidas, tipoFalla: fallidas > 0 ? getErrorKind(error) : null, reintentando }
}
