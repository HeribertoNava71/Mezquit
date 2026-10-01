import { SITE } from '@/config/site'
import Button from '@/components/ui/Button'
import GrainTexture from '@/components/ui/GrainTexture'
import './Hero.css'

export default function Hero() {
  return (
    <section className="hero" id="inicio" aria-labelledby="hero-title">
      <div className="hero__inner">
        <div className="hero__content">
          <h1 className="hero__title" id="hero-title">
            {SITE.tagline}
          </h1>
          <div className="hero__actions">
            <Button
              href={SITE.calendarUrl !== '[PENDIENTE: enlace de agenda]' ? SITE.calendarUrl : '#contacto'}
              size="lg"
            >
              Agenda una demo
            </Button>
            <a href="#catalogo" className="hero__link-secondary">
              Ver catálogo ↓
            </a>
          </div>
        </div>

        <div className="hero__texture" aria-hidden="true">
          <GrainTexture animated />
        </div>
      </div>
    </section>
  )
}
