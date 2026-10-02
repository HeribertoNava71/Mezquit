import { useState, type FormEvent } from 'react'
import { updateAdminMe } from '@/api/adminUsers'
import { Button, Input, PageHeader, useToast } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { CamposContrasena } from '@/pages/perfil/CamposContrasena'
import { erroresPorCampo, mensajeAlGuardar } from '@/pages/perfil/errores'
import { TarjetaFormulario } from '@/pages/perfil/TarjetaFormulario'
import { useFormulario } from '@/pages/perfil/useFormulario'
import {
  CONTRASENAS_VACIAS,
  confirmacionInmediata,
  MIN_CONTRASENA,
  reglasContrasena,
  reglasCorreo,
  type ValoresContrasena,
  type ValoresCorreo,
} from '@/pages/perfil/validacion'
import './AdminPerfilPage.css'

type ValoresOperador = ValoresCorreo & ValoresContrasena

export const EXITO_CREDENCIALES = 'Credenciales actualizadas.'

/**
 * PB-24: si la contraseña actual no coincide, PUT /api/admin/me responde 422
 * sin `errors` (el detalle viene serializado dentro de `message`). Mientras el
 * backend no lo corrija, se muestra un mensaje genérico. Los demás 422 (correo
 * en uso, largo o confirmación) sí traen `errors` y van en su campo.
 */
export const MENSAJE_SIN_DETALLE = 'Revisa tu contraseña actual y el correo, e inténtalo de nuevo.'

/**
 * /admin/perfil (R-32; mapa.md, sección 2): correo y contraseña del operador
 * con PUT /api/admin/me y el payload de siempre
 * { email, current_password, password, password_confirmation }. El servidor
 * pide la contraseña actual y una nueva en cada cambio. Validación inmediata
 * de la confirmación, errores en línea y, al guardar, el correo nuevo pasa a
 * la sesión con setUser (antes la barra seguía con el anterior).
 */
export default function AdminPerfilPage() {
  const { user, setUser } = useAuth()
  const { toast } = useToast()
  const form = useFormulario<ValoresOperador>({
    inicial: { email: user?.email ?? '', ...CONTRASENAS_VACIAS },
    reglas: (valores) => ({ ...reglasCorreo(valores), ...reglasContrasena(valores) }),
    inmediato: confirmacionInmediata,
  })
  const [enviando, setEnviando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (enviando) return
    setError(null)
    setGuardado(false)
    if (!form.validar()) return

    const { email, current_password, password, password_confirmation } = form.valores
    setEnviando(true)
    try {
      await updateAdminMe({ email, current_password, password, password_confirmation })
      // El servidor recorta los espacios del correo (TrimStrings): la sesión guarda el mismo valor.
      const correo = email.trim()
      form.reiniciar({ email: correo, ...CONTRASENAS_VACIAS })
      setGuardado(true)
      toast({ message: EXITO_CREDENCIALES, tone: 'success' })
      if (user) setUser({ ...user, email: correo })
    } catch (fallo) {
      const campos = erroresPorCampo(fallo)
      const ajenos = campos ? form.erroresDelServidor(campos) : null
      if (!campos) setError(mensajeAlGuardar(fallo, MENSAJE_SIN_DETALLE))
      else if (ajenos && Object.keys(ajenos).length > 0) setError(Object.values(ajenos).join(' '))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="st-admin-perfil">
      <PageHeader
        eyebrow="Operación"
        title="Mi perfil de operador"
        lede="Cambia el correo con el que entras y tu contraseña."
      />

      <TarjetaFormulario
        className="st-admin-perfil__tarjeta"
        titulo="Correo y contraseña"
        descripcion={`Cada cambio pide tu contraseña actual y una nueva de al menos ${MIN_CONTRASENA} caracteres. Para cambiar solo el correo, escribe tu contraseña actual también como nueva.`}
        indice={0}
        onSubmit={guardar}
        error={error}
        exito={guardado && !form.editado ? EXITO_CREDENCIALES : null}
        acciones={
          <Button type="submit" loading={enviando} loadingText="Guardando…">
            Guardar cambios
          </Button>
        }
      >
        <CamposContrasena form={form}>
          <Input label="Correo electrónico" type="email" required autoComplete="username" {...form.campo('email')} />
        </CamposContrasena>
      </TarjetaFormulario>
    </div>
  )
}
