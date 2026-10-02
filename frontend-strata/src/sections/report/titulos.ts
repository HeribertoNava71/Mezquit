/** Nivel de un encabezado HTML (h1 a h6). */
export type NivelTitulo = 1 | 2 | 3 | 4 | 5 | 6

/**
 * Limita un nivel de encabezado a h1–h6. El reporte se usa como página (h1) y
 * dentro de otras páginas (ejemplo público), así que sus títulos se calculan a
 * partir del nivel de su título principal.
 */
export function nivelDeTitulo(nivel: number): NivelTitulo {
  return Math.min(6, Math.max(1, Math.round(nivel))) as NivelTitulo
}
