import { useEffect, useId, useRef, useState, type FocusEvent, type KeyboardEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button, LiveDot } from '@/components/ui'
import { IconoChevron, IconoPalomita } from '@/components/ui/Iconos'
import { useAuth } from '@/context/AuthContext'
import './SelectorEscenario.css'

/** GET /__mock del modo demo (mock/plugin-mock.ts). */
interface EstadoDemo {
  activo: string
  escenarios: { nombre: string; descripcion: string }[]
}

/** Atajos a cada zona. Sin sesión, /app y /admin piden entrar primero (como siempre). */
const ATAJOS = [
  { to: '/', etiqueta: 'Inicio' },
  { to: '/app', etiqueta: 'Panel de RR. HH.' },
  { to: '/admin/creditos', etiqueta: 'Super admin' },
  { to: '/evaluar/demo', etiqueta: 'Candidato' },
] as const

const PORTAL_DEL_CANDIDATO = '/evaluar/demo'

const esDelCandidato = (nombre: string) => nombre === 'candidato' || nombre.startsWith('candidato-')

/**
 * Enlace que recarga con ?escenario=: el servidor guarda la cookie y redirige a
 * la misma ruta sin el parámetro. Las variantes del candidato abren el portal,
 * porque solo cambian /evaluar.
 */
function enlaceDeEscenario(nombre: string, { pathname, search, hash }: { pathname: string; search: string; hash: string }): string {
  const fueraDelPortal = esDelCandidato(nombre) && !pathname.startsWith('/evaluar/')
  const parametros = new URLSearchParams(fueraDelPortal ? '' : search)
  parametros.set('escenario', nombre)
  return `${fueraDelPortal ? PORTAL_DEL_CANDIDATO : pathname}?${parametros}${fueraDelPortal ? '' : hash}`
}

/**
 * Pastilla «Modo demo · <escenario>» del modo demo sin backend (npm run dev:mock).
 * main.tsx la carga con import() solo cuando import.meta.env.MODE es «mock»: el
 * build de producción no la incluye.
 *
 * Es un botón que despliega (patrón disclosure de WAI-ARIA) la lista de
 * escenarios, los atajos y cómo entrar con cada rol. Escape cierra y devuelve el
 * foco al botón; un clic fuera, salir del panel con el foco o cambiar de ruta
 * también lo cierran. El escenario activo se pide a GET /__mock al cargar, al
 * abrir y cada vez que cambia la sesión (login, registro o salida lo cambian).
 */
export default function SelectorEscenario() {
  const { user } = useAuth()
  const ubicacion = useLocation()
  const [estado, setEstado] = useState<EstadoDemo | null>(null)
  const [consulta, setConsulta] = useState(0)
  // Entrada del historial en la que se abrió: al navegar deja de coincidir y se cierra.
  const [abiertoEn, setAbiertoEn] = useState<string | null>(null)
  if (abiertoEn !== null && abiertoEn !== ubicacion.key) setAbiertoEn(null)
  const abierto = abiertoEn === ubicacion.key

  const raizRef = useRef<HTMLElement>(null)
  const botonRef = useRef<HTMLButtonElement>(null)
  const listaRef = useRef<HTMLUListElement>(null)
  const panelId = useId()
  const tituloEscenariosId = useId()
  const tituloAtajosId = useId()
  const usuarioId = user?.id ?? null

  useEffect(() => {
    const control = new AbortController()
    fetch('/__mock', { signal: control.signal, headers: { Accept: 'application/json' } })
      .then((respuesta) => (respuesta.ok ? (respuesta.json() as Promise<EstadoDemo>) : null))
      .then((datos) => {
        if (datos && Array.isArray(datos.escenarios)) setEstado(datos)
      })
      .catch(() => {
        // Sin el servidor del modo demo no hay nada que mostrar; se reintenta al abrir.
      })
    return () => control.abort()
  }, [usuarioId, consulta])

  // Al abrir, el escenario activo queda a la vista dentro de la lista.
  useEffect(() => {
    if (abierto) listaRef.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [abierto])

  // Un clic o un toque fuera lo cierra sin mover el foco.
  useEffect(() => {
    if (!abierto) return
    function alPresionar(evento: PointerEvent) {
      const raiz = raizRef.current
      if (raiz && !(evento.target instanceof Node && raiz.contains(evento.target))) setAbiertoEn(null)
    }
    document.addEventListener('pointerdown', alPresionar)
    return () => document.removeEventListener('pointerdown', alPresionar)
  }, [abierto])

  function alternar() {
    if (abierto) {
      setAbiertoEn(null)
      return
    }
    setAbiertoEn(ubicacion.key)
    setConsulta((actual) => actual + 1)
  }

  function alTeclear(evento: KeyboardEvent<HTMLElement>) {
    if (evento.key !== 'Escape' || !abierto) return
    evento.preventDefault()
    setAbiertoEn(null)
    botonRef.current?.focus()
  }

  // Si el foco sale del panel (Tab o un lector de pantalla), se cierra.
  function alPerderFoco(evento: FocusEvent<HTMLElement>) {
    const siguiente = evento.relatedTarget
    if (abierto && siguiente instanceof Node && !evento.currentTarget.contains(siguiente)) setAbiertoEn(null)
  }

  if (!estado) return null
  const { activo, escenarios } = estado

  return (
    <aside ref={raizRef} className="st-modo-demo no-print" aria-label="Modo demo" onKeyDown={alTeclear} onBlur={alPerderFoco}>
      <Button
        ref={botonRef}
        variant="ink"
        size="sm"
        className="st-modo-demo__boton"
        // Empieza con el texto visible (WCAG 2.5.3); un span oculto en medio sumaría un espacio en Chrome.
        aria-label={`Modo demo, escenario ${activo}`}
        aria-expanded={abierto}
        aria-controls={abierto ? panelId : undefined}
        iconLeft={<LiveDot tone="success" size={6} pulse="none" />}
        iconRight={<IconoChevron className="st-modo-demo__chevron" width={12} height={12} />}
        onClick={alternar}
      >
        Modo demo · <span className="st-modo-demo__activo">{activo}</span>
      </Button>

      {abierto && (
        <div id={panelId} className="st-modo-demo__panel">
          <section className="st-modo-demo__seccion st-modo-demo__seccion--escenarios" aria-labelledby={tituloEscenariosId}>
            <h2 id={tituloEscenariosId} className="st-modo-demo__titulo">
              Escenario
            </h2>
            <ul ref={listaRef} className="st-modo-demo__lista">
              {escenarios.map(({ nombre, descripcion }) => {
                const actual = nombre === activo
                return (
                  <li key={nombre}>
                    <a className="st-modo-demo__opcion" href={enlaceDeEscenario(nombre, ubicacion)} aria-current={actual || undefined}>
                      <span className="st-modo-demo__nombre">{nombre}</span>
                      {descripcion && descripcion !== nombre && <span className="st-modo-demo__descripcion">{descripcion}</span>}
                      {actual && <IconoPalomita className="st-modo-demo__marca" width={12} height={12} strokeLinecap="round" />}
                    </a>
                  </li>
                )
              })}
            </ul>
          </section>

          <section className="st-modo-demo__seccion" aria-labelledby={tituloAtajosId}>
            <h2 id={tituloAtajosId} className="st-modo-demo__titulo">
              Ir a
            </h2>
            <ul className="st-modo-demo__atajos">
              {ATAJOS.map(({ to, etiqueta }) => (
                <li key={to}>
                  <Link className="st-modo-demo__atajo" to={to}>
                    {etiqueta}
                    <span className="st-modo-demo__ruta">{to}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <p className="st-modo-demo__ayuda">
            En <Link to="/login">/login</Link>, cualquier correo entra como RR. HH.; uno que empiece con <code>admin</code>,
            como super admin, y uno con <code>sinempresa</code>, sin empresa. La contraseña <code>incorrecta</code> muestra
            el error.
          </p>
        </div>
      )}
    </aside>
  )
}
