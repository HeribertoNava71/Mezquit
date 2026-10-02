import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getUser, updateUser, type AdminUser } from '@/api/adminUsers'
import {
  Badge,
  Button,
  Callout,
  Card,
  EstadoCarga,
  EstadoError,
  Input,
  PageHeader,
  Select,
  Tag,
  VisuallyHidden,
  getErrorKind,
  useToast,
  type EstadoErrorKind,
} from '@/components/ui'
import { ConfirmarEliminacion } from './usuarios/ConfirmarEliminacion'
import { Correo } from './usuarios/Correo'
import { errorAlGuardar, erroresDeCampos } from './usuarios/errores'
import { fechaDeCalendario, fechaLarga, nombreCompleto } from './usuarios/formato'
import {
  LARGO_MAXIMO,
  erroresDelFormulario,
  formularioDesde,
  payloadDeActualizacion,
  primerCampoConError,
  usuarioTrasGuardar,
  validarFormulario,
  type CampoUsuario,
  type ErroresUsuario,
  type FormularioUsuario,
} from './usuarios/formulario'
import { IconoVolver } from './usuarios/iconos'
import { ROLES, esRolConocido, etiquetaRol, tonoRol } from './usuarios/roles'
import './AdminUsuarioDetallePage.css'

/** Última carga terminada de GET /api/admin/users/{id}. */
interface Carga {
  clave: string
  error: EstadoErrorKind | null
}

function Volver() {
  return (
    <Button variant="ghost" size="sm" to="/admin/usuarios" iconLeft={<IconoVolver />} className="st-usuario__volver">
      Volver a usuarios
    </Button>
  )
}

/**
 * /admin/usuarios/:id (R-31, R-03): nombre, apellido, teléfono y puesto
 * editables y el rol en un Select con etiqueta; correo, organización, fecha de
 * nacimiento y fecha de registro en solo lectura (GET los devuelve y PATCH no
 * los acepta). PATCH lleva los mismos campos que antes y omite last_name vacío
 * (PB-27). Errores 422 en cada campo; zona de peligro con Modal y el 409 al
 * eliminarse a sí mismo. EstadoError en lugar del «Cargando…» sin fin.
 * El rol no autoriza nada (R-33): solo se guarda.
 */
export default function AdminUsuarioDetallePage() {
  const { id = '' } = useParams()
  const idValido = /^\d+$/.test(id)
  const navigate = useNavigate()
  const { toast } = useToast()

  const [version, setVersion] = useState(0)
  const [carga, setCarga] = useState<Carga | null>(null)
  const [usuario, setUsuario] = useState<AdminUser | null>(null)
  const [formulario, setFormulario] = useState<FormularioUsuario | null>(null)
  const [errores, setErrores] = useState<ErroresUsuario>({})
  // Error de PATCH que no es de un campo. Se borra al reintentar, así el aviso
  // vuelve a montarse (y a anunciarse) si falla otra vez.
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [pedirFoco, setPedirFoco] = useState(0)
  const [eliminarAbierto, setEliminarAbierto] = useState(false)
  const enviando = useRef(false)
  const formularioRef = useRef<HTMLFormElement>(null)
  const idPerfil = useId()
  const idCuenta = useId()
  const idPeligro = useId()

  const clave = `${id}|${version}`

  useEffect(() => {
    if (!idValido) return
    let vigente = true
    getUser(Number(id)).then(
      (datos) => {
        if (!vigente) return
        setUsuario(datos)
        setFormulario(formularioDesde(datos))
        setErrores({})
        setErrorGuardar(null)
        setCarga({ clave, error: null })
      },
      (error: unknown) => {
        if (vigente) setCarga({ clave, error: getErrorKind(error) })
      },
    )
    return () => {
      vigente = false
    }
  }, [clave, id, idValido])

  // Tras un error de validación, el foco va al primer campo marcado (ya con su
  // aria-invalid y su mensaje, para que el lector de pantalla los anuncie).
  useEffect(() => {
    if (pedirFoco === 0) return
    formularioRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }, [pedirFoco])

  function cambiar(campo: CampoUsuario, valor: string) {
    setFormulario((actual) => (actual ? { ...actual, [campo]: valor } : actual))
    setErrores((actuales) => (actuales[campo] ? { ...actuales, [campo]: undefined } : actuales))
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!usuario || !formulario || enviando.current) return

    const locales = validarFormulario(formulario)
    if (primerCampoConError(locales)) {
      setErrores(locales)
      setErrorGuardar(null)
      setPedirFoco((n) => n + 1)
      return
    }

    enviando.current = true
    setGuardando(true)
    setErrores({})
    setErrorGuardar(null)
    const payload = payloadDeActualizacion(formulario)
    try {
      await updateUser(usuario.id, payload)
      const guardado = usuarioTrasGuardar(usuario, payload)
      setUsuario(guardado)
      setFormulario(formularioDesde(guardado))
      toast({ message: 'Cambios guardados', tone: 'success' })
    } catch (error) {
      const porCampo = erroresDelFormulario(erroresDeCampos(error))
      if (primerCampoConError(porCampo)) {
        setErrores(porCampo)
        setPedirFoco((n) => n + 1)
      } else {
        setErrorGuardar(errorAlGuardar(error).mensaje)
      }
    } finally {
      enviando.current = false
      setGuardando(false)
    }
  }

  function alEliminar(eliminado: AdminUser) {
    setEliminarAbierto(false)
    toast({ message: `Eliminaste la cuenta de ${nombreCompleto(eliminado)}`, tone: 'success' })
    navigate('/admin/usuarios')
  }

  // ── Estados sin usuario: enlace inválido, error de carga y carga ─────────
  const terminado = carga !== null && carga.clave === clave
  const errorCarga = idValido ? (carga?.error ?? null) : 'no-encontrado'

  if (errorCarga) {
    const noEncontrado = errorCarga === 'no-encontrado'
    return (
      <div className="st-usuario">
        <Volver />
        <VisuallyHidden as="h1">Detalle del usuario</VisuallyHidden>
        <EstadoError
          kind={errorCarga}
          titleAs="h2"
          title={
            noEncontrado ? 'No encontramos a este usuario' : errorCarga === 'servidor' ? 'No pudimos cargar al usuario' : undefined
          }
          message={noEncontrado ? 'Puede que el enlace esté incompleto o que la cuenta ya se haya eliminado.' : undefined}
          onRetry={noEncontrado ? undefined : () => setVersion((n) => n + 1)}
          retrying={!noEncontrado && !terminado}
          actions={
            noEncontrado && (
              <Button variant="secondary" to="/admin/usuarios">
                Ver todos los usuarios
              </Button>
            )
          }
        />
      </div>
    )
  }

  if (!terminado || !usuario || !formulario) {
    return (
      <div className="st-usuario">
        <Volver />
        <VisuallyHidden as="h1">Detalle del usuario</VisuallyHidden>
        <EstadoCarga variant="bloque" skeleton="tarjetas" count={2} label="Cargando usuario…" />
      </div>
    )
  }

  // ── Usuario cargado ──────────────────────────────────────────────────────
  const nombre = nombreCompleto(usuario)
  const nacimiento = fechaDeCalendario(usuario.birth_date)
  const registro = fechaLarga(usuario.created_at)
  // Un rol fuera de los tres se muestra tal como llega, sin cambiarlo en silencio.
  const opcionesRol = esRolConocido(formulario.role)
    ? ROLES
    : [...ROLES, { value: formulario.role, label: etiquetaRol(formulario.role) }]

  return (
    <div className="st-usuario">
      <Volver />
      <PageHeader
        eyebrow="Usuario"
        status={
          <Badge size="sm" tone={tonoRol(usuario.role)}>
            {etiquetaRol(usuario.role)}
          </Badge>
        }
        title={nombre}
        lede={<Correo valor={usuario.email} />}
      />

      <div className="st-usuario__rejilla">
        <Card as="section" aria-labelledby={idPerfil} className="st-usuario__tarjeta">
          <form ref={formularioRef} className="st-usuario__formulario" onSubmit={guardar} noValidate>
            <div className="st-usuario__cabecera">
              <h2 id={idPerfil} className="st-usuario__titulo">
                Datos del perfil
              </h2>
              <p className="st-usuario__descripcion">Corrige sus datos o cambia su rol. El nombre es obligatorio.</p>
            </div>

            <div className="st-usuario__campos">
              <Input
                label="Nombre"
                name="name"
                required
                maxLength={LARGO_MAXIMO.name}
                autoComplete="off"
                value={formulario.name}
                onChange={(evento) => cambiar('name', evento.target.value)}
                error={errores.name}
              />
              <Input
                label="Apellido"
                name="last_name"
                maxLength={LARGO_MAXIMO.last_name}
                autoComplete="off"
                hint={usuario.last_name?.trim() ? 'Si lo dejas vacío, se conserva el actual' : undefined}
                value={formulario.last_name}
                onChange={(evento) => cambiar('last_name', evento.target.value)}
                error={errores.last_name}
              />
              <Input
                label="Teléfono"
                name="phone"
                type="tel"
                maxLength={LARGO_MAXIMO.phone}
                autoComplete="off"
                value={formulario.phone}
                onChange={(evento) => cambiar('phone', evento.target.value)}
                error={errores.phone}
              />
              <Input
                label="Puesto"
                name="position"
                maxLength={LARGO_MAXIMO.position}
                autoComplete="off"
                value={formulario.position}
                onChange={(evento) => cambiar('position', evento.target.value)}
                error={errores.position}
              />
              <Select
                label="Rol"
                name="role"
                hint="Solo informativo: no cambia sus permisos"
                options={opcionesRol}
                value={formulario.role}
                onChange={(evento) => cambiar('role', evento.target.value)}
                error={errores.role}
              />
            </div>

            {errorGuardar && (
              <Callout tone="error" live="alert">
                {errorGuardar}
              </Callout>
            )}

            <div className="st-usuario__acciones">
              <Button type="submit" loading={guardando} loadingText="Guardando…" className="st-usuario__guardar">
                Guardar cambios
              </Button>
            </div>
          </form>
        </Card>

        <div className="st-usuario__lateral">
          <Card as="section" aria-labelledby={idCuenta} className="st-usuario__tarjeta">
            <div className="st-usuario__cabecera st-usuario__cabecera--fila">
              <h2 id={idCuenta} className="st-usuario__titulo">
                Datos de la cuenta
              </h2>
              <Tag tone="neutral" size="sm">
                Solo lectura
              </Tag>
            </div>
            <dl className="st-usuario__datos">
              <div className="st-usuario__dato">
                <dt>Correo</dt>
                <dd>
                  <Correo valor={usuario.email} />
                </dd>
              </div>
              <div className="st-usuario__dato">
                <dt>Organización</dt>
                <dd>{usuario.organization?.name || <span className="st-usuario__sin-dato">Sin organización</span>}</dd>
              </div>
              <div className="st-usuario__dato">
                <dt>Fecha de nacimiento</dt>
                <dd>
                  {nacimiento ? (
                    <time dateTime={nacimiento.iso}>{nacimiento.texto}</time>
                  ) : (
                    <span className="st-usuario__sin-dato">No registrada</span>
                  )}
                </dd>
              </div>
              <div className="st-usuario__dato">
                <dt>Fecha de registro</dt>
                <dd>
                  {registro ? (
                    <time dateTime={registro.iso}>{registro.texto}</time>
                  ) : (
                    <span className="st-usuario__sin-dato">Sin fecha</span>
                  )}
                </dd>
              </div>
            </dl>
            <p className="st-usuario__nota">Estos datos no se pueden editar desde aquí.</p>
          </Card>

          <Card as="section" variant="white" aria-labelledby={idPeligro} className="st-usuario__tarjeta st-usuario__peligro">
            <div className="st-usuario__cabecera">
              <h2 id={idPeligro} className="st-usuario__titulo st-usuario__titulo--peligro">
                Zona de peligro
              </h2>
              <p className="st-usuario__descripcion">
                Eliminar la cuenta es definitivo: la persona ya no podrá entrar con ella.
              </p>
            </div>
            <Button variant="danger" className="st-usuario__eliminar" onClick={() => setEliminarAbierto(true)}>
              Eliminar usuario
            </Button>
          </Card>
        </div>
      </div>

      <ConfirmarEliminacion
        usuario={eliminarAbierto ? usuario : null}
        onCancelar={() => setEliminarAbierto(false)}
        onEliminado={alEliminar}
      />
    </div>
  )
}
