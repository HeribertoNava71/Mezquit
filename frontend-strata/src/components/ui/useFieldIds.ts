import { useId, type AriaAttributes } from 'react'

// Utilidades internas de los campos de formulario (Input, Textarea, Select,
// Checkbox, RadioGroup y Stepper). No se exportan desde el barril.

/** ids relacionados de un campo: control, rótulo, ayuda y error. */
export interface FieldIds {
  controlId: string
  labelId: string
  hintId: string
  errorId: string
}

/**
 * Genera los ids de un campo a partir del id recibido o de useId.
 * El rótulo, la ayuda y el error derivan del id del control.
 */
export function useFieldIds(id?: string): FieldIds {
  const autoId = useId()
  const base = id ?? autoId
  return {
    controlId: base,
    labelId: `${base}-label`,
    hintId: `${base}-hint`,
    errorId: `${base}-error`,
  }
}

/** Une ids para aria-describedby o aria-labelledby; undefined si no queda ninguno. */
export function joinIds(...ids: Array<string | false | null | undefined>): string | undefined {
  const list = ids.filter((value): value is string => typeof value === 'string' && value.trim() !== '')
  return list.length > 0 ? list.join(' ') : undefined
}

/** true si aria-invalid marca un error (true, 'true', 'grammar' o 'spelling'). */
export function isAriaInvalid(value: AriaAttributes['aria-invalid']): boolean {
  return value !== undefined && value !== false && value !== 'false'
}
