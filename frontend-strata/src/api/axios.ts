import axios, { type InternalAxiosRequestConfig } from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
  withCredentials: true,
  withXSRFToken: true,
  headers: { Accept: 'application/json' },
})

export async function csrf(): Promise<void> {
  await api.get('/sanctum/csrf-cookie')
}

// ── Sesión vencida y CSRF (D-07, punto 8) ─────────────────────────────────
// - Un 401 o un 419 de una petición hecha con sesión emite EVENTO_SESION_VENCIDA.
//   AuthProvider lo escucha y limpia user; SessionWatcher lleva a /login.
// - Un 419 (token CSRF vencido o ausente) en una petición que escribe se
//   reintenta una sola vez después de pedir una cookie nueva con csrf(). Si el
//   reintento vuelve a fallar con 401 o 419 y había sesión, se emite el evento.
// - «Con sesión» lo marca AuthProvider con marcarSesion() cuando hay user. Así,
//   el GET /api/user inicial de un visitante (401) no emite nada.

/** Evento de window que emite el cliente cuando la sesión venció o se cerró en otra pestaña. */
export const EVENTO_SESION_VENCIDA = 'st:sesion-vencida'

let sesionActiva = false
// Cambia cada vez que la sesión se abre o se cierra. Una respuesta tardía de
// una sesión anterior (por ejemplo, un 401 que llega después de volver a
// entrar) trae otra generación y no cierra la sesión nueva.
let generacion = 0

/**
 * Lo llama AuthProvider: true cuando hay user cargado y false cuando no.
 * Solo las peticiones que salen con sesión pueden emitir EVENTO_SESION_VENCIDA.
 */
export function marcarSesion(activa: boolean): void {
  if (activa === sesionActiva) return
  sesionActiva = activa
  generacion += 1
}

interface ConfigConSesion extends InternalAxiosRequestConfig {
  /** Generación de la sesión con la que salió la petición; null si salió sin sesión. */
  stSesion?: number | null
  /** La petición ya se reintentó tras un 419. */
  stReintento419?: boolean
}

const METODOS_QUE_ESCRIBEN = ['post', 'put', 'patch', 'delete']

function escribe(metodo: string | undefined): boolean {
  return METODOS_QUE_ESCRIBEN.includes((metodo ?? 'get').toLowerCase())
}

// Varios 419 a la vez comparten una sola petición de cookie.
let csrfEnCurso: Promise<void> | null = null

function renovarCsrf(): Promise<void> {
  csrfEnCurso ??= csrf().finally(() => {
    csrfEnCurso = null
  })
  return csrfEnCurso
}

let csrfListo: Promise<void> | null = null

/**
 * Pide la cookie XSRF-TOKEN una sola vez por carga de la página, antes del
 * primer POST público (portal del candidato). Nunca falla: si la cookie no
 * llega, la petición sale igual y un 419 se reintenta con csrf().
 */
export function asegurarCsrf(): Promise<void> {
  csrfListo ??= csrf().catch(() => {
    csrfListo = null
  })
  return csrfListo
}

api.interceptors.request.use(
  (config: ConfigConSesion) => {
    // En un reintento se conserva la marca original de la petición.
    if (config.stSesion === undefined) config.stSesion = sesionActiva ? generacion : null
    return config
  },
  undefined,
  // Síncrono: la marca es la del momento en que se llama a api.get/post, no la
  // de una microtarea después.
  { synchronous: true },
)

function avisarSiVencio(config: ConfigConSesion, status: number): void {
  if (status !== 401 && status !== 419) return
  if (config.stSesion == null || config.stSesion !== generacion || !sesionActiva) return
  // Se marca antes de emitir: varias peticiones que fallan juntas avisan una sola vez.
  marcarSesion(false)
  window.dispatchEvent(new CustomEvent(EVENTO_SESION_VENCIDA))
}

api.interceptors.response.use(undefined, async (error: unknown) => {
  if (!axios.isAxiosError(error) || !error.config || !error.response) throw error
  const config = error.config as ConfigConSesion
  const { status } = error.response

  if (status === 419 && escribe(config.method) && !config.stReintento419) {
    config.stReintento419 = true
    let renovada = true
    try {
      await renovarCsrf()
    } catch {
      renovada = false
    }
    // El reintento pasa otra vez por este interceptor: si falla, avisa desde ahí.
    if (renovada) return api.request(config)
  }

  avisarSiVencio(config, status)
  throw error
})

export default api
