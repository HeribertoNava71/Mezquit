import { useState, type FormEvent } from 'react'
import { updateProfile, type getProfile } from '@/api/profile'
import { Button, cx, Input, useToast } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { erroresPorCampo, mensajeAlGuardar } from './errores'
import { TarjetaFormulario } from './TarjetaFormulario'
import { useFormulario } from './useFormulario'
import {
  diaAnterior,
  fechaLocal,
  fechaParaEnviar,
  fechaParaInput,
  reglasDatos,
  type ValoresDatos,
} from './validacion'
import './FormularioDatos.css'

/** Respuesta de GET /api/user/profile. */
export type Perfil = Awaited<ReturnType<typeof getProfile>>

export const EXITO_DATOS = 'Perfil guardado correctamente.'

function valoresDe(perfil: Perfil): ValoresDatos {
  return {
    name: perfil.name ?? '',
    last_name: perfil.last_name ?? '',
    phone: perfil.phone ?? '',
    birth_date: fechaParaInput(perfil.birth_date),
    position: perfil.position ?? '',
  }
}

export interface FormularioDatosProps {
  perfil: Perfil
  /** Posición de la tarjeta en la página (entrada escalonada). */
  indice?: number
}

/**
 * «Datos personales» de /perfil (R-04; mapa.md, sección 2): nombre, apellido,
 * teléfono, fecha de nacimiento y puesto con PUT /api/user/profile, y el correo
 * y la empresa en solo lectura (organization.name, PB-22). Conserva el payload
 * de siempre: { name, last_name, phone, birth_date, position }; un campo vacío
 * va como «» y el servidor lo guarda como null. El apellido es obligatorio
 * aunque venga nulo (PB-27). Errores por campo; éxito con toast y aviso en
 * línea. Al guardar actualiza el nombre de la sesión (barra superior).
 */
export function FormularioDatos({ perfil, indice }: FormularioDatosProps) {
  const { user, setUser } = useAuth()
  const { toast } = useToast()
  // Fecha local al abrir la página: la de nacimiento debe ser anterior (before:today).
  const [hoy] = useState(() => fechaLocal(new Date()))
  const form = useFormulario<ValoresDatos>({
    inicial: valoresDe(perfil),
    reglas: (valores) => reglasDatos(valores, hoy),
    // La fecha se elige completa en el selector: su error se ve al momento.
    inmediato: (campo, valores) => campo === 'birth_date' && valores.birth_date !== '',
  })
  const [enviando, setEnviando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const empresa = perfil.organization?.name?.trim() || null
  // PB-27: cuentas anteriores con last_name nulo. El campo es obligatorio.
  const apellidoPendiente = !(perfil.last_name ?? '').trim() && !form.valores.last_name.trim()

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (enviando) return
    setError(null)
    setGuardado(false)
    if (!form.validar()) return

    const valores = form.valores
    setEnviando(true)
    try {
      await updateProfile({
        name: valores.name,
        last_name: valores.last_name,
        phone: valores.phone,
        birth_date: fechaParaEnviar(valores.birth_date, perfil.birth_date),
        position: valores.position,
      })
      form.reiniciar(valores)
      setGuardado(true)
      toast({ message: EXITO_DATOS, tone: 'success' })
      // La barra muestra el nombre de la sesión (GET /api/user): se actualiza sin recargar.
      if (user) setUser({ ...user, name: valores.name.trim(), last_name: valores.last_name.trim() })
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
      titulo="Datos personales"
      descripcion="Los campos con * son obligatorios."
      indice={indice}
      onSubmit={guardar}
      error={error}
      exito={guardado && !form.editado ? EXITO_DATOS : null}
      acciones={
        <Button type="submit" loading={enviando} loadingText="Guardando…">
          Guardar cambios
        </Button>
      }
    >
      <div className="st-perfil-cuenta">
        <dl className="st-perfil-cuenta__datos">
          <div className="st-perfil-cuenta__dato">
            <dt className="st-perfil-cuenta__rotulo">Correo electrónico</dt>
            <dd className="st-perfil-cuenta__valor">{perfil.email}</dd>
          </div>
          <div className="st-perfil-cuenta__dato">
            <dt className="st-perfil-cuenta__rotulo">Empresa</dt>
            <dd className={cx('st-perfil-cuenta__valor', !empresa && 'st-perfil-cuenta__valor--vacio')}>
              {empresa ?? 'Sin empresa asociada'}
            </dd>
          </div>
        </dl>
        <p className="st-perfil-cuenta__nota">Tu correo y tu empresa no se pueden cambiar desde aquí.</p>
      </div>

      <div className="st-perfil-form__campos st-perfil-form__campos--rejilla">
        <Input label="Nombre" required autoComplete="given-name" maxLength={255} {...form.campo('name')} />
        <Input
          label="Apellido"
          required
          autoComplete="family-name"
          maxLength={255}
          hint={apellidoPendiente ? 'Complétalo para poder guardar' : undefined}
          {...form.campo('last_name')}
        />
        <Input label="Teléfono" type="tel" autoComplete="tel" maxLength={30} {...form.campo('phone')} />
        <Input
          label="Fecha de nacimiento"
          type="date"
          autoComplete="bday"
          max={diaAnterior(hoy)}
          {...form.campo('birth_date')}
        />
        <Input
          label="Puesto"
          autoComplete="organization-title"
          maxLength={255}
          className="st-perfil-form__campo--ancho"
          {...form.campo('position')}
        />
      </div>
    </TarjetaFormulario>
  )
}
