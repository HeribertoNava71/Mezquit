import { useSyncExternalStore } from 'react'

// Paneles de los overlays abiertos (Modal y Drawer), del más viejo al más
// reciente. El toast los consulta para no tapar sus controles (Fase 8). No sale
// del barril: es interno del sistema de diseño, como OverlayDialog.

const abiertos: HTMLElement[] = []
const oyentes = new Set<() => void>()

function avisar(): void {
  for (const oyente of oyentes) oyente()
}

/** Registra el panel de un overlay abierto. Devuelve la función que lo quita. */
export function registrarOverlay(panel: HTMLElement): () => void {
  abiertos.push(panel)
  avisar()
  return () => {
    const indice = abiertos.lastIndexOf(panel)
    if (indice !== -1) abiertos.splice(indice, 1)
    avisar()
  }
}

function suscribir(oyente: () => void): () => void {
  oyentes.add(oyente)
  return () => {
    oyentes.delete(oyente)
  }
}

function overlayActual(): HTMLElement | null {
  return abiertos.at(-1) ?? null
}

/** Panel del overlay abierto más reciente, o null si no hay ninguno. */
export function useOverlayAbierto(): HTMLElement | null {
  return useSyncExternalStore(suscribir, overlayActual, () => null)
}
