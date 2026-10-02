import { Button, Callout, IconButton, type EstadoErrorKind } from '@/components/ui'
import { IconoCerrar } from '@/components/ui/Iconos'
import './ErrorSalida.css'

export interface ErrorSalidaProps {
  /** Tipo de falla de POST /api/logout (useSalir). */
  tipo: EstadoErrorKind
  /** Vuelve a intentar cerrar la sesión. */
  onReintentar: () => void
  /** Oculta el aviso. */
  onDescartar: () => void
  /** El reintento está en curso. */
  reintentando?: boolean
}

/**
 * Aviso en línea, con ícono y texto (D-22), cuando «Salir» no pudo cerrar la
 * sesión. Va dentro de la barra, debajo de su fila (prop below de TopBar), y
 * se anuncia con role="alert".
 */
export function ErrorSalida({ tipo, onReintentar, onDescartar, reintentando = false }: ErrorSalidaProps) {
  const causa =
    tipo === 'red'
      ? 'Revisa tu conexión a internet e inténtalo de nuevo.'
      : 'Ocurrió un error de nuestro lado. Inténtalo de nuevo en unos minutos.'

  return (
    <div className="st-error-salida">
      <Callout
        tone="error"
        live="alert"
        title="No pudimos cerrar tu sesión"
        actions={
          <>
            <Button variant="secondary" size="sm" loading={reintentando} onClick={onReintentar}>
              Reintentar
            </Button>
            <IconButton aria-label="Cerrar aviso" onClick={onDescartar}>
              <IconoCerrar />
            </IconButton>
          </>
        }
      >
        Tu sesión sigue abierta. {causa}
      </Callout>
    </div>
  )
}

export default ErrorSalida
