import { useEffect, useState } from 'react'
import { getCatalog } from '@/api/catalog'
import type { EstadoCatalogo } from './catalogoInicio'

/**
 * Pide GET /api/catalog una vez al montar la home. Lo comparten el rango de
 * duración del hero y el catálogo exprés. Si la home se desmonta antes de la
 * respuesta, la respuesta se descarta.
 */
export function useCatalogoInicio(): EstadoCatalogo {
  const [catalogo, setCatalogo] = useState<EstadoCatalogo>({ estado: 'cargando' })

  useEffect(() => {
    let vigente = true
    getCatalog()
      .then((categorias) => {
        if (vigente) setCatalogo({ estado: 'listo', categorias: Array.isArray(categorias) ? categorias : [] })
      })
      .catch(() => {
        if (vigente) setCatalogo({ estado: 'error' })
      })
    return () => {
      vigente = false
    }
  }, [])

  return catalogo
}
