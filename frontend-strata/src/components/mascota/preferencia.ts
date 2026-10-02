import { useSyncExternalStore } from 'react'

// Preferencia «ocultar la mascota» (WCAG 2.2.2, nivel A; D-27). La mascota se
// mueve sola más de 5 s, así que la página ofrece cómo detenerla: el botón
// «Ocultar mascota» junto a su burbuja y en el pie de la home. Oculta, no se
// monta: sin tweens, ticker, listeners ni timers, y su chunk ni se descarga.
//
// Se guarda en localStorage para la siguiente visita. Si el navegador no lo
// permite (modo privado, almacenamiento bloqueado), la preferencia vale para la
// pestaña abierta y la mascota se muestra al volver. Este módulo no importa
// GSAP: lo usan el pie y la home sin descargar el motor.

export const CLAVE_MASCOTA_OCULTA = 'strata:mascota-oculta'

let memoria: boolean | null = null
const oyentes = new Set<() => void>()
/** Momento (performance.now) en que la persona la volvió a mostrar. */
let reaparicion = Number.NEGATIVE_INFINITY

/** Margen para considerar que «Mostrar mascota» se acaba de pulsar. */
const VENTANA_REAPARICION_MS = 2000

function leerAlmacenada(): boolean {
  try {
    return window.localStorage.getItem(CLAVE_MASCOTA_OCULTA) === '1'
  } catch {
    return false
  }
}

/** true si la persona ocultó la mascota (en esta pestaña o en una visita anterior). */
export function mascotaOculta(): boolean {
  if (memoria === null) memoria = typeof window === 'undefined' ? false : leerAlmacenada()
  return memoria
}

/** Oculta o vuelve a mostrar la mascota y lo recuerda para la siguiente visita. */
export function guardarMascotaOculta(oculta: boolean): void {
  // Estaba oculta y la persona la vuelve a mostrar.
  if (mascotaOculta() && !oculta) reaparicion = performance.now()
  memoria = oculta
  try {
    if (oculta) window.localStorage.setItem(CLAVE_MASCOTA_OCULTA, '1')
    else window.localStorage.removeItem(CLAVE_MASCOTA_OCULTA)
  } catch {
    // Sin almacenamiento: vale solo para esta pestaña.
  }
  for (const oyente of oyentes) oyente()
}

/** Vuelve a leer localStorage (otra pestaña cambió la preferencia) y avisa. */
function alCambiarAlmacenamiento(evento: StorageEvent) {
  if (evento.key !== null && evento.key !== CLAVE_MASCOTA_OCULTA) return
  memoria = leerAlmacenada()
  for (const oyente of oyentes) oyente()
}

function suscribir(oyente: () => void): () => void {
  oyentes.add(oyente)
  if (oyentes.size === 1) window.addEventListener('storage', alCambiarAlmacenamiento)
  return () => {
    oyentes.delete(oyente)
    if (oyentes.size === 0) window.removeEventListener('storage', alCambiarAlmacenamiento)
  }
}

/** Lectura reactiva de la preferencia. */
export function useMascotaOculta(): boolean {
  return useSyncExternalStore(suscribir, mascotaOculta, () => false)
}

/**
 * true si la persona la volvió a mostrar hace un momento: entonces la mascota
 * se descarga y entra casi de inmediato, sin la espera de la primera visita.
 */
export function reaparecioHaceUnMomento(): boolean {
  return performance.now() - reaparicion < VENTANA_REAPARICION_MS
}

/** Solo pruebas: olvida lo leído para volver a consultar localStorage. */
export function reiniciarPreferenciaMascota(): void {
  memoria = null
  reaparicion = Number.NEGATIVE_INFINITY
}
