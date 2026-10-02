import { Callout } from '@/components/ui'
import { SITE } from '@/config/site'
import { Pendiente } from '@/pages/publicas/Pendiente'
import { esCorreoReal } from '@/pages/publicas/marcadores'

export interface AvisoCuentaProps {
  /**
   * Aviso que una guarda dejó en location.state (D-07). Hoy, el de
   * RequireOrganization al llegar de /app sin empresa (AVISO_SIN_ORGANIZACION).
   */
  avisoDeRuta?: string
  /** La cuenta no tiene empresa (organization_id nulo). */
  sinEmpresa: boolean
  className?: string
}

/** Título del aviso cuando la persona llega a /perfil por su cuenta. */
export const TITULO_SIN_EMPRESA = 'Tu cuenta no tiene una empresa asociada'

/**
 * Único aviso de cuenta de /perfil (antes eran dos: el de la guarda, montado en
 * la ruta, y el de la página). Sin empresa explica qué implica y ofrece
 * contacto con SITE.email, sin la instrucción imposible «completa el campo
 * Empresa»: ese campo no existe y PUT /api/user/profile no lo acepta (PB-22).
 * Mientras el correo sea «[PENDIENTE]», se ve el marcador y no hay un mailto a
 * una dirección que no existe (el mismo criterio de /ayuda).
 * Si la persona llegó redirigida, el título es el aviso de la guarda y se
 * anuncia con role="alert", porque explica una redirección que no pidió.
 */
export function AvisoCuenta({ avisoDeRuta, sinEmpresa, className }: AvisoCuentaProps) {
  const correo = esCorreoReal(SITE.email) ? SITE.email.trim() : null
  if (!sinEmpresa) {
    // Un aviso de ruta que no es de empresa se muestra tal cual.
    if (!avisoDeRuta) return null
    return (
      <Callout tone="info" live="alert" className={className}>
        {avisoDeRuta}
      </Callout>
    )
  }

  return (
    <Callout
      tone="info"
      live={avisoDeRuta ? 'alert' : undefined}
      title={avisoDeRuta ?? TITULO_SIN_EMPRESA}
      className={className}
    >
      {!avisoDeRuta && <p>Sin una empresa no puedes entrar al panel de RR. HH. ni crear evaluaciones.</p>}
      <p>
        Por ahora no puedes registrar una empresa desde tu perfil. Si la necesitas, escríbenos a{' '}
        {correo ? (
          <>
            <a href={`mailto:${correo}`}>{correo}</a>.
          </>
        ) : (
          <Pendiente size="md">{SITE.email}</Pendiente>
        )}
      </p>
    </Callout>
  )
}
