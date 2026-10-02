import { describe, expect, it } from 'vitest'
import type { CreditsData } from '@/api/rh'
import {
  TIPOS_MOVIMIENTO,
  contarPorTipo,
  describirReferencia,
  formatearMonto,
  getTipoMovimientoMeta,
  prepararCreditos,
  resumirMovimientos,
} from './movimientos'

// Respuesta de GET /api/credits del escenario e2e/mocks/rh.json (saldo 37).
const DATOS: CreditsData = {
  balance: 37,
  transactions: [
    { type: 'consumo', amount: -4, reference: 'assessment:17', created_at: '2026-09-29 09:30' },
    { type: 'compra', amount: 20, reference: 'request:7', created_at: '2026-09-26 16:10' },
    { type: 'ajuste', amount: 2, reference: null, created_at: '2026-09-18 13:45' },
    { type: 'consumo', amount: -6, reference: 'assessment:13', created_at: '2026-09-16 10:02' },
    { type: 'consumo', amount: -5, reference: 'assessment:9', created_at: '2026-09-09 11:20' },
    { type: 'compra', amount: 25, reference: 'request:3', created_at: '2026-09-08 17:30' },
    { type: 'consumo', amount: -3, reference: 'assessment:6', created_at: '2026-09-05 12:05' },
    { type: 'consumo', amount: -2, reference: 'assessment:4', created_at: '2026-09-03 09:40' },
    { type: 'cortesia', amount: 10, reference: 'registro', created_at: '2026-09-02 10:15' },
  ],
}

describe('getTipoMovimientoMeta', () => {
  it('traduce los cuatro tipos del ledger con su tono', () => {
    expect(TIPOS_MOVIMIENTO.map((tipo) => getTipoMovimientoMeta(tipo))).toEqual([
      { label: 'Compra', tone: 'navy' },
      { label: 'Consumo', tone: 'neutral' },
      { label: 'Cortesía', tone: 'sky' },
      { label: 'Ajuste', tone: 'slate' },
    ])
  })

  it('muestra un tipo desconocido tal cual, con mayúscula y en tono neutro', () => {
    expect(getTipoMovimientoMeta('reembolso')).toEqual({ label: 'Reembolso', tone: 'neutral' })
    expect(getTipoMovimientoMeta('  ')).toEqual({ label: 'Sin tipo', tone: 'neutral' })
  })
})

describe('describirReferencia', () => {
  it('assessment:N enlaza a la evaluación como «Evaluación #N»', () => {
    expect(describirReferencia('assessment:12')).toEqual({
      tipo: 'evaluacion',
      id: '12',
      texto: 'Evaluación #12',
      ruta: '/app/evaluaciones/12',
    })
    expect(describirReferencia(' assessment:007 ')).toMatchObject({ texto: 'Evaluación #7', ruta: '/app/evaluaciones/7' })
  })

  it('request:N es «Solicitud aprobada» y registro es «Cortesía de registro»', () => {
    expect(describirReferencia('request:5')).toEqual({ tipo: 'texto', texto: 'Solicitud aprobada' })
    expect(describirReferencia('registro')).toEqual({ tipo: 'texto', texto: 'Cortesía de registro' })
  })

  it('deja cualquier otra referencia tal cual', () => {
    expect(describirReferencia('ajuste manual por soporte')).toEqual({ tipo: 'texto', texto: 'ajuste manual por soporte' })
    expect(describirReferencia('assessment:abc')).toEqual({ tipo: 'texto', texto: 'assessment:abc' })
    expect(describirReferencia('request:')).toEqual({ tipo: 'texto', texto: 'request:' })
  })

  it('sin referencia (null, vacía o espacios) no inventa texto', () => {
    expect(describirReferencia(null)).toEqual({ tipo: 'ninguna' })
    expect(describirReferencia(undefined)).toEqual({ tipo: 'ninguna' })
    expect(describirReferencia('   ')).toEqual({ tipo: 'ninguna' })
  })
})

describe('cifras', () => {
  // formatearNumero y textoCreditos se prueban en components/ui/formatoNumero.test.ts.
  it('el monto lleva signo: + al sumar y − (signo menos) al restar', () => {
    expect(formatearMonto(20)).toBe('+20')
    expect(formatearMonto(-4)).toBe('−4')
    expect(formatearMonto(-1200)).toBe('−1,200')
    expect(formatearMonto(0)).toBe('0')
  })
})

describe('totales y conteos', () => {
  it('recibidos suma los positivos y consumidos los negativos', () => {
    expect(resumirMovimientos([{ monto: 10 }, { monto: -3 }, { monto: 2 }, { monto: -1 }, { monto: 0 }])).toEqual({
      recibidos: 12,
      consumidos: 4,
    })
    expect(resumirMovimientos([])).toEqual({ recibidos: 0, consumidos: 0 })
  })

  it('cuenta los movimientos de cada tipo conocido', () => {
    expect(contarPorTipo([{ tipo: 'compra' }, { tipo: 'consumo' }, { tipo: 'consumo' }, { tipo: 'otro' }])).toEqual({
      compra: 1,
      consumo: 2,
      cortesia: 0,
      ajuste: 0,
    })
  })
})

describe('prepararCreditos', () => {
  it('arma saldo, totales y movimientos con referencias legibles', () => {
    const creditos = prepararCreditos(DATOS)
    expect(creditos.saldo).toBe(37)
    expect(creditos.recibidos).toBe(57)
    expect(creditos.consumidos).toBe(20)
    expect(creditos.movimientos).toHaveLength(9)
    expect(creditos.movimientos[0]).toMatchObject({
      clave: 0,
      tipo: 'consumo',
      monto: -4,
      referencia: { tipo: 'evaluacion', texto: 'Evaluación #17' },
      fecha: { texto: '29 sep 2026', hora: '09:30', iso: '2026-09-29T09:30' },
    })
    expect(creditos.movimientos[8].referencia).toEqual({ tipo: 'texto', texto: 'Cortesía de registro' })
  })

  it('una fecha que no se entiende se conserva como texto; sin fecha queda null', () => {
    const creditos = prepararCreditos({
      balance: 2,
      transactions: [
        { type: 'compra', amount: 1, reference: null, created_at: 'ayer' },
        { type: 'compra', amount: 1, reference: null, created_at: null },
      ],
    })
    expect(creditos.movimientos.map((m) => m.fecha)).toEqual([{ texto: 'ayer', hora: null, iso: null }, null])
  })

  it('ordena del más reciente al más antiguo, deja al final lo que no tiene fecha y conserva los empates', () => {
    const creditos = prepararCreditos({
      balance: 6,
      transactions: [
        { type: 'compra', amount: 1, reference: 'a', created_at: '2026-09-01 10:00' },
        { type: 'compra', amount: 1, reference: 'b', created_at: null },
        { type: 'compra', amount: 1, reference: 'c', created_at: '2026-09-03 10:00' },
        { type: 'compra', amount: 1, reference: 'd', created_at: '2026-09-01 10:00' },
      ],
    })
    expect(creditos.movimientos.map((m) => (m.referencia.tipo === 'texto' ? m.referencia.texto : ''))).toEqual([
      'c',
      'a',
      'd',
      'b',
    ])
  })

  it('tolera cifras como texto, filas que no son objetos y una respuesta sin movimientos', () => {
    const creditos = prepararCreditos({
      balance: '12' as unknown as number,
      transactions: [
        { type: 'compra', amount: '15' as unknown as number, reference: null, created_at: '2026-09-01 10:00' },
        null as unknown as CreditsData['transactions'][number],
        { type: 'consumo', amount: 'x' as unknown as number, reference: null, created_at: '2026-09-02 10:00' },
      ],
    })
    expect(creditos.saldo).toBe(12)
    expect(creditos.movimientos.map((m) => m.monto)).toEqual([0, 15])
    expect(prepararCreditos({ balance: 0, transactions: [] })).toEqual({
      saldo: 0,
      recibidos: 0,
      consumidos: 0,
      movimientos: [],
    })
    expect(prepararCreditos(null).saldo).toBeNull()
  })
})
