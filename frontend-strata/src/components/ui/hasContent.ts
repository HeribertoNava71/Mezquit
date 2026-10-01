import type { ReactNode } from 'react'

/**
 * true si el nodo tiene algo que mostrar: descarta null, undefined, false y ''.
 * Lo comparten los campos, los avisos, los estados y los diálogos para no
 * dibujar contenedores vacíos (uso interno; no sale del barril).
 */
export function hasContent(node: ReactNode): boolean {
  return node !== null && node !== undefined && node !== false && node !== ''
}
