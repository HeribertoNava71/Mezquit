// @vitest-environment node
// Formato y coincidencia de los mocks (mock/coincidencias.mjs): lo comparten
// scripts/captura.mjs, e2e/flujos/api.ts y el modo demo.
import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  compilarClave,
  crearBuscador,
  esApi,
  leerArchivoDeMocks,
  respuestaPorDefecto,
  revisarMocks,
} from './coincidencias.mjs'

const MOCKS = path.resolve(import.meta.dirname, '..', 'e2e', 'mocks')

const peticion = (ruta: string) => new URL(ruta, 'http://localhost:5173')

/** Clave de la entrada que respondería la petición, o undefined. */
function quienResponde(mocks: Record<string, unknown>, metodo: string, ruta: string): string | undefined {
  return crearBuscador(mocks)(metodo, peticion(ruta))?.clave
}

describe('compilarClave', () => {
  it('separa método, ruta y consulta, y marca los patrones', () => {
    const literal = compilarClave('get /api/user')
    expect(literal).toMatchObject({ metodo: 'GET', ruta: '/api/user', patron: null, consulta: [] })

    const patron = compilarClave('GET /api/admin/users/:id?page=2&search=*')
    expect(patron.ruta).toBe('/api/admin/users/:id')
    expect(patron.patron).toBeInstanceOf(RegExp)
    expect(patron.consulta).toEqual([
      ['page', '2'],
      ['search', '*'],
    ])
  })

  it('la firma no depende del orden de la consulta', () => {
    expect(compilarClave('GET /api/a?b=2&a=1').firma).toBe(compilarClave('GET /api/a?a=1&b=2').firma)
  })

  it('rechaza métodos desconocidos y rutas sin barra inicial', () => {
    expect(() => compilarClave('FETCH /api/a')).toThrow('Clave no válida: «FETCH /api/a»')
    expect(() => compilarClave('GET api/a')).toThrow('Clave no válida')
    expect(() => compilarClave('OPTIONS /api/a')).toThrow('Clave no válida')
  })
})

describe('crearBuscador', () => {
  it(':nombre ocupa un segmento completo y * cruza barras', () => {
    const mocks = { 'GET /api/assessments/:id': {}, 'GET /api/evaluar/*': {} }
    expect(quienResponde(mocks, 'GET', '/api/assessments/13')).toBe('GET /api/assessments/:id')
    expect(quienResponde(mocks, 'GET', '/api/assessments/13/compare')).toBeUndefined()
    expect(quienResponde(mocks, 'GET', '/api/evaluar/abc/pruebas/4')).toBe('GET /api/evaluar/*')
  })

  it('gana la entrada más específica: literal, luego menos comodines y menos parámetros', () => {
    const mocks = {
      'GET /api/*': {},
      'GET /api/assessments/*': {},
      'GET /api/assessments/:id': {},
      'GET /api/assessments/13': {},
    }
    expect(quienResponde(mocks, 'GET', '/api/assessments/13')).toBe('GET /api/assessments/13')
    expect(quienResponde(mocks, 'GET', '/api/assessments/9')).toBe('GET /api/assessments/:id')
    expect(quienResponde(mocks, 'GET', '/api/assessments/9/compare')).toBe('GET /api/assessments/*')
    expect(quienResponde(mocks, 'GET', '/api/credits')).toBe('GET /api/*')
  })

  it('la consulta pide parámetros en cualquier orden; gana la más exigente', () => {
    const mocks = {
      'GET /api/admin/users': {},
      'GET /api/admin/users?search=*': {},
      'GET /api/admin/users?search=ana': {},
      'GET /api/admin/users?page=2': {},
    }
    expect(quienResponde(mocks, 'GET', '/api/admin/users')).toBe('GET /api/admin/users')
    expect(quienResponde(mocks, 'GET', '/api/admin/users?search=luis')).toBe('GET /api/admin/users?search=*')
    expect(quienResponde(mocks, 'GET', '/api/admin/users?page=1&search=ana')).toBe('GET /api/admin/users?search=ana')
    expect(quienResponde(mocks, 'GET', '/api/admin/users?page=2&otro=x')).toBe('GET /api/admin/users?page=2')
  })

  it('con la misma prioridad gana el orden del archivo; el método debe coincidir', () => {
    const mocks = { 'GET /api/:a/x': { primero: true }, 'GET /api/y/:b': {}, 'POST /api/y/x': {} }
    expect(quienResponde(mocks, 'GET', '/api/y/x')).toBe('GET /api/:a/x')
    expect(quienResponde(mocks, 'post', '/api/y/x')).toBe('POST /api/y/x')
    expect(quienResponde(mocks, 'DELETE', '/api/y/x')).toBeUndefined()
  })

  it('ignora los comentarios y compara la ruta decodificada', () => {
    const mocks = { '// rutas': ['/'], 'GET /api/catalog/razonamiento-numérico': {} }
    expect(quienResponde(mocks, 'GET', '/api/catalog/razonamiento-num%C3%A9rico')).toBe('GET /api/catalog/razonamiento-numérico')
  })
})

describe('respuestaPorDefecto y esApi', () => {
  it('cookie CSRF 204 sin aviso, /api/user 401 y lo demás 404 con aviso', () => {
    expect(respuestaPorDefecto('GET', '/sanctum/csrf-cookie')).toEqual({ status: 204 })
    expect(respuestaPorDefecto('GET', '/api/user')).toEqual({ status: 401, body: { message: 'Unauthenticated.' }, avisar: true })
    expect(respuestaPorDefecto('POST', '/api/nada')).toEqual({ status: 404, body: { message: 'Not Found' }, avisar: true })
  })

  it('solo /api y /sanctum con sus subrutas', () => {
    expect(esApi('/api')).toBe(true)
    expect(esApi('/api/user')).toBe(true)
    expect(esApi('/sanctum/csrf-cookie')).toBe(true)
    expect(esApi('/apis')).toBe(false)
    expect(esApi('/app/creditos')).toBe(false)
  })
})

describe('revisarMocks', () => {
  it('cuenta entradas, patrones y comentarios de un archivo válido', () => {
    const datos = { '//': 'nota', 'GET /api/user': { status: 200, body: {} }, 'GET /api/a/:id': { abortar: 'timedout' } }
    expect(revisarMocks(datos, JSON.stringify(datos))).toEqual({
      errores: [],
      avisos: [],
      resumen: { entradas: 2, patrones: 1, comentarios: 1 },
    })
  })

  it('reporta claves, campos, status, headers y abortar no válidos', () => {
    const datos = {
      'FETCH /api/b': {},
      'POST /api/d?b=2&a=1': { status: 999, extra: 1 },
      'POST /api/d?a=1&b=2': { status: 204, body: { x: 1 } },
      'GET /otra/ruta': { headers: { x: 1 } },
      'PUT /api/e': { abortar: 'nope', status: 500 },
      'PATCH /api/f': 'no-objeto',
    }
    const { errores, avisos } = revisarMocks(datos)
    expect(errores).toEqual([
      expect.stringContaining('Clave no válida: «FETCH /api/b»'),
      '«POST /api/d?b=2&a=1»: campos desconocidos (extra); los válidos son status, body, headers, abortar.',
      '«POST /api/d?b=2&a=1»: status debe ser un entero entre 200 y 599.',
      '«POST /api/d?a=1&b=2» repite la petición de «POST /api/d?b=2&a=1».',
      '«GET /otra/ruta»: headers debe ser un objeto con valores de texto.',
      expect.stringContaining('«PUT /api/e»: abortar debe ser true o uno de estos códigos'),
      '«PATCH /api/f»: la respuesta debe ser un objeto { status, body, headers } o { abortar }.',
    ])
    expect(avisos).toEqual([
      '«POST /api/d?a=1&b=2»: un 204 no lleva cuerpo; body se ignora.',
      '«GET /otra/ruta»: el script solo responde /api y /sanctum; esta entrada nunca se usa.',
      '«PUT /api/e»: con abortar se ignoran status, body y headers.',
    ])
  })

  it('encuentra claves repetidas en el texto, que JSON.parse descarta', () => {
    const texto = '{ "// a": 1, "// a": 2, "GET /api/a": {}, "GET /api/a": {} }'
    const { errores, avisos } = revisarMocks(JSON.parse(texto), texto)
    expect(errores).toEqual(['La clave «GET /api/a» está repetida; JSON.parse solo conserva la última.'])
    expect(avisos).toEqual(['La clave «// a» está repetida; JSON.parse solo conserva la última.'])
  })

  it('pide un objeto', () => {
    expect(revisarMocks([1, 2]).errores).toEqual(['El JSON debe ser un objeto { "MÉTODO /ruta": { status, body } }.'])
  })
})

describe('leerArchivoDeMocks', () => {
  let carpeta = ''

  beforeAll(async () => {
    carpeta = await mkdtemp(path.join(tmpdir(), 'strata-coincidencias-'))
  })

  afterAll(async () => {
    await rm(carpeta, { recursive: true, force: true })
  })

  it('todos los escenarios de e2e/mocks son válidos', async () => {
    const archivos = (await readdir(MOCKS)).filter((archivo) => archivo.endsWith('.json'))
    expect(archivos.length).toBeGreaterThanOrEqual(13)
    for (const archivo of archivos) {
      const { errores } = await leerArchivoDeMocks(path.join(MOCKS, archivo))
      expect(errores, archivo).toEqual([])
    }
  })

  it('devuelve el JSON con su revisión y lanza el error de JSON.parse', async () => {
    const valido = path.join(carpeta, 'valido.json')
    await writeFile(valido, '{ "GET /api/user": { "status": 401 } }')
    const leido = await leerArchivoDeMocks(valido)
    expect(leido.datos).toEqual({ 'GET /api/user': { status: 401 } })
    expect(leido.resumen.entradas).toBe(1)

    const roto = path.join(carpeta, 'roto.json')
    await writeFile(roto, '{ roto')
    await expect(leerArchivoDeMocks(roto)).rejects.toThrow(SyntaxError)
  })
})
