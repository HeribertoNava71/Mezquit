import type { HTMLAttributes } from 'react'

export interface CorreoProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Dirección de correo tal como llega del servidor. */
  valor: string
}

/**
 * Correo con un punto de corte después de la arroba (<wbr>): en una columna o
 * una tarjeta angosta parte en «usuario@» / «dominio» y no a mitad de palabra.
 * El texto (y lo que lee un lector de pantalla) no cambia.
 */
export function Correo({ valor, ...rest }: CorreoProps) {
  const arroba = valor.lastIndexOf('@')
  if (arroba <= 0 || arroba === valor.length - 1) return <span {...rest}>{valor}</span>
  return (
    <span {...rest}>
      {valor.slice(0, arroba + 1)}
      <wbr />
      {valor.slice(arroba + 1)}
    </span>
  )
}
