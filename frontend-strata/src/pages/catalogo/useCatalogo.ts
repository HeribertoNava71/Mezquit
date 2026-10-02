import { useCallback, useEffect, useState } from 'react'
import { getCatalog, type CatalogCategory } from '@/api/catalog'
import { getErrorKind, type EstadoErrorKind } from '@/components/ui'
import { categoriasConPruebas } from './catalogo'

/** Estado de GET /api/catalog en el catálogo. */
export type EstadoDelCatalogo =
  | { estado: 'cargando' }
  | { estado: 'listo'; categorias: CatalogCategory[] }
  | { estado: 'error'; tipo: EstadoErrorKind }

export interface UsoDelCatalogo {
  catalogo: EstadoDelCatalogo
  /** Hay un reintento en curso: el error sigue a la vista y su botón dice «Reintentando…». */
  reintentando: boolean
  /** Vuelve a pedir el catálogo (botón «Reintentar» del error). */
  reintentar: () => void
}

/**
 * Pide GET /api/catalog al montar y en cada reintento.
 * - La respuesta llega saneada: solo categorías con pruebas (R-09).
 * - Si la API no devuelve una lista, es un error y no un catálogo vacío:
 *   el error siempre es distinto del vacío.
 * - Una respuesta que llega después de desmontar o de un reintento más nuevo se descarta.
 */
export function useCatalogo(): UsoDelCatalogo {
  const [catalogo, setCatalogo] = useState<EstadoDelCatalogo>({ estado: 'cargando' })
  const [reintentando, setReintentando] = useState(false)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    getCatalog().then(
      (respuesta) => {
        if (!vigente) return
        setCatalogo(
          Array.isArray(respuesta)
            ? { estado: 'listo', categorias: categoriasConPruebas(respuesta) }
            : { estado: 'error', tipo: 'servidor' },
        )
        setReintentando(false)
      },
      (error: unknown) => {
        if (!vigente) return
        setCatalogo({ estado: 'error', tipo: getErrorKind(error) })
        setReintentando(false)
      },
    )
    return () => {
      vigente = false
    }
  }, [intento])

  const reintentar = useCallback(() => {
    setReintentando(true)
    setIntento((n) => n + 1)
  }, [])

  return { catalogo, reintentando, reintentar }
}
