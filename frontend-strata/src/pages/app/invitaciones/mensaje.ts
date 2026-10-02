import { formatearFecha } from '@/components/ui'

// Mensaje y enlaces de los canales «Enviar por» (Strata.dc.html:1355-1365;
// D-10, opción a; brechas.md P-09), los mismos en el modal «Enlace de
// invitación» del detalle y en la pantalla de enlaces del asistente. No
// necesitan backend ni simulan nada: abren el cliente de correo o WhatsApp con
// el enlace real de la invitación (link de POST /api/assessments y de
// GET /api/assessments/{id}). No reemplazan al correo automático: ese lo manda
// el backend al crear la evaluación y al reenviar.

/** Lo que hace falta para compartir una invitación (InvitationRow e InvitationLink lo cumplen). */
export interface InvitacionCompartible {
  candidate: string
  email: string
  link: string
}

/** Asunto del borrador de correo. */
export const ASUNTO_INVITACION = 'Tu enlace para responder la evaluación'

/**
 * «15/10/2026», el formato de la fecha límite en el correo de invitación del
 * backend. Si el valor no es una fecha, lo devuelve tal cual.
 */
export function fechaNumerica(valor: string): string {
  const iso = formatearFecha(valor)?.iso
  if (!iso) return valor.trim()
  const [anio, mes, dia] = iso.slice(0, 10).split('-')
  return `${dia}/${mes}/${anio}`
}

/**
 * Texto para el candidato: saludo, el enlace real y, si hay fecha límite,
 * «Responde antes del dd/mm/aaaa». Dice «antes del» porque el backend vence la
 * invitación al comenzar el día límite (expires_at es esa fecha a las 00:00).
 * Sin promesas de resultados (D-16) ni de recordatorios (PB-28).
 */
export function mensajeInvitacion(invitacion: InvitacionCompartible, fechaLimite?: string | null): string[] {
  const nombre = invitacion.candidate.trim()
  const lineas = [
    nombre ? `Hola, ${nombre}:` : 'Hola:',
    '',
    'Este es tu enlace personal para responder la evaluación:',
    invitacion.link,
  ]
  if (fechaLimite?.trim()) lineas.push('', `Responde antes del ${fechaNumerica(fechaLimite)}.`)
  return lineas
}

/**
 * Borrador mailto: al correo del candidato, con el asunto y el mensaje. Se
 * codifica con encodeURIComponent (espacios como %20, no como «+», que algunos
 * clientes muestran tal cual); la «@» del destinatario queda legible y los
 * saltos de línea van como CRLF (RFC 6068).
 */
export function enlaceCorreo(invitacion: InvitacionCompartible, fechaLimite?: string | null): string {
  const destinatario = encodeURIComponent(invitacion.email.trim()).replace(/%40/g, '@')
  const asunto = encodeURIComponent(ASUNTO_INVITACION)
  const cuerpo = encodeURIComponent(mensajeInvitacion(invitacion, fechaLimite).join('\r\n'))
  return `mailto:${destinatario}?subject=${asunto}&body=${cuerpo}`
}

/**
 * WhatsApp con el mensaje y el enlace real (https://wa.me/?text=…). Sin número:
 * el backend no lo devuelve, así que WhatsApp pide elegir el contacto.
 */
export function enlaceWhatsApp(invitacion: InvitacionCompartible, fechaLimite?: string | null): string {
  return `https://wa.me/?text=${encodeURIComponent(mensajeInvitacion(invitacion, fechaLimite).join('\n'))}`
}
