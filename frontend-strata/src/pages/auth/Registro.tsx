import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register, type RegisterPayload } from '@/api/auth'
import { Button, Callout, Checkbox, Input, Select, VisuallyHidden, estadoErrorTextos } from '@/components/ui'
import { IconoReintentar } from '@/components/ui/Iconos'
import PasswordStrength from '@/components/ui/PasswordStrength'
import { useAuth } from '@/context/AuthContext'
import { AuthFrame } from './AuthFrame'
import { erroresPorCampo, tipoDeFalla, type FallaDeEnvio } from './fallas'
import { IconoFlecha } from './iconos'
import { PLACEHOLDER_OPCION, SECTORES, TAMANOS_DE_EMPRESA } from './opcionesEmpresa'
import { MENSAJE_NO_COINCIDEN, estadoConfirmacion } from './validacion'
import './Auth.css'

/** Cuerpo de POST /api/register: los mismos 12 campos y valores iniciales de siempre. */
const EMPTY: RegisterPayload = {
  name: '', last_name: '', email: '', password: '', password_confirmation: '',
  company_name: '', sector: '', company_size: '', phone: '', birth_date: '', position: '',
  privacy_accepted: false,
}

type Campo = keyof RegisterPayload
type Errores = Partial<Record<Campo, string>>

function esCampo(nombre: string): nombre is Campo {
  return Object.hasOwn(EMPTY, nombre)
}

interface FallaDelRegistro {
  tipo: FallaDeEnvio
  /** Mensajes de un 422 que no corresponden a ningún campo del formulario. */
  mensajes?: string[]
}

interface AvisoDeFalla {
  title?: string
  mensajes: string[]
  reintentar: boolean
}

function avisoDe(falla: FallaDelRegistro): AvisoDeFalla {
  switch (falla.tipo) {
    case 'validacion':
      return {
        title: 'Revisa tus datos',
        mensajes: falla.mensajes ?? ['Algunos datos no son válidos. Revísalos e inténtalo de nuevo.'],
        reintentar: false,
      }
    case 'limite':
      return {
        mensajes: ['Hiciste demasiados intentos seguidos. Espera un minuto y vuelve a intentarlo.'],
        reintentar: false,
      }
    case 'red':
      return { title: estadoErrorTextos.red.title, mensajes: [estadoErrorTextos.red.message], reintentar: true }
    case 'servidor':
      return { title: 'No pudimos crear tu cuenta', mensajes: [estadoErrorTextos.servidor.message], reintentar: true }
  }
}

/**
 * /registro (R-02, R-03, S-13; mapa.md, sección 2): tarjeta ancha con el marco
 * del acceso, en dos columnas desde 768 px, con las secciones «Datos
 * personales» y «Empresa (opcional)».
 * - Conserva los 9 campos, la casilla del aviso de privacidad (sin marcar), el
 *   cuerpo exacto de POST /api/register y la redirección de siempre:
 *   /app/evaluaciones/nueva con empresa o /perfil sin ella.
 * - Suma Sector y Tamaño de la empresa, que el contrato ya aceptaba (R-03).
 * - «Confirmar contraseña» se valida en vivo con los estados válido y error del
 *   Input, además del 422 del servidor; si no coincide, no se envía.
 * - Los 422 se muestran en su campo y el foco va al primero; las fallas de
 *   conexión o del servidor, en un aviso con «Reintentar» (D-22).
 * - Ningún texto promete un correo de verificación (PB-32).
 */
export default function Registro() {
  // El estado vive en el formulario: al teclear no se vuelve a pintar el marco (halos, marca y pie).
  return (
    <AuthFrame width="wide">
      <FormularioDeRegistro />
    </AuthFrame>
  )
}

function FormularioDeRegistro() {
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const tituloId = useId()
  const fuerzaId = useId()
  const [form, setForm] = useState<RegisterPayload>(EMPTY)
  const [errors, setErrors] = useState<Errores>({})
  const [loading, setLoading] = useState(false)
  const [falla, setFalla] = useState<FallaDelRegistro | null>(null)
  // La persona salió de «Confirmar contraseña» o intentó enviar: ya no se espera a que termine de escribir.
  const [confirmacionTerminada, setConfirmacionTerminada] = useState(false)
  // Cambia con cada envío que deja errores en los campos; el efecto enfoca el primero.
  const [enfocarError, setEnfocarError] = useState(0)
  const formulario = useRef<HTMLFormElement>(null)
  const botonCrear = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (enfocarError === 0) return
    formulario.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }, [enfocarError])

  function set(k: Campo, v: string | boolean) {
    setForm((p) => ({ ...p, [k]: v }))
    // Al editar un campo se quita su error del servidor. Al cambiar la contraseña
    // también el de la confirmación: el estado en vivo vuelve a compararlas.
    const limpiar: Campo[] = k === 'password' ? ['password', 'password_confirmation'] : [k]
    setErrors((p) => {
      if (!limpiar.some((campo) => p[campo])) return p
      const siguientes = { ...p }
      for (const campo of limpiar) delete siguientes[campo]
      return siguientes
    })
  }

  function str(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    if (esCampo(name)) set(name, value)
  }

  const confirmacion = estadoConfirmacion(form.password, form.password_confirmation, confirmacionTerminada)
  const errorConfirmacion =
    errors.password_confirmation ?? (confirmacion === 'no-coincide' ? MENSAJE_NO_COINCIDEN : undefined)

  async function crearCuenta() {
    if (loading) return
    // Confirmación distinta: el error ya se ve en el campo y el servidor la rechazaría (same:password).
    if (estadoConfirmacion(form.password, form.password_confirmation, true) === 'no-coincide') {
      setConfirmacionTerminada(true)
      setFalla(null)
      setEnfocarError((n) => n + 1)
      return
    }

    setLoading(true)
    setFalla(null)
    setErrors({})
    try {
      const user = await register(form)
      setUser(user)
      navigate(user.organization_id ? '/app/evaluaciones/nueva' : '/perfil')
    } catch (err: unknown) {
      const porCampo = erroresPorCampo(err)
      if (porCampo) {
        const campos: Errores = {}
        const otros: string[] = []
        for (const [campo, mensaje] of Object.entries(porCampo)) {
          if (esCampo(campo)) campos[campo] = mensaje
          else otros.push(mensaje)
        }
        setErrors(campos)
        setFalla(otros.length > 0 ? { tipo: 'validacion', mensajes: otros } : null)
        setEnfocarError((n) => n + 1)
      } else {
        setFalla({ tipo: tipoDeFalla(err) })
      }
      setLoading(false)
    }
  }

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    void crearCuenta()
  }

  function reintentar() {
    // El aviso se quita al reenviar: el foco pasa al botón, que muestra la carga.
    botonCrear.current?.focus()
    void crearCuenta()
  }

  const aviso = falla ? avisoDe(falla) : null

  return (
    <form ref={formulario} className="st-auth-form" onSubmit={enviar} noValidate aria-labelledby={tituloId}>
      <header className="st-auth-form__head st-auth-form__head--divider">
        <h1 id={tituloId} className="st-auth-form__title">
          Crear cuenta
        </h1>
        <p className="st-auth-form__lede">
          Si registras tu empresa, entrarás directo al portal de RR. HH. para crear tu primera evaluación.
        </p>
      </header>

      <fieldset className="st-auth-form__grupo">
        <legend className="st-auth-form__legend">Datos personales</legend>
        <div className="st-auth-form__grid">
          <Input
            size="lg"
            name="name"
            label="Nombre"
            autoComplete="given-name"
            maxLength={255}
            aria-required="true"
            value={form.name}
            onChange={str}
            error={errors.name}
          />
          <Input
            size="lg"
            name="last_name"
            label="Apellido"
            autoComplete="family-name"
            maxLength={255}
            aria-required="true"
            value={form.last_name}
            onChange={str}
            error={errors.last_name}
          />
          <Input
            size="lg"
            type="email"
            name="email"
            label="Correo electrónico"
            className="st-auth-form__celda--completa"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={255}
            aria-required="true"
            value={form.email}
            onChange={str}
            error={errors.email}
          />
          <div className="st-auth-form__celda">
            <Input
              size="lg"
              type="password"
              name="password"
              label="Contraseña"
              hint="Mínimo 8 caracteres"
              autoComplete="new-password"
              aria-required="true"
              aria-describedby={form.password ? fuerzaId : undefined}
              value={form.password}
              onChange={str}
              error={errors.password}
            />
            <PasswordStrength password={form.password} id={fuerzaId} />
          </div>
          <Input
            size="lg"
            type="password"
            name="password_confirmation"
            label="Confirmar contraseña"
            autoComplete="new-password"
            aria-required="true"
            value={form.password_confirmation}
            onChange={(e) => {
              setConfirmacionTerminada(false)
              str(e)
            }}
            onBlur={() => setConfirmacionTerminada(true)}
            valid={confirmacion === 'coincide'}
            error={errorConfirmacion}
          />
          <Input
            size="lg"
            type="date"
            name="birth_date"
            label="Fecha de nacimiento"
            hint="Opcional"
            autoComplete="bday"
            value={form.birth_date ?? ''}
            onChange={str}
            error={errors.birth_date}
          />
          <Input
            size="lg"
            type="tel"
            name="phone"
            label="Teléfono"
            hint="Opcional"
            autoComplete="tel"
            maxLength={30}
            value={form.phone ?? ''}
            onChange={str}
            error={errors.phone}
          />
        </div>
      </fieldset>

      <fieldset className="st-auth-form__grupo">
        <legend className="st-auth-form__legend">Empresa (opcional)</legend>
        <p className="st-auth-form__grupo-texto">
          El sector y el tamaño solo se guardan si escribes el nombre de tu empresa.
        </p>
        <div className="st-auth-form__grid">
          <Input
            size="lg"
            name="company_name"
            label="Empresa / Organización"
            autoComplete="organization"
            maxLength={255}
            value={form.company_name ?? ''}
            onChange={str}
            error={errors.company_name}
          />
          <Input
            size="lg"
            name="position"
            label="Puesto"
            autoComplete="organization-title"
            maxLength={255}
            value={form.position ?? ''}
            onChange={str}
            error={errors.position}
          />
          <Select
            size="lg"
            name="sector"
            label="Sector"
            placeholder={PLACEHOLDER_OPCION}
            options={SECTORES}
            value={form.sector ?? ''}
            onChange={str}
            error={errors.sector}
          />
          <Select
            size="lg"
            name="company_size"
            label="Tamaño de la empresa"
            placeholder={PLACEHOLDER_OPCION}
            options={TAMANOS_DE_EMPRESA}
            value={form.company_size ?? ''}
            onChange={str}
            error={errors.company_size}
          />
        </div>
      </fieldset>

      <Checkbox
        variant="consent"
        name="privacy_accepted"
        aria-required="true"
        checked={form.privacy_accepted}
        onChange={(e) => set('privacy_accepted', e.target.checked)}
        error={errors.privacy_accepted}
        label={
          <>
            Acepto el{' '}
            <Link to="/aviso-de-privacidad" target="_blank" rel="noopener noreferrer">
              aviso de privacidad
              <VisuallyHidden> (se abre en otra pestaña)</VisuallyHidden>
            </Link>{' '}
            y el uso de mis datos para la evaluación de candidatos.
          </>
        }
      />

      {aviso && (
        <Callout
          tone="error"
          live="alert"
          className="st-auth-form__falla"
          title={aviso.title}
          actions={
            aviso.reintentar && (
              <Button variant="secondary" iconLeft={<IconoReintentar />} onClick={reintentar}>
                Reintentar
              </Button>
            )
          }
        >
          {aviso.mensajes.length === 1 ? (
            aviso.mensajes[0]
          ) : (
            <ul className="st-auth-form__falla-lista">
              {aviso.mensajes.map((mensaje) => (
                <li key={mensaje}>{mensaje}</li>
              ))}
            </ul>
          )}
        </Callout>
      )}

      <div className="st-auth-form__cta">
        <Button
          ref={botonCrear}
          type="submit"
          className="st-auth-form__enviar"
          loading={loading}
          loadingText="Creando cuenta…"
          iconRight={loading ? undefined : <IconoFlecha />}
        >
          Crear cuenta
        </Button>
        <p className="st-auth-form__cambio">
          ¿Ya tienes cuenta? <Link to="/login">Entra aquí</Link>
        </p>
      </div>
    </form>
  )
}
