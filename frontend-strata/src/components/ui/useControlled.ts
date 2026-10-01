import { useCallback, useState } from 'react'

/**
 * Valor controlado o no controlado, como en los inputs nativos (uso interno).
 * Si `value` llega definido, manda la prop y el componente solo avisa con
 * onChange; si no, guarda su propio estado a partir de `defaultValue`.
 */
export function useControlled<T>(
  value: T | undefined,
  defaultValue: T,
  onChange?: (next: T) => void,
): [T, (next: T) => void] {
  const [internal, setInternal] = useState<T>(defaultValue)
  const isControlled = value !== undefined
  const current = isControlled ? value : internal

  const setValue = useCallback(
    (next: T) => {
      if (!isControlled) setInternal(next)
      onChange?.(next)
    },
    [isControlled, onChange],
  )

  return [current, setValue]
}
