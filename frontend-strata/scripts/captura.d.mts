// Tipos de scripts/captura.mjs para usarlo desde TypeScript (las pruebas de
// e2e/flujos reutilizan su buscador de mocks). El formato de los JSON de
// e2e/mocks está explicado en la cabecera de captura.mjs.

import type { BrowserContext, Page } from '@playwright/test'

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

export function crearBuscador(mocks: Record<string, unknown>): BuscadorDeMocks

export interface RevisionDeMocks {
  errores: string[]
  avisos: string[]
  resumen: { entradas: number; patrones: number; comentarios: number }
}

/** Revisa un objeto de mocks; texto es el JSON original (para hallar claves repetidas). */
export function revisarMocks(datos: unknown, texto?: string): RevisionDeMocks

/** Responde /api/* y /sanctum/* de un contexto o una página con el buscador. */
export function instalarMocks(context: BrowserContext | Page, buscar: BuscadorDeMocks): Promise<void>
