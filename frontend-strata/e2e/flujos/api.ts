// API simulada de las pruebas de extremo a extremo (e2e/flujos, Fase 8).
//
// Cada prueba arranca con un escenario de e2e/mocks: el mismo formato y el
// mismo buscador de mock/coincidencias.mjs, que también usan scripts/captura.mjs
// y el modo demo («MÉTODO /ruta?consulta», :param, *, prioridad de la entrada
// más específica). La prueba puede agregar o cambiar entradas con un objeto,
// igual que en los JSON, o con una función que calcula la respuesta con la
// petición; así el mock «recuerda» una aprobación o una sesión que vence. Todo
// /api/* y /sanctum/* se responde aquí con page.route; las hojas de Fontshare
// se responden vacías para no depender de la red.
//
// El fixture `simular` registra cada petición (método, ruta, consulta, cuerpo y
// la entrada que la respondió) y, al terminar la prueba, falla si hubo
// peticiones sin entrada en el mock o errores en la página: excepciones o
// console.error que no sean las respuestas de error que el mock da a propósito.

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test as base, type ConsoleMessage, type Page, type Request, type Route } from '@playwright/test'
import {
  crearBuscador,
  decodificarRuta,
  esApi,
  respuestaPorDefecto,
  revisarMocks,
  type BuscadorDeMocks,
  type RespuestaDeMock,
} from '../../mock/coincidencias.mjs'

export { expect }
export type { RespuestaDeMock }

const CARPETA_MOCKS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'mocks')

/** Petición que llegó a la API simulada. */
export interface Peticion {
  metodo: string
  /** pathname sin el host del backend (VITE_API_URL, http://localhost:8000 por defecto). */
  ruta: string
  consulta: URLSearchParams
  /** Cuerpo JSON de la petición; null si no trae. */
  cuerpo: unknown
  /** Entrada del mock que la respondió; null si se usó la respuesta por defecto. */
  clave: string | null
  /** Momento de llegada (Date.now()). */
  momento: number
}

/** Respuesta calculada al llegar la petición. Recibe también la API, para cambiar el mock. */
export type RespuestaDinamica = (peticion: Peticion, api: ApiSimulada) => RespuestaDeMock

/** Entradas «MÉTODO /ruta?consulta» con su respuesta, como en los JSON, o una función. */
export type EntradasDeMock = Record<string, RespuestaDeMock | RespuestaDinamica>

const leidos = new Map<string, Record<string, unknown>>()

/** e2e/mocks/<escenario>.json, revisado con revisarMocks. Devuelve una copia que se puede modificar. */
export function leerMock(escenario: string): Record<string, unknown> {
  let datos = leidos.get(escenario)
  if (!datos) {
    const archivo = path.join(CARPETA_MOCKS, `${escenario}.json`)
    const texto = readFileSync(archivo, 'utf8')
    const leido: unknown = JSON.parse(texto)
    const { errores } = revisarMocks(leido, texto)
    if (errores.length > 0) throw new Error(`e2e/mocks/${escenario}.json tiene errores:\n  ${errores.join('\n  ')}`)
    datos = leido as Record<string, unknown>
    leidos.set(escenario, datos)
  }
  return structuredClone(datos)
}

/** Respuesta de una entrada de un escenario (copia), para reutilizarla en otra prueba o modificarla. */
export function respuestaDe(escenario: string, clave: string): RespuestaDeMock {
  const respuesta = leerMock(escenario)[clave]
  if (typeof respuesta !== 'object' || respuesta === null) {
    throw new Error(`e2e/mocks/${escenario}.json no tiene la entrada «${clave}».`)
  }
  return respuesta as RespuestaDeMock
}

/** El body.data de una entrada (la forma { data } de los recursos de Laravel). */
export function datosDe<T>(escenario: string, clave: string): T {
  const { body } = respuestaDe(escenario, clave)
  return (body as { data: T }).data
}

function leerCuerpo(peticion: Request): unknown {
  try {
    return peticion.postDataJSON()
  } catch {
    return peticion.postData()
  }
}

/**
 * API simulada de una página. Empieza con un escenario de e2e/mocks y se puede
 * cambiar en cualquier momento: las peticiones siguientes ya usan el mock nuevo.
 */
export class ApiSimulada {
  /** Peticiones respondidas, en orden de llegada (sin las OPTIONS de CORS). */
  readonly peticiones: Peticion[] = []
  /** Peticiones sin entrada en el mock (salvo la cookie CSRF). La prueba falla al terminar si hay alguna. */
  readonly sinEntrada: string[] = []
  private entradas: Record<string, unknown> = {}
  private buscar: BuscadorDeMocks = () => undefined

  constructor(escenario: string, extras: EntradasDeMock = {}) {
    this.usar(escenario, extras)
  }

  /** Cambia todo el mock por el de otro escenario, con entradas extra. */
  usar(escenario: string, extras: EntradasDeMock = {}): void {
    this.entradas = { ...leerMock(escenario), ...extras }
    this.buscar = crearBuscador(this.entradas)
  }

  /** Agrega entradas o reemplaza las que tienen la misma clave. */
  definir(extras: EntradasDeMock): void {
    this.entradas = { ...this.entradas, ...extras }
    this.buscar = crearBuscador(this.entradas)
  }

  /** Peticiones con ese método a esa ruta (texto exacto del pathname o RegExp). */
  llamadas(metodo: string, ruta: string | RegExp): Peticion[] {
    const buscado = metodo.toUpperCase()
    return this.peticiones.filter(
      (peticion) => peticion.metodo === buscado && (typeof ruta === 'string' ? peticion.ruta === ruta : ruta.test(peticion.ruta)),
    )
  }

  /** Posición de una petición en el orden de llegada (-1 si no está). */
  orden(peticion: Peticion | undefined): number {
    return peticion ? this.peticiones.indexOf(peticion) : -1
  }

  /** Instala las rutas en la página. Va antes del primer goto. */
  async instalar(page: Page): Promise<void> {
    await page.route((url) => esApi(url.pathname), (route) => this.responder(route))
    // Fuentes de Fontshare (index.html): hoja vacía; el texto usa la fuente de respaldo.
    await page.route(/^https:\/\/(api|cdn)\.fontshare\.com\//, (route) =>
      route.fulfill({ status: 200, contentType: 'text/css', body: '' }),
    )
  }

  private async responder(route: Route): Promise<void> {
    const request = route.request()
    const url = new URL(request.url())
    const metodo = request.method().toUpperCase()
    const cors = {
      'access-control-allow-origin': (await request.headerValue('origin')) ?? '*',
      'access-control-allow-credentials': 'true',
      'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'access-control-allow-headers':
        (await request.headerValue('access-control-request-headers')) ?? 'accept, content-type, x-xsrf-token, x-requested-with',
      vary: 'Origin',
    }
    if (metodo === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: cors })
      return
    }

    const entrada = this.buscar(metodo, url)
    const peticion: Peticion = {
      metodo,
      ruta: decodificarRuta(url.pathname),
      consulta: url.searchParams,
      cuerpo: leerCuerpo(request),
      clave: entrada?.clave ?? null,
      momento: Date.now(),
    }
    this.peticiones.push(peticion)

    let respuesta: RespuestaDeMock
    if (entrada) {
      const valor = entrada.respuesta
      respuesta = typeof valor === 'function' ? (valor as RespuestaDinamica)(peticion, this) : (valor as RespuestaDeMock)
    } else {
      // Sin entrada: la cookie CSRF responde 204, GET /api/user 401 y lo demás 404.
      respuesta = respuestaPorDefecto(metodo, url.pathname)
      if (!(metodo === 'GET' && url.pathname === '/sanctum/csrf-cookie')) {
        this.sinEntrada.push(`${metodo} ${url.pathname}${url.search}`)
      }
    }

    if (respuesta.abortar !== undefined) {
      await route.abort(respuesta.abortar === true ? 'failed' : respuesta.abortar)
      return
    }
    const status = respuesta.status ?? 200
    const { body } = respuesta
    const sinCuerpo = status === 204 || status === 304 || body === undefined
    await route.fulfill({
      status,
      headers: { ...cors, ...(sinCuerpo ? {} : { 'content-type': 'application/json' }), ...(respuesta.headers ?? {}) },
      body: sinCuerpo ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
    })
  }
}

/**
 * Chromium anota cada respuesta de error con «Failed to load resource». Las de
 * la API son a propósito (401 sin sesión, 409, 422…): no cuentan como errores.
 */
function esRespuestaDeLaApi(mensaje: ConsoleMessage): boolean {
  if (!mensaje.text().startsWith('Failed to load resource')) return false
  try {
    return esApi(new URL(mensaje.location().url).pathname)
  } catch {
    return false
  }
}

/** Instala la API simulada con un escenario de e2e/mocks y entradas extra. Una vez por prueba. */
export type Simulador = (escenario: string, extras?: EntradasDeMock) => Promise<ApiSimulada>

export const test = base.extend<{ simular: Simulador }>({
  simular: async ({ page }, usar) => {
    const errores: string[] = []
    page.on('pageerror', (error) => errores.push(`Excepción: ${error.message}`))
    page.on('console', (mensaje) => {
      if (mensaje.type() === 'error' && !esRespuestaDeLaApi(mensaje)) errores.push(`console.error: ${mensaje.text()}`)
    })

    const estado: { api: ApiSimulada | null } = { api: null }
    await usar(async (escenario, extras) => {
      if (estado.api) throw new Error('simular() ya se llamó en esta prueba: usa api.usar() para cambiar de escenario.')
      const api = new ApiSimulada(escenario, extras)
      await api.instalar(page)
      estado.api = api
      return api
    })

    expect(
      { sinEntrada: estado.api?.sinEntrada ?? [], errores },
      'La página no debe pedir rutas que el mock no tiene ni registrar errores',
    ).toEqual({ sinEntrada: [], errores: [] })
  },
})

/** Espera a que la página esté en esa ruta (pathname, sin consulta). */
export async function esperarRuta(page: Page, ruta: string): Promise<void> {
  await expect(page).toHaveURL((url) => url.pathname === ruta)
}
