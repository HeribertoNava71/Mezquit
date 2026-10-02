import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Footer } from '@/components/layout/Footer'
import { Marca } from '@/components/layout/Marca'
import { PageLayout } from '@/components/layout/PageLayout'
import { Card, cx } from '@/components/ui'
import './AuthFrame.css'

/** narrow: /login (460 px). wide: /registro (760 px), con dos columnas de campos. */
export type AuthFrameWidth = 'narrow' | 'wide'

export interface AuthFrameProps {
  /** Ancho de la columna. Por defecto, narrow. */
  width?: AuthFrameWidth
  /** Contenido de la tarjeta blanca (el formulario). */
  children: ReactNode
}

/**
 * Marco de /login y /registro con el lenguaje del acceso del candidato
 * (Strata.dc.html:994-1011 y 1122-1136): lienzo con los halos globales,
 * columna centrada en el alto, fila de marca, tarjeta blanca con borde cálido
 * y fila de enlaces. A diferencia del candidato, la marca lleva a «/» (lo pedía
 * la spec de registro y login; mapa.md, sección 2) y la fila de enlaces suma
 * «¿Te invitaron a una evaluación?», para el candidato que llega aquí sin
 * necesitar una cuenta.
 */
export function AuthFrame({ width = 'narrow', children }: AuthFrameProps) {
  return (
    <PageLayout variant="candidate">
      <div className={cx('st-auth', `st-auth--${width}`)}>
        <div className="st-auth__inner">
          <div className="st-auth__brand">
            <Marca to="/" />
          </div>

          <Card variant="white" borderTone="warm" padding="none" className="st-auth__card">
            {children}
          </Card>
        </div>

        {/* Fila de enlaces con el ancho del acceso (600 px): en escritorio cabe en una línea aunque la tarjeta del login sea más angosta. */}
        <div className="st-auth__pie">
          <Footer variant="compact">
            <Link to="/evaluar" className="st-footer__link">
              ¿Te invitaron a una evaluación?
            </Link>
          </Footer>
        </div>
      </div>
    </PageLayout>
  )
}

export default AuthFrame
