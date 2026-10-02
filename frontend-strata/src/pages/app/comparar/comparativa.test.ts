import { describe, expect, it } from 'vitest'
import type { CompareData, CompareRow } from '@/api/rh'
import { csvAnterior, filasAnteriores, nombreCsvAnterior, TIPO_CSV_ANTERIOR } from '@/test/comparativaAnterior'
import {
  anchoMinimoDeTabla,
  descripcionDeCelda,
  etiquetaDeCategoria,
  generarCsv,
  nombreDelCsv,
  ordenarFilas,
  puntajeVisible,
  TIPO_CSV,
  tonoDeCategoria,
} from './comparativa'

// Orden y CSV contra el código anterior (src/test/comparativaAnterior.ts, copia literal de
// 2026-09-12-fase2-panel-rh.md:1601-1633); formato de la celda según D-14.

// ── Datos ─────────────────────────────────────────────────────────────────

/** Sin puntajes: PHP serializa el arreglo vacío como [] y no como {}. */
const SIN_PUNTAJES = [] as unknown as CompareRow['scores']

const DATOS: CompareData = {
  assessment: { id: 13, name: 'Coordinación de almacén · "septiembre", turno A' },
  scales: [
    { code: 'RES', name: 'Orientación a resultados' },
    { code: 'COL', name: 'Colaboración' },
    { code: 'ADA', name: 'Adaptabilidad' },
  ],
  rows: [
    {
      invitation_id: 41,
      candidate: 'Valentina Ríos',
      status: 'completada',
      scores: {
        RES: { category: 'alto', percentile: 81, normalized: 81.25 },
        COL: { category: 'alto', percentile: 69, normalized: 68.75 },
        ADA: { category: 'medio', percentile: 44, normalized: 43.75 },
      },
    },
    {
      invitation_id: 42,
      candidate: 'Joaquín "Quino" Herrera',
      status: 'completada',
      scores: {
        RES: { category: 'medio', percentile: 50, normalized: 50 },
        COL: { category: 'bajo', percentile: null, normalized: 12.5 },
      },
    },
    { invitation_id: 43, candidate: 'Paredes, Lucía', status: 'completada', scores: SIN_PUNTAJES },
    {
      invitation_id: 44,
      candidate: 'Mateo Cárdenas',
      status: 'completada',
      scores: {
        RES: { category: 'medio', percentile: 50, normalized: 50 },
        COL: { category: 'alto', percentile: 94, normalized: 93.75 },
        ADA: { category: 'bajo', percentile: 25, normalized: 25 },
      },
    },
  ],
}

const nombres = (filas: readonly CompareRow[]) => filas.map((fila) => fila.candidate)

describe('ordenarFilas', () => {
  it('sin orden deja las filas como llegan del servidor', () => {
    expect(ordenarFilas(DATOS.rows, null)).toBe(DATOS.rows)
  })

  it.each([
    ['RES', true],
    ['RES', false],
    ['COL', true],
    ['COL', false],
    ['ADA', true],
    ['ADA', false],
    ['XYZ', true],
  ])('por %s (descendente: %s) da el mismo orden que el código anterior', (escala, descendente) => {
    const esperado = filasAnteriores(DATOS, escala, !descendente)
    expect(nombres(ordenarFilas(DATOS.rows, { escala, descendente }))).toEqual(nombres(esperado))
  })

  it('sin puntaje cuenta como -1: al final de mayor a menor y al principio de menor a mayor', () => {
    expect(nombres(ordenarFilas(DATOS.rows, { escala: 'ADA', descendente: true }))).toEqual([
      'Valentina Ríos',
      'Mateo Cárdenas',
      'Joaquín "Quino" Herrera',
      'Paredes, Lucía',
    ])
    expect(nombres(ordenarFilas(DATOS.rows, { escala: 'ADA', descendente: false }))).toEqual([
      'Joaquín "Quino" Herrera',
      'Paredes, Lucía',
      'Mateo Cárdenas',
      'Valentina Ríos',
    ])
  })

  it('los empates conservan el orden del servidor y no cambia el arreglo original', () => {
    const copia = [...DATOS.rows]
    // Joaquín y Mateo empatan en RES (50).
    expect(nombres(ordenarFilas(DATOS.rows, { escala: 'RES', descendente: true }))).toEqual([
      'Valentina Ríos',
      'Joaquín "Quino" Herrera',
      'Mateo Cárdenas',
      'Paredes, Lucía',
    ])
    expect(DATOS.rows).toEqual(copia)
  })
})

describe('generarCsv', () => {
  it('sin orden es idéntico al CSV anterior', () => {
    expect(generarCsv(DATOS, DATOS.rows)).toBe(csvAnterior(DATOS, filasAnteriores(DATOS, null, false)))
  })

  it.each([
    ['RES', true],
    ['COL', false],
    ['ADA', true],
  ])('ordenado por %s (descendente: %s) es idéntico al CSV anterior', (escala, descendente) => {
    const filas = ordenarFilas(DATOS.rows, { escala, descendente })
    expect(generarCsv(DATOS, filas)).toBe(csvAnterior(DATOS, filasAnteriores(DATOS, escala, !descendente)))
  })

  it('conserva columnas y formato: encabezado sin comillas, celdas entre comillas y «categoría (percentil)»', () => {
    expect(generarCsv(DATOS, DATOS.rows)).toBe(
      [
        'Candidato,Orientación a resultados,Colaboración,Adaptabilidad',
        '"Valentina Ríos","alto (81)","alto (69)","medio (44)"',
        '"Joaquín ""Quino"" Herrera","medio (50)","bajo ()",""',
        '"Paredes, Lucía","","",""',
        '"Mateo Cárdenas","medio (50)","alto (94)","bajo (25)"',
      ].join('\n'),
    )
  })

  it('sin filas solo lleva el encabezado; sin escalas, solo el candidato', () => {
    expect(generarCsv(DATOS, [])).toBe(csvAnterior(DATOS, []))
    const sinEscalas: CompareData = { ...DATOS, scales: [] }
    expect(generarCsv(sinEscalas, DATOS.rows)).toBe(csvAnterior(sinEscalas, DATOS.rows))
  })

  it('el archivo se llama y se tipa como antes: comparativa-{nombre}.csv, text/csv en UTF-8', () => {
    expect(nombreDelCsv(DATOS)).toBe(nombreCsvAnterior(DATOS))
    expect(nombreDelCsv(DATOS)).toBe('comparativa-Coordinación de almacén · "septiembre", turno A.csv')
    expect(TIPO_CSV).toBe(TIPO_CSV_ANTERIOR)
  })
})

describe('formato de la celda (D-14)', () => {
  it('el puntaje es normalized redondeado: el mismo valor que el «pc N» anterior', () => {
    for (const fila of DATOS.rows) {
      for (const puntaje of Object.values(fila.scores)) {
        if (puntaje.percentile !== null) expect(puntajeVisible(puntaje)).toBe(puntaje.percentile)
      }
    }
    expect(puntajeVisible({ normalized: 12.5, percentile: null })).toBe(13)
    expect(puntajeVisible({ normalized: 66.67, percentile: 67 })).toBe(67)
  })

  it('sin normalized usa percentile, para no perder el dato; sin ninguno, null', () => {
    expect(puntajeVisible({ normalized: null, percentile: 40 })).toBe(40)
    expect(puntajeVisible({ normalized: null, percentile: null })).toBeNull()
  })

  it('para lectores de pantalla: «81 de 100, categoría Alto», sin depender de «·»', () => {
    expect(descripcionDeCelda({ normalized: 81.25, percentile: 81, category: 'alto' })).toBe('81 de 100, categoría Alto')
    expect(descripcionDeCelda({ normalized: null, percentile: null, category: 'medio' })).toBe('categoría Medio')
    expect(descripcionDeCelda({ normalized: null, percentile: null, category: '' })).toBe('Sin datos')
  })

  it('la categoría va con mayúscula inicial y su tono solo si es bajo, medio o alto', () => {
    expect(etiquetaDeCategoria('alto')).toBe('Alto')
    expect(etiquetaDeCategoria('muy alto')).toBe('Muy alto')
    expect(etiquetaDeCategoria('')).toBeNull()
    expect(tonoDeCategoria('alto')).toBe('alto')
    expect(tonoDeCategoria(' Medio ')).toBe('medio')
    expect(tonoDeCategoria('bajo')).toBe('bajo')
    expect(tonoDeCategoria('sobresaliente')).toBeNull()
    expect(tonoDeCategoria(null)).toBeNull()
  })

  it('el ancho mínimo de la tabla crece con las escalas', () => {
    expect(anchoMinimoDeTabla(0)).toBe(560)
    expect(anchoMinimoDeTabla(3)).toBe(574)
    expect(anchoMinimoDeTabla(7)).toBe(1086)
  })
})
