import { useCallback, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button, EstadoError, PageHeader, estadoErrorTextos, useFocoAlRecuperar } from '@/components/ui'
import { IconoAgregar } from '@/components/ui/Iconos'
import { ResumenCreditos } from './creditos/ResumenCreditos'
import { SolicitarCreditos } from './creditos/SolicitarCreditos'
import { PARAMETRO_SOLICITAR } from './creditos/solicitud'
import { TablaMovimientos } from './creditos/TablaMovimientos'
import { useCreditos } from './creditos/useCreditos'
import './CreditosPage.css'

/**
 * /app/creditos: «Mis licencias» del prototipo con el modelo de créditos
 * (Strata.dc.html:681-770; mapa.md, RH-4 y RH-5; D-08 y D-09).
 * - PageHeader con «Solicitar créditos» (drawer) e «Invitar candidatos» (→ /app/evaluaciones/nueva).
 * - StatCards: disponibles (balance), recibidos y consumidos.
 * - Tabla «Movimientos» con filtro por tipo y referencias legibles.
 * - Estados: carga en esqueleto, error con «Reintentar» (distinto del vacío) y
 *   «Aún no hay movimientos».
 * - El drawer se abre con ?solicitar=1 y el parámetro se quita al cerrarlo.
 */
export default function CreditosPage() {
  const { estado, reintentar } = useCreditos()
  const [parametros, setParametros] = useSearchParams()
  const abierto = parametros.get(PARAMETRO_SOLICITAR) === '1'
  const botonSolicitar = useRef<HTMLButtonElement>(null)
  const estabaAbierto = useRef(abierto)
  // Tras un «Reintentar» que trae los datos, el foco pasa al resumen (el botón ya no existe).
  const resumenRef = useRef<HTMLElement>(null)
  useFocoAlRecuperar(estado.fase === 'error', estado.fase === 'listo', resumenRef)

  const abrirSolicitud = useCallback(() => {
    setParametros(
      (actuales) => {
        const siguientes = new URLSearchParams(actuales)
        siguientes.set(PARAMETRO_SOLICITAR, '1')
        return siguientes
      },
      { replace: true },
    )
  }, [setParametros])

  const cerrarSolicitud = useCallback(() => {
    setParametros(
      (actuales) => {
        const siguientes = new URLSearchParams(actuales)
        siguientes.delete(PARAMETRO_SOLICITAR)
        return siguientes
      },
      { replace: true },
    )
  }, [setParametros])

  // Al cerrar, el drawer devuelve el foco a lo que lo abrió. Si se abrió desde
  // la URL no hay disparador: el foco va a «Solicitar créditos».
  useEffect(() => {
    if (estabaAbierto.current && !abierto) {
      const activo = document.activeElement
      if (activo === null || activo === document.body) botonSolicitar.current?.focus()
    }
    estabaAbierto.current = abierto
  }, [abierto])

  return (
    <div className="st-creditos">
      <PageHeader
        eyebrow="Saldo y movimientos"
        title="Créditos"
        lede="Cada crédito te permite invitar a un candidato y se descuenta al crear la evaluación. Si te faltan, solicítalos: un asesor revisa cada solicitud."
        actions={
          <>
            <Button ref={botonSolicitar} variant="secondary" aria-haspopup="dialog" onClick={abrirSolicitud}>
              Solicitar créditos
            </Button>
            <Button to="/app/evaluaciones/nueva" iconLeft={<IconoAgregar />}>
              Invitar candidatos
            </Button>
          </>
        }
      />

      {estado.fase === 'error' ? (
        <EstadoError
          kind={estado.error}
          titleAs="h2"
          title={
            estado.error === 'sesion' || estado.error === 'permiso'
              ? estadoErrorTextos[estado.error].title
              : 'No pudimos cargar tus créditos'
          }
          message={estadoErrorTextos[estado.error].message}
          onRetry={reintentar}
          retrying={estado.reintentando}
        />
      ) : (
        <div className="st-creditos__contenido">
          <ResumenCreditos ref={resumenRef} creditos={estado.fase === 'listo' ? estado.creditos : null} />
          <TablaMovimientos
            movimientos={estado.fase === 'listo' ? estado.creditos.movimientos : null}
            onSolicitar={abrirSolicitud}
          />
        </div>
      )}

      <SolicitarCreditos open={abierto} onClose={cerrarSolicitud} />
    </div>
  )
}
