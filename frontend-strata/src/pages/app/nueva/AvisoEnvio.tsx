import { Button, Callout, type EstadoErrorKind } from '@/components/ui'
import { IconoReintentar } from '@/components/ui/Iconos'
import { EnlaceSolicitarCreditos } from './BloqueCreditos'
import { PASOS, type ErrorEnvio, type ErroresServidor, type IndicePaso } from './modelo'

interface TextoEnvio {
  titulo: string
  mensaje: string
  /** El error se puede reintentar desde el aviso. */
  reintentar: boolean
}

/** Textos del error de POST /api/assessments por tipo (red, servidor, sesión…). */
const TEXTOS_ERROR_ENVIO: Record<EstadoErrorKind, TextoEnvio> = {
  red: {
    titulo: 'No pudimos conectarnos',
    mensaje: 'Revisa tu conexión a internet e inténtalo de nuevo. Lo que capturaste sigue aquí.',
    reintentar: true,
  },
  servidor: {
    titulo: 'No pudimos crear la evaluación',
    mensaje: 'Ocurrió un error de nuestro lado. Inténtalo de nuevo en unos minutos; lo que capturaste sigue aquí.',
    reintentar: true,
  },
  conflicto: {
    titulo: 'No pudimos crear la evaluación',
    mensaje: 'La información cambió mientras la enviabas. Inténtalo de nuevo.',
    reintentar: true,
  },
  'no-encontrado': {
    titulo: 'No pudimos crear la evaluación',
    mensaje: 'El servicio no respondió como esperábamos. Inténtalo de nuevo en unos minutos.',
    reintentar: true,
  },
  sesion: {
    titulo: 'Tu sesión expiró',
    mensaje: 'Vuelve a entrar para crear la evaluación.',
    reintentar: false,
  },
  permiso: {
    titulo: 'No tienes permiso para crear evaluaciones',
    mensaje: 'Tu cuenta no tiene acceso a esta acción.',
    reintentar: false,
  },
}

export interface AvisoEnvioProps {
  id: string
  error: Exclude<ErrorEnvio, { tipo: 'campos' }>
  onReintentar: () => void
  reintentando: boolean
}

/**
 * Error del envío, inline y con ícono (D-22):
 * - Saldo insuficiente (422 sin errors, PB-25): el message del backend y el
 *   enlace a Créditos (R-20).
 * - Red o servidor: «Reintentar» sin perder lo capturado.
 */
export function AvisoEnvio({ id, error, onReintentar, reintentando }: AvisoEnvioProps) {
  if (error.tipo === 'saldo') {
    return (
      <Callout id={id} tabIndex={-1} tone="error" live="alert" title="No te alcanzan los créditos" actions={<EnlaceSolicitarCreditos />}>
        {error.mensaje}
      </Callout>
    )
  }
  const texto = TEXTOS_ERROR_ENVIO[error.kind]
  return (
    <Callout
      id={id}
      tabIndex={-1}
      tone="error"
      live="alert"
      title={texto.titulo}
      actions={
        texto.reintentar && (
          <Button
            variant="secondary"
            size="sm"
            iconLeft={<IconoReintentar />}
            loading={reintentando}
            loadingText="Reintentando…"
            onClick={onReintentar}
          >
            Reintentar
          </Button>
        )
      }
    >
      {texto.mensaje}
    </Callout>
  )
}

export interface AvisoErroresServidorProps {
  id: string
  errores: ErroresServidor
  /** Pasos con errores del servidor. */
  pasos: IndicePaso[]
  /** Paso visible: no se repite en la lista de pasos por revisar. */
  pasoActual: IndicePaso
}

/**
 * 422 con errores por campo: cada campo muestra su mensaje (el del servidor) y
 * este aviso dice qué otros pasos revisar y lista lo que no tiene campo.
 */
export function AvisoErroresServidor({ id, errores, pasos, pasoActual }: AvisoErroresServidorProps) {
  const otrosPasos = pasos.filter((paso) => paso !== pasoActual).map((paso) => PASOS[paso])
  return (
    <Callout id={id} tabIndex={-1} tone="error" title="Revisa los datos marcados">
      <p>No pudimos crear la evaluación: el servidor rechazó algunos datos.</p>
      {otrosPasos.length > 0 && <p>También hay datos por revisar en: {otrosPasos.join(', ')}.</p>}
      {errores.otros.length > 0 && (
        <ul>
          {errores.otros.map((mensaje, indice) => (
            <li key={`${indice}-${mensaje}`}>{mensaje}</li>
          ))}
        </ul>
      )}
    </Callout>
  )
}
