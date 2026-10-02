// Formato de los datos de un usuario de /api/admin/users para la vista.
// Las fechas se arman a mano y no con Intl, con los meses del prototipo
// («04 sep 2026», Strata.dc.html:1488-1494): así se ven igual en todos los
// navegadores (algunos escriben «sept.»).

interface ConNombre {
  name?: string | null
  last_name?: string | null
  email?: string | null
}

/**
 * Nombre y apellido. Sin apellido (PB-27: last_name puede ser null), solo el
 * nombre; sin ninguno de los dos, el correo.
 */
export function nombreCompleto(usuario: ConNombre): string {
  const nombre = [usuario.name, usuario.last_name]
    .map((parte) => parte?.trim())
    .filter(Boolean)
    .join(' ')
  return nombre || usuario.email?.trim() || 'Usuario sin nombre'
}

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'] as const
const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
] as const

interface Dia {
  anio: number
  /** 0 a 11. */
  mes: number
  dia: number
}

/** Fecha lista para un <time>: texto visible y AAAA-MM-DD para dateTime. */
export interface FechaLegible {
  texto: string
  iso: string
}

const dosDigitos = (valor: number) => String(valor).padStart(2, '0')

function isoDe({ anio, mes, dia }: Dia): string {
  return `${anio}-${dosDigitos(mes + 1)}-${dosDigitos(dia)}`
}

/**
 * Día de un instante ISO como lo serializa Laravel («2026-09-12T10:20:30.000000Z»),
 * en la zona del navegador. Recorta los microsegundos a milisegundos, el formato
 * que leen todos los navegadores. null si falta o no es una fecha.
 */
function diaLocal(iso: string | null | undefined): Dia | null {
  if (!iso?.trim()) return null
  const fecha = new Date(iso.trim().replace(/(\.\d{3})\d+/, '$1'))
  if (Number.isNaN(fecha.getTime())) return null
  return { anio: fecha.getFullYear(), mes: fecha.getMonth(), dia: fecha.getDate() }
}

/**
 * Día de calendario (birth_date, columna date): solo «AAAA-MM-DD», sin zona.
 * Laravel la manda como medianoche UTC y, leída en la zona de México, caería un
 * día antes. null si falta o no es una fecha válida.
 */
function diaCalendario(valor: string | null | undefined): Dia | null {
  const partes = valor?.trim().match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!partes) return null
  const anio = Number(partes[1])
  const mes = Number(partes[2]) - 1
  const dia = Number(partes[3])
  const prueba = new Date(Date.UTC(anio, mes, dia))
  if (prueba.getUTCFullYear() !== anio || prueba.getUTCMonth() !== mes || prueba.getUTCDate() !== dia) return null
  return { anio, mes, dia }
}

/** Fecha de registro en la tabla, en la zona del navegador: «01 oct 2026». */
export function fechaCorta(iso: string | null | undefined): FechaLegible | null {
  const dia = diaLocal(iso)
  if (!dia) return null
  return { texto: `${dosDigitos(dia.dia)} ${MESES_CORTOS[dia.mes]} ${dia.anio}`, iso: isoDe(dia) }
}

function largo(dia: Dia): FechaLegible {
  return { texto: `${dia.dia} de ${MESES[dia.mes]} de ${dia.anio}`, iso: isoDe(dia) }
}

/** Fecha de registro en el detalle, en la zona del navegador: «1 de octubre de 2026». */
export function fechaLarga(iso: string | null | undefined): FechaLegible | null {
  const dia = diaLocal(iso)
  return dia ? largo(dia) : null
}

/** Fecha de nacimiento (sin zona horaria): «21 de septiembre de 1985». */
export function fechaDeCalendario(valor: string | null | undefined): FechaLegible | null {
  const dia = diaCalendario(valor)
  return dia ? largo(dia) : null
}
