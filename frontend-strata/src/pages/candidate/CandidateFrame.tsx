import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Footer } from '@/components/layout/Footer'
import { Marca } from '@/components/layout/Marca'
import { PageLayout } from '@/components/layout/PageLayout'
import { Avatar, Card, cx, getInitials } from '@/components/ui'
import { SITE } from '@/config/site'
import './CandidateFrame.css'

export interface CandidateFrameProps {
  /**
   * Organización que invita (GET /api/evaluar/{token}). Con ella, la fila de
   * marca muestra su inicial y su nombre, más «Powered by STRATA»
   * (Strata.dc.html:999-1009). Sin ella (/evaluar, 404 o error de red), la
   * marca de Strata.
   */
  organization?: string | null
  /** Contenido de la tarjeta blanca. */
  children: ReactNode
  /** Clase extra para la tarjeta. */
  className?: string
}

/**
 * Marco del acceso del candidato (Strata.dc.html:994-1011 y 1122-1136):
 * lienzo con los halos globales (PageLayout candidate), columna de 600 px
 * centrada en el alto, fila de marca, tarjeta blanca y fila de enlaces
 * (¿Problemas con la prueba?, Aviso de privacidad y Soporte). Sin barra de
 * navegación ni enlaces del sitio, y el logo no enlaza.
 */
export function CandidateFrame({ organization, children, className }: CandidateFrameProps) {
  const empresa = organization?.trim()
  return (
    <PageLayout variant="candidate">
      <div className="st-cand-frame">
        <div className="st-cand-frame__inner">
          <div className="st-cand-frame__brand">
            {empresa ? (
              <>
                <p className="st-cand-frame__org">
                  <Avatar name={empresa} initials={getInitials(empresa, 1)} shape="square" />
                  <span className="st-cand-frame__org-name">{empresa}</span>
                </p>
                <p className="st-cand-frame__powered">
                  {/* Frase en inglés dentro de la página en español (WCAG 3.1.2). */}
                  <span className="st-cand-frame__powered-text" lang="en">
                    Powered by
                  </span>
                  <img className="st-cand-frame__mark" src={SITE.brand.mark} alt="" width={15} height={15} />
                  <span className="st-cand-frame__strata">{SITE.name}</span>
                </p>
              </>
            ) : (
              <Marca />
            )}
          </div>

          <Card variant="white" borderTone="warm" padding="none" className={cx('st-cand-frame__card', className)}>
            {children}
          </Card>

          <Footer variant="compact">
            {/* R-28: el enlace de ayuda del portal, que antes no llevaba a ningún lado. */}
            <Link to="/ayuda" className="st-footer__link">
              ¿Problemas con la prueba?
            </Link>
          </Footer>
        </div>
      </div>
    </PageLayout>
  )
}

export default CandidateFrame
