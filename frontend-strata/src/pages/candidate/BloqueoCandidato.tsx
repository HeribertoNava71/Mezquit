import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { Button, Callout, type CalloutTone } from '@/components/ui'
import { IconoAdvertencia, IconoBuscar, IconoError, IconoExito, IconoReloj, IconoSinRed } from '@/components/ui/Iconos'
import { SITE } from '@/config/site'
import type { MotivoBloqueo } from './useCandidateFlow'
import './BloqueoCandidato.css'

/** Motivo del bloqueo, o la falla de la carga inicial (red o servidor). */
export type TipoBloqueo = MotivoBloqueo | 'error-red' | 'error-servidor'

export interface BloqueoCandidatoProps {
  tipo: TipoBloqueo
  /** Organización que invita, si se conoce (para el contacto). */
  organization?: string | null
  /** Solo en los errores de carga: vuelve a pedir la invitación. */
  onReintentar?: () => void
}

type Tono = 'exito' | 'aviso' | 'error'

interface Contenido {
  tono: Tono
  icono: ReactNode
  titulo: string
  texto: string
  /** Contacto o siguiente paso, en un Callout. */
  contacto: ReactNode
  tonoContacto: CalloutTone
}

function contenidoDe(tipo: TipoBloqueo, empresa: string): Contenido {
  const soporte = (
    <>
      Si el problema sigue, escríbenos a <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
    </>
  )
  switch (tipo) {
    case 'completada':
      return {
        tono: 'exito',
        icono: <IconoExito />,
        titulo: 'Esta evaluación ya se completó',
        texto: 'Tus respuestas quedaron registradas. No es necesario hacer nada más.',
        contacto: `Si tienes dudas, contacta a ${empresa}.`,
        tonoContacto: 'info',
      }
    case 'expirada':
      return {
        tono: 'aviso',
        icono: <IconoReloj />,
        titulo: 'Esta invitación ya venció',
        texto: 'La fecha límite para responder la evaluación ya pasó.',
        contacto: `Si todavía quieres responder o crees que es un error, contacta a ${empresa}.`,
        tonoContacto: 'warning',
      }
    case 'no-encontrada':
      return {
        tono: 'aviso',
        icono: <IconoBuscar />,
        titulo: 'No encontramos tu invitación',
        texto: 'Revisa que el enlace esté completo. Si lo copiaste del correo, ábrelo de nuevo desde ahí.',
        contacto: 'Si el problema sigue, pide a la empresa que te invitó que te envíe el enlace de nuevo.',
        tonoContacto: 'warning',
      }
    case 'no-disponible':
      return {
        tono: 'aviso',
        icono: <IconoAdvertencia />,
        titulo: 'Esta evaluación ya no admite respuestas',
        texto: 'Puede que ya se haya completado o que su fecha límite haya pasado.',
        contacto: `Si crees que es un error, contacta a ${empresa}.`,
        tonoContacto: 'warning',
      }
    case 'error-red':
      return {
        tono: 'error',
        icono: <IconoSinRed />,
        titulo: 'No pudimos conectarnos',
        texto: 'Revisa tu conexión a internet e inténtalo de nuevo. Tus respuestas guardadas no se pierden.',
        contacto: soporte,
        tonoContacto: 'info',
      }
    case 'error-servidor':
      return {
        tono: 'error',
        icono: <IconoError />,
        titulo: 'No pudimos cargar tu invitación',
        texto: 'Ocurrió un error de nuestro lado. Inténtalo de nuevo en unos minutos. Tus respuestas guardadas no se pierden.',
        contacto: soporte,
        tonoContacto: 'info',
      }
  }
}

/**
 * Pantalla de bloqueo del portal dentro del marco del acceso (mapa.md, CA-1 y
 * R-28): invitación completada, vencida, inexistente (404) o que ya no admite
 * respuestas (409), y fallas de la carga inicial con «Reintentar». Cada caso
 * tiene su mensaje y su contacto. Va dentro de CandidateFrame.
 */
export function BloqueoCandidato({ tipo, organization, onReintentar }: BloqueoCandidatoProps) {
  const titulo = useRef<HTMLHeadingElement>(null)
  const empresa = organization?.trim() || 'la empresa que te invitó'
  const { tono, icono, titulo: textoTitulo, texto, contacto, tonoContacto } = contenidoDe(tipo, empresa)
  const esError = tipo === 'error-red' || tipo === 'error-servidor'

  // Al llegar, el foco va al título: los lectores de pantalla anuncian el motivo.
  // useLayoutEffect: en el mismo commit, antes de pintar.
  useLayoutEffect(() => {
    titulo.current?.focus()
  }, [])

  return (
    <div className="st-bloqueo">
      <span className={`st-bloqueo__icono st-bloqueo__icono--${tono}`} aria-hidden="true">
        {icono}
      </span>
      <h1 ref={titulo} tabIndex={-1} className="st-bloqueo__titulo">
        {textoTitulo}
      </h1>
      <p className="st-bloqueo__texto">{texto}</p>
      <Callout tone={tonoContacto} className="st-bloqueo__contacto">
        {contacto}
      </Callout>
      {esError && onReintentar && (
        <div className="st-bloqueo__acciones">
          <Button onClick={onReintentar}>Reintentar</Button>
        </div>
      )}
      {tipo === 'no-encontrada' && (
        <div className="st-bloqueo__acciones">
          <Button variant="secondary" to="/evaluar">
            Ingresar otro enlace o código
          </Button>
        </div>
      )}
    </div>
  )
}

export default BloqueoCandidato
