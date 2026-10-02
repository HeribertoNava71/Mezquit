import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { requestCredits } from '@/api/rh'
import {
  Button,
  Callout,
  Drawer,
  Stepper,
  Textarea,
  VisuallyHidden,
  cx,
  getErrorKind,
  useToast,
  type EstadoErrorKind,
} from '@/components/ui'
import { IconoReloj } from '@/components/ui/Iconos'
import { textoCreditos } from './movimientos'
import {
  CANTIDAD_MIN,
  MENSAJE_EXITO,
  MENSAJE_TOAST,
  NOTA_AVISO_RESTANTES,
  NOTA_MAX,
  leerValidacion,
  textoFallaSolicitud,
  validarSolicitud,
  type ErroresSolicitud,
} from './solicitud'
import './SolicitarCreditos.css'

/** editando: formulario. enviando: POST en curso. enviada: confirmación (201). */
type Fase = 'editando' | 'enviando' | 'enviada'

/** Aviso general del formulario: un 422 sin campo conocido, o una falla de red, sesión o servidor. */
type Falla = { tipo: 'validacion'; mensaje: string } | { tipo: 'envio'; error: EstadoErrorKind }

interface ContadorProps {
  id: string
  usados: number
  maximo: number
}

/**
 * Contador de la nota bajo el campo («12/255»). El campo lo enlaza con
 * aria-describedby; cerca del límite, una región viva avisa cuántos quedan.
 */
function Contador({ id, usados, maximo }: ContadorProps) {
  const restantes = Math.max(0, maximo - usados)
  const cerca = restantes <= NOTA_AVISO_RESTANTES
  let aviso = ''
  if (restantes === 0) aviso = `Llegaste al límite de ${maximo} caracteres.`
  else if (restantes === 1) aviso = 'Te queda 1 carácter.'
  else if (cerca) aviso = `Te quedan ${restantes} caracteres.`

  return (
    <>
      <p id={id} className={cx('st-cr-solicitud__contador', cerca && 'st-cr-solicitud__contador--cerca')}>
        <span aria-hidden="true">
          {usados}/{maximo}
        </span>
        <VisuallyHidden>
          {usados} de {maximo} caracteres
        </VisuallyHidden>
      </p>
      <VisuallyHidden aria-live="polite">{aviso}</VisuallyHidden>
    </>
  )
}

export interface SolicitarCreditosProps {
  /** Abre el drawer. */
  open: boolean
  /** Se llama al cerrar (X, Escape, fondo o «Cerrar»). No se llama mientras se envía. */
  onClose: () => void
}

/**
 * Drawer «Solicitar créditos» (Strata.dc.html:1247-1321; D-09): el checkout del
 * prototipo adaptado a POST /api/credit-requests, sin métodos de pago,
 * impuestos ni total (PB-09). Cantidad entera de 1 o más con Stepper y nota
 * opcional de hasta 255 caracteres (PB-26).
 * - Errores 422 junto a su campo (traducidos si llegan en inglés); red, sesión
 *   o servidor en un Callout de error (D-22). Ninguna falla queda sin capturar.
 * - Al 201: Callout de éxito «Solicitud registrada. Un asesor la revisará.» y
 *   toast. El saldo no cambia hasta la aprobación (S-10), así que no se vuelve
 *   a pedir GET /api/credits. RR. HH. no puede ver sus solicitudes (PB-08).
 * - Cerrar conserva lo escrito; tras enviar, el formulario vuelve a empezar.
 */
export function SolicitarCreditos({ open, onClose }: SolicitarCreditosProps) {
  const { toast } = useToast()
  const formId = useId()
  const contadorId = useId()
  const [cantidad, setCantidad] = useState(CANTIDAD_MIN)
  const [nota, setNota] = useState('')
  const [fase, setFase] = useState<Fase>('editando')
  const [enviados, setEnviados] = useState(0)
  const [errores, setErrores] = useState<ErroresSolicitud>({})
  const [falla, setFalla] = useState<Falla | null>(null)
  const cantidadRef = useRef<HTMLInputElement>(null)
  const notaRef = useRef<HTMLTextAreaElement>(null)
  const cerrarRef = useRef<HTMLButtonElement>(null)
  // Guarda contra un segundo envío antes de que se pinte «enviando» (Enter repetido).
  const enviando = useRef(false)
  // Campo que recibe el foco cuando se pinten sus errores.
  const enfocarCampo = useRef<keyof ErroresSolicitud | null>(null)

  useEffect(() => {
    const campo = enfocarCampo.current
    if (!campo) return
    enfocarCampo.current = null
    if (campo === 'cantidad') cantidadRef.current?.focus()
    else notaRef.current?.focus()
  })

  // La confirmación reemplaza al formulario. Con el botón del pie, el foco sigue
  // en él (ahora «Cerrar»); si se envió con Enter desde un campo, ese campo ya
  // no existe y el foco pasa a «Cerrar» en lugar de perderse fuera del diálogo.
  useEffect(() => {
    if (fase !== 'enviada') return
    const activo = document.activeElement
    if (activo === null || activo === document.body) cerrarRef.current?.focus()
  }, [fase])

  function mostrarErrores(nuevos: ErroresSolicitud) {
    setErrores(nuevos)
    if (nuevos.cantidad) enfocarCampo.current = 'cantidad'
    else if (nuevos.nota) enfocarCampo.current = 'nota'
  }

  function limpiarError(campo: keyof ErroresSolicitud) {
    setErrores((actuales) => (actuales[campo] ? { ...actuales, [campo]: undefined } : actuales))
  }

  function cerrar() {
    if (enviando.current) return
    if (fase === 'enviada') {
      setCantidad(CANTIDAD_MIN)
      setNota('')
      setFase('editando')
    }
    setErrores({})
    setFalla(null)
    onClose()
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (enviando.current || fase !== 'editando') return

    const locales = validarSolicitud(cantidad, nota)
    if (locales) {
      setFalla(null)
      mostrarErrores(locales)
      return
    }

    enviando.current = true
    setFase('enviando')
    setErrores({})
    setFalla(null)
    try {
      await requestCredits(cantidad, nota.trim())
      setEnviados(cantidad)
      setFase('enviada')
      toast({ message: MENSAJE_TOAST, tone: 'success' })
    } catch (error) {
      setFase('editando')
      const validacion = leerValidacion(error)
      if (validacion) {
        if (validacion.mensaje) setFalla({ tipo: 'validacion', mensaje: validacion.mensaje })
        mostrarErrores(validacion.campos)
      } else {
        setFalla({ tipo: 'envio', error: getErrorKind(error) })
      }
    } finally {
      enviando.current = false
    }
  }

  const enviada = fase === 'enviada'

  return (
    <Drawer
      open={open}
      onClose={cerrar}
      title="Solicitar créditos"
      description="Un asesor revisa cada solicitud."
      initialFocusRef={cantidadRef}
      footer={
        enviada ? (
          <Button ref={cerrarRef} fullWidth onClick={cerrar}>
            Cerrar
          </Button>
        ) : (
          <Button type="submit" form={formId} fullWidth loading={fase === 'enviando'} loadingText="Enviando…">
            Enviar solicitud
          </Button>
        )
      }
      footerNote={
        !enviada && (
          <>
            <IconoReloj width={13} height={13} />
            Tu saldo se actualiza cuando se aprueba la solicitud.
          </>
        )
      }
    >
      {/* Existe desde que se abre el drawer: así se anuncia la confirmación. */}
      <VisuallyHidden role="status">{enviada ? MENSAJE_EXITO : ''}</VisuallyHidden>

      {enviada ? (
        <Callout tone="success" title={MENSAJE_EXITO}>
          <p>Pediste {textoCreditos(enviados)}. Tu saldo no cambia hasta que se apruebe la solicitud.</p>
        </Callout>
      ) : (
        <form id={formId} className="st-cr-solicitud" noValidate onSubmit={enviar}>
          {falla && (
            <Callout
              tone="error"
              live="alert"
              title={falla.tipo === 'validacion' ? 'Revisa la solicitud' : 'No pudimos enviar la solicitud'}
            >
              {falla.tipo === 'validacion' ? falla.mensaje : textoFallaSolicitud(falla.error)}
            </Callout>
          )}

          <Stepper
            ref={cantidadRef}
            label="Cantidad de créditos"
            hint="1 crédito = 1 candidato invitado"
            min={CANTIDAD_MIN}
            value={cantidad}
            onChange={(valor) => {
              setCantidad(valor)
              limpiarError('cantidad')
            }}
            decrementLabel="Quitar un crédito"
            incrementLabel="Agregar un crédito"
            error={errores.cantidad}
          />

          <div className="st-cr-solicitud__nota">
            <Textarea
              ref={notaRef}
              label="Nota (opcional)"
              placeholder="Por ejemplo: proceso de selección de octubre"
              rows={4}
              maxLength={NOTA_MAX}
              value={nota}
              onChange={(evento) => {
                setNota(evento.target.value)
                limpiarError('nota')
              }}
              error={errores.nota}
              aria-describedby={contadorId}
            />
            <Contador id={contadorId} usados={nota.length} maximo={NOTA_MAX} />
          </div>
        </form>
      )}
    </Drawer>
  )
}
