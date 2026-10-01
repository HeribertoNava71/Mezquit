/** Valor aceptado por cx: texto, número, booleano, nulo, diccionario o lista anidada. */
export type ClassValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ClassDictionary
  | ClassValue[]

/** Diccionario { clase: condición }: incluye la clase si la condición es verdadera. */
export type ClassDictionary = Record<string, unknown>

function collect(value: ClassValue, out: string[]): void {
  if (!value) return
  if (typeof value === 'string') {
    out.push(value)
  } else if (typeof value === 'number') {
    out.push(String(value))
  } else if (Array.isArray(value)) {
    for (const item of value) collect(item, out)
  } else if (typeof value === 'object') {
    for (const key of Object.keys(value)) {
      if (value[key]) out.push(key)
    }
  }
  // true no aporta clase.
}

/**
 * Une nombres de clase e ignora los valores falsos.
 *
 * @example cx('st-btn', `st-btn--${variant}`, loading && 'st-btn--loading', { 'is-active': active })
 */
export function cx(...values: ClassValue[]): string {
  const out: string[] = []
  for (const value of values) collect(value, out)
  return out.join(' ')
}
