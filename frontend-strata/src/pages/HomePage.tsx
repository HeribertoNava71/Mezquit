import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Hero from '@/sections/Hero'
import SampleReport from '@/sections/SampleReport'
import HowItWorks from '@/sections/HowItWorks'
import Button from '@/components/ui/Button'
import { getCatalog, type CatalogCategory } from '@/api/catalog'
import './HomePage.css'

export default function HomePage() {
  const [categories, setCategories] = useState<CatalogCategory[] | null>(null)

  useEffect(() => {
    getCatalog().then(setCategories).catch(() => setCategories([]))
  }, [])

  return (
    <>
      <Hero />
      <SampleReport />
      <div className="home-cta home-cta--tinted">
        <Button to="/como-funciona" variant="ghost">Ver cómo funciona</Button>
      </div>

      <section className="home-catalog" aria-labelledby="home-catalog-title">
        <div className="home-catalog__inner">
          <h2 className="home-catalog__title" id="home-catalog-title">Pruebas por categoría</h2>
          <div className="home-catalog__grid">
            {(categories ?? []).map(c => (
              <Link key={c.id} to="/pruebas" className="home-catalog__cat">
                <span className="home-catalog__cat-name">{c.label}</span>
                <span className="home-catalog__cat-count">[ {c.count} pruebas ]</span>
              </Link>
            ))}
          </div>
          <div className="home-cta">
            <Button to="/pruebas">Ver todas las pruebas</Button>
          </div>
        </div>
      </section>

      <HowItWorks />
      <div className="home-cta home-cta--tinted">
        <Button to="/demo">Agenda una demo</Button>
      </div>
    </>
  )
}
