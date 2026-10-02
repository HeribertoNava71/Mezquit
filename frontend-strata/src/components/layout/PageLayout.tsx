import type { MouseEvent, ReactNode } from 'react'
import { cx } from '@/components/ui'
import { hasContent } from '@/components/ui/hasContent'
import { ScrollToTop } from './ScrollToTop'
import './PageLayout.css'

/** Lienzo de página: default (sitio y paneles), home (Fase 6) y candidate (Fase 3). */
export type PageLayoutVariant = 'default' | 'home' | 'candidate'

export interface PageLayoutProps {
  /**
   * - default: halos globales fijos y contenedor de 1200 px con padding 48/34/88,
   *   que baja a 32/20/64 (≤ 640 px) y a 24/16/56 (≤ 400 px).
   * - home: halos propios de la home, absolutos y más intensos; barra, contenido
   *   y pie van dentro de un marco de 1200 px con padding 0 34 72.
   * - candidate: halos globales y contenido sin contenedor; cada pantalla del
   *   candidato pone su ancho (acceso 600, examen 760 y fin 560 px).
   * Por defecto, default.
   */
  variant?: PageLayoutVariant
  /**
   * Barra superior (TopBar). Se monta como hija directa del lienzo para que
   * su position: sticky funcione. Con barra se agrega «Saltar al contenido».
   */
  topbar?: ReactNode
  /** Pie de página (Footer). Va por encima de los halos. */
  footer?: ReactNode
  /** Contenido. En un layout de rutas, <RouteTransition />. */
  children?: ReactNode
  /** Clase extra para el contenedor del contenido (.st-page__content). */
  contentClassName?: string
}

const MAIN_ID = 'main-content'

/**
 * Enlace «Saltar al contenido» (estilo .st-skip-link de global.css): lleva el
 * foco a <main> sin tocar la URL. El tabindex es temporal para que un clic en
 * el contenido no enfoque <main>.
 */
function SaltarAlContenido() {
  function enfocar(evento: MouseEvent<HTMLAnchorElement>) {
    const main = document.getElementById(MAIN_ID)
    if (!main) return
    evento.preventDefault()
    main.setAttribute('tabindex', '-1')
    main.addEventListener('blur', () => main.removeAttribute('tabindex'), { once: true })
    main.focus()
  }

  return (
    <a className="st-skip-link" href={`#${MAIN_ID}`} onClick={enfocar}>
      Saltar al contenido
    </a>
  )
}

/** Tres halos radiales con deriva de 18 s (Strata.dc.html:47-50; en la home, :97-99). Decorativos. */
function Halos({ home }: { home: boolean }) {
  return (
    <div className={cx('st-page__halos', home && 'st-page__halos--home')} aria-hidden="true">
      <div className="st-page__halo st-page__halo--coral" />
      <div className="st-page__halo st-page__halo--sky" />
      <div className="st-page__halo st-page__halo--navy" />
    </div>
  )
}

/**
 * Lienzo de cada pantalla: fondo #FAF8F5 con halos, barra superior, <main>
 * con el contenedor de contenido y pie (Strata.dc.html:45-51, :92 y :96-108).
 * Monta ScrollToTop: al cambiar de ruta sube al inicio o salta al #hash.
 *
 * @example
 * <PageLayout topbar={<BarraRh />} footer={<Footer />}>
 *   <RouteTransition />
 * </PageLayout>
 */
export function PageLayout({ variant = 'default', topbar, footer, children, contentClassName }: PageLayoutProps) {
  const home = variant === 'home'
  const cuerpo = (
    <>
      {topbar}
      <main id={MAIN_ID} className="st-page__main">
        <div className={cx('st-page__content', `st-page__content--${variant}`, contentClassName)}>{children}</div>
      </main>
      {hasContent(footer) && <div className="st-page__footer">{footer}</div>}
    </>
  )

  return (
    <div className={cx('st-page', `st-page--${variant}`)}>
      <ScrollToTop />
      {hasContent(topbar) && <SaltarAlContenido />}
      <Halos home={home} />
      {home ? <div className="st-page__frame">{cuerpo}</div> : cuerpo}
    </div>
  )
}

export default PageLayout
