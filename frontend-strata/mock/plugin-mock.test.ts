// @vitest-environment node
// Modo demo sin backend (mock/plugin-mock.ts): capas, cambio de escenario por
// login, registro y salida, y el middleware con un servidor HTTP de verdad.
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import type { ConfigEnv, UserConfig } from 'vite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { crearBuscador } from './coincidencias.mjs'
import {
  CONTRASENA_INCORRECTA,
  ESCENARIO_INICIAL,
  cargarEscenarios,
  crearModoDemo,
  describirEscenario,
  escenarioDeCorreo,
  leerRetardo,
  pluginMock,
  responder,
  type Escenario,
  type Escenarios,
  type EstadoDemo,
  type ModoDemo,
  type Registro,
  type RespuestaDemo,
} from './plugin-mock.ts'

const MOCKS = path.resolve(import.meta.dirname, '..', 'e2e', 'mocks')
const ORIGEN = 'http://localhost:5173'

let escenarios: Escenarios

beforeAll(async () => {
  const carga = await cargarEscenarios(MOCKS)
  expect(carga.errores).toEqual([])
  escenarios = carga.escenarios
})

function pedir(escenario: string, metodo: string, ruta: string, cuerpo?: unknown): RespuestaDemo {
  return responder(escenarios, { metodo, url: new URL(ruta, ORIGEN), escenario, cuerpo })
}

/** Lo que leen las pruebas de un body: { data } de los recursos o { user } de la sesión. */
interface Cuerpo {
  data?: { status?: string; [campo: string]: unknown }
  user?: Record<string, unknown>
  [campo: string]: unknown
}
const cuerpoDe = (respuesta: RespuestaDemo) => respuesta.body as Cuerpo

describe('escenarios de e2e/mocks', () => {
  it('carga los 13 escenarios en el orden del selector, con qué simula cada uno', () => {
    expect([...escenarios.keys()]).toEqual([
      'visitante',
      'rh',
      'rh-vacio',
      'rh-error',
      'rh-sesion-vencida',
      'admin',
      'sin-org',
      'candidato',
      'candidato-iniciada',
      'candidato-completada',
      'candidato-expirada',
      'candidato-404',
      'candidato-sin-red',
    ])
    expect(escenarios.get('rh')?.descripcion).toBe('RR. HH. con datos (Mariana Solís)')
    expect(escenarios.get('candidato-sin-red')?.descripcion).toBe('Sin conexión: toda petición falla')
    expect([...escenarios.values()].every(({ descripcion }) => descripcion.length > 0)).toBe(true)
  })

  it('un escenario nuevo se describe con su comentario «//» hasta los dos puntos', () => {
    expect(describirEscenario({ '//': ['Escenario RR. HH.: Mariana Solís…'] })).toBe('RR. HH.')
    expect(describirEscenario({ '//': 'Sesión vencida (D-07, punto 8): GET /api/user…' })).toBe('Sesión vencida')
    expect(describirEscenario({ '//': ['Usuario sin empresa: Paulina…', 'otra'] })).toBe('Usuario sin empresa')
    expect(describirEscenario({ '//': 'sin dos puntos' })).toBe('Sin dos puntos')
    expect(describirEscenario({ 'GET /api/user': {} })).toBe('')
  })
})

describe('capas', () => {
  it('sin escenario conocido responde el visitante: catálogo y /api/user 401', () => {
    expect(pedir('no-existe', 'GET', '/api/catalog')).toMatchObject({ escenario: 'visitante', fuente: 'visitante.json "GET /api/catalog"' })
    expect(pedir(ESCENARIO_INICIAL, 'GET', '/api/user')).toMatchObject({ status: 401, escenario: 'visitante' })
  })

  it('el escenario activo responde primero', () => {
    const usuario = pedir('rh', 'GET', '/api/user')
    expect(cuerpoDe(usuario)).toMatchObject({ id: 34, organization_id: 4 })
    expect(pedir('rh-error', 'GET', '/api/catalog')).toMatchObject({ status: 500, fuente: 'rh-error.json "GET /api/catalog"' })
    expect(pedir('candidato-sin-red', 'GET', '/api/catalog')).toMatchObject({ abortar: 'internetdisconnected' })
  })

  it('el portal del candidato sale de candidato.json en cualquier escenario', () => {
    for (const escenario of ['visitante', 'rh', 'admin', 'rh-sesion-vencida']) {
      const portal = pedir(escenario, 'GET', '/api/evaluar/demo')
      expect(portal.fuente, escenario).toBe('candidato.json "GET /api/evaluar/:token"')
      expect(cuerpoDe(portal).data?.status).toBe('pendiente')
    }
    // Aunque rh-sesion-vencida responda 401 a todo lo demás.
    expect(pedir('rh-sesion-vencida', 'GET', '/api/credits').status).toBe(401)
  })

  it('salvo que el activo sea una variante candidato-*', () => {
    expect(cuerpoDe(pedir('candidato-iniciada', 'GET', '/api/evaluar/demo')).data?.status).toBe('iniciada')
    expect(pedir('candidato-404', 'GET', '/api/evaluar/demo').status).toBe(404)
    expect(pedir('candidato-completada', 'POST', '/api/evaluar/demo/answers', {}).status).toBe(409)
  })

  it('el catálogo y los leads salen de visitante.json si el activo no los define', () => {
    expect(pedir('candidato', 'GET', '/api/catalog').fuente).toBe('visitante.json "GET /api/catalog"')
    expect(pedir('candidato-404', 'GET', '/api/catalog/adaptabilidad').fuente).toBe('visitante.json "GET /api/catalog/adaptabilidad"')
    expect(pedir('candidato', 'POST', '/api/leads', {}).status).toBe(201)
  })

  it('sin entrada: la cookie CSRF responde 204 y lo demás 404 con aviso', () => {
    expect(pedir('rh', 'GET', '/sanctum/csrf-cookie')).toMatchObject({ status: 204, avisar: false })
    expect(pedir('rh', 'GET', '/api/no-existe')).toMatchObject({ status: 404, avisar: true, escenario: 'rh' })
  })

  it('POST /api/assessments con éxito devuelve el nombre y los candidatos capturados', () => {
    const creada = pedir('rh', 'POST', '/api/assessments', {
      name: 'Vendedores · octubre',
      position: 'Vendedor',
      test_ids: [1],
      candidates: [
        { name: 'Pedro López', email: 'pedro@example.com' },
        { name: 'Ana Ruiz', email: 'ana@example.com', phone: '55 1234 5678' },
      ],
      deadline: null,
    })
    expect(creada.status).toBe(201)
    expect(cuerpoDe(creada).data).toEqual({
      id: 18,
      name: 'Vendedores · octubre',
      invitations: [
        { id: 1801, candidate: 'Pedro López', email: 'pedro@example.com', status: 'pendiente', link: `${ORIGEN}/evaluar/demo-18-1` },
        { id: 1802, candidate: 'Ana Ruiz', email: 'ana@example.com', status: 'pendiente', link: `${ORIGEN}/evaluar/demo-18-2` },
      ],
    })
  })

  it('los errores del escenario no cambian: saldo insuficiente en rh-vacio y 409 al reenviar una completada', () => {
    expect(pedir('rh-vacio', 'POST', '/api/assessments', { name: 'X', candidates: [] }).status).toBe(422)
    expect(pedir('rh', 'POST', '/api/invitations/41/resend').status).toBe(409)
    expect(pedir('admin', 'DELETE', '/api/admin/users/1').status).toBe(409)
  })

  it('las escrituras que el activo no define responden con éxito y la forma de src/api', () => {
    const soloLectura: Escenario = {
      nombre: 'solo-lectura',
      descripcion: '',
      archivo: 'solo-lectura.json',
      buscar: crearBuscador({ 'GET /api/user': { body: { id: 7, organization_id: 3 } } }),
    }
    const conSoloLectura = new Map([...escenarios, ['solo-lectura', soloLectura]])
    const escribir = (metodo: string, ruta: string, cuerpo?: unknown) =>
      responder(conSoloLectura, { metodo, url: new URL(ruta, ORIGEN), escenario: 'solo-lectura', cuerpo })

    const creada = escribir('POST', '/api/assessments', { name: 'Nueva', candidates: [{ name: 'Eva', email: 'eva@example.com' }] })
    expect(creada).toMatchObject({ status: 201, fuente: 'modo demo: escritura "POST /api/assessments"' })
    expect(cuerpoDe(creada).data).toMatchObject({ id: 900, name: 'Nueva', invitations: [{ candidate: 'Eva', link: `${ORIGEN}/evaluar/demo-900-1` }] })
    expect(escribir('POST', '/api/invitations/5/resend')).toMatchObject({ status: 200, body: { ok: true } })
    expect(escribir('POST', '/api/credit-requests', { requested_amount: 10, note: '' })).toMatchObject({ status: 201 })
    expect(escribir('POST', '/api/admin/credit-requests/3/approve')).toMatchObject({ status: 200 })
    expect(escribir('POST', '/api/admin/credit-requests/3/reject')).toMatchObject({ status: 200 })
    expect(escribir('PATCH', '/api/admin/users/48', { name: 'Vale' })).toMatchObject({ status: 200, body: { data: { id: 48, name: 'Vale' } } })
    expect(escribir('DELETE', '/api/admin/users/48')).toMatchObject({ status: 204 })
    expect(escribir('PUT', '/api/admin/me', {})).toMatchObject({ status: 200 })
    expect(escribir('PUT', '/api/user/profile', { name: 'Eva' })).toMatchObject({ status: 200, body: { data: { name: 'Eva' } } })
    expect(escribir('PUT', '/api/user/password', {})).toMatchObject({ status: 200 })
    expect(escribir('GET', '/api/credits')).toMatchObject({ status: 404, avisar: true })
  })
})

describe('sesión', () => {
  const acceso = (email: string, password = 'Contrasena-1') => ({ email, password })
  const registro = (cambios: Record<string, unknown> = {}) => ({
    name: 'Ana',
    last_name: 'López',
    email: 'ana@empresa.com',
    password: 'Secret123!',
    password_confirmation: 'Secret123!',
    company_name: 'Empresa SA',
    sector: '',
    company_size: '',
    phone: '',
    birth_date: '',
    position: '',
    privacy_accepted: true,
    ...cambios,
  })

  it('escenarioDeCorreo: admin…, …sinempresa… y cualquier otro', () => {
    expect(escenarioDeCorreo('Admin@strata.mx')).toBe('admin')
    expect(escenarioDeCorreo('paula.sinempresa@correo.mx')).toBe('sin-org')
    expect(escenarioDeCorreo('admin.sinempresa@correo.mx')).toBe('sin-org')
    expect(escenarioDeCorreo('mariana@rioclaro.mx')).toBe('rh')
  })

  it('login con cualquier correo entra a rh con el usuario de rh.json, como espera auth.ts ({ user })', () => {
    const respuesta = pedir('visitante', 'POST', '/api/login', acceso('mariana@rioclaro.mx'))
    expect(respuesta).toMatchObject({ status: 200, escenario: 'rh' })
    expect(cuerpoDe(respuesta).user).toEqual(cuerpoDe(pedir('rh', 'GET', '/api/user')))
  })

  it('login con admin… entra como super admin y con …sinempresa… como cuenta sin empresa', () => {
    const admin = pedir('visitante', 'POST', '/api/login', acceso('admin@strata.mx'))
    expect(admin.escenario).toBe('admin')
    expect(cuerpoDe(admin).user).toMatchObject({ id: 1, is_platform_admin: true })

    const sinEmpresa = pedir('visitante', 'POST', '/api/login', acceso('paula.sinempresa@correo.mx'))
    expect(sinEmpresa.escenario).toBe('sin-org')
    expect(cuerpoDe(sinEmpresa).user).toMatchObject({ id: 46, organization_id: null })
  })

  it('el login del modo demo le gana a la entrada del escenario (visitante.json y rh-sesion-vencida.json traen la suya)', () => {
    expect(pedir('rh-sesion-vencida', 'POST', '/api/login', acceso('mariana@rioclaro.mx')).escenario).toBe('rh')
  })

  it(`la contraseña «${CONTRASENA_INCORRECTA}» responde el 422 de visitante.json sin cambiar de escenario`, () => {
    const respuesta = pedir('visitante', 'POST', '/api/login', acceso('ana@empresa.com', CONTRASENA_INCORRECTA))
    expect(respuesta).toMatchObject({
      status: 422,
      escenario: 'visitante',
      body: { message: 'Credenciales incorrectas.', errors: { email: ['Credenciales incorrectas.'] } },
    })
  })

  it('login sin datos responde 422 por campo, como Laravel', () => {
    expect(pedir('visitante', 'POST', '/api/login', { email: 'no-es-correo', password: '' })).toMatchObject({
      status: 422,
      escenario: 'visitante',
      body: {
        message: 'The email field must be a valid email address. (and 1 more error)',
        errors: { email: ['The email field must be a valid email address.'], password: ['The password field is required.'] },
      },
    })
  })

  it('registro con empresa entra a rh (201) y sin empresa a sin-org', () => {
    const conEmpresa = pedir('visitante', 'POST', '/api/register', registro())
    expect(conEmpresa).toMatchObject({ status: 201, escenario: 'rh' })
    expect(cuerpoDe(conEmpresa).user).toMatchObject({ organization_id: 4 })

    // El formulario manda company_name vacío cuando no se escribe.
    for (const company_name of ['', '   ', undefined]) {
      const sinEmpresa = pedir('visitante', 'POST', '/api/register', registro({ company_name }))
      expect(sinEmpresa.escenario).toBe('sin-org')
      expect(cuerpoDe(sinEmpresa).user).toMatchObject({ organization_id: null })
    }
  })

  it('registro valida como RegisterRequest y el correo «repetido…» responde el 422 de visitante.json', () => {
    const invalido = pedir('visitante', 'POST', '/api/register', registro({
      name: ' ',
      password: 'corta',
      password_confirmation: 'otra',
      privacy_accepted: false,
    }))
    expect(invalido).toMatchObject({ status: 422, escenario: 'visitante' })
    expect(cuerpoDe(invalido)).toEqual({
      message: 'The name field is required. (and 3 more errors)',
      errors: {
        name: ['The name field is required.'],
        password: ['The password field must be at least 8 characters.'],
        password_confirmation: ['The password confirmation field must match password.'],
        privacy_accepted: ['The privacy accepted field must be accepted.'],
      },
    })

    expect(pedir('visitante', 'POST', '/api/register', registro({ email: 'repetido@empresa.com' }))).toMatchObject({
      status: 422,
      escenario: 'visitante',
      body: { errors: { email: ['The email has already been taken.'] } },
    })
  })

  it('salir responde 204 y vuelve a visitante', () => {
    expect(pedir('admin', 'POST', '/api/logout')).toMatchObject({ status: 204, escenario: 'visitante' })
  })
})

describe('retardo y plugin', () => {
  it('leerRetardo entiende «0», «300» y «250-400»', () => {
    expect(leerRetardo('0')).toEqual({ min: 0, max: 0 })
    expect(leerRetardo('300')).toEqual({ min: 300, max: 300 })
    expect(leerRetardo(' 250 - 400 ')).toEqual({ min: 250, max: 400 })
    expect(leerRetardo('400-250')).toBeNull()
    expect(leerRetardo('rápido')).toBeNull()
  })

  it('solo se aplica al servidor de desarrollo con --mode mock', () => {
    const { apply } = pluginMock()
    expect(typeof apply).toBe('function')
    const aplica = apply as (config: UserConfig, env: ConfigEnv) => boolean
    expect(aplica({}, { command: 'serve', mode: 'mock' })).toBe(true)
    expect(aplica({}, { command: 'serve', mode: 'development' })).toBe(false)
    expect(aplica({}, { command: 'serve', mode: 'test' })).toBe(false)
    expect(aplica({}, { command: 'build', mode: 'mock' })).toBe(false)
  })
})

describe('middleware', () => {
  const avisos: string[] = []
  const registro: Registro = { info: () => {}, warn: (mensaje) => avisos.push(mensaje), error: (mensaje) => avisos.push(mensaje) }
  let demo: ModoDemo
  let servidor: Server
  let base = ''

  beforeAll(async () => {
    demo = await crearModoDemo({ carpeta: MOCKS, retardo: 0, registro })
    servidor = createServer((req, res) =>
      demo.middleware(req, res, () => {
        res.statusCode = 200
        res.end('siguiente')
      }),
    )
    await new Promise<void>((resolve) => servidor.listen(0, '127.0.0.1', resolve))
    base = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}`
  })

  afterAll(async () => {
    servidor.closeAllConnections()
    await new Promise((resolve) => servidor.close(resolve))
  })

  const cookie = (escenario: string) => ({ cookie: `otra=1; strata-mock-escenario=${escenario}` })
  const json = { 'content-type': 'application/json', accept: 'application/json' }

  it('GET /__mock lista los escenarios y dice cuál está activo', async () => {
    const respuesta = await fetch(`${base}/__mock`, { headers: cookie('admin') })
    const estado = (await respuesta.json()) as EstadoDemo
    expect(estado).toMatchObject({ activo: 'admin', inicial: 'visitante', retardo: { min: 0, max: 0 } })
    expect(estado.escenarios).toContainEqual({ nombre: 'sin-org', descripcion: 'Cuenta sin empresa (Paulina Cárdenas)' })
    expect(estado.escenarios).toHaveLength(13)
  })

  it('responde /api con el escenario de la cookie y dice quién respondió', async () => {
    const respuesta = await fetch(`${base}/api/user`, { headers: { ...cookie('rh'), ...json } })
    expect(respuesta.status).toBe(200)
    expect(respuesta.headers.get('x-strata-mock-escenario')).toBe('rh')
    expect(respuesta.headers.get('x-strata-mock-fuente')).toBe('rh.json "GET /api/user"')
    expect(respuesta.headers.get('set-cookie')).toBeNull()
    expect(await respuesta.json()).toMatchObject({ id: 34 })
  })

  it('login, la cookie y salir: cada paso cambia de escenario', async () => {
    const entrar = await fetch(`${base}/api/login`, {
      method: 'POST',
      headers: json,
      body: JSON.stringify({ email: 'admin@strata.mx', password: 'x' }),
    })
    expect(entrar.status).toBe(200)
    expect(entrar.headers.get('set-cookie')).toBe('strata-mock-escenario=admin; Path=/; SameSite=Lax')
    expect(((await entrar.json()) as Cuerpo).user).toMatchObject({ is_platform_admin: true })

    const solicitudes = await fetch(`${base}/api/admin/credit-requests`, { headers: { ...cookie('admin'), ...json } })
    expect(solicitudes.status).toBe(200)

    const salir = await fetch(`${base}/api/logout`, { method: 'POST', headers: { ...cookie('admin'), ...json } })
    expect(salir.status).toBe(204)
    expect(salir.headers.get('set-cookie')).toBe('strata-mock-escenario=visitante; Path=/; SameSite=Lax')
  })

  it('?escenario= al navegar guarda la cookie y redirige a la misma ruta sin el parámetro', async () => {
    const respuesta = await fetch(`${base}/app/creditos?escenario=rh-vacio&filtro=a`, {
      headers: { accept: 'text/html' },
      redirect: 'manual',
    })
    expect(respuesta.status).toBe(302)
    expect(respuesta.headers.get('location')).toBe('/app/creditos?filtro=a')
    expect(respuesta.headers.get('set-cookie')).toBe('strata-mock-escenario=rh-vacio; Path=/; SameSite=Lax')
  })

  it('?escenario= en una petición de /api la responde con ese escenario', async () => {
    const respuesta = await fetch(`${base}/api/credits?escenario=rh-vacio`, { headers: json })
    expect(respuesta.headers.get('set-cookie')).toContain('strata-mock-escenario=rh-vacio')
    expect(((await respuesta.json()) as Cuerpo).data?.balance).toBe(0)
  })

  it('un ?escenario= que no existe avisa y no toca la cookie', async () => {
    const respuesta = await fetch(`${base}/?escenario=no-existe`, { headers: { accept: 'text/html' }, redirect: 'manual' })
    expect(respuesta.status).toBe(302)
    expect(respuesta.headers.get('location')).toBe('/')
    expect(respuesta.headers.get('set-cookie')).toBeNull()
    expect(avisos.some((aviso) => aviso.includes('?escenario=no-existe no existe'))).toBe(true)
  })

  it('una cookie con un escenario que ya no existe vuelve a visitante', async () => {
    const respuesta = await fetch(`${base}/api/user`, { headers: { ...cookie('borrado'), ...json } })
    expect(respuesta.status).toBe(401)
    expect(respuesta.headers.get('set-cookie')).toContain('strata-mock-escenario=visitante')
  })

  it('lo que no es /api ni /sanctum pasa al siguiente middleware (Vite)', async () => {
    const respuesta = await fetch(`${base}/app/creditos`, { headers: { accept: 'text/html' } })
    expect(await respuesta.text()).toBe('siguiente')
  })

  it('abortar corta la conexión sin responder (error de red en el navegador)', async () => {
    await expect(fetch(`${base}/api/catalog`, { headers: { ...cookie('candidato-sin-red'), ...json } })).rejects.toThrow()
  })

  it('una petición sin entrada responde 404 y avisa en la consola', async () => {
    const respuesta = await fetch(`${base}/api/no-existe`, { headers: json })
    expect(respuesta.status).toBe(404)
    expect(avisos.some((aviso) => aviso.includes('GET /api/no-existe sin entrada en «visitante» → 404'))).toBe(true)
  })

  it('el retardo se aplica a cada respuesta', async () => {
    const lento = await crearModoDemo({ carpeta: MOCKS, retardo: { min: 60, max: 60 }, registro })
    const servidorLento = createServer((req, res) => lento.middleware(req, res, () => res.end()))
    await new Promise<void>((resolve) => servidorLento.listen(0, '127.0.0.1', resolve))
    try {
      const inicio = performance.now()
      await fetch(`http://127.0.0.1:${(servidorLento.address() as AddressInfo).port}/api/catalog`, { headers: json })
      expect(performance.now() - inicio).toBeGreaterThanOrEqual(50)
    } finally {
      servidorLento.closeAllConnections()
      await new Promise((resolve) => servidorLento.close(resolve))
    }
  })
})

describe('recarga de los JSON', () => {
  let carpeta = ''

  beforeAll(async () => {
    carpeta = await mkdtemp(path.join(tmpdir(), 'strata-modo-demo-'))
  })

  afterAll(async () => {
    await rm(carpeta, { recursive: true, force: true })
  })

  it('lee los cambios y, si un archivo queda roto, conserva su versión anterior', async () => {
    const archivo = path.join(carpeta, 'visitante.json')
    await writeFile(archivo, JSON.stringify({ '//': 'Visitante: prueba', 'GET /api/catalog': { body: { data: [] } } }))
    const errores: string[] = []
    const demo = await crearModoDemo({
      carpeta,
      retardo: 0,
      registro: { info: () => {}, warn: () => {}, error: (mensaje) => errores.push(mensaje) },
    })
    const catalogo = () => responder(demo.escenarios, { metodo: 'GET', url: new URL('/api/catalog', ORIGEN), escenario: 'visitante' })
    expect(catalogo().body).toEqual({ data: [] })

    await writeFile(archivo, JSON.stringify({ 'GET /api/catalog': { body: { data: [{ id: 'nueva' }] } } }))
    expect(await demo.recargar()).toEqual([])
    expect(catalogo().body).toEqual({ data: [{ id: 'nueva' }] })

    // recargar() devuelve el error con el nombre del archivo: el plugin no recarga la página.
    await writeFile(archivo, '{ "GET /api/catalog": ')
    const suyos = await demo.recargar()
    expect(suyos).toHaveLength(1)
    expect(suyos[0]).toMatch(/^visitante\.json: /)
    expect(catalogo().body).toEqual({ data: [{ id: 'nueva' }] })
    expect(errores.some((error) => error.includes('visitante.json') && error.includes('Se conserva la versión anterior.'))).toBe(true)
  })
})
