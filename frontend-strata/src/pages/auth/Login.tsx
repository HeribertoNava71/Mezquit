import { useId, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { login } from '@/api/auth'
import { AvisoDeRuta } from '@/components/AvisoDeRuta'
import { destinoTrasLogin, leerEstadoDeRuta } from '@/components/rutasDeSesion'
import { Button, Callout, Input, estadoErrorTextos } from '@/components/ui'
import { IconoReintentar } from '@/components/ui/Iconos'
import { useAuth } from '@/context/AuthContext'
import { AuthFrame } from './AuthFrame'
import { tipoDeFalla, type FallaDeEnvio } from './fallas'
import { IconoCandado, IconoCorreo, IconoFlecha } from './iconos'
import { validarAcceso, type ErroresDeAcceso } from './validacion'
import './Auth.css'

interface AvisoDeFalla {
  title?: string
  text: string
  /** El reintento solo tiene sentido si falló la conexión o el servidor. */
  reintentar: boolean
}

const AVISOS: Record<FallaDeEnvio, AvisoDeFalla> = {
  // 422: el texto de siempre. No dice cuál de los dos datos falló.
  validacion: { text: 'Correo o contraseña incorrectos.', reintentar: false },
  limite: {
    text: 'Hiciste demasiados intentos seguidos. Espera un minuto y vuelve a intentarlo.',
    reintentar: false,
  },
  red: { title: estadoErrorTextos.red.title, text: estadoErrorTextos.red.message, reintentar: true },
  servidor: { title: 'No pudimos iniciar tu sesión', text: estadoErrorTextos.servidor.message, reintentar: true },
}

/**
 * /login (R-01; mapa.md, sección 2): tarjeta centrada con el marco del acceso
 * del candidato. Correo y contraseña con el Input del sistema y validación
 * inline (la misma que antes hacía el navegador: obligatorios y formato de
 * correo); «Entrar» con estado de carga; falla del envío inline con ícono y
 * texto (D-22) y «Reintentar» si fue de conexión o del servidor.
 * Muestra el aviso que dejan las guardas en location.state (sesión vencida) y,
 * al entrar, vuelve a la ruta de origen o al inicio de cada usuario (D-07).
 * «¿Olvidaste tu contraseña?» no se muestra hasta que exista PB-23.
 */
export default function Login() {
  // El estado vive en el formulario: al teclear no se vuelve a pintar el marco (halos, marca y pie).
  return (
    <AuthFrame>
      <FormularioDeAcceso />
    </AuthFrame>
  )
}

function FormularioDeAcceso() {
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const tituloId = useId()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errores, setErrores] = useState<ErroresDeAcceso>({})
  const [falla, setFalla] = useState<FallaDeEnvio | null>(null)
  const [loading, setLoading] = useState(false)
  const campoCorreo = useRef<HTMLInputElement>(null)
  const campoContrasena = useRef<HTMLInputElement>(null)
  const botonEntrar = useRef<HTMLButtonElement>(null)

  async function entrar() {
    if (loading) return
    const nuevos = validarAcceso(email, password)
    setErrores(nuevos)
    if (nuevos.email || nuevos.password) {
      setFalla(null)
      const primerError = nuevos.email ? campoCorreo.current : campoContrasena.current
      primerError?.focus()
      return
    }

    setLoading(true)
    setFalla(null)
    try {
      const user = await login(email, password)
      setUser(user)
      // D-07, punto 6: vuelve a la ruta de origen (state.from) si es interna y el
      // usuario puede abrirla; si no, /app con empresa o /perfil sin ella. replace:
      // «Atrás» no regresa al formulario.
      navigate(destinoTrasLogin(user, leerEstadoDeRuta(location.state).from), { replace: true })
    } catch (error) {
      setFalla(tipoDeFalla(error))
      setLoading(false)
    }
  }

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    void entrar()
  }

  function reintentar() {
    // El aviso se quita al reenviar: el foco pasa al botón, que muestra la carga.
    botonEntrar.current?.focus()
    void entrar()
  }

  const aviso = falla ? AVISOS[falla] : null

  return (
    <form className="st-auth-form" onSubmit={enviar} noValidate aria-labelledby={tituloId}>
      <header className="st-auth-form__head">
        <h1 id={tituloId} className="st-auth-form__title">
          Entrar
        </h1>
        <p className="st-auth-form__lede">Usa el correo y la contraseña con los que creaste tu cuenta.</p>
      </header>

      {/* Aviso de la guarda o de SessionWatcher, p. ej. «Tu sesión expiró. Vuelve a entrar.» */}
      <AvisoDeRuta className="st-auth-form__aviso" />

      <div className="st-auth-form__campos">
        <Input
          ref={campoCorreo}
          size="lg"
          type="email"
          name="email"
          label="Correo electrónico"
          icon={<IconoCorreo />}
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          aria-required="true"
          value={email}
          onChange={(evento) => {
            setEmail(evento.target.value)
            if (errores.email) setErrores((previos) => ({ ...previos, email: undefined }))
          }}
          error={errores.email}
        />
        <Input
          ref={campoContrasena}
          size="lg"
          type="password"
          name="password"
          label="Contraseña"
          icon={<IconoCandado />}
          autoComplete="current-password"
          aria-required="true"
          value={password}
          onChange={(evento) => {
            setPassword(evento.target.value)
            if (errores.password) setErrores((previos) => ({ ...previos, password: undefined }))
          }}
          error={errores.password}
        />
      </div>

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
          {aviso.text}
        </Callout>
      )}

      <div className="st-auth-form__cta">
        <Button
          ref={botonEntrar}
          type="submit"
          className="st-auth-form__enviar"
          loading={loading}
          loadingText="Entrando…"
          iconRight={loading ? undefined : <IconoFlecha />}
        >
          Entrar
        </Button>
        <p className="st-auth-form__cambio">
          ¿No tienes cuenta? <Link to="/registro">Regístrate</Link>
        </p>
      </div>
    </form>
  )
}
