import { isAxiosError } from 'axios'
import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react'
import {
  complete,
  getItems,
  getPortal,
  saveAnswer,
  sendConsent,
  sendEvent,
  type PortalItem,
  type PortalState,
  type PortalTest,
} from '@/api/candidate'
import { getErrorKind, type EstadoErrorKind } from '@/components/ui'

// ── Máquina de estados del portal del candidato (/evaluar/:token) ─────────
// carga → acceso → examen → fin, con bloqueo y error. Conserva la lógica del
// CandidateFlow anterior (2026-09-11-fase1-nucleo.md:2786-2924):
// - El consentimiento (POST consent, privacy_version v1) se guarda antes del
//   primer reactivo; si GET /api/evaluar/{token} ya trae consented, se salta.
// - Reanuda en el primer reactivo sin respuesta.
// - Guarda cada respuesta al elegirla, con elapsed_ms.
// - Registra la pérdida de foco (visibilitychange → evento blur; D-25).
// - «Anterior» solo si la prueba tiene allows_back; no avanza sin responder.
// Y además recorre TODAS las pruebas de tests[] (S-19): reactivos y avance por
// prueba, y POST complete una sola vez al final.
// Errores por llamada (mapa.md, CA-2 y CA-4): un 409 de consent, answers o
// complete lleva al bloqueo; un error de red se puede reintentar sin perder
// las respuestas guardadas.

/** Etapa del portal. */
export type EtapaCandidato = 'carga' | 'error' | 'bloqueo' | 'acceso' | 'examen' | 'fin'

/**
 * Por qué el portal no deja responder:
 * - completada: la invitación ya se completó (aquí o en otra pestaña).
 * - expirada: pasó la fecha límite.
 * - no-encontrada: el enlace no existe (404).
 * - no-disponible: el servidor respondió 409 y no se pudo saber el motivo.
 */
export type MotivoBloqueo = 'completada' | 'expirada' | 'no-encontrada' | 'no-disponible'

/**
 * Guardado automático de respuestas (indicador de la barra del examen):
 * inicial (aún no se guarda nada en esta visita), guardando, guardado y error
 * (hay respuestas sin guardar; se reintentan con reintentarGuardado o al responder otra).
 */
export type EstadoGuardado = 'inicial' | 'guardando' | 'guardado' | 'error'

/** Carga de los reactivos de la prueba en curso. */
export type CargaPrueba = 'cargando' | 'error' | 'lista'

/** Falla al finalizar: respuestas que no se pudieron guardar o error de POST complete. */
export type ErrorCierre = 'pendientes' | EstadoErrorKind

/** Prueba en curso dentro del examen. */
export interface ExamenEnCurso {
  /** La prueba, como la describe GET /api/evaluar/{token}. */
  prueba: PortalTest
  /** Posición de la prueba en tests[] (desde 0). */
  indicePrueba: number
  totalPruebas: number
  carga: CargaPrueba
  /** Tipo de error de GET …/pruebas/{testId} (carga «error»). */
  errorPrueba: EstadoErrorKind | null
  /** Reactivos de la prueba, en su orden. */
  reactivos: PortalItem[]
  /** Índice del reactivo visible. */
  actual: number
  /** Reactivo visible (null mientras carga, con error o sin reactivos). */
  reactivo: PortalItem | null
  /** La prueba deja regresar (allows_back): se muestra «Anterior». */
  permiteRegresar: boolean
  /** «Anterior» está disponible ahora (allows_back y no es el primer reactivo). */
  puedeRegresar: boolean
  /** El reactivo visible ya tiene respuesta: «Siguiente» está disponible. */
  puedeAvanzar: boolean
  esUltimoReactivo: boolean
  esUltimaPrueba: boolean
  /** La prueba cargó sin reactivos (PB-04). */
  vacia: boolean
}

/** Datos reales del fin. */
export interface ResumenFin {
  /** Nombres de las pruebas aplicadas, en orden. */
  pruebas: string[]
  /** Reactivos con respuesta, sumando todas las pruebas. */
  respondidos: number
  /** Reactivos de todas las pruebas. */
  total: number
  organizacion: string
}

export interface FlujoCandidato {
  etapa: EtapaCandidato
  /** Respuesta de GET /api/evaluar/{token} (null mientras carga, con 404 o con error). */
  portal: PortalState | null
  /** Tipo de error de la carga inicial (etapa «error»). */
  errorCarga: EstadoErrorKind | null
  /** Motivo del bloqueo (etapa «bloqueo»). */
  motivoBloqueo: MotivoBloqueo | null

  // Acceso
  /** Casilla del aviso de privacidad (empieza sin marcar). */
  aceptaAviso: boolean
  /** Se puede iniciar: hay pruebas y el consentimiento ya existe o la casilla está marcada. */
  puedeIniciar: boolean
  /** POST consent en curso. */
  iniciando: boolean
  /** Falla de POST consent que no es bloqueo (red o servidor). */
  errorInicio: EstadoErrorKind | null

  // Examen
  examen: ExamenEnCurso | null
  guardado: EstadoGuardado
  /** Finalizando: guardado pendiente y POST complete en curso. */
  cerrando: boolean
  errorCierre: ErrorCierre | null

  // Fin
  resumen: ResumenFin | null

  // Acciones
  reintentarCarga: () => void
  marcarAviso: (acepta: boolean) => void
  /** Guarda el consentimiento (si falta) y abre la primera prueba. */
  iniciar: () => void
  /** Responde el reactivo visible y guarda la respuesta. */
  responder: (valor: number) => void
  /** Siguiente reactivo, siguiente prueba o finalizar. No hace nada sin respuesta. */
  siguiente: () => void
  /** Reactivo anterior; solo con allows_back. */
  anterior: () => void
  reintentarPrueba: () => void
  reintentarGuardado: () => void
  reintentarCierre: () => void
}

// ── Estado y transiciones ──────────────────────────────────────────────────

interface ConteoPrueba {
  respondidos: number
  total: number
}

interface EstadoFlujo {
  etapa: EtapaCandidato
  portal: PortalState | null
  errorCarga: EstadoErrorKind | null
  motivo: MotivoBloqueo | null
  aceptaAviso: boolean
  iniciando: boolean
  errorInicio: EstadoErrorKind | null
  prueba: number
  carga: CargaPrueba
  errorPrueba: EstadoErrorKind | null
  permiteRegresar: boolean
  reactivos: PortalItem[]
  actual: number
  /** Conteo de cada prueba terminada, por índice (para el fin). */
  conteos: Record<number, ConteoPrueba>
  cerrando: boolean
  errorCierre: ErrorCierre | null
}

type Accion =
  | { tipo: 'recargar' }
  | { tipo: 'portal'; portal: PortalState }
  | { tipo: 'error-carga'; error: EstadoErrorKind }
  | { tipo: 'bloquear'; motivo: MotivoBloqueo; portal?: PortalState }
  | { tipo: 'aceptar-aviso'; acepta: boolean }
  | { tipo: 'inicio-enviando' }
  | { tipo: 'inicio-error'; error: EstadoErrorKind }
  | { tipo: 'cargar-prueba'; prueba: number }
  | { tipo: 'prueba-lista'; prueba: number; reactivos: PortalItem[]; actual: number; permiteRegresar: boolean }
  | { tipo: 'prueba-error'; prueba: number; error: EstadoErrorKind }
  | { tipo: 'terminar-prueba' }
  | { tipo: 'responder'; itemId: number; valor: number }
  | { tipo: 'ir-a'; actual: number }
  | { tipo: 'cierre-enviando' }
  | { tipo: 'cierre-error'; error: ErrorCierre }
  | { tipo: 'fin' }

const ESTADO_INICIAL: EstadoFlujo = {
  etapa: 'carga',
  portal: null,
  errorCarga: null,
  motivo: null,
  aceptaAviso: false,
  iniciando: false,
  errorInicio: null,
  prueba: 0,
  carga: 'cargando',
  errorPrueba: null,
  permiteRegresar: false,
  reactivos: [],
  actual: 0,
  conteos: {},
  cerrando: false,
  errorCierre: null,
}

function contar(reactivos: PortalItem[]): ConteoPrueba {
  return { respondidos: reactivos.filter((r) => r.answered != null).length, total: reactivos.length }
}

function transicion(estado: EstadoFlujo, accion: Accion): EstadoFlujo {
  switch (accion.tipo) {
    case 'recargar':
      return { ...estado, etapa: 'carga', errorCarga: null }
    case 'portal': {
      const { portal } = accion
      if (portal.status === 'completada' || portal.status === 'expirada') {
        return { ...estado, etapa: 'bloqueo', portal, motivo: portal.status, errorCarga: null }
      }
      return { ...estado, etapa: 'acceso', portal, errorCarga: null }
    }
    case 'error-carga':
      return { ...estado, etapa: 'error', errorCarga: accion.error }
    case 'bloquear':
      return {
        ...estado,
        etapa: 'bloqueo',
        motivo: accion.motivo,
        portal: accion.portal ?? estado.portal,
        iniciando: false,
        cerrando: false,
      }
    case 'aceptar-aviso':
      return { ...estado, aceptaAviso: accion.acepta }
    case 'inicio-enviando':
      return { ...estado, iniciando: true, errorInicio: null }
    case 'inicio-error':
      return { ...estado, iniciando: false, errorInicio: accion.error }
    case 'cargar-prueba':
      return {
        ...estado,
        etapa: 'examen',
        iniciando: false,
        errorInicio: null,
        prueba: accion.prueba,
        carga: 'cargando',
        errorPrueba: null,
        reactivos: [],
        actual: 0,
        errorCierre: null,
      }
    case 'prueba-lista':
      if (accion.prueba !== estado.prueba) return estado
      return {
        ...estado,
        carga: 'lista',
        reactivos: accion.reactivos,
        actual: accion.actual,
        permiteRegresar: accion.permiteRegresar,
      }
    case 'prueba-error':
      if (accion.prueba !== estado.prueba) return estado
      return { ...estado, carga: 'error', errorPrueba: accion.error }
    case 'terminar-prueba':
      return { ...estado, conteos: { ...estado.conteos, [estado.prueba]: contar(estado.reactivos) } }
    case 'responder':
      return {
        ...estado,
        reactivos: estado.reactivos.map((r) => (r.id === accion.itemId ? { ...r, answered: accion.valor } : r)),
      }
    case 'ir-a':
      return { ...estado, actual: accion.actual, errorCierre: null }
    case 'cierre-enviando':
      return { ...estado, cerrando: true, errorCierre: null }
    case 'cierre-error':
      return { ...estado, cerrando: false, errorCierre: accion.error }
    case 'fin':
      return {
        ...estado,
        etapa: 'fin',
        cerrando: false,
        errorCierre: null,
        conteos: { ...estado.conteos, [estado.prueba]: contar(estado.reactivos) },
      }
  }
}

// ── Utilidades ─────────────────────────────────────────────────────────────

interface RespuestaPendiente {
  testId: number
  itemId: number
  value: number
  elapsedMs: number
}

function claveDe(testId: number, itemId: number): string {
  return `${testId}:${itemId}`
}

function estadoHttp(error: unknown): number | undefined {
  return isAxiosError(error) ? error.response?.status : undefined
}

/** 409 (ya no admite respuestas) o 404 (el enlace ya no existe): el portal se bloquea. */
function esBloqueo(error: unknown): boolean {
  const status = estadoHttp(error)
  return status === 409 || status === 404
}

function motivoDe(status: string): MotivoBloqueo {
  if (status === 'completada' || status === 'expirada') return status
  return 'no-disponible'
}

function sumar(valores: number[]): number {
  return valores.reduce((total, n) => total + n, 0)
}

// ── Hook ───────────────────────────────────────────────────────────────────

/**
 * Estado y acciones del portal del candidato para un token. Monta el
 * componente con key={token}: un token nuevo empieza de cero.
 */
export function useCandidateFlow(token: string): FlujoCandidato {
  const [estado, dispatch] = useReducer(transicion, ESTADO_INICIAL)
  const [guardado, setGuardado] = useState<EstadoGuardado>('inicial')

  // Peticiones vigentes: una respuesta tardía de una petición anterior se ignora.
  const solicitudPortal = useRef(0)
  const solicitudPrueba = useRef(0)
  // Candados contra el doble envío (dos clics antes de pintar).
  const iniciandoRef = useRef(false)
  const cerrandoRef = useRef(false)
  const bloqueado = useRef(false)
  // Momento en que se mostró el reactivo visible (elapsed_ms).
  const mostradoEn = useRef(0)
  // Respuestas sin confirmar por el servidor y envíos en curso, por prueba y reactivo.
  const pendientes = useRef(new Map<string, RespuestaPendiente>())
  const enVuelo = useRef(new Map<string, Promise<void>>())
  const huboGuardado = useRef(false)

  // ── Carga inicial: GET /api/evaluar/{token} ──────────────────────────────
  const cargarPortal = useCallback(async () => {
    const id = ++solicitudPortal.current
    try {
      const portal = await getPortal(token)
      if (id === solicitudPortal.current) dispatch({ tipo: 'portal', portal })
    } catch (error) {
      if (id !== solicitudPortal.current) return
      if (estadoHttp(error) === 404) dispatch({ tipo: 'bloquear', motivo: 'no-encontrada' })
      else dispatch({ tipo: 'error-carga', error: getErrorKind(error) })
    }
  }, [token])

  useEffect(() => {
    void cargarPortal()
  }, [cargarPortal])

  // ── Bloqueo ──────────────────────────────────────────────────────────────
  // Ante un 409 se vuelve a pedir el portal para decir si la invitación se
  // completó (por ejemplo, en otra pestaña) o venció.
  async function bloquearPor(error: unknown) {
    if (bloqueado.current) return
    bloqueado.current = true
    if (estadoHttp(error) === 404) {
      dispatch({ tipo: 'bloquear', motivo: 'no-encontrada' })
      return
    }
    try {
      const portal = await getPortal(token)
      dispatch({ tipo: 'bloquear', motivo: motivoDe(portal.status), portal })
    } catch {
      dispatch({ tipo: 'bloquear', motivo: 'no-disponible' })
    }
  }

  // ── Guardado automático ──────────────────────────────────────────────────
  function actualizarGuardado() {
    if (enVuelo.current.size > 0) setGuardado('guardando')
    else if (pendientes.current.size > 0) setGuardado('error')
    else setGuardado(huboGuardado.current ? 'guardado' : 'inicial')
  }

  // Un envío a la vez por reactivo: si el candidato cambia la respuesta mientras
  // se guarda la anterior, la nueva sale al terminar (así no llega antes la vieja).
  function enviar(clave: string): Promise<void> {
    const enCurso = enVuelo.current.get(clave)
    if (enCurso) return enCurso
    const respuesta = pendientes.current.get(clave)
    if (!respuesta || bloqueado.current) return Promise.resolve()

    const promesa = saveAnswer(token, respuesta.testId, respuesta.itemId, respuesta.value, respuesta.elapsedMs)
      .then(() => {
        if (pendientes.current.get(clave) === respuesta) pendientes.current.delete(clave)
        huboGuardado.current = true
      })
      .catch((error: unknown) => {
        // La respuesta queda pendiente («No se pudo guardar» con reintento).
        if (esBloqueo(error)) void bloquearPor(error)
      })
      .finally(() => {
        enVuelo.current.delete(clave)
        const masReciente = pendientes.current.get(clave)
        if (masReciente && masReciente !== respuesta) void enviar(clave)
        actualizarGuardado()
      })
    enVuelo.current.set(clave, promesa)
    actualizarGuardado()
    return promesa
  }

  /** Envía las respuestas pendientes (reintenta las que fallaron). */
  function enviarPendientes() {
    for (const clave of pendientes.current.keys()) void enviar(clave)
  }

  /** Envía lo pendiente y espera a que termine. true si todo quedó guardado. */
  async function guardarTodo(): Promise<boolean> {
    enviarPendientes()
    while (enVuelo.current.size > 0) {
      await Promise.allSettled([...enVuelo.current.values()])
    }
    return pendientes.current.size === 0 && !bloqueado.current
  }

  // ── Pruebas: GET /api/evaluar/{token}/pruebas/{testId} ───────────────────
  async function cargarPrueba(indice: number, tests: PortalTest[]) {
    const prueba = tests[indice]
    if (!prueba) return
    const id = ++solicitudPrueba.current
    dispatch({ tipo: 'cargar-prueba', prueba: indice })
    try {
      const datos = await getItems(token, prueba.id)
      if (id !== solicitudPrueba.current) return
      const reactivos = [...datos.items].sort((a, b) => a.order - b.order)
      // Reanudación: primer reactivo sin respuesta; si ya respondió todos,
      // pasa a la siguiente prueba o queda en el último para finalizar.
      const sinResponder = reactivos.findIndex((r) => r.answered == null)
      const completa = reactivos.length > 0 && sinResponder === -1
      dispatch({
        tipo: 'prueba-lista',
        prueba: indice,
        reactivos,
        actual: completa ? reactivos.length - 1 : Math.max(0, sinResponder),
        permiteRegresar: datos.test?.allows_back ?? prueba.allows_back,
      })
      if (completa && indice < tests.length - 1) {
        dispatch({ tipo: 'terminar-prueba' })
        void cargarPrueba(indice + 1, tests)
      }
    } catch (error) {
      if (id !== solicitudPrueba.current) return
      dispatch({ tipo: 'prueba-error', prueba: indice, error: getErrorKind(error) })
    }
  }

  // ── Acceso: POST consent antes del primer reactivo ───────────────────────
  async function iniciar() {
    const { etapa, portal, aceptaAviso } = estado
    if (etapa !== 'acceso' || !portal || portal.tests.length === 0 || iniciandoRef.current) return
    if (!portal.consented) {
      if (!aceptaAviso) return
      iniciandoRef.current = true
      dispatch({ tipo: 'inicio-enviando' })
      try {
        await sendConsent(token)
      } catch (error) {
        iniciandoRef.current = false
        if (esBloqueo(error)) void bloquearPor(error)
        else dispatch({ tipo: 'inicio-error', error: getErrorKind(error) })
        return
      }
      iniciandoRef.current = false
    }
    void cargarPrueba(0, portal.tests)
  }

  // ── Examen ───────────────────────────────────────────────────────────────
  const { portal } = estado
  const tests = portal?.tests ?? []
  const pruebaActual = estado.etapa === 'examen' ? tests[estado.prueba] : undefined
  const reactivo = estado.carga === 'lista' ? (estado.reactivos[estado.actual] ?? null) : null

  function responder(valor: number) {
    if (!pruebaActual || !reactivo || estado.cerrando || bloqueado.current) return
    if (reactivo.answered === valor) return
    const elapsedMs = Math.max(0, Math.round(Date.now() - mostradoEn.current))
    dispatch({ tipo: 'responder', itemId: reactivo.id, valor })
    pendientes.current.set(claveDe(pruebaActual.id, reactivo.id), {
      testId: pruebaActual.id,
      itemId: reactivo.id,
      value: valor,
      elapsedMs,
    })
    // Sale la nueva y, de paso, se reintentan las que fallaron antes.
    enviarPendientes()
  }

  async function finalizar() {
    if (cerrandoRef.current || bloqueado.current) return
    cerrandoRef.current = true
    dispatch({ tipo: 'cierre-enviando' })
    // Antes de calificar, todas las respuestas deben estar en el servidor.
    const guardadas = await guardarTodo()
    if (bloqueado.current) return
    if (!guardadas) {
      cerrandoRef.current = false
      dispatch({ tipo: 'cierre-error', error: 'pendientes' })
      return
    }
    try {
      await complete(token)
    } catch (error) {
      cerrandoRef.current = false
      if (esBloqueo(error)) void bloquearPor(error)
      else dispatch({ tipo: 'cierre-error', error: getErrorKind(error) })
      return
    }
    dispatch({ tipo: 'fin' })
  }

  function siguiente() {
    if (!pruebaActual || !reactivo || reactivo.answered == null || estado.cerrando) return
    if (estado.actual < estado.reactivos.length - 1) {
      dispatch({ tipo: 'ir-a', actual: estado.actual + 1 })
      return
    }
    if (estado.prueba < tests.length - 1) {
      dispatch({ tipo: 'terminar-prueba' })
      void cargarPrueba(estado.prueba + 1, tests)
      return
    }
    void finalizar()
  }

  function anterior() {
    if (!reactivo || !estado.permiteRegresar || estado.actual === 0 || estado.cerrando) return
    dispatch({ tipo: 'ir-a', actual: estado.actual - 1 })
  }

  // Cronómetro del reactivo: arranca en el commit en que el reactivo aparece
  // (useLayoutEffect), así ninguna respuesta sale con el cronómetro sin iniciar.
  const reactivoVisible = reactivo ? `${estado.prueba}:${estado.actual}` : null
  useLayoutEffect(() => {
    if (reactivoVisible) mostradoEn.current = Date.now()
  }, [reactivoVisible])

  // Pérdida de foco durante el examen (D-25: solo blur, sin payload).
  const idPruebaActual = pruebaActual?.id
  useEffect(() => {
    if (idPruebaActual === undefined) return
    const testId = idPruebaActual
    function alCambiarVisibilidad() {
      if (document.hidden) sendEvent(token, testId, 'blur').catch(() => {})
    }
    document.addEventListener('visibilitychange', alCambiarVisibilidad)
    return () => document.removeEventListener('visibilitychange', alCambiarVisibilidad)
  }, [idPruebaActual, token])

  // Con respuestas sin guardar, el navegador pide confirmar antes de cerrar.
  // Fuera del examen (bloqueo o fin) ya no hay nada que proteger.
  const hayPendientes = estado.etapa === 'examen' && (guardado === 'guardando' || guardado === 'error')
  useEffect(() => {
    if (!hayPendientes) return
    function avisar(evento: BeforeUnloadEvent) {
      evento.preventDefault()
    }
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [hayPendientes])

  // ── Vista ────────────────────────────────────────────────────────────────
  const examen: ExamenEnCurso | null = pruebaActual
    ? {
        prueba: pruebaActual,
        indicePrueba: estado.prueba,
        totalPruebas: tests.length,
        carga: estado.carga,
        errorPrueba: estado.errorPrueba,
        reactivos: estado.reactivos,
        actual: estado.actual,
        reactivo,
        permiteRegresar: estado.permiteRegresar,
        puedeRegresar: Boolean(reactivo) && estado.permiteRegresar && estado.actual > 0 && !estado.cerrando,
        puedeAvanzar: reactivo?.answered != null && !estado.cerrando,
        esUltimoReactivo: estado.actual >= estado.reactivos.length - 1,
        esUltimaPrueba: estado.prueba >= tests.length - 1,
        vacia: estado.carga === 'lista' && estado.reactivos.length === 0,
      }
    : null

  const conteos = Object.values(estado.conteos)
  const resumen: ResumenFin | null =
    estado.etapa === 'fin' && portal
      ? {
          pruebas: portal.tests.map((t) => t.name),
          respondidos: sumar(conteos.map((c) => c.respondidos)),
          total: sumar(conteos.map((c) => c.total)),
          organizacion: portal.organization,
        }
      : null

  return {
    etapa: estado.etapa,
    portal,
    errorCarga: estado.errorCarga,
    motivoBloqueo: estado.motivo,
    aceptaAviso: estado.aceptaAviso,
    puedeIniciar:
      estado.etapa === 'acceso' &&
      tests.length > 0 &&
      Boolean(portal?.consented || estado.aceptaAviso) &&
      !estado.iniciando,
    iniciando: estado.iniciando,
    errorInicio: estado.errorInicio,
    examen,
    guardado,
    cerrando: estado.cerrando,
    errorCierre: estado.errorCierre,
    resumen,
    reintentarCarga: () => {
      dispatch({ tipo: 'recargar' })
      void cargarPortal()
    },
    marcarAviso: (acepta) => dispatch({ tipo: 'aceptar-aviso', acepta }),
    iniciar: () => void iniciar(),
    responder,
    siguiente,
    anterior,
    reintentarPrueba: () => void cargarPrueba(estado.prueba, tests),
    reintentarGuardado: () => void guardarTodo(),
    reintentarCierre: () => void finalizar(),
  }
}
