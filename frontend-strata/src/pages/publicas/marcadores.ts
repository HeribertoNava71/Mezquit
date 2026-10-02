// Datos que el dueño aún no entrega: precios, enlace de agenda, correo y textos
// legales llegan como «[PENDIENTE: …]» (config/site.ts y data/plans.ts). Se
// muestran a la vista con <Pendiente /> (R-35) y nunca se usan como destino de
// un enlace: un mailto o una agenda con el marcador no llevan a ningún lado.

const MARCADOR = /^\s*\[PENDIENTE\b/i

/** true si el texto es un marcador «[PENDIENTE: …]» en lugar de un dato real. */
export function esPendiente(texto: string | null | undefined): boolean {
  return typeof texto === 'string' && MARCADOR.test(texto)
}

/** true si la URL es un enlace http(s) real (no un marcador ni un texto suelto). */
export function esEnlaceReal(url: string | null | undefined): url is string {
  if (typeof url !== 'string' || esPendiente(url)) return false
  try {
    const { protocol } = new URL(url.trim())
    return protocol === 'https:' || protocol === 'http:'
  } catch {
    return false
  }
}

/** true si el correo tiene forma de dirección real (algo@dominio.tld). */
export function esCorreoReal(correo: string | null | undefined): correo is string {
  return typeof correo === 'string' && !esPendiente(correo) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())
}
