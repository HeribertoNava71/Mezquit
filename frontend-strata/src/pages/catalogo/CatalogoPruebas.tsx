import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import type { CatalogCategory } from '@/api/catalog'
import { Button, EstadoVacio, Input, SegmentedFilter, VisuallyHidden } from '@/components/ui'
import { IconoBuscar } from '@/components/ui/Iconos'
import {
  INDICE_MAXIMO_ESCALONADO,
  SIN_RESULTADOS,
  TODAS,
  filtrarPruebas,
  opcionesDeFiltro,
  resumenDeResultados,
  terminosDeBusqueda,
  totalDePruebas,
} from './catalogo'
import { TarjetaPrueba } from './TarjetaPrueba'
import './CatalogoPruebas.css'

/** Espera antes de anunciar el resultado: no se anuncia cada tecla de la búsqueda. */
const RETARDO_ANUNCIO_MS = 400

export interface CatalogoPruebasProps {
  /** Categorías de GET /api/catalog con al menos una prueba (useCatalogo ya las sanea). */
  categorias: CatalogCategory[]
}

/**
 * Catálogo cargado (Strata.dc.html:620-677; mapa.md, RH-2):
 * - Barra con el filtro de categorías de la API, cada una con su conteo y
 *   «Todas» con el total (R-09, S-16), y la búsqueda por texto (R-08).
 * - Grilla de tarjetas de vidrio con entrada escalonada de 55 ms; al cambiar de
 *   categoría la grilla vuelve a entrar, como en el prototipo. Mientras se
 *   escribe, las tarjetas no se animan.
 * - Búsqueda sin resultados: EstadoVacio con «Limpiar búsqueda» y, si hay
 *   coincidencias en otras categorías, «Buscar en todas las categorías».
 * - El resultado se anuncia en una región de estado oculta (WCAG 4.1.3).
 */
export function CatalogoPruebas({ categorias }: CatalogoPruebasProps) {
  const [categoria, setCategoria] = useState(TODAS)
  const [consulta, setConsulta] = useState('')
  const busquedaRef = useRef<HTMLInputElement>(null)

  const opciones = useMemo(() => opcionesDeFiltro(categorias), [categorias])
  const total = useMemo(() => totalDePruebas(categorias), [categorias])
  const visibles = useMemo(() => filtrarPruebas(categorias, categoria, consulta), [categorias, categoria, consulta])
  const buscando = terminosDeBusqueda(consulta).length > 0
  const enOtrasCategorias =
    visibles.length === 0 && categoria !== TODAS ? filtrarPruebas(categorias, TODAS, consulta).length : 0

  const resumen = resumenDeResultados(visibles.length, total)
  const [anuncio, setAnuncio] = useState('')
  useEffect(() => {
    const espera = window.setTimeout(() => setAnuncio(resumen), RETARDO_ANUNCIO_MS)
    return () => window.clearTimeout(espera)
  }, [resumen])

  function limpiarBusqueda() {
    setConsulta('')
    busquedaRef.current?.focus()
  }

  function buscarEnTodas() {
    setCategoria(TODAS)
    busquedaRef.current?.focus()
  }

  // Escape borra la búsqueda en todos los navegadores (en Firefox, type=search no lo hace).
  function alTeclear(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key !== 'Escape' || consulta === '') return
    evento.preventDefault()
    setConsulta('')
  }

  return (
    <div className="st-catalogo">
      <div role="search" aria-label="Filtrar y buscar pruebas" className="st-catalogo__barra">
        <SegmentedFilter
          aria-label="Filtrar por categoría"
          options={opciones}
          value={categoria}
          onChange={setCategoria}
        />
        <Input
          ref={busquedaRef}
          type="search"
          label="Buscar prueba"
          hideLabel
          placeholder="Buscar por nombre o descripción"
          icon={<IconoBuscar width={16} height={16} />}
          value={consulta}
          onChange={(evento) => setConsulta(evento.target.value)}
          onKeyDown={alTeclear}
          autoComplete="off"
          enterKeyHint="search"
          className="st-catalogo__busqueda"
        />
      </div>

      <VisuallyHidden as="p" role="status">
        {anuncio}
      </VisuallyHidden>

      {visibles.length > 0 ? (
        // La clave reinicia la grilla al cambiar de categoría: las tarjetas vuelven a entrar escalonadas.
        <ul key={categoria} className="st-catalogo__grilla">
          {visibles.map(({ prueba, categoria: suCategoria }, i) => (
            <TarjetaPrueba
              key={prueba.slug}
              prueba={prueba}
              categoria={suCategoria}
              indice={buscando ? undefined : Math.min(i, INDICE_MAXIMO_ESCALONADO)}
            />
          ))}
        </ul>
      ) : (
        <EstadoVacio
          titleAs="h2"
          icon={<IconoBuscar />}
          title={SIN_RESULTADOS}
          description={
            enOtrasCategorias > 0
              ? `En esta categoría no hay resultados, pero ${
                  enOtrasCategorias === 1 ? 'hay 1 prueba que coincide' : `hay ${enOtrasCategorias} pruebas que coinciden`
                } en otras categorías.`
              : 'Revisa la ortografía o prueba con otras palabras.'
          }
          actions={
            <>
              <Button variant="secondary" onClick={limpiarBusqueda}>
                Limpiar búsqueda
              </Button>
              {enOtrasCategorias > 0 && (
                <Button variant="ghost" onClick={buscarEnTodas}>
                  Buscar en todas las categorías
                </Button>
              )}
            </>
          }
        />
      )}
    </div>
  )
}

export default CatalogoPruebas
