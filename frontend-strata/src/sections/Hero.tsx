import { useId, useState, type ReactNode, type Ref } from 'react'
import { Button, SegmentedToggle, Tag } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import './Hero.css'

/** Modo del selector (D-13): el candidato invitado o la empresa. */
export type ModoHero = 'mi' | 'empresa'

const OPCIONES_MODO = [
  { value: 'mi', label: 'Para mí' },
  { value: 'empresa', label: 'Para mi empresa' },
] as const

interface Destino {
  label: string
  to: string
}

interface ContenidoModo {
  entradilla: string
  cta: Destino
  enlace: Destino
}

/**
 * Entradilla, CTA y enlace de cada modo (mapa.md, V-3). Sin precios, sin
 * compra (PB-09, PB-21) y sin prometer nada por correo al candidato (D-16).
 */
function contenidoDelModo(modo: ModoHero, conSesion: boolean): ContenidoModo {
  if (modo === 'empresa') {
    return {
      entradilla:
        'Crea evaluaciones, envía enlaces únicos a tus candidatos y compara sus resultados desde un solo panel.',
      cta: { label: 'Crear cuenta de empresa', to: '/registro' },
      // Con sesión, al panel; la guarda de /app manda a /perfil a quien no tiene empresa (D-07).
      enlace: { label: 'Entrar al portal de RR. HH.', to: conSesion ? '/app' : '/login' },
    }
  }
  return {
    entradilla:
      '¿Te invitó una empresa? Responde con el enlace que te envió, sin crear cuenta. Tus respuestas se guardan solas.',
    cta: { label: 'Tengo un código', to: '/evaluar' },
    enlace: { label: 'Cómo funciona', to: '/como-funciona' },
  }
}

/** Flecha del CTA (Strata.dc.html:147). */
function IconoFlecha() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden focusable={false}>
      <path d="M3.4 9h11.2M10.4 4.8 14.6 9l-4.2 4.2" />
    </svg>
  )
}

/** Reloj (Strata.dc.html:154). */
function IconoReloj() {
  return (
    <svg width="15" height="15" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden focusable={false}>
      <circle cx="9" cy="9" r="6.6" />
      <path d="M9 5.4V9l2.5 1.8" />
    </svg>
  )
}

/** Impresora: el reporte se imprime desde el panel de RR. HH. */
function IconoImprimir() {
  return (
    <svg width="15" height="15" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden focusable={false}>
      <path d="M5.2 6.4V2.6h7.6v3.8" />
      <rect x="2.6" y="6.4" width="12.8" height="6.2" rx="1.6" />
      <path d="M5.2 10.6h7.6v4.8H5.2z" />
    </svg>
  )
}

/** Disquete: guardado automático de respuestas. */
function IconoGuardar() {
  return (
    <svg width="15" height="15" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden focusable={false}>
      <path d="M3 3h9.4L15 5.6V15H3z" />
      <path d="M5.8 3v3.6h5.4V3M5.6 15v-4.6h6.8V15" />
    </svg>
  )
}

export interface HeroProps {
  /**
   * Texto de duración de la fila de confianza: el rango de GET /api/catalog
   * («10–25 min por prueba») o el respaldo si la llamada falla (D-18).
   */
  duracion: string
  /** Ref al H1. La mascota la usa para bajar su opacidad al pasar sobre el titular. */
  tituloRef?: Ref<HTMLHeadingElement>
  /** Columna derecha del hero: la demo del examen (mapa.md, V-4). */
  aside?: ReactNode
}

/**
 * Hero de la home (Strata.dc.html:127-166; mapa.md, V-3; D-13):
 * - Eyebrow con punto en vivo y H1 display de 52 px.
 * - Selector «Para mí» / «Para mi empresa»: cambia la entradilla, el CTA y el enlace.
 *   Para mí → «Tengo un código» (/evaluar) y «Cómo funciona».
 *   Para mi empresa → «Crear cuenta de empresa» (/registro) y «Entrar al portal
 *   de RR. HH.» (/login, o /app con sesión).
 * - Fila de confianza con tres afirmaciones verdaderas (D-18), cortas para que
 *   quepan en un renglón de 540 px como en el prototipo, también con la duración
 *   de respaldo (así la fila no cambia de alto al llegar el catálogo).
 * Los CTA llevan data-mascota-objetivo y el H1 data-mascota-titular, para la mascota.
 */
export function Hero({ duracion, tituloRef, aside }: HeroProps) {
  const [modo, setModo] = useState<ModoHero>('mi')
  const { user } = useAuth()
  const tituloId = useId()
  const contenido = contenidoDelModo(modo, Boolean(user))

  return (
    <section className="st-hero" aria-labelledby={tituloId}>
      <div className="st-hero__copy">
        <Tag tone="surface" size="lg" live className="st-hero__eyebrow">
          Evaluaciones psicométricas en línea
        </Tag>

        <h1 id={tituloId} ref={tituloRef} className="st-hero__title" data-mascota-titular="">
          Descubre lo que llevas dentro.<span className="st-hero__title-accent"> O encuentra a quien lo tiene.</span>
        </h1>

        <SegmentedToggle
          aria-label="¿Para quién es?"
          options={OPCIONES_MODO}
          value={modo}
          onChange={(valor) => setModo(valor === 'empresa' ? 'empresa' : 'mi')}
          className="st-hero__toggle"
          data-mascota-objetivo="selector"
        />

        {/* Región viva: al cambiar de modo se anuncia la entradilla nueva. La clave
            vuelve a montar el párrafo para repetir su entrada (softIn, Strata.dc.html:142). */}
        <div className="st-hero__lead-live" aria-live="polite">
          <p key={modo} className="st-hero__lead">
            {contenido.entradilla}
          </p>
        </div>

        <div className="st-hero__actions">
          <Button to={contenido.cta.to} size="lg" iconRight={<IconoFlecha />} data-mascota-objetivo="cta">
            {contenido.cta.label}
          </Button>
          <Button to={contenido.enlace.to} variant="ghost" data-mascota-objetivo="enlace">
            {contenido.enlace.label}
          </Button>
        </div>

        <ul className="st-hero__trust">
          <li className="st-hero__trust-item">
            <span className="st-hero__trust-icon">
              <IconoReloj />
            </span>
            {duracion}
          </li>
          <li className="st-hero__trust-item">
            <span className="st-hero__trust-icon">
              <IconoImprimir />
            </span>
            Reporte para RR. HH.
          </li>
          <li className="st-hero__trust-item">
            <span className="st-hero__trust-icon">
              <IconoGuardar />
            </span>
            Guardado automático
          </li>
        </ul>
      </div>

      {aside != null && <div className="st-hero__aside">{aside}</div>}
    </section>
  )
}

export default Hero
