import type { CreditsData } from '@/api/rh'
import { formatearFecha, type BadgeTone, type FechaLegible } from '@/components/ui'

// Datos de /app/creditos (mapa.md, RH-5; D-08): saldo, totales y movimientos
// del ledger de créditos con referencias legibles. Solo funciones puras; las
// pantallas las pintan. Contrato: GET /api/credits → { balance, transactions[]
// con type, amount, reference y created_at «Y-m-d H:i» }, ordenado del más
// reciente al más antiguo (2026-09-12-fase2-panel-rh.md:897-904).

/** Tipos de movimiento del ledger (credit_transactions.type), en el orden del filtro. */
export type TipoMovimiento = 'compra' | 'consumo' | 'cortesia' | 'ajuste'

export const TIPOS_MOVIMIENTO: readonly TipoMovimiento[] = ['compra', 'consumo', 'cortesia', 'ajuste']

export interface TipoMovimientoMeta {
  /** Texto visible del tipo. */
  label: string
  /** Tono del Badge. */
  tone: BadgeTone
}

/*
 * Tonos de la paleta del inventario (Strata.dc.html:1831-1836), por equivalencia:
 * - compra   → navy, como «Disponible»: créditos que llegan para usarse.
 * - cortesia → sky, como «Enviada».
 * - consumo  → neutral, como «Consumida».
 * - ajuste   → coral: no existe en el prototipo; tinte de su insignia
 *   (Strata.dc.html:266-268), distinto de los demás. Puede sumar o restar.
 * El texto acompaña siempre al tono.
 */
const META: Record<TipoMovimiento, TipoMovimientoMeta> = {
  compra: { label: 'Compra', tone: 'navy' },
  consumo: { label: 'Consumo', tone: 'neutral' },
  cortesia: { label: 'Cortesía', tone: 'sky' },
  ajuste: { label: 'Ajuste', tone: 'coral' },
}

/** true si el texto es uno de los cuatro tipos conocidos. */
export function esTipoMovimiento(valor: string): valor is TipoMovimiento {
  return Object.hasOwn(META, valor)
}

/**
 * Texto y tono de un tipo. Un tipo desconocido se muestra tal cual (con
 * mayúscula inicial) y en tono neutro, para no perder el dato.
 */
export function getTipoMovimientoMeta(tipo: string): TipoMovimientoMeta {
  if (esTipoMovimiento(tipo)) return META[tipo]
  const texto = tipo.trim()
  return {
    label: texto ? texto.charAt(0).toLocaleUpperCase('es-MX') + texto.slice(1) : 'Sin tipo',
    tone: 'neutral',
  }
}

// ── Referencias ─────────────────────────────────────────────────────────────

/** Referencia legible de un movimiento. */
export type Referencia =
  /** assessment:N: la evaluación que consumió los créditos. Enlaza a su detalle. */
  | { tipo: 'evaluacion'; id: string; texto: string; ruta: string }
  /** request:N, registro u otra referencia, como texto. */
  | { tipo: 'texto'; texto: string }
  /** Sin referencia (null o vacía). */
  | { tipo: 'ninguna' }

/**
 * Traduce la referencia cruda del ledger (2026-09-12-fase2-panel-rh.md:453,
 * :1092; 2026-09-12-registro-login-crud-usuarios.md:299):
 * - assessment:N → «Evaluación #N», con enlace a /app/evaluaciones/N.
 * - request:N → «Solicitud aprobada» (RR. HH. no ve sus solicitudes: PB-08).
 * - registro → «Cortesía de registro».
 * - Cualquier otra, tal cual.
 */
export function describirReferencia(referencia: string | null | undefined): Referencia {
  const valor = typeof referencia === 'string' ? referencia.trim() : ''
  if (!valor) return { tipo: 'ninguna' }

  const evaluacion = /^assessment:(\d+)$/.exec(valor)
  if (evaluacion) {
    const id = evaluacion[1].replace(/^0+(?=\d)/, '')
    return { tipo: 'evaluacion', id, texto: `Evaluación #${id}`, ruta: `/app/evaluaciones/${id}` }
  }
  if (/^request:\d+$/.test(valor)) return { tipo: 'texto', texto: 'Solicitud aprobada' }
  if (valor === 'registro') return { tipo: 'texto', texto: 'Cortesía de registro' }
  return { tipo: 'texto', texto: valor }
}

// ── Cifras ──────────────────────────────────────────────────────────────────
// La fecha («04 sep 2026» y la hora tal como la manda el servidor, sin
// convertir zonas) sale de formatearFecha, del sistema de diseño.

const numero = new Intl.NumberFormat('es-MX')

/** Cifra de créditos con separador de miles: 1250 → «1,250». */
export function formatearCreditos(valor: number): string {
  return numero.format(valor)
}

/** «1 crédito» o «N créditos». */
export function textoCreditos(valor: number): string {
  return `${formatearCreditos(valor)} ${valor === 1 ? 'crédito' : 'créditos'}`
}

/** Monto con signo: «+20», «−4» (signo menos tipográfico) o «0». */
export function formatearMonto(monto: number): string {
  if (monto > 0) return `+${formatearCreditos(monto)}`
  if (monto < 0) return `−${formatearCreditos(Math.abs(monto))}`
  return '0'
}

// ── Movimientos y totales ───────────────────────────────────────────────────

/** Movimiento listo para la tabla. */
export interface Movimiento {
  /** Posición en la respuesta: las transacciones no traen id. Sirve de clave estable. */
  clave: number
  /** type tal como llega (compra, consumo, cortesia, ajuste u otro). */
  tipo: string
  /** amount: positivo suma, negativo resta. */
  monto: number
  referencia: Referencia
  /**
   * created_at con formato («04 sep 2026» y «10:15»). null si no llega; si no
   * es una fecha, el texto tal cual con iso null.
   */
  fecha: FechaLegible | null
  /** created_at crudo, para ordenar. */
  creadoEn: string | null
}

/** Datos de la pantalla de créditos. */
export interface Creditos {
  /** balance de la API (suma del ledger). null si no llega un número. */
  saldo: number | null
  /** Suma de los movimientos positivos. */
  recibidos: number
  /** Suma de los movimientos negativos, en positivo. */
  consumidos: number
  /** Movimientos del más reciente al más antiguo. */
  movimientos: Movimiento[]
}

function aNumero(valor: unknown): number | null {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : null
  if (typeof valor === 'string' && valor.trim() !== '') {
    const convertido = Number(valor)
    return Number.isFinite(convertido) ? convertido : null
  }
  return null
}

function aTexto(valor: unknown): string | null {
  return typeof valor === 'string' ? valor : null
}

/** Recibidos (suma de positivos) y consumidos (suma de negativos, en positivo). */
export function resumirMovimientos(movimientos: ReadonlyArray<{ monto: number }>): {
  recibidos: number
  consumidos: number
} {
  let recibidos = 0
  let consumidos = 0
  for (const { monto } of movimientos) {
    if (monto > 0) recibidos += monto
    else if (monto < 0) consumidos -= monto
  }
  return { recibidos, consumidos }
}

/** Cuántos movimientos hay de cada tipo conocido. */
export function contarPorTipo(movimientos: ReadonlyArray<{ tipo: string }>): Record<TipoMovimiento, number> {
  const conteo: Record<TipoMovimiento, number> = { compra: 0, consumo: 0, cortesia: 0, ajuste: 0 }
  for (const { tipo } of movimientos) {
    if (esTipoMovimiento(tipo)) conteo[tipo] += 1
  }
  return conteo
}

/** Del más reciente al más antiguo; sin fecha, al final. Los empates conservan el orden de la API. */
function compararPorFecha(a: Movimiento, b: Movimiento): number {
  if (a.creadoEn !== b.creadoEn) {
    if (a.creadoEn === null) return 1
    if (b.creadoEn === null) return -1
    return a.creadoEn < b.creadoEn ? 1 : -1
  }
  return a.clave - b.clave
}

/**
 * Convierte la respuesta de GET /api/credits en los datos de la pantalla. Tolera
 * cifras que lleguen como texto y omite filas que no sean objetos.
 */
export function prepararCreditos(datos: CreditsData | null | undefined): Creditos {
  const crudas: unknown[] = Array.isArray(datos?.transactions) ? datos.transactions : []
  const movimientos: Movimiento[] = []
  crudas.forEach((cruda, indice) => {
    if (typeof cruda !== 'object' || cruda === null) return
    const fila = cruda as Record<string, unknown>
    const creadoEn = aTexto(fila.created_at)
    movimientos.push({
      clave: indice,
      tipo: aTexto(fila.type) ?? '',
      monto: aNumero(fila.amount) ?? 0,
      referencia: describirReferencia(aTexto(fila.reference)),
      fecha: formatearFecha(creadoEn),
      creadoEn,
    })
  })
  movimientos.sort(compararPorFecha)
  return { saldo: aNumero(datos?.balance), ...resumirMovimientos(movimientos), movimientos }
}
