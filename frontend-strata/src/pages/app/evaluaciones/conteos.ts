import type { AssessmentSummary } from '@/api/rh'
import { INVITATION_STATUSES, isInvitationStatus, type InvitationStatus } from '@/components/ui'

/** Invitaciones por cada uno de los cuatro estados del backend. */
export type ConteoPorEstado = Record<InvitationStatus, number>

function conteoVacio(): ConteoPorEstado {
  return { pendiente: 0, iniciada: 0, completada: 0, expirada: 0 }
}

/** Cuenta las invitaciones de un detalle por estado. Un estado desconocido no suma en ninguno. */
export function contarInvitaciones(invitaciones: ReadonlyArray<{ status: string }>): ConteoPorEstado {
  const conteo = conteoVacio()
  for (const { status } of invitaciones) {
    if (isInvitationStatus(status)) conteo[status] += 1
  }
  return conteo
}

function entero(valor: unknown): number {
  const n = Number(valor)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
}

/**
 * Conteos de una fila de GET /api/assessments. El índice cuenta total,
 * pendiente, iniciada y completada, pero no expirada (pendientes-backend.md,
 * PB-07). Como status solo admite esos cuatro valores
 * (2026-09-11-fase1-nucleo.md:311), las expiradas son el total menos los otros
 * tres. Nunca da negativos.
 */
export function conteosDeResumen(counts: AssessmentSummary['counts']): ConteoPorEstado {
  const pendiente = entero(counts.pendiente)
  const iniciada = entero(counts.iniciada)
  const completada = entero(counts.completada)
  const expirada = Math.max(0, entero(counts.total) - pendiente - iniciada - completada)
  return { pendiente, iniciada, completada, expirada }
}

const PALABRAS: Record<InvitationStatus, readonly [singular: string, plural: string]> = {
  pendiente: ['pendiente', 'pendientes'],
  iniciada: ['iniciada', 'iniciadas'],
  completada: ['completada', 'completadas'],
  expirada: ['expirada', 'expiradas'],
}

/** «1 pendiente», «3 completadas». */
export function textoConteo(estado: InvitationStatus, n: number): string {
  const [singular, plural] = PALABRAS[estado]
  return `${n} ${n === 1 ? singular : plural}`
}

/** Invitaciones de todas las evaluaciones: por estado y en total. */
export interface ConteoTotal {
  conteo: ConteoPorEstado
  /** Suma de counts.total: los candidatos invitados. */
  total: number
}

/**
 * Suma los conteos de todas las evaluaciones de GET /api/assessments: el
 * resumen por estado de «Candidatos» (brechas.md P-12, en lugar del saldo por
 * prueba del prototipo). El total es la suma de los cuatro estados, así que
 * cada barra mide su parte del total.
 */
export function sumarConteos(evaluaciones: ReadonlyArray<Pick<AssessmentSummary, 'counts'>>): ConteoTotal {
  const conteo = conteoVacio()
  for (const { counts } of evaluaciones) {
    const propio = conteosDeResumen(counts)
    for (const estado of INVITATION_STATUSES) conteo[estado] += propio[estado]
  }
  const total = INVITATION_STATUSES.reduce((suma, estado) => suma + conteo[estado], 0)
  return { conteo, total }
}

/** Los estados con al menos una invitación, en orden de avance. */
export function estadosConInvitaciones(conteo: ConteoPorEstado): InvitationStatus[] {
  return INVITATION_STATUSES.filter((estado) => conteo[estado] > 0)
}

/** «1 candidato», «4 candidatos». */
export function textoCandidatos(n: number): string {
  return `${n} ${n === 1 ? 'candidato' : 'candidatos'}`
}
