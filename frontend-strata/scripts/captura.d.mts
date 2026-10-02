// Tipos de scripts/captura.mjs para usarlo desde TypeScript. El buscador y la
// revisión de los mocks vienen de mock/coincidencias.mjs (allí está el formato
// de los JSON de e2e/mocks); este script los vuelve a exportar.

import type { BrowserContext, Page } from '@playwright/test'
import type { BuscadorDeMocks } from '../mock/coincidencias.mjs'

export type { BuscadorDeMocks, EntradaDeMock, RespuestaDeMock, RevisionDeMocks } from '../mock/coincidencias.mjs'
export { crearBuscador, revisarMocks } from '../mock/coincidencias.mjs'

/** Responde /api/* y /sanctum/* de un contexto o una página con el buscador. */
export function instalarMocks(context: BrowserContext | Page, buscar: BuscadorDeMocks): Promise<void>
