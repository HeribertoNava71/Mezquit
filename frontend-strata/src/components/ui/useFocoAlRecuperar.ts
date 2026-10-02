import { useEffect, useRef, type RefObject } from 'react'

/**
 * Foco tras un «Reintentar» que sí trae los datos: el botón que tenía el foco
 * desaparece con el EstadoError y el foco caería en <body>, así que el teclado y
 * el lector de pantalla perderían su lugar. Al pasar de error a listo, este hook
 * lleva el foco al destino (un contenedor con tabIndex −1 o un control).
 * Si la persona ya movió el foco a otra parte, lo respeta.
 *
 * @param enError la pantalla muestra el error de carga.
 * @param listo los datos ya están en pantalla.
 * @param destino a dónde va el foco (por ejemplo, el primer bloque de contenido).
 */
export function useFocoAlRecuperar(enError: boolean, listo: boolean, destino: RefObject<HTMLElement | null>): void {
  const recuperando = useRef(false)

  useEffect(() => {
    if (enError) {
      recuperando.current = true
      return
    }
    if (!listo || !recuperando.current) return
    recuperando.current = false
    const activo = document.activeElement
    if (activo && activo !== document.body) return
    destino.current?.focus()
  }, [enError, listo, destino])
}
