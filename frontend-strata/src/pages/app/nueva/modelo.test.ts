import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios'
import { describe, expect, it } from 'vitest'
import {
  MENSAJES,
  MENSAJE_SALDO_GENERICO,
  candidatosConDatos,
  clasificarErrorEnvio,
  construirPayload,
  diaSiguiente,
  esCorreoValido,
  fechaLocalISO,
  formatoFecha,
  mapearErrores422,
  parsearLista,
  pasosConErroresServidor,
  validarCandidato,
  validarCandidatos,
  validarDatos,
  validarFechaLimite,
  type CandidatoBorrador,
} from './modelo'

function fila(id: string, name = '', email = '', phone = ''): CandidatoBorrador {
  return { id, name, email, phone }
}

/** Error de axios con el código HTTP y el cuerpo dados; sin código, un error de red. */
function errorHttp(status?: number, data: unknown = {}): AxiosError {
  if (status === undefined) return new AxiosError('Network Error', AxiosError.ERR_NETWORK)
  const respuesta = { status, statusText: '', data, headers: {}, config: { headers: new AxiosHeaders() } }
  return new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, undefined, undefined, respuesta as AxiosResponse)
}

describe('esCorreoValido', () => {
  it.each(['ana@correo.com', ' luis.ortiz@empresa.com.mx ', 'a+b@x.io'])('acepta %s', (correo) => {
    expect(esCorreoValido(correo)).toBe(true)
  })

  it.each(['', 'ana', 'ana@', 'ana@correo', 'ana@correo.c', 'ana correo@x.com', 'ana@x..com', '@x.com', 'a@b@c.com'])(
    'rechaza «%s»',
    (correo) => {
      expect(esCorreoValido(correo)).toBe(false)
    },
  )
})

describe('validarDatos (paso 1)', () => {
  it('pide el nombre de la evaluación; el puesto es opcional', () => {
    expect(validarDatos({ name: '', position: '' })).toEqual({ name: MENSAJES.nombreVacio })
    expect(validarDatos({ name: '   ', position: 'Ventas' })).toEqual({ name: MENSAJES.nombreVacio })
    expect(validarDatos({ name: 'Vendedores Q4', position: '' })).toEqual({})
  })

  it('respeta los 255 caracteres de nombre y puesto', () => {
    const largo = 'x'.repeat(256)
    expect(validarDatos({ name: largo, position: largo })).toEqual({
      name: 'Usa 255 caracteres o menos.',
      position: 'Usa 255 caracteres o menos.',
    })
  })
})

describe('validarCandidatos (paso 3)', () => {
  it('exige al menos un candidato con datos', () => {
    expect(validarCandidatos([fila('a')]).general).toBe(MENSAJES.sinCandidatos)
    expect(validarCandidatos([]).general).toBe(MENSAJES.sinCandidatos)
  })

  it('ignora las filas vacías y valida nombre, correo y teléfono de las demás', () => {
    const errores = validarCandidatos([
      fila('a', 'Ana López', 'ana@correo.com'),
      fila('b'),
      fila('c', '', 'luis@correo'),
      fila('d', 'Rita', '', '5'.repeat(31)),
    ])
    expect(errores.general).toBeUndefined()
    expect(errores.filas).toEqual({
      c: { name: MENSAJES.candidatoNombreVacio, email: MENSAJES.correoNoValido },
      d: { email: MENSAJES.correoVacio, phone: 'Usa 30 caracteres o menos.' },
    })
  })

  it('una fila válida no tiene errores', () => {
    expect(validarCandidato(fila('a', 'Ana', 'ana@correo.com', '55 1234 5678'))).toEqual({})
  })

  it('candidatosConDatos conserva el orden y quita las filas vacías', () => {
    const filas = [fila('a'), fila('b', 'Ana'), fila('c', '', '', ' '), fila('d', '', 'x@y.com')]
    expect(candidatosConDatos(filas).map((f) => f.id)).toEqual(['b', 'd'])
  })
})

describe('parsearLista («Pegar lista»)', () => {
  it('lee «nombre, correo» por línea, como el asistente anterior', () => {
    expect(parsearLista('Juan Pérez, juan@correo.com\nAna López, ana@correo.com')).toEqual([
      { name: 'Juan Pérez', email: 'juan@correo.com', phone: '' },
      { name: 'Ana López', email: 'ana@correo.com', phone: '' },
    ])
  })

  it('ignora líneas vacías y espacios, y acepta saltos de Windows', () => {
    expect(parsearLista('\r\n  Juan Pérez ,  juan@correo.com  \r\n\r\n\n')).toEqual([
      { name: 'Juan Pérez', email: 'juan@correo.com', phone: '' },
    ])
    expect(parsearLista('   \n\n')).toEqual([])
  })

  it('acepta tabuladores y punto y coma (celdas pegadas de una hoja de cálculo)', () => {
    expect(parsearLista('Juan Pérez\tjuan@correo.com\nAna López; ana@correo.com')).toEqual([
      { name: 'Juan Pérez', email: 'juan@correo.com', phone: '' },
      { name: 'Ana López', email: 'ana@correo.com', phone: '' },
    ])
  })

  it('toma el teléfono opcional y encuentra el correo en cualquier columna', () => {
    expect(parsearLista('Ana López, ana@correo.com, 55 1234 5678')).toEqual([
      { name: 'Ana López', email: 'ana@correo.com', phone: '55 1234 5678' },
    ])
    expect(parsearLista('luis@correo.com, Luis Ortiz, +52 (55) 1234-5678')).toEqual([
      { name: 'Luis Ortiz', email: 'luis@correo.com', phone: '+52 (55) 1234-5678' },
    ])
  })

  it('no pierde texto: las columnas que no son correo ni teléfono forman el nombre', () => {
    expect(parsearLista('López, Ana, ana@correo.com')).toEqual([{ name: 'López, Ana', email: 'ana@correo.com', phone: '' }])
  })

  it('cada línea con texto es un candidato, aunque le falten datos', () => {
    expect(parsearLista('Ana López\nana@correo.com\nLuis, sin-correo')).toEqual([
      { name: 'Ana López', email: '', phone: '' },
      { name: '', email: 'ana@correo.com', phone: '' },
      { name: 'Luis', email: 'sin-correo', phone: '' },
    ])
  })
})

describe('fecha límite', () => {
  const HOY = '2026-10-01'

  it('es opcional y debe ser posterior a hoy (el enlace vence al comenzar ese día)', () => {
    expect(validarFechaLimite('', HOY)).toBeUndefined()
    expect(validarFechaLimite('2026-10-02', HOY)).toBeUndefined()
    expect(validarFechaLimite(HOY, HOY)).toBe(MENSAJES.fechaPasada)
    expect(validarFechaLimite('2026-09-30', HOY)).toBe(MENSAJES.fechaPasada)
    expect(validarFechaLimite('2026-02-30', HOY)).toBe(MENSAJES.fechaNoValida)
  })

  it('arma las fechas en hora local (sin el corrimiento de UTC)', () => {
    expect(fechaLocalISO(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(diaSiguiente('2026-12-31')).toBe('2027-01-01')
    expect(diaSiguiente('no')).toBe('')
    expect(formatoFecha('2026-10-15')).toBe('15 oct 2026')
    // El día va en dos cifras, como en Candidatos y Créditos.
    expect(formatoFecha('2026-10-05')).toBe('05 oct 2026')
    expect(formatoFecha('no')).toBe('no')
  })
})

describe('construirPayload', () => {
  it('conserva el payload del asistente anterior y agrega phone solo si se capturó', () => {
    const { payload, filasEnviadas } = construirPayload(
      { name: '  Vendedores Q4 ', position: ' Ejecutivo de ventas ' },
      [
        fila('a', ' Juan Pérez ', ' juan@correo.com '),
        fila('b'),
        fila('c', 'Ana López', 'ana@correo.com', ' 55 1234 5678 '),
      ],
      '2026-10-15',
    )
    expect(payload).toStrictEqual({
      name: 'Vendedores Q4',
      position: 'Ejecutivo de ventas',
      test_ids: [1],
      candidates: [
        { name: 'Juan Pérez', email: 'juan@correo.com' },
        { name: 'Ana López', email: 'ana@correo.com', phone: '55 1234 5678' },
      ],
      deadline: '2026-10-15',
    })
    expect(Object.keys(payload)).toEqual(['name', 'position', 'test_ids', 'candidates', 'deadline'])
    expect(filasEnviadas).toEqual(['a', 'c'])
  })

  it('sin puesto envía «» y sin fecha límite envía null, como hoy', () => {
    const { payload } = construirPayload({ name: 'Prácticas', position: '' }, [fila('a', 'Ana', 'ana@correo.com')], '')
    expect(payload.position).toBe('')
    expect(payload.deadline).toBeNull()
  })
})

describe('errores 422 de POST /api/assessments', () => {
  const ENVIADAS = ['a', 'c']

  it('reparte cada clave en su paso y su campo; candidates.N usa la fila enviada', () => {
    const errores = mapearErrores422(
      {
        name: ['El nombre es obligatorio.'],
        'test_ids.0': ['La prueba seleccionada no es válida.'],
        'candidates.1.email': ['El correo no es válido.', 'Otro mensaje'],
        'candidates.0.phone': ['Máximo 30.'],
        deadline: ['La fecha no es válida.'],
        'candidates.9.name': ['Fila que no existe.'],
        algo: 'Clave desconocida.',
      },
      ENVIADAS,
    )
    expect(errores.datos).toEqual({ name: 'El nombre es obligatorio.' })
    expect(errores.prueba).toBe('La prueba seleccionada no es válida.')
    expect(errores.candidatos.filas).toEqual({ c: { email: 'El correo no es válido.' }, a: { phone: 'Máximo 30.' } })
    expect(errores.fechaLimite).toBe('La fecha no es válida.')
    expect(errores.otros).toEqual(['Fila que no existe.', 'Clave desconocida.'])
    expect(pasosConErroresServidor(errores)).toEqual([0, 1, 2, 3])
  })

  it('candidates (la lista) es un error general del paso Candidatos', () => {
    const errores = mapearErrores422({ candidates: ['Agrega al menos un candidato.'] }, [])
    expect(errores.candidatos.general).toBe('Agrega al menos un candidato.')
    expect(pasosConErroresServidor(errores)).toEqual([2])
  })

  it('clasifica un 422 con errors como errores por campo', () => {
    const resultado = clasificarErrorEnvio(
      errorHttp(422, { message: 'The given data was invalid.', errors: { 'candidates.0.email': ['Correo inválido.'] } }),
      ENVIADAS,
    )
    expect(resultado.tipo).toBe('campos')
    if (resultado.tipo === 'campos') expect(resultado.errores.candidatos.filas).toEqual({ a: { email: 'Correo inválido.' } })
  })

  it('un 422 sin errors es saldo insuficiente, con el message del backend (PB-25)', () => {
    expect(clasificarErrorEnvio(errorHttp(422, { message: 'Créditos insuficientes: necesitas 3, tienes 1' }), [])).toEqual({
      tipo: 'saldo',
      mensaje: 'Créditos insuficientes: necesitas 3, tienes 1',
    })
    expect(clasificarErrorEnvio(errorHttp(422, {}), [])).toEqual({ tipo: 'saldo', mensaje: MENSAJE_SALDO_GENERICO })
    expect(
      clasificarErrorEnvio(errorHttp(422, { message: 'Sin saldo', code: 'insufficient_credits', errors: { x: ['y'] } }), []),
    ).toEqual({ tipo: 'saldo', mensaje: 'Sin saldo' })
  })

  it('red, sesión, permiso y servidor van como error general', () => {
    expect(clasificarErrorEnvio(errorHttp(), [])).toEqual({ tipo: 'general', kind: 'red' })
    expect(clasificarErrorEnvio(errorHttp(401), [])).toEqual({ tipo: 'general', kind: 'sesion' })
    expect(clasificarErrorEnvio(errorHttp(403), [])).toEqual({ tipo: 'general', kind: 'permiso' })
    expect(clasificarErrorEnvio(errorHttp(409), [])).toEqual({ tipo: 'general', kind: 'conflicto' })
    expect(clasificarErrorEnvio(errorHttp(500), [])).toEqual({ tipo: 'general', kind: 'servidor' })
    expect(clasificarErrorEnvio(new Error('x'), [])).toEqual({ tipo: 'general', kind: 'servidor' })
  })
})

// El mensaje, el mailto: y el wa.me para compartir el enlace se prueban en
// src/pages/app/invitaciones/mensaje.test.ts (los mismos del detalle).
