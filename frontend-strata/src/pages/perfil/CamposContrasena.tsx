import type { ReactNode } from 'react'
import { Input } from '@/components/ui'
import type { Formulario, ValoresFormulario } from './useFormulario'
import { confirmacionEsValida, MIN_CONTRASENA, nuevaEsValida, type ValoresContrasena } from './validacion'

export interface CamposContrasenaProps<V extends ValoresContrasena & ValoresFormulario<V>> {
  /** Formulario que contiene los tres campos de contraseña (useFormulario). */
  form: Formulario<V>
  /**
   * Usuario de la cuenta (su correo). Va en un campo oculto para que el gestor
   * de contraseñas asocie la nueva a esa cuenta. Omítelo si el formulario ya
   * tiene un campo visible de correo con autoComplete="username".
   */
  usuario?: string
  /**
   * Campos que van antes de las contraseñas, en el mismo grupo (con el mismo
   * espacio entre campos). /admin/perfil pone aquí el correo.
   */
  children?: ReactNode
}

/**
 * Contraseña actual, nueva y confirmación, iguales en /perfil y /admin/perfil
 * (brechas.md, R-02: «el mismo patrón en los cambios de contraseña»). La nueva
 * y la confirmación muestran el estado válido del Input (borde verde y
 * palomita) en cuanto cumplen; la confirmación avisa al momento si no coincide.
 */
export function CamposContrasena<V extends ValoresContrasena & ValoresFormulario<V>>({
  form,
  usuario,
  children,
}: CamposContrasenaProps<V>) {
  const { valores } = form
  return (
    <div className="st-perfil-form__campos">
      {usuario !== undefined && (
        <input type="email" name="username" autoComplete="username" value={usuario} readOnly hidden tabIndex={-1} />
      )}
      {children}
      <Input
        label="Contraseña actual"
        type="password"
        required
        autoComplete="current-password"
        {...form.campo('current_password')}
      />
      <Input
        label="Nueva contraseña"
        type="password"
        required
        autoComplete="new-password"
        hint={`Mínimo ${MIN_CONTRASENA} caracteres`}
        valid={nuevaEsValida(valores)}
        {...form.campo('password')}
      />
      <Input
        label="Confirmar nueva contraseña"
        type="password"
        required
        autoComplete="new-password"
        valid={confirmacionEsValida(valores)}
        {...form.campo('password_confirmation')}
      />
    </div>
  )
}
