import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { approveRequest, listCreditRequests, rejectRequest, type PendingRequest } from '@/api/admin'
// Por su archivo: en Windows, «…/layout/topbar» choca con TopBar.tsx (mismo nombre sin distinguir mayúsculas).
import { avisarCambioDeSolicitudes } from '@/components/layout/topbar/datosBarra'
import {
  Button,
  DataTable,
  EstadoCarga,
  EstadoError,
  EstadoVacio,
  getErrorKind,
  PageHeader,
  useToast,
  VisuallyHidden,
  type DataTableColumn,
  type EstadoErrorKind,
} from '@/components/ui'
import { ConfirmarSolicitud } from './creditos/ConfirmarSolicitud'
import { creditos, fechaDeSolicitud } from './creditos/formato'
import type { AccionSolicitud, DialogoSolicitud } from './creditos/solicitud'
import './AdminCreditosPage.css'

type Carga =
  | { fase: 'cargando' }
  | { fase: 'error'; tipo: EstadoErrorKind; reintentando: boolean }
  | { fase: 'lista'; solicitudes: PendingRequest[] }

/**
 * A dónde va el foco después de cambiar la lista: tras resolver, a la fila que
 * ocupó el lugar de la resuelta (o al vacío); tras actualizar, al encabezado.
 */
type DestinoFoco = { tipo: 'tras-resolver'; indice: number } | { tipo: 'encabezado' }

/** Textos propios por tipo de error de la lista; los demás usan los de EstadoError. */
const TEXTOS_ERROR: Partial<Record<EstadoErrorKind, { title: string; message: string }>> = {
  permiso: {
    title: 'No tienes acceso a las solicitudes',
    message: 'Esta sección es solo para el equipo de operación de Strata.',
  },
  servidor: {
    title: 'No pudimos cargar las solicitudes',
    message: 'Ocurrió un error de nuestro lado. Inténtalo de nuevo en unos minutos.',
  },
}

function solicitudes(cantidad: number): string {
  return `${cantidad} ${cantidad === 1 ? 'solicitud' : 'solicitudes'}`
}

function Nota({ texto }: { texto: string | null }) {
  const limpio = texto?.trim()
  if (!limpio) return <span className="st-admin-creditos__sin-nota">Sin nota</span>
  return <span className="st-admin-creditos__nota">{limpio}</span>
}

function Fecha({ valor }: { valor: string | null }) {
  const fecha = fechaDeSolicitud(valor)
  if (!fecha.iso) return <span className="st-admin-creditos__fecha">{fecha.texto}</span>
  return (
    <time className="st-admin-creditos__fecha" dateTime={fecha.iso}>
      {fecha.texto}
    </time>
  )
}

/**
 * Solicitudes de créditos (/admin/creditos; mapa.md, sección 2; R-30).
 * - DataTable con empresa, saldo actual, cantidad solicitada, nota, fecha y las
 *   acciones «Aprobar» y «Rechazar». A 640 px o menos, cada solicitud es una tarjeta (D-23).
 * - Cada acción pide confirmación en un Modal, porque no se deshace (S-15). Al
 *   resolverse: toast, la fila desaparece, la barra vuelve a contar las
 *   pendientes y la lista se vuelve a pedir en silencio para actualizar saldos.
 * - Un error al aprobar o rechazar (red, servidor o 409) se muestra en el modal (D-22).
 * - Estados: carga; vacío «No hay solicitudes pendientes»; error distinto del
 *   vacío, con «Reintentar».
 */
export default function AdminCreditosPage() {
  const { toast } = useToast()
  const [carga, setCarga] = useState<Carga>({ fase: 'cargando' })
  const [dialogo, setDialogo] = useState<DialogoSolicitud | null>(null)
  // Solo cuenta la respuesta de la última petición de la lista.
  const secuencia = useRef(0)
  // Solicitudes resueltas aquí: una respuesta que salió antes no las devuelve a la lista.
  const resueltas = useRef(new Set<number>())
  const focoPendiente = useRef<DestinoFoco | null>(null)
  const encabezadoRef = useRef<HTMLElement>(null)
  const tablaRef = useRef<HTMLDivElement>(null)
  const vacioRef = useRef<HTMLDivElement>(null)

  /** GET /api/admin/credit-requests. En silencio, una falla conserva la lista que ya se ve. */
  const pedirLista = useCallback((silenciosa: boolean) => {
    secuencia.current += 1
    const numero = secuencia.current
    listCreditRequests()
      .then((lista) => {
        if (numero !== secuencia.current) return
        const pendientes = (Array.isArray(lista) ? lista : []).filter((solicitud) => !resueltas.current.has(solicitud.id))
        setCarga({ fase: 'lista', solicitudes: pendientes })
      })
      .catch((error: unknown) => {
        if (numero !== secuencia.current || silenciosa) return
        setCarga({ fase: 'error', tipo: getErrorKind(error), reintentando: false })
      })
  }, [])

  useEffect(() => {
    pedirLista(false)
  }, [pedirLista])

  // Foco después de que la lista cambia: la fila desaparece con el botón que lo
  // tenía, y el modal ya no puede devolverlo a su disparador.
  useEffect(() => {
    const destino = focoPendiente.current
    if (!destino) return
    focoPendiente.current = null
    if (destino.tipo === 'encabezado') {
      encabezadoRef.current?.focus()
      return
    }
    if (carga.fase !== 'lista') return
    const lista = carga.solicitudes
    if (lista.length === 0) {
      vacioRef.current?.focus()
      return
    }
    const siguiente = lista[Math.min(destino.indice, lista.length - 1)]
    tablaRef.current?.querySelector<HTMLElement>(`[data-foco-solicitud="${siguiente.id}"]`)?.focus()
  })

  function reintentar() {
    setCarga((actual) => (actual.fase === 'error' ? { ...actual, reintentando: true } : actual))
    pedirLista(false)
  }

  function abrir(solicitud: PendingRequest, accion: AccionSolicitud) {
    setDialogo({ accion, solicitud, enviando: false, error: null })
  }

  function cerrarDialogo() {
    setDialogo((actual) => (actual?.enviando ? actual : null))
  }

  /**
   * Tras un 409, 404 o 403 en el modal: lista nueva y el foco en el encabezado.
   * Alguien más resolvió solicitudes, así que la barra también vuelve a contarlas.
   */
  function actualizarLista() {
    focoPendiente.current = { tipo: 'encabezado' }
    setDialogo(null)
    setCarga({ fase: 'cargando' })
    pedirLista(false)
    avisarCambioDeSolicitudes()
  }

  function resolver(solicitud: PendingRequest, accion: AccionSolicitud) {
    // Lugar de la fila en lo que se ve ahora (una actualización en silencio pudo moverla).
    const filas = Array.from(tablaRef.current?.querySelectorAll<HTMLElement>('[data-foco-solicitud]') ?? [])
    const indice = filas.findIndex((fila) => fila.dataset.focoSolicitud === String(solicitud.id))
    focoPendiente.current = { tipo: 'tras-resolver', indice: Math.max(0, indice) }
    resueltas.current.add(solicitud.id)

    setCarga((actual) =>
      actual.fase === 'lista'
        ? { ...actual, solicitudes: actual.solicitudes.filter((pendiente) => pendiente.id !== solicitud.id) }
        : actual,
    )
    setDialogo(null)
    toast({
      tone: 'success',
      message:
        accion === 'aprobar'
          ? `Solicitud de ${solicitud.organization} aprobada: se sumaron ${creditos(solicitud.requested_amount)} a su saldo.`
          : `Solicitud de ${solicitud.organization} rechazada.`,
    })
    avisarCambioDeSolicitudes()
    // Saldos al día: aprobar cambia el de la empresa, que puede tener otra solicitud en la lista.
    pedirLista(true)
  }

  async function confirmar() {
    const actual = dialogo
    if (!actual || actual.enviando) return
    const { accion, solicitud } = actual
    setDialogo({ ...actual, enviando: true, error: null })
    try {
      if (accion === 'aprobar') await approveRequest(solicitud.id)
      else await rejectRequest(solicitud.id)
    } catch (error) {
      const tipo = getErrorKind(error)
      setDialogo((vigente) =>
        vigente?.solicitud.id === solicitud.id ? { ...vigente, enviando: false, error: tipo } : vigente,
      )
      return
    }
    resolver(solicitud, accion)
  }

  const columnas: DataTableColumn<PendingRequest>[] = [
    {
      key: 'organization',
      header: 'Empresa',
      rowHeader: true,
      render: (solicitud) => <span className="st-admin-creditos__empresa">{solicitud.organization}</span>,
    },
    {
      key: 'organization_balance',
      header: 'Saldo actual',
      render: (solicitud) => <span className="st-admin-creditos__cifra">{creditos(solicitud.organization_balance)}</span>,
    },
    {
      key: 'requested_amount',
      header: 'Solicita',
      render: (solicitud) => (
        <span className="st-admin-creditos__cifra st-admin-creditos__cifra--solicitada">
          {creditos(solicitud.requested_amount)}
        </span>
      ),
    },
    { key: 'note', header: 'Nota', render: (solicitud) => <Nota texto={solicitud.note} /> },
    { key: 'created_at', header: 'Fecha', render: (solicitud) => <Fecha valor={solicitud.created_at} /> },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'end',
      cardLabel: false,
      render: (solicitud) => {
        // Nombre accesible completo: «Aprobar la solicitud de {empresa} por {n} créditos».
        const contexto = `la solicitud de ${solicitud.organization} por ${creditos(solicitud.requested_amount)}`
        return (
          <div className="st-admin-creditos__acciones">
            <Button
              size="sm"
              variant="secondary"
              data-foco-solicitud={solicitud.id}
              onClick={() => abrir(solicitud, 'aprobar')}
            >
              Aprobar <VisuallyHidden>{contexto}</VisuallyHidden>
            </Button>
            <Button size="sm" variant="neutral" onClick={() => abrir(solicitud, 'rechazar')}>
              Rechazar <VisuallyHidden>{contexto}</VisuallyHidden>
            </Button>
          </div>
        )
      },
    },
  ]

  let contenido: ReactNode
  if (carga.fase === 'cargando') {
    contenido = <EstadoCarga variant="bloque" count={4} label="Cargando solicitudes…" />
  } else if (carga.fase === 'error') {
    const textos = TEXTOS_ERROR[carga.tipo]
    const reintentable = carga.tipo !== 'permiso' && carga.tipo !== 'sesion'
    contenido = (
      <EstadoError
        titleAs="h2"
        kind={carga.tipo}
        title={textos?.title}
        message={textos?.message}
        onRetry={reintentable ? reintentar : undefined}
        retrying={carga.reintentando}
      />
    )
  } else if (carga.solicitudes.length === 0) {
    contenido = (
      <EstadoVacio
        ref={vacioRef}
        tabIndex={-1}
        titleAs="h2"
        title="No hay solicitudes pendientes"
        description="Cuando una empresa pida créditos desde su panel, su solicitud aparecerá aquí."
      />
    )
  } else {
    contenido = (
      <DataTable
        ref={tablaRef}
        caption="Solicitudes de créditos pendientes"
        title="Pendientes de revisión"
        subtitle={`· ${solicitudes(carga.solicitudes.length)}, de la más antigua a la más reciente`}
        columns={columnas}
        rows={carga.solicitudes}
        getRowKey={(solicitud) => solicitud.id}
      />
    )
  }

  return (
    <div className="st-admin-creditos">
      <PageHeader
        ref={encabezadoRef}
        tabIndex={-1}
        className="st-admin-creditos__encabezado"
        eyebrow="Operación"
        title="Solicitudes de créditos"
        lede="Aprobar suma los créditos al saldo de la empresa; rechazar cierra la solicitud sin cambios. Ninguna de las dos acciones se puede deshacer."
      />
      {contenido}
      <ConfirmarSolicitud
        dialogo={dialogo}
        onConfirmar={confirmar}
        onCerrar={cerrarDialogo}
        onActualizar={actualizarLista}
      />
    </div>
  )
}
