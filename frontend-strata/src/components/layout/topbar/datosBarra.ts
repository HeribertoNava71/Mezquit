import { useEffect, useState } from 'react'
import { listCreditRequests } from '@/api/admin'
import { getProfile } from '@/api/profile'
import { getCredits } from '@/api/rh'

// Datos de las barras de RR. HH. y de super admin. Cada lectura se vuelve a
// pedir al cambiar de ruta, y también cuando una pantalla avisa que el dato
// cambió sin salir de ella (por ejemplo, al aprobar una solicitud).

const EVENTO_CREDITOS = 'strata:creditos-actualizados'
const EVENTO_SOLICITUDES = 'strata:solicitudes-actualizadas'

/** Pide a la barra de RR. HH. que vuelva a leer el saldo (GET /api/credits). */
export function avisarCambioDeCreditos(): void {
  window.dispatchEvent(new Event(EVENTO_CREDITOS))
}

/** Pide a la barra de super admin que vuelva a contar las solicitudes pendientes. */
export function avisarCambioDeSolicitudes(): void {
  window.dispatchEvent(new Event(EVENTO_SOLICITUDES))
}

/** Número que sube con cada aviso del evento; sirve de dependencia para volver a pedir. */
function useVersion(evento: string): number {
  const [version, setVersion] = useState(0)
  useEffect(() => {
    const alAvisar = () => setVersion((actual) => actual + 1)
    window.addEventListener(evento, alAvisar)
    return () => window.removeEventListener(evento, alAvisar)
  }, [evento])
  return version
}

/**
 * Saldo de créditos de la organización (GET /api/credits → balance), como el
 * AppLayout anterior. Solo se pide con organización: sin ella el backend
 * responde 500 (PB-03). null mientras carga, si falló o sin organización:
 * la barra lo muestra sin cifra.
 */
export function useSaldoCreditos(organizacionId: number | null | undefined, ruta: string): number | null {
  const version = useVersion(EVENTO_CREDITOS)
  const [saldo, setSaldo] = useState<{ organizacionId: number; valor: number | null } | null>(null)

  useEffect(() => {
    if (!organizacionId) return
    let vigente = true
    getCredits()
      .then((datos) => {
        const valor = typeof datos.balance === 'number' && Number.isFinite(datos.balance) ? datos.balance : null
        if (vigente) setSaldo({ organizacionId, valor })
      })
      .catch(() => {
        if (vigente) setSaldo({ organizacionId, valor: null })
      })
    return () => {
      vigente = false
    }
  }, [organizacionId, ruta, version])

  return organizacionId && saldo?.organizacionId === organizacionId ? saldo.valor : null
}

export interface NombreOrganizacion {
  /** La petición está en curso. */
  cargando: boolean
  /** organization.name de GET /api/user/profile; null si no hay o si falló. */
  nombre: string | null
}

/**
 * Nombre de la organización para la pastilla de RR. HH. (GET /api/user/profile
 * → organization.name; mapa.md, RH-1). GET /api/user no lo trae (PB-02).
 */
export function useNombreOrganizacion(usuarioId: number | null | undefined): NombreOrganizacion {
  const [dato, setDato] = useState<{ usuarioId: number; nombre: string | null } | null>(null)

  useEffect(() => {
    if (usuarioId == null) return
    let vigente = true
    getProfile()
      .then((perfil) => {
        const nombre = perfil.organization?.name?.trim() || null
        if (vigente) setDato({ usuarioId, nombre })
      })
      .catch(() => {
        if (vigente) setDato({ usuarioId, nombre: null })
      })
    return () => {
      vigente = false
    }
  }, [usuarioId])

  if (usuarioId == null) return { cargando: false, nombre: null }
  return dato?.usuarioId === usuarioId ? { cargando: false, nombre: dato.nombre } : { cargando: true, nombre: null }
}

/**
 * Solicitudes de créditos por resolver: longitud de GET /api/admin/credit-requests
 * (mapa.md, SA-1). Solo se pide con is_platform_admin. null mientras carga o si falló.
 */
export function useSolicitudesPendientes(activo: boolean, ruta: string): number | null {
  const version = useVersion(EVENTO_SOLICITUDES)
  const [pendientes, setPendientes] = useState<number | null>(null)

  useEffect(() => {
    if (!activo) return
    let vigente = true
    listCreditRequests()
      .then((lista) => {
        if (vigente) setPendientes(Array.isArray(lista) ? lista.length : null)
      })
      .catch(() => {
        if (vigente) setPendientes(null)
      })
    return () => {
      vigente = false
    }
  }, [activo, ruta, version])

  return activo ? pendientes : null
}
