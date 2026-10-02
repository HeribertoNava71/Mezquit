import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { isAxiosError } from 'axios'
import api, { csrf } from '@/api/axios'
import { Button, Callout, Card, Input, Select, type SelectOption } from '@/components/ui'
import { SITE } from '@/config/site'
import { IconoCalendario, IconoCorreo, IconoEdificio, IconoFlechaDerecha, IconoPersona } from '@/pages/publicas/iconos'
import { Pendiente } from '@/pages/publicas/Pendiente'
import { esEnlaceReal } from '@/pages/publicas/marcadores'
import './ContactSection.css'

/** Campos de POST /api/leads (StoreLeadRequest; 2026-09-10-sales-site.md:600-610). Los seis son obligatorios. */
type Campo = 'name' | 'company' | 'email' | 'sector' | 'company_size' | 'evaluations_per_month'
type Formulario = Record<Campo, string>
type ErroresDeCampo = Partial<Record<Campo, string>>

/** Los seis campos, en el orden del formulario. */
const CAMPOS: readonly Campo[] = ['name', 'company', 'email', 'sector', 'company_size', 'evaluations_per_month']

const VACIO: Formulario = {
  name: '',
  company: '',
  email: '',
  sector: '',
  company_size: '',
  evaluations_per_month: '',
}

// Opciones originales: el value es el que acepta el backend (regla in:) y el texto, el de siempre.
const SECTORES: readonly SelectOption[] = [
  { value: 'comercio', label: 'Comercio' },
  { value: 'manufactura', label: 'Manufactura o maquila' },
  { value: 'servicios', label: 'Servicios' },
  { value: 'otro', label: 'Otro' },
]

const TAMANOS: readonly SelectOption[] = [
  { value: '1-10', label: '1 – 10 personas' },
  { value: '11-50', label: '11 – 50 personas' },
  { value: '51-250', label: '51 – 250 personas' },
  { value: '250+', label: 'Más de 250' },
]

const VOLUMENES: readonly SelectOption[] = [
  { value: '<10', label: 'Menos de 10' },
  { value: '10-50', label: '10 – 50' },
  { value: '50-200', label: '50 – 200' },
  { value: '200+', label: 'Más de 200' },
]

/**
 * Falla del envío que no es de un campo. Antes solo se manejaba el 422 y el
 * resto (red, 419, 429 y 500) no mostraba nada (R-13).
 * - red: sin respuesta del servidor.
 * - csrf: 419 aun después del reintento con csrf() que hace el cliente api.
 * - limite: 429.
 * - servidor: 500 o cualquier 5xx.
 * - datos: 422 sin errores de los seis campos.
 * - otro: cualquier otra respuesta.
 */
type FallaDeEnvio = 'red' | 'csrf' | 'limite' | 'servidor' | 'datos' | 'otro'

const AVISOS: Record<FallaDeEnvio, { title: string; text: string }> = {
  red: { title: 'No pudimos enviar tu solicitud', text: 'Revisa tu conexión a internet e inténtalo de nuevo.' },
  csrf: {
    title: 'La sesión del formulario expiró',
    text: 'Vuelve a enviarlo. Si el error sigue, recarga la página.',
  },
  limite: { title: 'Demasiados intentos seguidos', text: 'Espera un momento y vuelve a enviarlo.' },
  servidor: {
    title: 'Ocurrió un error de nuestro lado',
    text: 'Tu solicitud no se envió. Inténtalo de nuevo en unos minutos.',
  },
  datos: { title: 'No pudimos validar tu solicitud', text: 'Revisa los datos e inténtalo de nuevo.' },
  otro: { title: 'No pudimos enviar tu solicitud', text: 'Inténtalo de nuevo en unos minutos.' },
}

/** Primer mensaje de cada campo en un 422 de Laravel ({ errors: { campo: [mensaje] } }). */
function erroresDeCampo(datos: unknown): ErroresDeCampo {
  const errores = datos && typeof datos === 'object' ? (datos as { errors?: unknown }).errors : undefined
  if (!errores || typeof errores !== 'object') return {}
  const resultado: ErroresDeCampo = {}
  for (const campo of CAMPOS) {
    const mensajes: unknown = (errores as Record<string, unknown>)[campo]
    const lista = Array.isArray(mensajes) ? mensajes : [mensajes]
    const mensaje = lista.find((m): m is string => typeof m === 'string' && m.trim() !== '')
    if (mensaje) resultado[campo] = mensaje
  }
  return resultado
}

function clasificar(error: unknown): { campos: ErroresDeCampo } | { falla: FallaDeEnvio } {
  if (!isAxiosError(error)) return { falla: 'otro' }
  if (!error.response) return { falla: 'red' }
  const { status, data } = error.response
  if (status === 422) {
    const campos = erroresDeCampo(data)
    return Object.keys(campos).length > 0 ? { campos } : { falla: 'datos' }
  }
  if (status === 419) return { falla: 'csrf' }
  if (status === 429) return { falla: 'limite' }
  if (status >= 500) return { falla: 'servidor' }
  return { falla: 'otro' }
}

/**
 * Bloque de agenda (R-38). «Reservar tiempo» solo aparece con un enlace real
 * en SITE.calendarUrl; mientras tanto, el marcador pendiente queda a la vista
 * (R-35) y no hay ningún botón que lleve a una agenda inexistente.
 */
function Agenda() {
  const tituloId = useId()
  const enlace = esEnlaceReal(SITE.calendarUrl) ? SITE.calendarUrl : null
  return (
    <Card as="aside" variant="glass" padding="lg" className="st-contacto__agenda" aria-labelledby={tituloId}>
      <span className="st-contacto__agenda-icono">
        <IconoCalendario />
      </span>
      <h2 id={tituloId} className="st-contacto__agenda-titulo">
        Agenda una demo de 30 minutos
      </h2>
      <p className="st-contacto__agenda-texto">
        Muéstrame el sistema en acción y resuelve tus dudas antes de decidir.
      </p>
      <div className="st-contacto__agenda-accion">
        {enlace ? (
          <Button variant="secondary" href={enlace} iconRight={<IconoFlechaDerecha />}>
            Reservar tiempo
          </Button>
        ) : (
          <Pendiente>{SITE.calendarUrl}</Pendiente>
        )}
      </div>
    </Card>
  )
}

/**
 * Formulario de leads de /demo (mapa.md, sección 2; R-13) y bloque de agenda.
 * - Tarjeta blanca con los seis campos de siempre: 3 Input y 3 Select con sus
 *   etiquetas y opciones originales. El servidor valida (StoreLeadRequest).
 * - Enviando: el botón dice «Enviando…» y no se puede enviar dos veces.
 * - Éxito: aviso con ícono que recibe el foco.
 * - 422: error por campo con ícono (D-22) y foco en el primer campo con error;
 *   al editar un campo se borra su error.
 * - Red, 419, 429 y 500: aviso de error con ícono y «Reintentar».
 * - csrf() antes del POST: /demo no hace ningún GET propio que deje la cookie.
 */
export default function ContactSection() {
  const tituloId = useId()
  const [form, setForm] = useState<Formulario>(VACIO)
  const [errores, setErrores] = useState<ErroresDeCampo>({})
  const [falla, setFalla] = useState<FallaDeEnvio | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  // Evita un segundo POST si se envía otra vez antes de que cambie el estado.
  const enCurso = useRef(false)
  const enfocarError = useRef(false)
  const formulario = useRef<HTMLFormElement>(null)
  const exito = useRef<HTMLDivElement>(null)

  // Tras un 422, el foco va al primer campo con error en el orden del formulario,
  // ya con su mensaje enlazado (aria-describedby).
  useEffect(() => {
    if (!enfocarError.current) return
    enfocarError.current = false
    formulario.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }, [errores])

  // El formulario desaparece al enviarse: el foco pasa al aviso de éxito.
  useEffect(() => {
    if (enviado) exito.current?.focus()
  }, [enviado])

  function cambiar(campo: Campo, valor: string) {
    setForm((anterior) => ({ ...anterior, [campo]: valor }))
    if (errores[campo]) setErrores((anteriores) => ({ ...anteriores, [campo]: undefined }))
  }

  async function enviar() {
    if (enCurso.current) return
    enCurso.current = true
    setEnviando(true)
    setErrores({})
    try {
      await csrf()
      await api.post('/api/leads', form)
      setFalla(null)
      setEnviado(true)
    } catch (error) {
      const resultado = clasificar(error)
      if ('campos' in resultado) {
        setFalla(null)
        enfocarError.current = true
        setErrores(resultado.campos)
      } else {
        setFalla(resultado.falla)
      }
    } finally {
      enCurso.current = false
      setEnviando(false)
    }
  }

  function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    void enviar()
  }

  return (
    // Sin nombre propio: el formulario y la agenda ya son landmarks con su título.
    <section className="st-contacto" id="contacto">
      <Card variant="white" borderTone="warm" padding="lg" className="st-contacto__tarjeta">
        <h2 id={tituloId} className="st-contacto__titulo">
          ¿Listo para medir?
        </h2>

        {enviado ? (
          <Callout
            ref={exito}
            tabIndex={-1}
            tone="success"
            live="status"
            title="¡Gracias!"
            className="st-contacto__exito"
          >
            Tu solicitud fue recibida. Te contactamos en un día hábil.
          </Callout>
        ) : (
          <form
            ref={formulario}
            className="st-contacto__form"
            onSubmit={alEnviar}
            noValidate
            aria-labelledby={tituloId}
          >
            <p className="st-contacto__nota">Todos los campos son obligatorios.</p>

            <div className="st-contacto__campos">
              <Input
                label="Nombre"
                name="name"
                type="text"
                placeholder="Tu nombre"
                autoComplete="name"
                size="lg"
                icon={<IconoPersona />}
                value={form.name}
                onChange={(evento) => cambiar('name', evento.target.value)}
                error={errores.name}
                required
              />
              <Input
                label="Empresa"
                name="company"
                type="text"
                placeholder="Nombre de la empresa"
                autoComplete="organization"
                size="lg"
                icon={<IconoEdificio />}
                value={form.company}
                onChange={(evento) => cambiar('company', evento.target.value)}
                error={errores.company}
                required
              />
              <Input
                label="Correo electrónico"
                name="email"
                type="email"
                placeholder="tu@empresa.com"
                autoComplete="email"
                inputMode="email"
                size="lg"
                icon={<IconoCorreo />}
                value={form.email}
                onChange={(evento) => cambiar('email', evento.target.value)}
                error={errores.email}
                required
              />
              <Select
                label="Sector"
                name="sector"
                size="lg"
                placeholder="Selecciona…"
                options={SECTORES}
                value={form.sector}
                onChange={(evento) => cambiar('sector', evento.target.value)}
                error={errores.sector}
                required
              />
              <Select
                label="Tamaño de empresa"
                name="company_size"
                size="lg"
                placeholder="Selecciona…"
                options={TAMANOS}
                value={form.company_size}
                onChange={(evento) => cambiar('company_size', evento.target.value)}
                error={errores.company_size}
                required
              />
              <Select
                label="Evaluaciones al mes"
                name="evaluations_per_month"
                size="lg"
                placeholder="Selecciona…"
                options={VOLUMENES}
                value={form.evaluations_per_month}
                onChange={(evento) => cambiar('evaluations_per_month', evento.target.value)}
                error={errores.evaluations_per_month}
                required
              />
            </div>

            {falla && (
              <Callout
                tone="error"
                live="alert"
                title={AVISOS[falla].title}
                className="st-contacto__falla"
                actions={
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={enviando}
                    loadingText="Reintentando…"
                    onClick={() => void enviar()}
                  >
                    Reintentar
                  </Button>
                }
              >
                {AVISOS[falla].text}
              </Callout>
            )}

            <div className="st-contacto__acciones">
              <Button type="submit" loading={enviando} loadingText="Enviando…" iconRight={<IconoFlechaDerecha />}>
                Solicitar información
              </Button>
              <p className="st-contacto__respuesta">Te respondemos en un día hábil.</p>
            </div>
          </form>
        )}
      </Card>

      <Agenda />
    </section>
  )
}
