import { useState, type FormEvent } from 'react'
import { updatePassword } from '@/api/profile'
import { Button, useToast } from '@/components/ui'
import { CamposContrasena } from './CamposContrasena'
import { erroresPorCampo, mensajeAlGuardar } from './errores'
import { TarjetaFormulario } from './TarjetaFormulario'
import { useFormulario } from './useFormulario'
import {
  CONTRASENAS_VACIAS,
  confirmacionInmediata,
  MIN_CONTRASENA,
  reglasContrasena,
  type ValoresContrasena,
} from './validacion'

export const EXITO_CONTRASENA = 'Contraseña actualizada.'

export interface FormularioContrasenaProps {
  /** Correo de la cuenta, para que el gestor de contraseñas sepa de qué usuario es. */
  correo: string
  /** Posición de la tarjeta en la página (entrada escalonada). */
  indice?: number
}

/**
 * «Cambiar contraseña» de /perfil (R-04): actual, nueva y confirmación con
 * PUT /api/user/password y el mismo payload de siempre
 * { current_password, password, password_confirmation }. Validación inmediata
 * de la confirmación; errores 422 en cada campo (antes solo se veía el de la
 * contraseña actual); éxito con toast y aviso en línea, y los campos se vacían.
 */
export function FormularioContrasena({ correo, indice }: FormularioContrasenaProps) {
  const { toast } = useToast()
  const form = useFormulario<ValoresContrasena>({
    inicial: CONTRASENAS_VACIAS,
    reglas: reglasContrasena,
    inmediato: confirmacionInmediata,
  })
  const [enviando, setEnviando] = useState(false)
  const [guardada, setGuardada] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (enviando) return
    setError(null)
    setGuardada(false)
    if (!form.validar()) return

    const { current_password, password, password_confirmation } = form.valores
    setEnviando(true)
    try {
      await updatePassword({ current_password, password, password_confirmation })
      form.reiniciar(CONTRASENAS_VACIAS)
      setGuardada(true)
      toast({ message: EXITO_CONTRASENA, tone: 'success' })
    } catch (fallo) {
      const campos = erroresPorCampo(fallo)
      const ajenos = campos ? form.erroresDelServidor(campos) : null
      if (!campos) setError(mensajeAlGuardar(fallo))
      else if (ajenos && Object.keys(ajenos).length > 0) setError(Object.values(ajenos).join(' '))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <TarjetaFormulario
      titulo="Cambiar contraseña"
      descripcion={`Escribe tu contraseña actual y elige una nueva de al menos ${MIN_CONTRASENA} caracteres.`}
      indice={indice}
      onSubmit={guardar}
      error={error}
      exito={guardada && !form.editado ? EXITO_CONTRASENA : null}
      acciones={
        <Button type="submit" variant="secondary" loading={enviando} loadingText="Guardando…">
          Cambiar contraseña
        </Button>
      }
    >
      <CamposContrasena form={form} usuario={correo} />
    </TarjetaFormulario>
  )
}
