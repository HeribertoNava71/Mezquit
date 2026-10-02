// Fechas con el formato del prototipo («04 sep 2026», Strata.dc.html:848 y
// :1488-1494). Se arman a mano y no con Intl: así se ven igual en todos los
// navegadores (según la versión de ICU, es-MX escribe «sept» o «4 sep») y el
// día no cambia con la zona horaria. Antes había una copia en cada pantalla.

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'] as const

/** AAAA-MM-DD con hora opcional («AAAA-MM-DD HH:mm» o ISO, «AAAA-MM-DDTHH:mm…»). */
const PATRON_FECHA = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/

/** Fecha lista para mostrar dentro de un <time>. */
export interface FechaLegible {
  /** Texto visible: «04 sep 2026». Si el valor no es una fecha, el valor tal cual. */
  texto: string
  /** «10:15» si el valor trae hora; null si no la trae. */
  hora: string | null
  /** Para el atributo dateTime: AAAA-MM-DD o AAAA-MM-DDTHH:mm. null si el valor no es una fecha. */
  iso: string | null
}

/**
 * Da formato a una fecha del backend (created_at, deadline…): «04 sep 2026» y,
 * si la trae, la hora tal como llega, sin convertir de zona. Sin valor devuelve
 * null. Un texto que no es una fecha se devuelve tal cual (iso null), para no
 * perder el dato.
 */
export function formatearFecha(valor: string | null | undefined): FechaLegible | null {
  if (typeof valor !== 'string') return null
  const limpio = valor.trim()
  if (!limpio) return null

  const partes = PATRON_FECHA.exec(limpio)
  if (partes) {
    const [, anio, mes, dia, hora, minuto] = partes
    const nombreMes = MESES[Number(mes) - 1]
    const numeroDia = Number(dia)
    const conHora = hora !== undefined && minuto !== undefined
    const horaValida = !conHora || (Number(hora) <= 23 && Number(minuto) <= 59)
    if (nombreMes && numeroDia >= 1 && numeroDia <= 31 && horaValida) {
      return {
        texto: `${dia} ${nombreMes} ${anio}`,
        hora: conHora ? `${hora}:${minuto}` : null,
        iso: conHora ? `${anio}-${mes}-${dia}T${hora}:${minuto}` : `${anio}-${mes}-${dia}`,
      }
    }
  }
  return { texto: limpio, hora: null, iso: null }
}
