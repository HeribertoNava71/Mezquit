import { useLocation } from 'react-router-dom'
import { Callout, type CalloutTone } from '@/components/ui'
import { leerEstadoDeRuta } from './rutasDeSesion'

export interface AvisoDeRutaProps {
  /** Tono del Callout. Por defecto, info. */
  tone?: CalloutTone
  className?: string
}

/**
 * Muestra el aviso que una guarda dejó en location.state (D-07) con el Callout
 * del sistema; sin aviso no pinta nada. Usa role="alert" para que se anuncie
 * al llegar, porque explica una redirección que el usuario no pidió.
 * Hoy lo usa /perfil (RequireOrganization manda ahí a las cuentas sin empresa).
 */
export function AvisoDeRuta({ tone = 'info', className }: AvisoDeRutaProps) {
  const { aviso } = leerEstadoDeRuta(useLocation().state)
  if (!aviso) return null
  return (
    <Callout tone={tone} live="alert" className={className}>
      {aviso}
    </Callout>
  )
}
