import type { AuthUser } from '@/api/auth'

// Navegación de las barras superiores por rol (D-06 A; mapa.md, sección 3).
// Solo datos y funciones puras: los componentes de la barra los pintan.

/** Enlace de una barra superior o del menú móvil. */
export interface EnlaceNav {
  /** Ruta de destino. */
  to: string
  /** Texto visible. */
  label: string
  /** Activo solo en la ruta exacta (como `end` de NavLink). */
  end?: boolean
  /**
   * Regla propia para marcar el enlace activo. Sin ella decide NavLink: la
   * ruta y sus subrutas, o solo la exacta con `end`.
   */
  coincide?: (pathname: string) => boolean
  /** Acción con color de enlace (navy, 600), como «Tengo un código» (Strata.dc.html:122). */
  destacado?: boolean
}

/** Barra pública: Tests · Para empresas · Cómo funciona · Precios (Strata.dc.html:116-119). */
export const ENLACES_PUBLICOS: readonly EnlaceNav[] = [
  { to: '/pruebas', label: 'Tests' },
  { to: '/demo', label: 'Para empresas' },
  { to: '/como-funciona', label: 'Cómo funciona' },
  { to: '/precios', label: 'Precios' },
]

/** Ayuda sale de la barra pública: queda en el pie y en el menú móvil (mapa.md, V-2). */
export const ENLACE_AYUDA: EnlaceNav = { to: '/ayuda', label: 'Ayuda' }

/** Acceso del candidato (Strata.dc.html:122; mapa.md, V-2). */
export const ENLACE_CODIGO: EnlaceNav = { to: '/evaluar', label: 'Tengo un código', destacado: true }

/**
 * «Resultados» está activo en el índice de /app y en el reporte de cada
 * candidato (/app/candidatos/:invitationId/reporte), pero no en el resto del panel.
 */
export function esResultados(pathname: string): boolean {
  // Como el router, sin distinguir mayúsculas y aceptando la barra final.
  const ruta = pathname.toLowerCase().replace(/\/+$/, '')
  return ruta === '/app' || ruta.startsWith('/app/candidatos/')
}

/**
 * Barra de RR. HH.: Tests · Créditos · Candidatos · Resultados (Strata.dc.html:61-64).
 * «Créditos» sustituye a «Mis licencias» (D-08). Candidatos queda activo en
 * /app/evaluaciones y sus subrutas.
 */
export const ENLACES_RH: readonly EnlaceNav[] = [
  { to: '/app/pruebas', label: 'Tests' },
  { to: '/app/creditos', label: 'Créditos' },
  { to: '/app/evaluaciones', label: 'Candidatos' },
  { to: '/app', label: 'Resultados', coincide: esResultados },
]

/**
 * Barra de super admin: Solicitudes · Usuarios. Test Builder, Reactivos y
 * Algoritmos (Strata.dc.html:76-78) no se muestran hasta que exista PB-20.
 */
export const ENLACES_ADMIN: readonly EnlaceNav[] = [
  { to: '/admin/creditos', label: 'Solicitudes' },
  { to: '/admin/usuarios', label: 'Usuarios' },
]

/** Opción del menú de la pastilla: un enlace o «Salir». */
export type OpcionCuenta =
  | { tipo: 'enlace'; to: string; label: string }
  | { tipo: 'salir'; label: string }

/** Zona de la barra: sitio público, panel de RR. HH. u operación. */
export type ZonaBarra = 'publica' | 'rh' | 'admin'

const MI_PERFIL: OpcionCuenta = { tipo: 'enlace', to: '/perfil', label: 'Mi perfil' }
const PERFIL_OPERADOR: OpcionCuenta = { tipo: 'enlace', to: '/admin/perfil', label: 'Mi perfil de operador' }
const PANEL_RH: OpcionCuenta = { tipo: 'enlace', to: '/app', label: 'Panel de RR. HH.' }
const OPERACION: OpcionCuenta = { tipo: 'enlace', to: '/admin/creditos', label: 'Operación' }
const SITIO_PUBLICO: OpcionCuenta = { tipo: 'enlace', to: '/', label: 'Sitio público' }
const SALIR: OpcionCuenta = { tipo: 'salir', label: 'Salir' }

/**
 * Opciones del menú de la pastilla según la zona y la sesión (mapa.md, sección 3):
 * - Pública: Mi perfil, Panel de RR. HH. (con organización), Operación (con is_platform_admin) y Salir.
 * - RR. HH.: Mi perfil, Operación (con is_platform_admin), Sitio público y Salir.
 * - Super admin: Mi perfil de operador, Panel de RR. HH. (con organización), Sitio público y Salir.
 *
 * Sin organización nunca aparece «Panel de RR. HH.» (la guarda de /app lo
 * mandaría a /perfil), y sin is_platform_admin nunca aparece «Operación».
 */
export function opcionesDeCuenta(
  zona: ZonaBarra,
  user: Pick<AuthUser, 'organization_id' | 'is_platform_admin'>,
): OpcionCuenta[] {
  const conOrganizacion = Boolean(user.organization_id)
  const operador = Boolean(user.is_platform_admin)
  const opciones: Array<OpcionCuenta | false> =
    zona === 'publica'
      ? [MI_PERFIL, conOrganizacion && PANEL_RH, operador && OPERACION, SALIR]
      : zona === 'rh'
        ? [MI_PERFIL, operador && OPERACION, SITIO_PUBLICO, SALIR]
        : [PERFIL_OPERADOR, conOrganizacion && PANEL_RH, SITIO_PUBLICO, SALIR]
  return opciones.filter((opcion): opcion is OpcionCuenta => opcion !== false)
}

/**
 * Nombre de la persona para la pastilla: nombre y apellido de GET /api/user.
 * Si los dos vienen vacíos, el correo, para que la pastilla nunca quede sin texto.
 */
export function nombreVisible(user: Pick<AuthUser, 'name' | 'last_name' | 'email'>): string {
  const nombre = [user.name, user.last_name]
    .map((parte) => parte?.trim())
    .filter(Boolean)
    .join(' ')
  return nombre || user.email
}

/** Datos de la pastilla y de su menú; los comparten el menú de escritorio y el móvil. */
export interface CuentaMenu {
  /** Nombre de la persona: iniciales del avatar y nombre accesible. */
  nombre: string
  /**
   * Texto visible de la pastilla: el nombre de la organización en RR. HH.
   * (Strata.dc.html:70) y el de la persona en las demás barras.
   * null mientras se carga.
   */
  etiqueta: string | null
  /** Línea bajo el nombre en la cabecera del menú (el correo). */
  detalle?: string
  /** Opciones del menú (opcionesDeCuenta). */
  opciones: OpcionCuenta[]
  /** «Salir»: POST /api/logout y setUser(null) (useSalir). */
  onSalir: () => void
  /** El cierre de sesión está en curso. */
  saliendo?: boolean
}
