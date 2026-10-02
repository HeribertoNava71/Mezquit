// Tipos de mock/coincidencias.mjs para usarlo desde TypeScript (e2e/flujos/api.ts,
// mock/plugin-mock.ts y sus pruebas). El formato de los JSON de e2e/mocks está
// explicado en la cabecera de coincidencias.mjs.

/** Respuesta de una entrada: { status, body, headers } o { abortar }. */
export interface RespuestaDeMock {
  status?: number
  body?: unknown
  headers?: Record<string, string>
  abortar?: true | string
}

/** Entrada compilada de un JSON de mocks: la clave «MÉTODO /ruta?consulta» y lo que responde. */
export interface EntradaDeMock {
  clave: string
  metodo: string
  ruta: string
  /** Lo que la entrada tenga como valor (en los JSON, una RespuestaDeMock). */
  respuesta: unknown
  indice: number
}

/** Busca la entrada más específica que responde una petición, o undefined. */
export type BuscadorDeMocks = (metodo: string, url: URL) => EntradaDeMock | undefined

export interface RevisionDeMocks {
  errores: string[]
  avisos: string[]
  resumen: { entradas: number; patrones: number; comentarios: number }
}

/** Archivo leído con leerArchivoDeMocks: el JSON, su texto y su revisión. */
export interface ArchivoDeMocks extends RevisionDeMocks {
  datos: unknown
  texto: string
}

/** Clave compilada (compilarClave). prioridad: menor es más específica. */
export interface ClaveCompilada {
  clave: string
  metodo: string
  ruta: string
  patron: RegExp | null
  consulta: [string, string][]
  prioridad: number[]
  firma: string
}

/** Métodos que aceptan las claves. */
export const METODOS: readonly string[]
/** Códigos válidos de «abortar» (los de route.abort() de Playwright). */
export const ERRORES_DE_RED: readonly string[]

/** /api y /sanctum, con sus subrutas. */
export function esApi(pathname: string): boolean
/** La clave empieza con // (comentario). */
export function esComentario(clave: string): boolean
/** «MÉTODO /ruta?consulta» compilada. Lanza si la clave no es válida. */
export function compilarClave(clave: string): ClaveCompilada
/** pathname con los %xx decodificados. */
export function decodificarRuta(pathname: string): string

/** Busca la entrada más específica de un objeto de mocks. */
export function crearBuscador(mocks: Record<string, unknown>): BuscadorDeMocks

/** Respuesta sin entrada: 204 para la cookie CSRF, 401 para /api/user y 404 para lo demás. */
export function respuestaPorDefecto(metodo: string, pathname: string): RespuestaDeMock & { avisar?: true }

/** Revisa un objeto de mocks; texto es el JSON original (para hallar claves repetidas). */
export function revisarMocks(datos: unknown, texto?: string): RevisionDeMocks

/** Lee, analiza y revisa un archivo. Lanza el error de lectura o de JSON.parse. */
export function leerArchivoDeMocks(ruta: string): Promise<ArchivoDeMocks>
