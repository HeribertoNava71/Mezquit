import { useLayoutEffect, useId, useRef, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { PortalState } from '@/api/candidate'
import { Button, Callout, Checkbox, DotSeparator, Tag, VisuallyHidden, type EstadoErrorKind } from '@/components/ui'
import { IconoExito } from '@/components/ui/Iconos'
import { IconoDuracion, IconoEnlace, IconoFlecha, IconoGuardar, IconoVerificado } from './iconos'
import './AccesoVerificado.css'

export interface AccesoVerificadoProps {
  /** Respuesta de GET /api/evaluar/{token}: organización, puesto, pruebas y consented. */
  portal: PortalState
  /** Casilla del aviso de privacidad (sin marcar al inicio). */
  aceptaAviso: boolean
  onAceptaAvisoChange: (acepta: boolean) => void
  /** Hay pruebas y el consentimiento ya existe o la casilla está marcada. */
  puedeIniciar: boolean
  /** POST consent en curso. */
  iniciando: boolean
  /** Falla de POST consent que no es bloqueo (red o servidor). */
  error: EstadoErrorKind | null
  /** Guarda el consentimiento (si falta) y abre la primera prueba. */
  onIniciar: () => void
}

function minutos(n: number): string {
  return `${n} ${n === 1 ? 'minuto' : 'minutos'}`
}

function reactivos(n: number): string {
  return `${n} ${n === 1 ? 'reactivo' : 'reactivos'}`
}

/** Instrucción sobre «Anterior», según allows_back de las pruebas. */
function instruccionRegreso(portal: PortalState): ReactNode {
  const conRegreso = portal.tests.filter((t) => t.allows_back).length
  if (conRegreso === portal.tests.length) {
    return (
      <>
        <strong>Puedes regresar a la pregunta anterior</strong> para cambiar tu respuesta.
      </>
    )
  }
  if (conRegreso === 0) {
    return (
      <>
        <strong>No podrás regresar a preguntas anteriores.</strong> Revisa tu respuesta antes de continuar.
      </>
    )
  }
  return (
    <>
      <strong>En algunas pruebas no podrás regresar a la pregunta anterior.</strong> Revisa tu respuesta antes de
      continuar.
    </>
  )
}

const TEXTO_ERROR: Partial<Record<EstadoErrorKind, string>> = {
  red: 'Revisa tu conexión a internet e inténtalo de nuevo.',
}

/**
 * Paso 2 del acceso: invitación verificada, instrucciones y consentimiento
 * (Strata.dc.html:1013-1105; mapa.md, CA-2). Sin formulario de datos (D-11):
 * el nombre y el correo los captura RR. HH. La casilla empieza sin marcar y
 * enlaza al aviso; si el consentimiento ya existe, se salta. No hay reactivos
 * de práctica (PB-31): la escala se explica con texto.
 * Va dentro de CandidateFrame.
 */
export function AccesoVerificado({
  portal,
  aceptaAviso,
  onAceptaAvisoChange,
  puedeIniciar,
  iniciando,
  error,
  onIniciar,
}: AccesoVerificadoProps) {
  const ayudaId = useId()
  const titulo = useRef<HTMLHeadingElement>(null)
  const { organization, position, tests, consented } = portal
  const totalMinutos = tests.reduce((total, t) => total + t.duration_min, 0)
  const sinPruebas = tests.length === 0

  // Al llegar, el foco va al título: los lectores de pantalla anuncian la invitación.
  // useLayoutEffect: en el mismo commit, antes de pintar.
  useLayoutEffect(() => {
    titulo.current?.focus()
  }, [])

  const ayuda = sinPruebas
    ? null
    : consented || aceptaAviso
      ? 'Podrás pausar en cualquier momento.'
      : 'Acepta el aviso de privacidad para continuar.'

  return (
    <div className="st-acceso">
      <header className="st-acceso__head st-on-dark">
        <Tag tone="success-on-dark" size="lg" icon={<IconoVerificado />} className="st-acceso__insignia">
          Invitación verificada
        </Tag>
        <h1 ref={titulo} tabIndex={-1} className="st-acceso__title">
          {organization} te ha invitado a realizar una evaluación
          {position ? ` para el puesto de ${position}` : ''}
        </h1>
        {!sinPruebas && (
          <ul className="st-acceso__tests" aria-label="Pruebas de la evaluación">
            {tests.map((test) => (
              <li key={test.id} className="st-acceso__test">
                <span className="st-acceso__test-name">{test.name}</span>
                <DotSeparator tone="on-dark" />
                <span className="st-acceso__test-meta">{test.duration_min} min</span>
                <DotSeparator tone="on-dark" />
                <span className="st-acceso__test-meta">{reactivos(test.item_count)}</span>
              </li>
            ))}
          </ul>
        )}
      </header>

      <div className="st-acceso__body">
        <p className="st-acceso__intro">
          {consented
            ? 'Lee las instrucciones y continúa donde te quedaste.'
            : 'Lee las instrucciones y acepta el aviso de privacidad para comenzar.'}{' '}
          No necesitas crear una cuenta ni contraseña.
        </p>

        {sinPruebas ? (
          <Callout tone="warning" className="st-acceso__aviso">
            Esta evaluación todavía no tiene pruebas. Contacta a {organization} para que revise tu invitación.
          </Callout>
        ) : (
          <>
            <section className="st-acceso__instrucciones" aria-labelledby={`${ayudaId}-instrucciones`}>
              <h2 id={`${ayudaId}-instrucciones`} className="st-acceso__instrucciones-titulo">
                Antes de empezar
              </h2>
              <ol className="st-acceso__pasos">
                <li className="st-acceso__paso">
                  <span className="st-acceso__paso-num" aria-hidden="true">
                    01
                  </span>
                  <p className="st-acceso__paso-texto">
                    <strong>Una afirmación por pantalla.</strong>{' '}
                    {tests.length > 1 && `Responderás ${tests.length} pruebas, una después de otra. `}
                    Cada afirmación tiene una escala de opciones, de un extremo al otro: elige la que mejor te
                    describa en el trabajo.
                  </p>
                </li>
                <li className="st-acceso__paso">
                  <span className="st-acceso__paso-num" aria-hidden="true">
                    02
                  </span>
                  <p className="st-acceso__paso-texto">
                    <strong>No hay respuestas correctas ni incorrectas.</strong> Responde con sinceridad, a tu
                    ritmo.
                  </p>
                </li>
                <li className="st-acceso__paso">
                  <span className="st-acceso__paso-num" aria-hidden="true">
                    03
                  </span>
                  <p className="st-acceso__paso-texto">
                    <strong>Tus respuestas se guardan solas.</strong> Si cierras la ventana, vuelve con el mismo
                    enlace y retomarás en la primera pregunta sin responder.
                  </p>
                </li>
                <li className="st-acceso__paso">
                  <span className="st-acceso__paso-num" aria-hidden="true">
                    04
                  </span>
                  <p className="st-acceso__paso-texto">{instruccionRegreso(portal)}</p>
                </li>
              </ol>
            </section>

            {consented ? (
              <p className="st-acceso__consentido">
                <IconoExito className="st-acceso__consentido-icono" width={15} height={15} />
                Ya aceptaste el aviso de privacidad.
              </p>
            ) : (
              <Checkbox
                variant="consent"
                className="st-acceso__consent"
                checked={aceptaAviso}
                onChange={(evento) => onAceptaAvisoChange(evento.target.checked)}
                disabled={iniciando}
                label={
                  <>
                    Acepto el tratamiento de mis respuestas con fines de evaluación laboral y el{' '}
                    <Link to="/aviso-de-privacidad" target="_blank" rel="noopener noreferrer">
                      aviso de privacidad
                      <VisuallyHidden> (se abre en otra pestaña)</VisuallyHidden>
                    </Link>
                    .
                  </>
                }
                description={`Recabamos tus respuestas para generar un reporte que verá ${organization}. Se conservan de forma confidencial.`}
              />
            )}
          </>
        )}

        {/* Falla de POST consent (red o servidor). Un 409 o un 404 llevan al bloqueo. */}
        {error && (
          <Callout
            tone="error"
            live="alert"
            className="st-acceso__aviso"
            title="No pudimos registrar tu consentimiento"
            actions={
              <Button variant="secondary" onClick={onIniciar}>
                Reintentar
              </Button>
            }
          >
            {TEXTO_ERROR[error] ?? 'Ocurrió un error de nuestro lado. Inténtalo de nuevo en unos minutos.'}
          </Callout>
        )}

        {!sinPruebas && (
          <div className="st-acceso__cta">
            <Button
              className="st-acceso__iniciar"
              iconRight={<IconoFlecha />}
              onClick={onIniciar}
              disabled={!puedeIniciar}
              loading={iniciando}
              loadingText="Iniciando…"
              aria-describedby={ayudaId}
            >
              {consented ? 'Continuar evaluación' : 'Iniciar evaluación'}
            </Button>
            <span id={ayudaId} className="st-acceso__ayuda">
              {ayuda}
            </span>
          </div>
        )}
      </div>

      {!sinPruebas && (
        <ul className="st-acceso__garantias">
          <li className="st-acceso__garantia">
            <span className="st-acceso__garantia-icono">
              <IconoDuracion />
            </span>
            <span>
              <span aria-hidden="true">~</span>
              {minutos(totalMinutos)} de duración estimada
            </span>
          </li>
          <li className="st-acceso__garantia">
            <span className="st-acceso__garantia-icono">
              <IconoGuardar />
            </span>
            <span>Guardado automático de respuestas</span>
          </li>
          <li className="st-acceso__garantia">
            <span className="st-acceso__garantia-icono">
              <IconoEnlace />
            </span>
            {/* D-18: sustituye a «Tus datos viajan cifrados», que no tiene respaldo. */}
            <span>Puedes pausar y retomar con el mismo enlace</span>
          </li>
        </ul>
      )}
    </div>
  )
}

export default AccesoVerificado
