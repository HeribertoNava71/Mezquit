import { useLayoutEffect, useId, useRef, type FormEvent } from 'react'
import { Marca } from '@/components/layout/Marca'
import {
  Button,
  Callout,
  Card,
  EstadoCarga,
  EstadoError,
  EstadoVacio,
  ProgressBar,
  RadioCard,
  RadioGroup,
  type EstadoErrorKind,
} from '@/components/ui'
import { IconoFlecha } from './iconos'
import { IndicadorGuardado } from './IndicadorGuardado'
import type { ErrorCierre, EstadoGuardado, ExamenEnCurso } from './useCandidateFlow'
import './ExamenFoco.css'

export interface ExamenFocoProps {
  /** Prueba en curso (useCandidateFlow). */
  examen: ExamenEnCurso
  /** Organización que invita (barra y mensajes de contacto). */
  organization: string
  guardado: EstadoGuardado
  /** Finalizando: guardado pendiente y POST complete en curso. */
  cerrando: boolean
  errorCierre: ErrorCierre | null
  onResponder: (valor: number) => void
  onSiguiente: () => void
  onAnterior: () => void
  onReintentarPrueba: () => void
  onReintentarGuardado: () => void
  onReintentarCierre: () => void
}

/** Textos del error al cargar los reactivos (GET …/pruebas/{testId}). */
function textoErrorPrueba(kind: EstadoErrorKind | null, organization: string): { title: string; message: string } {
  if (kind === 'no-encontrado') {
    return {
      title: 'No encontramos esta prueba',
      message: `Inténtalo de nuevo. Si el problema sigue, contacta a ${organization}, la empresa que te invitó.`,
    }
  }
  return {
    title: 'No pudimos cargar las preguntas',
    message:
      kind === 'red'
        ? 'Revisa tu conexión a internet e inténtalo de nuevo. Tus respuestas guardadas no se pierden.'
        : 'Ocurrió un error de nuestro lado. Inténtalo de nuevo en unos minutos. Tus respuestas guardadas no se pierden.',
  }
}

/** Textos del error al finalizar (respuestas sin guardar o POST complete). */
function textoErrorCierre(error: ErrorCierre): { title: string; message: string } {
  if (error === 'pendientes') {
    return {
      title: 'No pudimos guardar todas tus respuestas',
      message: 'Revisa tu conexión a internet y vuelve a intentarlo. No cierres esta ventana.',
    }
  }
  return {
    title: 'No pudimos finalizar el examen',
    message:
      error === 'red'
        ? 'Revisa tu conexión a internet e inténtalo de nuevo. Tus respuestas están guardadas.'
        : 'Ocurrió un error de nuestro lado. Inténtalo de nuevo en unos minutos. Tus respuestas están guardadas.',
  }
}

/**
 * Examen en modo foco (Strata.dc.html:1138-1196; mapa.md, CA-4): barra
 * translúcida sticky con el logo (sin enlace), la prueba, la organización, el
 * guardado real y el avance; una pregunta por vista con opciones RadioCard.
 * Sin temporizador (D-12) ni «Sección» (PB-29). «Anterior» solo con
 * allows_back; «Siguiente» deshabilitado hasta responder; al final de cada
 * prueba, «Siguiente prueba» o «Finalizar examen». La tarjeta entra con
 * softIn en cada pregunta (D-21), sin animación con movimiento reducido.
 * Va dentro de PageLayout variant="candidate".
 */
export function ExamenFoco({
  examen,
  organization,
  guardado,
  cerrando,
  errorCierre,
  onResponder,
  onSiguiente,
  onAnterior,
  onReintentarPrueba,
  onReintentarGuardado,
  onReintentarCierre,
}: ExamenFocoProps) {
  const {
    prueba,
    indicePrueba,
    totalPruebas,
    carga,
    errorPrueba,
    reactivos,
    actual,
    reactivo,
    permiteRegresar,
    puedeRegresar,
    puedeAvanzar,
    esUltimoReactivo,
    esUltimaPrueba,
    vacia,
  } = examen
  const preguntaId = useId()
  const notaId = useId()
  const pregunta = useRef<HTMLHeadingElement>(null)
  const vacio = useRef<HTMLDivElement>(null)
  const claveReactivo = reactivo ? `${indicePrueba}:${actual}` : null

  // En cada pregunta: arriba de la página y el foco en la pregunta, para que
  // los lectores de pantalla la lean y Tab lleve a las opciones. useLayoutEffect:
  // en el mismo commit, antes de pintar (como ScrollToTop).
  useLayoutEffect(() => {
    if (!claveReactivo) return
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    pregunta.current?.focus({ preventScroll: true })
  }, [claveReactivo])

  // Prueba sin reactivos: el botón que llevó aquí ya no existe, así que el foco
  // pasa al aviso para que se lea (una región de estado recién montada no
  // siempre se anuncia).
  useLayoutEffect(() => {
    if (!vacia) return
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    vacio.current?.focus({ preventScroll: true })
  }, [vacia, indicePrueba])

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (puedeAvanzar) onSiguiente()
  }

  const textoSiguiente = !esUltimoReactivo
    ? 'Siguiente pregunta'
    : esUltimaPrueba
      ? 'Finalizar examen'
      : 'Siguiente prueba'
  const sinResponder = reactivo?.answered == null
  const errorDeCarga = textoErrorPrueba(errorPrueba, organization)
  const errorDeCierre = errorCierre ? textoErrorCierre(errorCierre) : null

  return (
    <div className="st-examen">
      <header className="st-examen__barra">
        <div className="st-examen__barra-inner">
          <Marca hideName />
          <div className="st-examen__contexto">
            <h1 className="st-examen__prueba">{prueba.name}</h1>
            <p className="st-examen__org">{organization}</p>
          </div>
          <IndicadorGuardado estado={guardado} onReintentar={onReintentarGuardado} />
        </div>
        <ProgressBar
          size={4}
          track="divider"
          flush
          value={reactivo ? actual + 1 : 0}
          max={Math.max(1, reactivos.length)}
          label="Avance de la prueba"
          valueText={reactivo ? `Pregunta ${actual + 1} de ${reactivos.length}` : undefined}
        />
      </header>

      <div className="st-examen__cuerpo">
        <div className="st-examen__columna">
          {carga === 'cargando' && (
            <div className="st-examen__estado">
              <EstadoCarga label="Cargando las preguntas…" />
            </div>
          )}

          {carga === 'error' && (
            <EstadoError
              kind={errorPrueba ?? 'servidor'}
              titleAs="h2"
              title={errorDeCarga.title}
              message={errorDeCarga.message}
              onRetry={onReintentarPrueba}
            />
          )}

          {vacia && (
            <EstadoVacio
              ref={vacio}
              tabIndex={-1}
              className="st-examen__vacio"
              role="status"
              titleAs="h2"
              title="Esta prueba todavía no tiene preguntas"
              description={`Contacta a ${organization}, la empresa que te invitó, para que revise tu evaluación.${
                indicePrueba > 0 ? ' Tus respuestas anteriores están guardadas.' : ''
              }`}
            />
          )}

          {reactivo && (
            <form className="st-examen__form" onSubmit={enviar} noValidate>
              <div className="st-examen__encabezado">
                <p className="st-examen__contador">
                  Pregunta {actual + 1} de {reactivos.length}
                </p>
                {totalPruebas > 1 && (
                  <p className="st-examen__prueba-n">
                    Prueba {indicePrueba + 1} de {totalPruebas}
                  </p>
                )}
              </div>

              <Card key={claveReactivo} variant="white" padding="lg" className="st-examen__tarjeta">
                <p className="st-examen__indicacion">Indica qué tanto te describe la siguiente afirmación:</p>
                <h2 id={preguntaId} ref={pregunta} tabIndex={-1} className="st-examen__pregunta">
                  {reactivo.prompt}
                </h2>
                {/* El nombre del grupo es la pregunta (aria-labelledby); el rótulo oculto no la repite. */}
                <RadioGroup
                  label="Opciones de respuesta"
                  hideLabel
                  aria-labelledby={preguntaId}
                  size="lg"
                  value={reactivo.answered == null ? '' : String(reactivo.answered)}
                  onChange={(valor) => onResponder(Number(valor))}
                  disabled={cerrando}
                >
                  {reactivo.options.map((opcion, indice) => (
                    <RadioCard
                      key={opcion.value}
                      value={String(opcion.value)}
                      label={opcion.label}
                      aside={String(indice + 1)}
                    />
                  ))}
                </RadioGroup>
              </Card>

              {errorDeCierre && (
                <Callout
                  tone="error"
                  live="alert"
                  className="st-examen__aviso"
                  title={errorDeCierre.title}
                  actions={
                    <Button variant="secondary" onClick={onReintentarCierre}>
                      Reintentar
                    </Button>
                  }
                >
                  {errorDeCierre.message}
                </Callout>
              )}

              <div className="st-examen__nav">
                {permiteRegresar && (
                  <Button
                    variant="secondary"
                    className="st-examen__anterior"
                    onClick={onAnterior}
                    disabled={!puedeRegresar}
                  >
                    Anterior
                  </Button>
                )}
                <p id={notaId} className="st-examen__nota">
                  {sinResponder ? 'Elige una opción para continuar.' : 'No hay respuestas correctas ni incorrectas.'}
                </p>
                <Button
                  type="submit"
                  className="st-examen__siguiente"
                  iconRight={<IconoFlecha />}
                  disabled={!puedeAvanzar}
                  loading={cerrando}
                  loadingText="Finalizando…"
                  aria-describedby={sinResponder ? notaId : undefined}
                >
                  {textoSiguiente}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default ExamenFoco
