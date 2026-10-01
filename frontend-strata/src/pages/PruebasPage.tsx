import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCatalog, type CatalogCategory } from '@/api/catalog'
import PageHeader from '@/sections/PageHeader'
import './PruebasPage.css'

const ALL = 'todas'

export default function PruebasPage() {
  const [categories, setCategories] = useState<CatalogCategory[] | null>(null)
  const [error, setError] = useState(false)
  const [active, setActive] = useState<string>(ALL)
  const [query, setQuery] = useState('')

  useEffect(() => {
    getCatalog().then(setCategories).catch(() => setError(true))
  }, [])

  const visible = useMemo(() => {
    if (!categories) return []
    const q = query.trim().toLowerCase()
    return categories
      .filter(c => active === ALL || c.id === active)
      .map(c => ({
        ...c,
        tests: q ? c.tests.filter(t => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)) : c.tests,
      }))
      .filter(c => c.tests.length > 0)
  }, [categories, active, query])

  return (
    <>
      <PageHeader title="Pruebas" intro="Explora el catálogo por categoría o busca por nombre. Cada prueba mide un aspecto distinto del candidato." />
      <section className="pruebas">
        <div className="pruebas__inner">
          {error && <p className="pruebas__state">No pudimos cargar el catálogo. Recarga la página.</p>}
          {!error && !categories && <p className="pruebas__state">Cargando catálogo…</p>}

          {categories && (
            <>
              <div className="pruebas__controls">
                <div className="pruebas__filters" role="group" aria-label="Filtrar por categoría">
                  <button className="pruebas__filter" aria-pressed={active === ALL} onClick={() => setActive(ALL)}>Todas</button>
                  {categories.map(c => (
                    <button key={c.id} className="pruebas__filter" aria-pressed={active === c.id} onClick={() => setActive(c.id)}>
                      {c.label} [ {c.count} ]
                    </button>
                  ))}
                </div>
                <input
                  className="pruebas__search"
                  type="search"
                  placeholder="Buscar prueba…"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  aria-label="Buscar prueba"
                />
              </div>

              {visible.map(c => (
                <div key={c.id} className="pruebas__group">
                  <h2 className="pruebas__group-title">{c.label} <span aria-hidden="true">·</span> {c.tests.length}</h2>
                  <div className="pruebas__grid">
                    {c.tests.map(t => (
                      <Link key={t.slug} to={`/pruebas/${t.slug}`} className="prueba-card">
                        <h3 className="prueba-card__name">{t.name}</h3>
                        <p className="prueba-card__desc">{t.description}</p>
                        <span className="prueba-card__meta">{t.duration_min} min · [ {t.item_count} reactivos ]</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
              {visible.length === 0 && <p className="pruebas__state">No hay pruebas que coincidan con tu búsqueda.</p>}
            </>
          )}
        </div>
      </section>
    </>
  )
}
