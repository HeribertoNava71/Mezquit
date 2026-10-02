import { describe, expect, it } from 'vitest'
import type { AssessmentDetail, AssessmentSummary, InvitationRow } from '@/api/rh'
import {
  TOPE_EVALUACIONES,
  agregarCompletadas,
  contarCandidatosCompletados,
  contarEvaluacionesActivas,
  diaDeFecha,
  filasDeEvaluacion,
  formatearNumero,
  seleccionarEvaluaciones,
} from './resultados'

// Formas de GET /api/assessments (AssessmentController@index: created_at con
// format('Y-m-d') y orden por created_at desc) y de GET /api/assessments/{id}
// (show: id, name, position e invitations con id, candidate, email, status y link).

function evaluacion(
  id: number,
  conteos: Partial<AssessmentSummary['counts']> = {},
  parcial: Partial<AssessmentSummary> = {},
): AssessmentSummary {
  const counts = { total: 0, pendiente: 0, iniciada: 0, completada: 0, ...conteos }
  return {
    id,
    name: `Evaluación ${id}`,
    position: `Puesto ${id}`,
    deadline: null,
    status: 'activa',
    counts,
    created_at: '2026-09-01',
    ...parcial,
  }
}

function invitacion(id: number, status: string, candidate = `Candidato ${id}`): InvitationRow {
  return { id, candidate, email: `c${id}@empresa.mx`, status, link: `http://localhost:5173/evaluar/token${id}` }
}

function detalle(resumen: AssessmentSummary, invitations: InvitationRow[], parcial: Partial<AssessmentDetail> = {}): AssessmentDetail {
  return { id: resumen.id, name: resumen.name, position: resumen.position, invitations, ...parcial }
}

describe('contarEvaluacionesActivas (regla del Resumen anterior: completada < total)', () => {
  it('cuenta las que tienen candidatos sin terminar, incluidas las expiradas', () => {
    const lista = [
      evaluacion(1, { total: 3, pendiente: 1, iniciada: 1, completada: 1 }),
      evaluacion(2, { total: 2, completada: 2 }),
      // 1 expirada: total 2, completada 1 (counts no trae «expirada») → activa
      evaluacion(3, { total: 2, completada: 1 }),
      // Sin invitaciones: 0 < 0 es falso → no activa
      evaluacion(4, { total: 0 }),
    ]
    expect(contarEvaluacionesActivas(lista)).toBe(2)
  })

  it('sin evaluaciones da 0', () => {
    expect(contarEvaluacionesActivas([])).toBe(0)
  })
})

describe('contarCandidatosCompletados', () => {
  it('suma counts.completada de todas las evaluaciones, no solo de las 5 de la tabla', () => {
    const lista = Array.from({ length: 8 }, (_, i) => evaluacion(i + 1, { total: 4, completada: i % 3 }))
    // 0 + 1 + 2 + 0 + 1 + 2 + 0 + 1
    expect(contarCandidatosCompletados(lista)).toBe(7)
  })

  it('ignora conteos ausentes o inválidos', () => {
    const rota = { ...evaluacion(9), counts: undefined } as unknown as AssessmentSummary
    const texto = evaluacion(10, { completada: '3' as unknown as number })
    expect(contarCandidatosCompletados([rota, texto, evaluacion(11, { total: 2, completada: 2 })])).toBe(2)
  })
})

describe('seleccionarEvaluaciones (agregación limitada, PB-05)', () => {
  it(`toma como mucho ${TOPE_EVALUACIONES} evaluaciones`, () => {
    expect(TOPE_EVALUACIONES).toBe(5)
    const lista = Array.from({ length: 9 }, (_, i) =>
      evaluacion(i + 1, { total: 2, completada: 1 }, { created_at: `2026-09-0${i + 1}` }),
    )
    const elegidas = seleccionarEvaluaciones(lista)
    expect(elegidas).toHaveLength(5)
    expect(elegidas.map((e) => e.id)).toEqual([9, 8, 7, 6, 5])
  })

  it('solo considera las que tienen al menos un candidato completado', () => {
    const lista = [
      evaluacion(1, { total: 3, completada: 0 }, { created_at: '2026-09-30' }),
      evaluacion(2, { total: 3, completada: 2 }, { created_at: '2026-09-10' }),
      evaluacion(3, { total: 0 }, { created_at: '2026-09-29' }),
    ]
    expect(seleccionarEvaluaciones(lista).map((e) => e.id)).toEqual([2])
  })

  it('ordena por created_at de la más reciente a la más antigua aunque la lista llegue desordenada', () => {
    const lista = [
      evaluacion(1, { completada: 1 }, { created_at: '2026-08-15' }),
      evaluacion(2, { completada: 1 }, { created_at: '2026-09-20' }),
      evaluacion(3, { completada: 1 }, { created_at: '2025-12-31' }),
      evaluacion(4, { completada: 1 }, { created_at: '2026-09-02' }),
    ]
    expect(seleccionarEvaluaciones(lista).map((e) => e.id)).toEqual([2, 4, 1, 3])
  })

  it('en el mismo día gana el id mayor y las que no tienen fecha van al final', () => {
    const lista = [
      evaluacion(3, { completada: 1 }, { created_at: null }),
      evaluacion(10, { completada: 1 }, { created_at: '2026-09-20' }),
      evaluacion(12, { completada: 1 }, { created_at: '2026-09-20' }),
      evaluacion(7, { completada: 1 }, { created_at: 'fecha rara' }),
      evaluacion(11, { completada: 1 }, { created_at: '2026-09-20' }),
    ]
    expect(seleccionarEvaluaciones(lista).map((e) => e.id)).toEqual([12, 11, 10, 7, 3])
  })

  it('acepta otro tope y no muta la lista recibida', () => {
    const lista = [evaluacion(1, { completada: 1 }), evaluacion(2, { completada: 1 }), evaluacion(3, { completada: 1 })]
    const copia = [...lista]
    expect(seleccionarEvaluaciones(lista, 2).map((e) => e.id)).toEqual([3, 2])
    expect(seleccionarEvaluaciones(lista, 0)).toEqual([])
    expect(lista).toEqual(copia)
  })
})

describe('filasDeEvaluacion', () => {
  it('lista solo las invitaciones completadas, en el orden del detalle', () => {
    const resumen = evaluacion(5, { total: 4, completada: 2 }, { created_at: '2026-09-18' })
    const filas = filasDeEvaluacion(
      resumen,
      detalle(resumen, [
        invitacion(41, 'completada', 'Valentina Ríos'),
        invitacion(42, 'pendiente'),
        invitacion(43, 'iniciada'),
        invitacion(44, 'completada', 'Andrés Molina'),
        invitacion(45, 'expirada'),
      ]),
    )
    expect(filas).toEqual([
      {
        invitacionId: 41,
        candidato: 'Valentina Ríos',
        correo: 'c41@empresa.mx',
        evaluacionId: 5,
        evaluacion: 'Evaluación 5',
        puesto: 'Puesto 5',
        fechaEvaluacion: '2026-09-18',
      },
      {
        invitacionId: 44,
        candidato: 'Andrés Molina',
        correo: 'c44@empresa.mx',
        evaluacionId: 5,
        evaluacion: 'Evaluación 5',
        puesto: 'Puesto 5',
        fechaEvaluacion: '2026-09-18',
      },
    ])
  })

  it('sin puesto queda en null; nombre y puesto vacíos del detalle toman los del resumen', () => {
    const sinPuesto = evaluacion(6, { completada: 1 }, { position: null })
    expect(filasDeEvaluacion(sinPuesto, detalle(sinPuesto, [invitacion(1, 'completada')]))[0].puesto).toBeNull()

    const resumen = evaluacion(7, { completada: 1 }, { name: 'Ventas 2026', position: 'Ejecutivo' })
    const [fila] = filasDeEvaluacion(resumen, detalle(resumen, [invitacion(2, 'completada')], { name: '  ', position: '' }))
    expect(fila.evaluacion).toBe('Ventas 2026')
    expect(fila.puesto).toBe('Ejecutivo')
  })

  it('tolera un detalle sin invitaciones', () => {
    const resumen = evaluacion(8, { completada: 1 })
    const roto = { id: 8, name: 'X', position: null } as unknown as AssessmentDetail
    expect(filasDeEvaluacion(resumen, roto)).toEqual([])
  })
})

describe('agregarCompletadas', () => {
  const a = evaluacion(1, { total: 2, completada: 1 }, { created_at: '2026-09-20' })
  const b = evaluacion(2, { total: 2, completada: 2 }, { created_at: '2026-09-10' })
  const c = evaluacion(3, { total: 1, completada: 1 }, { created_at: '2026-09-05' })

  it('junta las filas evaluación por evaluación, en el orden de la selección', () => {
    const agregado = agregarCompletadas(
      [a, b],
      [
        { status: 'fulfilled', value: detalle(a, [invitacion(11, 'completada'), invitacion(12, 'pendiente')]) },
        { status: 'fulfilled', value: detalle(b, [invitacion(21, 'completada'), invitacion(22, 'completada')]) },
      ],
    )
    expect(agregado.filas.map((f) => f.invitacionId)).toEqual([11, 21, 22])
    expect(agregado).toMatchObject({ pedidas: 2, fallidas: 0, error: undefined })
  })

  it('cuenta los detalles que fallaron y guarda el primer error', () => {
    const primero = new Error('primero')
    const agregado = agregarCompletadas(
      [a, b, c],
      [
        { status: 'rejected', reason: primero },
        { status: 'fulfilled', value: detalle(b, [invitacion(21, 'completada')]) },
        { status: 'rejected', reason: new Error('segundo') },
      ],
    )
    expect(agregado.filas.map((f) => f.invitacionId)).toEqual([21])
    expect(agregado.pedidas).toBe(3)
    expect(agregado.fallidas).toBe(2)
    expect(agregado.error).toBe(primero)
  })
})

describe('fechas y cifras', () => {
  it('lee created_at como día UTC, sin correrse de día por la zona horaria', () => {
    expect(diaDeFecha('2026-09-20')).toBe(Date.UTC(2026, 8, 20))
    expect(diaDeFecha('2026-12-31T23:59:59Z')).toBe(Date.UTC(2026, 11, 31))
  })

  it('sin fecha o con un formato desconocido, el día es null', () => {
    expect(diaDeFecha(null)).toBeNull()
    expect(diaDeFecha('')).toBeNull()
    expect(diaDeFecha('20/09/2026')).toBeNull()
  })

  it('las cifras llevan separador de miles de es-MX', () => {
    expect(formatearNumero(0)).toBe('0')
    expect(formatearNumero(1250)).toBe('1,250')
  })
})
