import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { getReport, type ReportData } from '@/api/report'
import { Button, EstadoCarga, EstadoError, getErrorKind, VisuallyHidden, type EstadoErrorKind } from '@/components/ui'
import { SITE } from '@/config/site'
import Report from '@/sections/Report'
import { IconoDescargar, IconoVolver } from '@/components/ui/Iconos'
import './ReporteCandidato.css'

/** Respaldo de «Volver» cuando no hay historial en la app (PB-17: el reporte no trae el id de la evaluación). */
const RUTA_RESPALDO = '/app/evaluaciones'

/**
 * h1 de la página mientras carga o con error (solo para lectores de pantalla):
 * con el reporte, el h1 es el nombre del candidato.
 */
const TITULO_PAGINA = 'Reporte del candidato'

type EstadoReporte =
  | { tipo: 'cargando' }
  | { tipo: 'listo'; data: ReportData }
  | { tipo: 'error'; kind: EstadoErrorKind; reintentando: boolean }

interface TextoError {
  title: string
  message: string
  /** Muestra «Reintentar»: solo cuando volver a pedirlo puede cambiar el resultado. */
  reintentable: boolean
}

/**
 * Errores de GET /api/invitations/{id}/report (R-26, R-27): 403 si la invitación
 * es de otra organización, 409 si aún no está completada y 404 si no existe
 * (2026-09-11-fase1-nucleo.md:1931-1932). Antes era un solo mensaje.
 */
const ERRORES: Record<EstadoErrorKind, TextoError> = {
  red: {
    title: 'No pudimos conectarnos',
    message: 'Revisa tu conexión a internet e inténtalo de nuevo.',
    reintentable: true,
  },
  servidor: {
    title: 'No pudimos cargar el reporte',
    message: 'Ocurrió un error de nuestro lado. Inténtalo de nuevo en unos minutos.',
    reintentable: true,
  },
  permiso: {
    title: 'No tienes acceso a este reporte',
    message: 'Este reporte pertenece a una evaluación de otra organización.',
    reintentable: false,
  },
  conflicto: {
    title: 'La evaluación aún no está completada',
    message: 'El reporte se genera cuando el candidato termina todas sus pruebas.',
    reintentable: true,
  },
  'no-encontrado': {
    title: 'No encontramos este reporte',
    message: 'Puede que el enlace esté incompleto o que la invitación ya no exista.',
    reintentable: false,
  },
  sesion: {
    title: 'Tu sesión expiró',
    message: 'Vuelve a entrar para ver el reporte.',
    reintentable: false,
  },
}

/** Id de la invitación de la URL: solo un entero positivo. Otro valor no llega a la API. */
function idDeInvitacion(parametro: string): number | null {
  if (!/^\d+$/.test(parametro)) return null
  const id = Number(parametro)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

/**
 * Abre la impresión del navegador («Guardar como PDF»; P-18, 2026-09-12-fase2-panel-rh.md:1836).
 * Mientras dura, el título del documento nombra al candidato: es el nombre que
 * el navegador sugiere para el archivo.
 */
function imprimirReporte(candidato: string) {
  const tituloAnterior = document.title
  const restaurar = () => {
    document.title = tituloAnterior
    window.removeEventListener('afterprint', restaurar)
  }
  document.title = `Reporte de ${candidato} · ${SITE.name}`
  window.addEventListener('afterprint', restaurar)
  window.print()
}

/**
 * «Volver» (Strata.dc.html:884): regresa a la pantalla anterior de la app; si se
 * abrió el reporte directo (sin historial), va a la lista de evaluaciones. Es un
 * enlace real a esa lista, así que se puede abrir en otra pestaña.
 */
function VolverAtras() {
  const navigate = useNavigate()
  const location = useLocation()
  const hayHistorial = location.key !== 'default'

  function alPulsar(evento: MouseEvent<HTMLAnchorElement>) {
    const conModificador = evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey || evento.button !== 0
    if (!hayHistorial || conModificador) return
    evento.preventDefault()
    navigate(-1)
  }

  return (
    <Button variant="ghost" to={RUTA_RESPALDO} iconLeft={<IconoVolver />} onClick={alPulsar}>
      Volver
    </Button>
  )
}

/**
 * /app/candidatos/:invitationId/reporte (RH-10): reporte individual con el Report
 * nuevo (D-14), «Descargar PDF» (impresión) y «Volver». Carga, error por código
 * y vacío (el Report muestra el vacío si el reporte no trae pruebas).
 */
export default function ReporteCandidato() {
  const { invitationId = '' } = useParams()
  // Otra invitación empieza de cero: estado nuevo y petición nueva.
  return <ReporteDeInvitacion key={invitationId} parametro={invitationId} />
}

function ReporteDeInvitacion({ parametro }: { parametro: string }) {
  const id = idDeInvitacion(parametro)
  const [estado, setEstado] = useState<EstadoReporte>(() =>
    id == null ? { tipo: 'error', kind: 'no-encontrado', reintentando: false } : { tipo: 'cargando' },
  )
  const [intento, setIntento] = useState(0)
  const tituloRef = useRef<HTMLHeadingElement>(null)
  const enfocarAlCargar = useRef(false)

  useEffect(() => {
    if (id == null) return
    // Una respuesta tardía (de un intento anterior o tras salir) se ignora.
    let vigente = true
    getReport(id).then(
      (data) => {
        if (vigente) setEstado({ tipo: 'listo', data })
      },
      (error: unknown) => {
        if (vigente) setEstado({ tipo: 'error', kind: getErrorKind(error), reintentando: false })
      },
    )
    return () => {
      vigente = false
    }
  }, [id, intento])

  // Tras «Reintentar», el foco pasa al nombre del candidato: el botón ya no existe.
  useEffect(() => {
    if (estado.tipo !== 'listo' || !enfocarAlCargar.current) return
    enfocarAlCargar.current = false
    tituloRef.current?.focus()
  }, [estado])

  function reintentar() {
    enfocarAlCargar.current = true
    setEstado((actual) => (actual.tipo === 'error' ? { ...actual, reintentando: true } : actual))
    setIntento((n) => n + 1)
  }

  if (estado.tipo === 'cargando') {
    return (
      <div className="st-reporte-candidato st-reporte-candidato--estado">
        <VisuallyHidden as="h1">{TITULO_PAGINA}</VisuallyHidden>
        <EstadoCarga label="Cargando reporte…" />
      </div>
    )
  }

  if (estado.tipo === 'error') {
    const texto = ERRORES[estado.kind]
    return (
      <div className="st-reporte-candidato st-reporte-candidato--estado">
        <VisuallyHidden as="h1">{TITULO_PAGINA}</VisuallyHidden>
        <EstadoError
          className="st-reporte-candidato__error"
          kind={estado.kind}
          titleAs="h2"
          title={texto.title}
          message={texto.message}
          onRetry={texto.reintentable ? reintentar : undefined}
          retrying={estado.reintentando}
          actions={
            estado.kind === 'sesion' ? (
              <Button variant="secondary" to="/login">
                Entrar
              </Button>
            ) : (
              <VolverAtras />
            )
          }
        />
      </div>
    )
  }

  const { data } = estado
  return (
    <div className="st-reporte-candidato">
      <Report
        data={data}
        headingLevel={1}
        headingRef={tituloRef}
        actions={
          <div className="st-reporte-candidato__acciones no-print">
            <Button variant="secondary" iconLeft={<IconoDescargar />} onClick={() => imprimirReporte(data.candidate)}>
              Descargar PDF
            </Button>
            <VolverAtras />
          </div>
        }
      />
    </div>
  )
}
