import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { getProfile } from '@/api/profile'
import { leerEstadoDeRuta } from '@/components/rutasDeSesion'
import { Card, EstadoCarga, EstadoError, PageHeader, getErrorKind, type EstadoErrorKind } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { AvisoCuenta } from './perfil/AvisoCuenta'
import { FormularioContrasena } from './perfil/FormularioContrasena'
import { FormularioDatos, type Perfil } from './perfil/FormularioDatos'
import './PerfilPage.css'

type CargaPerfil =
  | { fase: 'cargando' }
  | { fase: 'error'; tipo: EstadoErrorKind }
  | { fase: 'listo'; perfil: Perfil }

/**
 * GET /api/user/profile con sus estados (R-34: antes se quedaba en «Cargando…»
 * si fallaba). Reintentar deja el error a la vista, con el botón en
 * «Reintentando…», hasta que llega la respuesta: el foco no se pierde.
 */
function usePerfil() {
  const [carga, setCarga] = useState<CargaPerfil>({ fase: 'cargando' })
  const [solicitud, setSolicitud] = useState(0)
  const [reintentando, setReintentando] = useState(false)

  useEffect(() => {
    let vigente = true
    getProfile()
      .then((perfil) => {
        if (!vigente) return
        // Una respuesta sin perfil no es un perfil vacío: es un error del servidor.
        if (perfil && typeof perfil === 'object') setCarga({ fase: 'listo', perfil })
        else setCarga({ fase: 'error', tipo: 'servidor' })
      })
      .catch((error: unknown) => {
        if (vigente) setCarga({ fase: 'error', tipo: getErrorKind(error) })
      })
      .finally(() => {
        if (vigente) setReintentando(false)
      })
    return () => {
      vigente = false
    }
  }, [solicitud])

  function reintentar() {
    setReintentando(true)
    setSolicitud((actual) => actual + 1)
  }

  return { carga, reintentar, reintentando }
}

/**
 * /perfil (R-04; mapa.md, sección 2): PageHeader y dos tarjetas, «Datos
 * personales» y «Cambiar contraseña». La guarda de sesión está en App.tsx
 * (D-07, punto 4).
 *
 * Un solo aviso de cuenta: el que RequireOrganization deja en location.state al
 * llegar de /app sin empresa y el de la página se unifican en AvisoCuenta.
 * Mientras carga el perfil, la empresa se toma de la sesión, para que el aviso
 * de la redirección se vea de inmediato.
 */
export default function PerfilPage() {
  const { user } = useAuth()
  const { aviso } = leerEstadoDeRuta(useLocation().state)
  const { carga, reintentar, reintentando } = usePerfil()

  const sinEmpresa = carga.fase === 'listo' ? !carga.perfil.organization_id : user ? !user.organization_id : false

  return (
    <div className="st-perfil">
      <PageHeader eyebrow="Tu cuenta" title="Mi perfil" lede="Actualiza tus datos personales y cambia tu contraseña." />

      <AvisoCuenta avisoDeRuta={aviso} sinEmpresa={sinEmpresa} className="st-perfil__aviso" />

      {carga.fase === 'cargando' && (
        // El esqueleto ocupa la misma rejilla que las dos tarjetas: al cargar no salta.
        // Solo el primero se anuncia; el segundo es decorativo.
        <div className="st-perfil__tarjetas">
          <Card variant="glass">
            <EstadoCarga variant="bloque" count={7} label="Cargando tu perfil…" />
          </Card>
          <Card variant="glass" aria-hidden="true">
            <EstadoCarga variant="bloque" count={4} />
          </Card>
        </div>
      )}

      {carga.fase === 'error' && (
        <EstadoError
          kind={carga.tipo}
          titleAs="h2"
          title="No pudimos cargar tu perfil"
          onRetry={reintentar}
          retrying={reintentando}
        />
      )}

      {carga.fase === 'listo' && (
        <div className="st-perfil__tarjetas">
          <FormularioDatos perfil={carga.perfil} indice={0} />
          <FormularioContrasena correo={carga.perfil.email} indice={1} />
        </div>
      )}
    </div>
  )
}
