import { AxiosError, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest'

// Interceptor de sesión vencida y CSRF (D-07, punto 8). Un adaptador falso
// responde con el estado que indique cada prueba y registra las llamadas.

type Modulo = typeof import('./axios')

/** Estados por petición («MÉTODO url»): se consumen en orden y el último se repite. */
let guion: Record<string, number[]>
let llamadas: string[]
let cuerpos: unknown[]
let alVencer: Mock<(evento: Event) => void>

function responder(config: InternalAxiosRequestConfig, status: number): Promise<AxiosResponse> {
  const response: AxiosResponse = { data: {}, status, statusText: String(status), headers: {}, config }
  if (status < 400) return Promise.resolve(response)
  return Promise.reject(
    new AxiosError(`Request failed with status code ${status}`, AxiosError.ERR_BAD_REQUEST, config, null, response),
  )
}

const adaptador: AxiosAdapter = (config) => {
  const clave = `${(config.method ?? 'get').toUpperCase()} ${config.url}`
  llamadas.push(clave)
  if (config.data !== undefined) cuerpos.push(config.data)
  const cola = guion[clave] ?? [200]
  const status = cola.length > 1 ? (cola.shift() as number) : cola[0]
  return responder(config, status)
}

/** Módulo nuevo en cada prueba: sin sesión marcada y sin cookie memorizada. */
async function cargar(): Promise<Modulo> {
  vi.resetModules()
  const modulo = await import('./axios')
  modulo.default.defaults.adapter = adaptador
  return modulo
}

describe('cliente api · sesión vencida y CSRF', () => {
  beforeEach(() => {
    guion = {}
    llamadas = []
    cuerpos = []
    alVencer = vi.fn<(evento: Event) => void>()
    window.addEventListener('st:sesion-vencida', alVencer)
  })

  afterEach(() => {
    window.removeEventListener('st:sesion-vencida', alVencer)
  })

  it('un 401 de una petición hecha con sesión emite st:sesion-vencida', async () => {
    const { default: api, marcarSesion, EVENTO_SESION_VENCIDA } = await cargar()
    expect(EVENTO_SESION_VENCIDA).toBe('st:sesion-vencida')
    guion['GET /api/credits'] = [401]
    marcarSesion(true)

    await expect(api.get('/api/credits')).rejects.toMatchObject({ response: { status: 401 } })
    expect(alVencer).toHaveBeenCalledTimes(1)
  })

  it('el GET /api/user inicial de un visitante (401, sin sesión) no emite el evento', async () => {
    const { default: api } = await cargar()
    guion['GET /api/user'] = [401]

    await expect(api.get('/api/user')).rejects.toMatchObject({ response: { status: 401 } })
    expect(alVencer).not.toHaveBeenCalled()
    expect(llamadas).toEqual(['GET /api/user'])
  })

  it('varias peticiones que fallan juntas avisan una sola vez', async () => {
    const { default: api, marcarSesion } = await cargar()
    guion['GET /api/credits'] = [401]
    guion['GET /api/assessments'] = [401]
    marcarSesion(true)

    await Promise.allSettled([api.get('/api/credits'), api.get('/api/assessments')])
    expect(alVencer).toHaveBeenCalledTimes(1)
  })

  it('después de avisar, otro 401 ya no emite (la sesión quedó marcada como cerrada)', async () => {
    const { default: api, marcarSesion } = await cargar()
    guion['GET /api/credits'] = [401]
    marcarSesion(true)

    await api.get('/api/credits').catch(() => {})
    await api.get('/api/credits').catch(() => {})
    expect(alVencer).toHaveBeenCalledTimes(1)
  })

  it('un 401 que llega de una sesión anterior no cierra la sesión nueva', async () => {
    const { default: api, marcarSesion } = await cargar()
    let llego: () => void = () => {}
    let soltar: () => void = () => {}
    const enCurso = new Promise<void>((resolve) => {
      llego = resolve
    })
    const liberada = new Promise<void>((resolve) => {
      soltar = resolve
    })
    api.defaults.adapter = async (config) => {
      llego()
      await liberada
      return responder(config, 401)
    }
    marcarSesion(true)
    const vieja = api.get('/api/credits')
    await enCurso

    // Salir y volver a entrar mientras la petición sigue en curso.
    marcarSesion(false)
    marcarSesion(true)
    soltar()

    await expect(vieja).rejects.toMatchObject({ response: { status: 401 } })
    expect(alVencer).not.toHaveBeenCalled()
  })

  it('un 419 en un POST público pide la cookie con csrf() y reintenta una vez', async () => {
    const { default: api } = await cargar()
    guion['POST /api/leads'] = [419, 201]

    const respuesta = await api.post('/api/leads', { email: 'ana@empresa.mx' })
    expect(respuesta.status).toBe(201)
    expect(llamadas).toEqual(['POST /api/leads', 'GET /sanctum/csrf-cookie', 'POST /api/leads'])
    // El reintento manda el mismo cuerpo.
    expect(cuerpos).toHaveLength(2)
    expect(JSON.parse(String(cuerpos[1]))).toEqual({ email: 'ana@empresa.mx' })
    expect(alVencer).not.toHaveBeenCalled()
  })

  it('si el reintento vuelve a dar 419, no reintenta otra vez y rechaza (sin bucles)', async () => {
    const { default: api } = await cargar()
    guion['POST /api/evaluar/abc/consent'] = [419]

    await expect(api.post('/api/evaluar/abc/consent', {})).rejects.toMatchObject({ response: { status: 419 } })
    expect(llamadas).toEqual([
      'POST /api/evaluar/abc/consent',
      'GET /sanctum/csrf-cookie',
      'POST /api/evaluar/abc/consent',
    ])
    expect(alVencer).not.toHaveBeenCalled()
  })

  it('si no se puede renovar la cookie, rechaza con el 419 sin reintentar', async () => {
    const { default: api } = await cargar()
    guion['POST /api/leads'] = [419]
    guion['GET /sanctum/csrf-cookie'] = [500]

    await expect(api.post('/api/leads', {})).rejects.toMatchObject({ response: { status: 419 } })
    expect(llamadas).toEqual(['POST /api/leads', 'GET /sanctum/csrf-cookie'])
  })

  it('un 419 con sesión reintenta; si el reintento da 401, emite el evento', async () => {
    const { default: api, marcarSesion } = await cargar()
    guion['POST /api/assessments'] = [419, 401]
    marcarSesion(true)

    await expect(api.post('/api/assessments', {})).rejects.toMatchObject({ response: { status: 401 } })
    expect(llamadas).toEqual(['POST /api/assessments', 'GET /sanctum/csrf-cookie', 'POST /api/assessments'])
    expect(alVencer).toHaveBeenCalledTimes(1)
  })

  it('un 419 con sesión cuyo reintento funciona no cierra la sesión', async () => {
    const { default: api, marcarSesion } = await cargar()
    guion['POST /api/credit-requests'] = [419, 201]
    marcarSesion(true)

    await expect(api.post('/api/credit-requests', { quantity: 5 })).resolves.toMatchObject({ status: 201 })
    expect(alVencer).not.toHaveBeenCalled()
  })

  it('no reintenta un 401 ni un 422', async () => {
    const { default: api } = await cargar()
    guion['POST /api/login'] = [401]
    guion['POST /api/register'] = [422]

    await api.post('/api/login', {}).catch(() => {})
    await api.post('/api/register', {}).catch(() => {})
    expect(llamadas).toEqual(['POST /api/login', 'POST /api/register'])
  })

  it('varios 419 a la vez comparten una sola petición de cookie', async () => {
    const { default: api } = await cargar()
    guion['POST /api/evaluar/abc/answers'] = [419, 419, 201]

    await Promise.all([api.post('/api/evaluar/abc/answers', {}), api.post('/api/evaluar/abc/answers', {})])
    expect(llamadas.filter((l) => l === 'GET /sanctum/csrf-cookie')).toHaveLength(1)
  })

  it('asegurarCsrf pide la cookie una sola vez; si falla, no rechaza y la vuelve a pedir después', async () => {
    const { asegurarCsrf } = await cargar()
    guion['GET /sanctum/csrf-cookie'] = [500, 204]

    await expect(asegurarCsrf()).resolves.toBeUndefined()
    await asegurarCsrf()
    await asegurarCsrf()
    expect(llamadas).toEqual(['GET /sanctum/csrf-cookie', 'GET /sanctum/csrf-cookie'])
  })
})
