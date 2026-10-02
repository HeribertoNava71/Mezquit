import type { AuthUser } from '@/api/auth'

// Reglas de navegación de la sesión (D-07): qué rutas exigen sesión, a dónde va
// cada usuario al entrar y qué lleva location.state entre las guardas, /login
// y /perfil. Las usan las guardas, SessionWatcher y Login.

/** Aviso de /login cuando la sesión venció o se cerró en otra pestaña (D-07, punto 8). */
export const AVISO_SESION_VENCIDA = 'Tu sesión expiró. Vuelve a entrar.'

/** Aviso de /perfil cuando una cuenta sin empresa intenta entrar a /app (D-07, punto 3). */
export const AVISO_SIN_ORGANIZACION =
  'Tu cuenta no tiene una empresa registrada, por eso no puedes entrar al panel de RR. HH.'

/**
 * location.state que comparten las guardas, SessionWatcher, /login y /perfil.
 * Es serializable: el navegador lo guarda en history.state.
 */
export interface EstadoDeRuta {
  /** Ruta interna de origen (pathname + search + hash) a la que se vuelve tras entrar. */
  from?: string
  /** Aviso que la pantalla de destino muestra con el Callout del sistema. */
  aviso?: string
}

interface UbicacionMinima {
  pathname: string
  search?: string
  hash?: string
}

/** pathname + search + hash de una ubicación del router. */
export function rutaDeUbicacion({ pathname, search = '', hash = '' }: UbicacionMinima): string {
  return `${pathname}${search}${hash}`
}

function esUbicacion(valor: unknown): valor is UbicacionMinima {
  return typeof valor === 'object' && valor !== null && typeof (valor as UbicacionMinima).pathname === 'string'
}

/**
 * Lee location.state sin confiar en su forma. from acepta una cadena o un objeto
 * Location (la convención de React Router); aviso, solo texto no vacío.
 */
export function leerEstadoDeRuta(state: unknown): EstadoDeRuta {
  if (typeof state !== 'object' || state === null) return {}
  const { from, aviso } = state as Record<string, unknown>
  const estado: EstadoDeRuta = {}
  if (typeof from === 'string') estado.from = from
  else if (esUbicacion(from)) estado.from = rutaDeUbicacion(from)
  if (typeof aviso === 'string' && aviso.trim() !== '') estado.aviso = aviso
  return estado
}

/** Estado con el que una guarda manda a /login: la ruta de origen y, si la sesión venció, el aviso. */
export function estadoHaciaLogin(ubicacion: UbicacionMinima, sesionVencida = false): EstadoDeRuta {
  const estado: EstadoDeRuta = { from: rutaDeUbicacion(ubicacion) }
  if (sesionVencida) estado.aviso = AVISO_SESION_VENCIDA
  return estado
}

function dentroDe(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(`${base}/`)
}

/** /app, /admin y /perfil, con sus subrutas: las zonas que exigen sesión. */
export function esRutaProtegida(pathname: string): boolean {
  return ['/app', '/admin', '/perfil'].some((base) => dentroDe(pathname, base))
}

// Origen ficticio para analizar rutas relativas con URL sin depender de window.
const ORIGEN = 'http://strata.invalid'

/**
 * Analiza una ruta de origen. Solo acepta rutas internas: empiezan con «/» y no
 * cambian de origen al resolverse (descarta «//otro.sitio», «/\otro.sitio» y
 * variantes con tabuladores o saltos de línea). Tampoco acepta /login ni
 * /registro, para no volver a la pantalla de acceso.
 */
function analizarRutaInterna(ruta: string): URL | null {
  if (!ruta.startsWith('/')) return null
  let url: URL
  try {
    url = new URL(ruta, ORIGEN)
  } catch {
    return null
  }
  if (url.origin !== ORIGEN) return null
  if (dentroDe(url.pathname, '/login') || dentroDe(url.pathname, '/registro')) return null
  return url
}

/** Si el usuario puede abrir esa ruta: /app pide empresa y /admin, super admin. */
function permitidaPara(pathname: string, user: AuthUser): boolean {
  if (dentroDe(pathname, '/app')) return Boolean(user.organization_id)
  if (dentroDe(pathname, '/admin')) return user.is_platform_admin === true
  return true
}

/** Inicio de cada usuario (la redirección de siempre de Login): /app con empresa; si no, /perfil. */
export function inicioDe(user: AuthUser): string {
  return user.organization_id ? '/app' : '/perfil'
}

/**
 * A dónde va un usuario después de entrar: a la ruta de origen si es interna y
 * puede abrirla; si no, a su inicio (D-07, puntos 5 y 6).
 */
export function destinoTrasLogin(user: AuthUser, from?: string): string {
  const url = from ? analizarRutaInterna(from) : null
  if (!url || !permitidaPara(url.pathname, user)) return inicioDe(user)
  return `${url.pathname}${url.search}${url.hash}`
}
