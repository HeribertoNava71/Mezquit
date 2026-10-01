import { createContext, useContext, type ChangeEvent } from 'react'

// Contexto interno entre RadioGroup y RadioCard. No se exporta desde el barril.

/**
 * - sm: chip del builder, 12.5 px y aro de 15 px (Strata.dc.html:482-485).
 * - md: lista de modal, 13 px y aro de 17 px (Strata.dc.html:1346-1350, :1394-1398).
 * - lg: opción del examen, 14.5 px y aro de 20 px (Strata.dc.html:1175-1181).
 */
export type RadioSize = 'sm' | 'md' | 'lg'

/** radio: con aro y punto. none: tarjeta sin aro (modos de envío, Strata.dc.html:1404-1407). */
export type RadioIndicator = 'radio' | 'none'

export interface RadioGroupContextValue {
  name: string
  /** Valor controlado; undefined si el grupo no es controlado. */
  value?: string
  defaultValue?: string
  onChange: (value: string, event: ChangeEvent<HTMLInputElement>) => void
  disabled: boolean
  required: boolean
  invalid: boolean
  size: RadioSize
  indicator: RadioIndicator
}

export const RadioGroupContext = createContext<RadioGroupContextValue | null>(null)

export function useRadioGroup(): RadioGroupContextValue | null {
  return useContext(RadioGroupContext)
}
