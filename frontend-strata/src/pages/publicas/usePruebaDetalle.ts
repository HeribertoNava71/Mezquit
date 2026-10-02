import { useCallback, useEffect, useState } from 'react'
import { getTest, type TestDetail } from '@/api/catalog'
import { getErrorKind, type EstadoErrorKind } from '@/components/ui'

/** Estado de GET /api/catalog/{slug} en /pruebas/:slug. */
export type DetallePrueba =
  | { estado: 'cargando' }
  | { estado: 'listo'; prueba: TestDetail }
  /** reintentando: «Reintentar» está en curso; el error sigue a la vista con «Reintentando…». */
  | { estado: 'error'; kind: EstadoErrorKind; reintentando: boolean }

type Resultado = { estado: 'listo'; prueba: TestDetail } | { estado: 'error'; kind: EstadoErrorKind }

/** Respuesta de la última petición, con el slug y el intento que la pidieron. */
interface Respuesta {
  slug: string
  intento: number
  resultado: Resultado
}

/**
 * Pide la prueba del catálogo por su slug y distingue el 404 («Prueba no
 * encontrada») de un error de red o del servidor, que se puede reintentar
 * (mapa.md, sección 2; R-34). Antes, cualquier error se mostraba como 404.
 * - Al cambiar de slug vuelve a «cargando»; una respuesta tardía de otro slug se descarta.
 * - reintentar() repite la petición sin quitar el error de la vista, para que
 *   el foco siga en el botón (EstadoError con retrying).
 */
export function usePruebaDetalle(slug: string): DetallePrueba & { reintentar: () => void } {
  const [intento, setIntento] = useState(0)
  const [respuesta, setRespuesta] = useState<Respuesta | null>(null)

  useEffect(() => {
    let vigente = true
    getTest(slug).then(
      (prueba) => {
        if (!vigente) return
        // Una respuesta sin la forma esperada no es una prueba: se trata como error del servidor.
        const resultado: Resultado =
          prueba && typeof prueba === 'object' ? { estado: 'listo', prueba } : { estado: 'error', kind: 'servidor' }
        setRespuesta({ slug, intento, resultado })
      },
      (error: unknown) => {
        if (vigente) setRespuesta({ slug, intento, resultado: { estado: 'error', kind: getErrorKind(error) } })
      },
    )
    return () => {
      vigente = false
    }
  }, [slug, intento])

  const reintentar = useCallback(() => setIntento((n) => n + 1), [])

  if (!respuesta || respuesta.slug !== slug) return { estado: 'cargando', reintentar }
  const { resultado } = respuesta
  if (resultado.estado === 'listo') return { ...resultado, reintentar }
  return { ...resultado, reintentando: respuesta.intento !== intento, reintentar }
}
