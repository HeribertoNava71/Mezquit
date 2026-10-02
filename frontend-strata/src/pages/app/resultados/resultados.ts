import type { AssessmentDetail, AssessmentSummary } from '@/api/rh'

// «Resultados» (/app; R-15, D-06): cifras de las StatCards y agregación
// limitada de «Últimas completadas» mientras no exista una lista de
// invitaciones de la organización (PB-05). Solo funciones puras.
//
// Sin PB-05, la tabla se arma con GET /api/assessments (conteos por estado) y
// con el detalle GET /api/assessments/{id} de unas pocas evaluaciones. El
// detalle no trae la fecha en que cada candidato terminó (PB-06), así que el
// orden sigue la fecha de creación de la evaluación.
//
// La fecha de la tabla («20 sep 2026») la pinta el componente base Fecha, y las
// cifras («1,250»), formatearNumero del sistema de diseño.

/** Tope de evaluaciones cuyo detalle se pide en cada carga (PB-05). */
export const TOPE_EVALUACIONES = 5

/** Estado de invitación que cuenta como «completada» (status del backend). */
const COMPLETADA = 'completada'

/** Conteo de counts como número finito; 0 si falta o no es válido. */
function conteo(evaluacion: AssessmentSummary, campo: 'total' | 'completada'): number {
  const valor = evaluacion.counts?.[campo]
  return typeof valor === 'number' && Number.isFinite(valor) ? valor : 0
}

/**
 * Evaluaciones activas, con la regla del Resumen anterior: tienen menos
 * candidatos completados que invitaciones (las pendientes, las iniciadas y las
 * expiradas cuentan como «sin terminar»).
 */
export function contarEvaluacionesActivas(evaluaciones: readonly AssessmentSummary[]): number {
  return evaluaciones.filter((evaluacion) => conteo(evaluacion, 'completada') < conteo(evaluacion, 'total')).length
}

/** Candidatos completados: suma de counts.completada de todas las evaluaciones. */
export function contarCandidatosCompletados(evaluaciones: readonly AssessmentSummary[]): number {
  return evaluaciones.reduce((suma, evaluacion) => suma + conteo(evaluacion, 'completada'), 0)
}

/** Fecha ISO «AAAA-MM-DD» (con o sin hora) como día en UTC. */
const FECHA_ISO = /^(\d{4})-(\d{2})-(\d{2})/

/**
 * Milisegundos del día de una fecha «AAAA-MM-DD» (created_at llega con
 * format('Y-m-d')), leída en UTC para que el día no cambie con la zona horaria.
 * null si falta o no tiene ese formato.
 */
export function diaDeFecha(fecha: string | null | undefined): number | null {
  if (!fecha) return null
  const partes = FECHA_ISO.exec(fecha.trim())
  if (!partes) return null
  const dia = Date.UTC(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]))
  return Number.isNaN(dia) ? null : dia
}

/**
 * Evaluaciones cuyo detalle se pide para «Últimas completadas»: las que tienen
 * al menos un candidato completado, de la más reciente a la más antigua por
 * created_at, y como mucho `tope`. En el mismo día (o sin fecha, que va al
 * final) gana el id mayor, que es la creada después.
 */
export function seleccionarEvaluaciones(
  evaluaciones: readonly AssessmentSummary[],
  tope: number = TOPE_EVALUACIONES,
): AssessmentSummary[] {
  return evaluaciones
    .filter((evaluacion) => conteo(evaluacion, 'completada') > 0)
    .map((evaluacion) => ({ evaluacion, dia: diaDeFecha(evaluacion.created_at) }))
    .sort((a, b) => {
      if (a.dia !== b.dia) {
        if (a.dia === null) return 1
        if (b.dia === null) return -1
        return b.dia - a.dia
      }
      return b.evaluacion.id - a.evaluacion.id
    })
    .slice(0, Math.max(0, Math.floor(tope)))
    .map(({ evaluacion }) => evaluacion)
}

/** Fila de «Últimas completadas»: una invitación completada. */
export interface FilaCompletada {
  /** Id de la invitación; el reporte está en /app/candidatos/{id}/reporte. */
  invitacionId: number
  candidato: string
  correo: string
  evaluacionId: number
  evaluacion: string
  /** Puesto de la evaluación; null si no tiene. */
  puesto: string | null
  /** created_at de la evaluación («AAAA-MM-DD»): es lo que ordena la tabla (PB-06). */
  fechaEvaluacion: string | null
}

function textoONulo(valor: string | null | undefined): string | null {
  const texto = typeof valor === 'string' ? valor.trim() : ''
  return texto === '' ? null : texto
}

/**
 * Invitaciones completadas de una evaluación como filas, en el orden en que
 * las devuelve el detalle. Nombre y puesto salen del detalle y, si faltan, del
 * resumen de la lista.
 */
export function filasDeEvaluacion(resumen: AssessmentSummary, detalle: AssessmentDetail): FilaCompletada[] {
  const invitaciones = Array.isArray(detalle.invitations) ? detalle.invitations : []
  const evaluacion = textoONulo(detalle.name) ?? resumen.name
  const puesto = textoONulo(detalle.position) ?? textoONulo(resumen.position)
  return invitaciones
    .filter((invitacion) => invitacion?.status === COMPLETADA)
    .map((invitacion) => ({
      invitacionId: invitacion.id,
      candidato: invitacion.candidate,
      correo: invitacion.email,
      evaluacionId: resumen.id,
      evaluacion,
      puesto,
      fechaEvaluacion: resumen.created_at,
    }))
}

/** Resultado de juntar los detalles de las evaluaciones seleccionadas. */
export interface AgregadoCompletadas {
  /** Invitaciones completadas, evaluación por evaluación en el orden de la selección. */
  filas: FilaCompletada[]
  /** Detalles pedidos (uno por evaluación seleccionada). */
  pedidas: number
  /** Detalles que no se pudieron cargar. */
  fallidas: number
  /** Error del primer detalle que falló (para elegir el tipo de error); undefined si ninguno falló. */
  error: unknown
}

/**
 * Junta los detalles pedidos con Promise.allSettled: `resultados[i]` es el
 * detalle de `seleccion[i]`. Los que fallaron no aportan filas y se cuentan en
 * `fallidas`, para avisar en lugar de mostrar una lista incompleta en silencio.
 */
export function agregarCompletadas(
  seleccion: readonly AssessmentSummary[],
  resultados: readonly PromiseSettledResult<AssessmentDetail>[],
): AgregadoCompletadas {
  const filas: FilaCompletada[] = []
  let fallidas = 0
  let error: unknown = undefined
  seleccion.forEach((evaluacion, indice) => {
    const resultado = resultados[indice]
    if (resultado?.status === 'fulfilled' && resultado.value) {
      filas.push(...filasDeEvaluacion(evaluacion, resultado.value))
      return
    }
    if (fallidas === 0) error = resultado?.status === 'rejected' ? resultado.reason : undefined
    fallidas += 1
  })
  return { filas, pedidas: seleccion.length, fallidas, error }
}
