// Formato de los datos de una solicitud de créditos (GET /api/admin/credit-requests).
// Solo presentación: los valores son los que manda el servidor.

const numero = new Intl.NumberFormat('es-MX')

/** «1 crédito», «40 créditos», «1,250 créditos». Sin un número válido, «—». */
export function creditos(cantidad: number | null | undefined): string {
  if (typeof cantidad !== 'number' || !Number.isFinite(cantidad)) return '—'
  return `${numero.format(cantidad)} ${Math.abs(cantidad) === 1 ? 'crédito' : 'créditos'}`
}

/** Meses abreviados como en el prototipo («09 sep 2026, 11:42», Strata.dc.html:881). */
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'] as const

const PATRON_FECHA = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/

export interface FechaVisible {
  /** Texto para mostrar. */
  texto: string
  /** Valor para <time dateTime>; null si el texto no tiene el formato esperado. */
  iso: string | null
}

/**
 * created_at llega como «Y-m-d H:i», en la hora del servidor y sin zona
 * (2026-09-12-fase2-panel-rh.md:1084). Se muestra «27 sep 2026, 11:42» sin
 * convertir de zona, así que la hora es la misma que antes. Si no tiene ese
 * formato, se muestra tal cual; sin fecha, «—».
 */
export function fechaDeSolicitud(valor: string | null | undefined): FechaVisible {
  if (!valor) return { texto: '—', iso: null }
  const partes = PATRON_FECHA.exec(valor.trim())
  if (!partes) return { texto: valor, iso: null }
  const [, anio, mes, dia, hora, minuto] = partes
  const indiceMes = Number(mes) - 1
  const nombreMes = MESES[indiceMes]
  const diaValido = Number(dia) >= 1 && Number(dia) <= 31
  if (!nombreMes || !diaValido || Number(hora) > 23 || Number(minuto) > 59) return { texto: valor, iso: null }
  return {
    texto: `${dia} ${nombreMes} ${anio}, ${hora}:${minuto}`,
    iso: `${anio}-${mes}-${dia}T${hora}:${minuto}`,
  }
}
