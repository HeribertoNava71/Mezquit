import { useEffect, useRef, useState, type Dispatch, type FormEvent, type SetStateAction } from 'react'
import { listUsers, type AdminUser, type UserList } from '@/api/adminUsers'
import {
  Avatar,
  Badge,
  Button,
  DataTable,
  EstadoCarga,
  EstadoError,
  EstadoVacio,
  Input,
  PageHeader,
  VisuallyHidden,
  getErrorKind,
  useToast,
  type DataTableColumn,
  type EstadoErrorKind,
} from '@/components/ui'
import { IconoBuscar } from '@/components/ui/Iconos'
import { ConfirmarEliminacion } from './usuarios/ConfirmarEliminacion'
import { Correo } from './usuarios/Correo'
import { fechaCorta, nombreCompleto } from './usuarios/formato'
import { etiquetaRol, tonoRol } from './usuarios/roles'
import './AdminUsuariosPage.css'

/** Admin\UserController::index pagina de 15 en 15 (paginate(15)). */
const POR_PAGINA = 15
/** Espera tras la última tecla antes de buscar; antes salía una petición por tecla. */
const RETARDO_BUSQUEDA = 300

/** Lo que se pide a GET /api/admin/users. version cambia para volver a pedir lo mismo. */
interface Consulta {
  texto: string
  pagina: number
  version: number
}

/**
 * Respuesta de la última consulta terminada. datos conserva la última lista que
 * llegó bien, también cuando la consulta siguiente falla o mientras carga otra.
 */
interface Resultado {
  clave: string
  datos: UserList | null
  error: EstadoErrorKind | null
}

const claveDe = ({ texto, pagina, version }: Consulta) => `${version}|${pagina}|${texto}`

/**
 * Aplica el texto buscado (sin espacios a los lados, como lo recibe el
 * servidor). Si cambió, vuelve a la página 1; si no, no pide nada.
 */
function aplicarBusqueda(setConsulta: Dispatch<SetStateAction<Consulta>>, valor: string) {
  const limpio = valor.trim()
  setConsulta((actual) => (actual.texto === limpio ? actual : { ...actual, texto: limpio, pagina: 1 }))
}

/** «—» para la vista y un texto para lectores de pantalla. */
function SinDato({ texto }: { texto: string }) {
  return (
    <span className="st-usuarios__sin-dato">
      <span aria-hidden="true">—</span>
      <VisuallyHidden>{texto}</VisuallyHidden>
    </span>
  )
}

/**
 * /admin/usuarios (R-31): búsqueda en el servidor por nombre, apellido o correo,
 * con un retardo de 300 ms; tabla con Nombre, Correo, Organización, Puesto, Rol
 * traducido y Registro (R-03); paginación de 15 con el total; «Editar» lleva al
 * detalle y «Eliminar» pide confirmación en un Modal (el 409 al eliminarse a sí
 * mismo se muestra ahí). Carga, vacío y error distintos, con «Reintentar» (R-34).
 * El rol no autoriza nada (R-33): ninguna acción depende de él.
 */
export default function AdminUsuariosPage() {
  const { toast } = useToast()
  const [busqueda, setBusqueda] = useState('')
  const [consulta, setConsulta] = useState<Consulta>({ texto: '', pagina: 1, version: 0 })
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [porEliminar, setPorEliminar] = useState<AdminUser | null>(null)
  const [enfocarTabla, setEnfocarTabla] = useState(0)
  const busquedaRef = useRef<HTMLInputElement>(null)
  const tituloRef = useRef<HTMLSpanElement>(null)

  const clave = claveDe(consulta)
  const { texto, pagina } = consulta

  // Búsqueda con retardo: se aplica 300 ms después de la última tecla (Enter la
  // aplica al momento). Un texto nuevo vuelve a la página 1.
  useEffect(() => {
    const id = window.setTimeout(() => aplicarBusqueda(setConsulta, busqueda), RETARDO_BUSQUEDA)
    return () => window.clearTimeout(id)
  }, [busqueda])

  useEffect(() => {
    let vigente = true
    listUsers(texto || undefined, pagina).then(
      (datos) => {
        if (!vigente) return
        // La página quedó vacía (p. ej., tras eliminar a su único usuario): ir a la última que exista.
        if (datos.items.length === 0 && pagina > 1 && datos.last_page < pagina) {
          setConsulta((actual) =>
            claveDe(actual) === clave ? { ...actual, pagina: Math.max(1, datos.last_page) } : actual,
          )
          return
        }
        setResultado({ clave, datos, error: null })
      },
      (error: unknown) => {
        if (!vigente) return
        setResultado((previo) => ({ clave, datos: previo?.datos ?? null, error: getErrorKind(error) }))
      },
    )
    return () => {
      vigente = false
    }
  }, [clave, texto, pagina])

  // Sin la fila que tenía el foco (se eliminó), el foco pasa al título de la tabla.
  useEffect(() => {
    if (enfocarTabla > 0) tituloRef.current?.focus()
  }, [enfocarTabla])

  const terminado = resultado !== null && resultado.clave === clave
  const cargando = !terminado
  const ultimoError = resultado?.error ?? null
  const datos = resultado?.datos ?? null
  const usuarios = terminado && resultado.error === null && resultado.datos ? resultado.datos.items : []
  const buscando = texto !== ''

  function alEnviarBusqueda(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    aplicarBusqueda(setConsulta, busqueda)
  }

  function borrarBusqueda() {
    setBusqueda('')
    aplicarBusqueda(setConsulta, '')
    busquedaRef.current?.focus()
  }

  function irAPagina(numero: number) {
    setConsulta((actual) => ({ ...actual, pagina: numero }))
  }

  function recargar() {
    setConsulta((actual) => ({ ...actual, version: actual.version + 1 }))
  }

  function alEliminar(usuario: AdminUser) {
    setPorEliminar(null)
    toast({ message: `Eliminaste la cuenta de ${nombreCompleto(usuario)}`, tone: 'success' })
    recargar()
    setEnfocarTabla((n) => n + 1)
  }

  const columnas: ReadonlyArray<DataTableColumn<AdminUser>> = [
    {
      key: 'nombre',
      header: 'Nombre',
      rowHeader: true,
      render: (usuario) => {
        const nombre = nombreCompleto(usuario)
        return (
          <span className="st-usuarios__persona">
            <Avatar name={nombre} shape="square" tone="sky" size="md" />
            <span className="st-usuarios__nombre">{nombre}</span>
          </span>
        )
      },
    },
    {
      key: 'email',
      header: 'Correo',
      render: (usuario) => <Correo valor={usuario.email} />,
    },
    {
      key: 'organizacion',
      header: 'Organización',
      render: (usuario) => usuario.organization?.name || <SinDato texto="Sin organización" />,
    },
    {
      key: 'puesto',
      header: 'Puesto',
      render: (usuario) => usuario.position || <SinDato texto="Sin puesto" />,
    },
    {
      key: 'rol',
      header: 'Rol',
      render: (usuario) => <Badge tone={tonoRol(usuario.role)}>{etiquetaRol(usuario.role)}</Badge>,
    },
    {
      key: 'registro',
      header: 'Registro',
      render: (usuario) => {
        const fecha = fechaCorta(usuario.created_at)
        return fecha ? (
          <time className="st-usuarios__fecha" dateTime={fecha.iso}>
            {fecha.texto}
          </time>
        ) : (
          <SinDato texto="Sin fecha" />
        )
      },
    },
    {
      key: 'acciones',
      header: 'Acciones',
      align: 'end',
      cardLabel: false,
      render: (usuario) => {
        const nombre = nombreCompleto(usuario)
        return (
          <span className="st-usuarios__acciones">
            {/* El espacio va fuera del texto oculto: así el nombre accesible es «Editar a …». */}
            <Button size="sm" variant="secondary" to={`/admin/usuarios/${usuario.id}`}>
              Editar <VisuallyHidden>a {nombre}</VisuallyHidden>
            </Button>
            <Button size="sm" variant="neutral" className="st-usuarios__eliminar" onClick={() => setPorEliminar(usuario)}>
              Eliminar <VisuallyHidden>a {nombre}</VisuallyHidden>
            </Button>
          </span>
        )
      },
    },
  ]

  // Pie: total y paginación. Mientras carga otra página conserva la anterior y
  // deja los botones inactivos (sin desmontarlos, para no perder el foco).
  let pie = null
  if (datos && datos.total > 0 && datos.items.length > 0) {
    const desde = (datos.current_page - 1) * POR_PAGINA + 1
    const hasta = desde + datos.items.length - 1
    const sustantivo = datos.total === 1 ? 'usuario' : 'usuarios'
    pie = (
      <>
        <p className="st-usuarios__rango" role="status">
          Mostrando {desde === hasta ? desde : `${desde}–${hasta}`} de {datos.total} {sustantivo}
        </p>
        {datos.last_page > 1 && (
          <nav className="st-usuarios__paginacion" aria-label="Páginas de usuarios">
            <span className="st-usuarios__pagina">
              Página {datos.current_page} de {datos.last_page}
            </span>
            <Button
              size="sm"
              variant="secondary"
              disabled={cargando || datos.current_page <= 1}
              onClick={() => irAPagina(datos.current_page - 1)}
            >
              Anterior
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={cargando || datos.current_page >= datos.last_page}
              onClick={() => irAPagina(datos.current_page + 1)}
            >
              Siguiente
            </Button>
          </nav>
        )}
      </>
    )
  }

  let vacio
  if (cargando) {
    vacio = <EstadoCarga variant="bloque" count={5} label="Cargando usuarios…" />
  } else if (buscando) {
    vacio = (
      <EstadoVacio
        size="sm"
        role="status"
        title="Ningún usuario coincide con tu búsqueda"
        description={`No encontramos a nadie con «${texto}» en el nombre, el apellido o el correo.`}
        actions={
          <Button size="sm" variant="secondary" onClick={borrarBusqueda}>
            Borrar búsqueda
          </Button>
        }
      />
    )
  } else {
    vacio = (
      <EstadoVacio
        size="sm"
        role="status"
        title="Aún no hay usuarios registrados"
        description="Cuando alguien cree su cuenta, aparecerá aquí."
      />
    )
  }

  // El caption nombra la tabla para lectores de pantalla, con la página si hay más de una.
  const paginaVisible =
    datos && !cargando && datos.last_page > 1 ? `, página ${datos.current_page} de ${datos.last_page}` : ''

  return (
    <div className="st-usuarios">
      <PageHeader
        eyebrow="Operación"
        title="Usuarios"
        lede="Busca a cualquier persona registrada, revisa sus datos y edita su perfil o su rol."
        actions={
          <form role="search" className="st-usuarios__busqueda" onSubmit={alEnviarBusqueda}>
            <Input
              ref={busquedaRef}
              type="search"
              label="Buscar usuarios"
              hint="Nombre, apellido o correo"
              icon={<IconoBuscar width={16} height={16} />}
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              autoComplete="off"
              spellCheck={false}
              enterKeyHint="search"
            />
          </form>
        }
      />

      {ultimoError ? (
        <EstadoError
          kind={ultimoError}
          titleAs="h2"
          title={ultimoError === 'servidor' ? 'No pudimos cargar los usuarios' : undefined}
          onRetry={recargar}
          retrying={cargando}
        />
      ) : (
        <DataTable
          caption={`${buscando ? `Usuarios que coinciden con «${texto}»` : 'Usuarios registrados'}${paginaVisible}`}
          title={
            <span ref={tituloRef} tabIndex={-1} className="st-usuarios__titulo-tabla">
              {buscando ? 'Resultados de la búsqueda' : 'Todos los usuarios'}
            </span>
          }
          subtitle={buscando ? `· «${texto}»` : undefined}
          columns={columnas}
          rows={usuarios}
          getRowKey={(usuario) => usuario.id}
          empty={vacio}
          footer={pie}
          aria-busy={cargando || undefined}
        />
      )}

      <ConfirmarEliminacion usuario={porEliminar} onCancelar={() => setPorEliminar(null)} onEliminado={alEliminar} />
    </div>
  )
}
