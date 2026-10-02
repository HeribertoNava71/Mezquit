import { useEffect, useReducer, useRef, useState, type ReactNode } from 'react'
import { createAssessment, type InvitationLink } from '@/api/assessments'
import { avisarCambioDeCreditos } from '@/components/layout/topbar/datosBarra'
import { Button, Callout, EstadoVacio, PageHeader, StepPills, textoCreditos, useToast } from '@/components/ui'
import { SITE } from '@/config/site'
import { TOAST_ENLACE_COPIADO } from './evaluaciones/mensajes'
import { AvisoEnvio, AvisoErroresServidor } from './nueva/AvisoEnvio'
import { EnlacesInvitacion } from './nueva/EnlacesInvitacion'
import {
  claveCandidato,
  claveDato,
  errorFechaVisible,
  erroresCandidatosVisibles,
  erroresDatosVisibles,
  estadoInicial,
  idCampoCandidato,
  pasoValido,
  primerCampoConError,
  primerPasoInvalido,
  reducerAsistente,
  type EstadoAsistente,
} from './nueva/estadoAsistente'
import {
  PASOS,
  PASO_CANDIDATOS,
  PASO_CONFIRMAR,
  PASO_DATOS,
  PASO_PRUEBA,
  candidatosConDatos,
  clasificarErrorEnvio,
  construirPayload,
  contarCandidatos,
  diaSiguiente,
  fechaLocalISO,
  formatoFecha,
  parsearLista,
  pasosConErroresServidor,
  validarCandidato,
  type CampoCandidato,
  type CampoDatos,
  type CandidatoBorrador,
  type ErrorEnvio,
  type IndicePaso,
  type LineaCandidato,
} from './nueva/modelo'
import { PanelPaso } from './nueva/PanelPaso'
import { PasoCandidatos } from './nueva/PasoCandidatos'
import { PasoConfirmar } from './nueva/PasoConfirmar'
import { PasoDatos } from './nueva/PasoDatos'
import { PasoPrueba } from './nueva/PasoPrueba'
import { useSaldo, type EstadoSaldo } from './nueva/useSaldo'
import './NuevaEvaluacion.css'

/** id del título del panel: recibe el foco al cambiar de paso. */
const TITULO_PANEL_ID = 'nueva-evaluacion-titulo'
/** id del aviso de error del envío (recibe el foco si no hay un campo al cual llevarlo). */
const AVISO_ID = 'nueva-evaluacion-aviso'

const TEXTO_CREDITO = 'Cada candidato usa 1 crédito.'

interface PanelDePaso {
  titulo: string
  descripcion: string
}

const PANELES: Record<IndicePaso, PanelDePaso> = {
  [PASO_DATOS]: { titulo: 'Datos de la evaluación', descripcion: 'Así la reconocerás en Candidatos.' },
  [PASO_PRUEBA]: { titulo: 'Prueba', descripcion: 'La prueba que responderán tus candidatos.' },
  [PASO_CANDIDATOS]: { titulo: 'Candidatos', descripcion: 'Cada uno recibe por correo su propio enlace.' },
  [PASO_CONFIRMAR]: { titulo: 'Confirma y envía', descripcion: 'Revisa los datos antes de enviar las invitaciones.' },
}

/** Evaluación creada (respuesta de POST /api/assessments más lo que se envió). */
interface Resultado {
  id: number
  nombre: string
  invitaciones: InvitationLink[]
  /** Créditos usados: 1 por candidato enviado. */
  creditos: number
  fechaLimite: string | null
}

/** Error del envío que no es por campo. vez cambia en cada fallo: el aviso se vuelve a anunciar. */
interface FalloDeEnvio {
  error: Exclude<ErrorEnvio, { tipo: 'campos' }>
  vez: number
}

type Envio =
  | { estado: 'inactivo' }
  /** previo: el aviso sigue a la vista (con «Reintentando…») mientras se reintenta desde él. */
  | { estado: 'enviando'; previo?: FalloDeEnvio }
  | { estado: 'error'; fallo: FalloDeEnvio }
  | { estado: 'listo'; resultado: Resultado }

// ids locales de las filas de candidato (solo para React y para los errores).
let ultimaFila = 0

function nuevaFila(datos?: LineaCandidato): CandidatoBorrador {
  ultimaFila += 1
  return { id: `c${ultimaFila}`, name: datos?.name ?? '', email: datos?.email ?? '', phone: datos?.phone ?? '' }
}

function hoy(): string {
  return fechaLocalISO(new Date())
}

function crearEstado(): EstadoAsistente {
  return estadoInicial(hoy(), nuevaFila())
}

function textoSaldo(saldo: EstadoSaldo): string {
  switch (saldo.estado) {
    case 'listo':
      return `Tu saldo actual es de ${textoCreditos(saldo.valor)}.`
    case 'error':
      return 'No pudimos actualizar tu saldo.'
    case 'cargando':
      return 'Actualizando tu saldo…'
    case 'inactivo':
      return ''
  }
}

/**
 * Asistente de nueva evaluación (/app/evaluaciones/nueva; RH-9, D-10 opción A).
 * Cuatro pasos con StepPills y el lenguaje del modal de asignación: Datos,
 * Prueba (fija hasta PB-04), Candidatos (filas, «Agregar otro» y «Pegar lista»)
 * y Confirmar (fecha límite, resumen y créditos frente al saldo). Envía el
 * payload de siempre a POST /api/assessments (más phone, si se capturó) y
 * muestra los enlaces de invitación con Correo, WhatsApp y Copiar.
 */
export default function NuevaEvaluacion() {
  const [estado, dispatch] = useReducer(reducerAsistente, undefined, crearEstado)
  const [envio, setEnvio] = useState<Envio>({ estado: 'inactivo' })
  const { saldo, cargar: cargarSaldo } = useSaldo()
  const { toast } = useToast()
  const [foco, setFoco] = useState<{ id: string; vez: number } | null>(null)
  const enviando = useRef(false)
  const fallos = useRef(0)

  // El foco se mueve después de pintar el paso nuevo (el control ya existe).
  useEffect(() => {
    if (foco) document.getElementById(foco.id)?.focus()
  }, [foco])

  function enfocar(id: string) {
    setFoco((anterior) => ({ id, vez: (anterior?.vez ?? 0) + 1 }))
  }

  const { paso } = estado
  const ocupado = envio.estado === 'enviando'

  /** Lleva al primer paso que no cumple sus reglas, con sus errores visibles. */
  function mostrarPasoInvalido(actual: EstadoAsistente, invalido: IndicePaso) {
    dispatch({ tipo: 'intentar', paso: invalido })
    // Con el mismo «hoy» con el que se validó, para que el error de la fecha se vea.
    dispatch({ tipo: 'ir', paso: invalido, hoy: actual.hoy })
    enfocar(primerCampoConError(actual, invalido) ?? TITULO_PANEL_ID)
  }

  function irAPaso(destino: IndicePaso) {
    if (ocupado || destino === paso) return
    if (destino > paso) {
      const invalido = primerPasoInvalido(estado, destino)
      if (invalido !== null) {
        mostrarPasoInvalido(estado, invalido)
        return
      }
    }
    // El aviso de un envío fallido es de ese intento: al salir de Confirmar se descarta.
    if (envio.estado === 'error') setEnvio({ estado: 'inactivo' })
    const aConfirmar = destino === PASO_CONFIRMAR
    dispatch({ tipo: 'ir', paso: destino, hoy: aConfirmar ? hoy() : undefined })
    // El saldo se pide al llegar a Confirmar: así está al día al decidir.
    if (aConfirmar) cargarSaldo()
    enfocar(TITULO_PANEL_ID)
  }

  async function crear() {
    if (enviando.current) return
    const actual = { ...estado, hoy: hoy() }
    const invalido = primerPasoInvalido(actual, PASOS.length)
    if (invalido !== null) {
      mostrarPasoInvalido(actual, invalido)
      return
    }
    const { payload, filasEnviadas } = construirPayload(estado.datos, estado.filas, estado.fechaLimite)
    enviando.current = true
    setEnvio((anterior) => ({ estado: 'enviando', previo: anterior.estado === 'error' ? anterior.fallo : undefined }))
    dispatch({ tipo: 'limpiar-servidor' })
    try {
      const creada = await createAssessment(payload)
      setEnvio({
        estado: 'listo',
        resultado: {
          id: creada.id,
          nombre: creada.name?.trim() || payload.name,
          invitaciones: Array.isArray(creada.invitations) ? creada.invitations : [],
          creditos: payload.candidates.length,
          fechaLimite: payload.deadline,
        },
      })
      // S-11: el backend ya descontó los créditos; la barra y esta pantalla vuelven a pedir el saldo.
      avisarCambioDeCreditos()
      cargarSaldo()
      toast({ message: 'Evaluación creada', tone: 'success' })
      enfocar(TITULO_PANEL_ID)
    } catch (error) {
      const clasificado = clasificarErrorEnvio(error, filasEnviadas)
      if (clasificado.tipo === 'campos') {
        const destino = pasosConErroresServidor(clasificado.errores)[0] ?? PASO_CONFIRMAR
        dispatch({ tipo: 'errores-servidor', errores: clasificado.errores, paso: destino })
        setEnvio({ estado: 'inactivo' })
        enfocar(primerCampoConError({ ...actual, servidor: clasificado.errores }, destino) ?? AVISO_ID)
      } else {
        fallos.current += 1
        setEnvio({ estado: 'error', fallo: { error: clasificado, vez: fallos.current } })
        // Con saldo insuficiente, el bloque de créditos se pone al día.
        if (clasificado.tipo === 'saldo') cargarSaldo()
        enfocar(AVISO_ID)
      }
    } finally {
      enviando.current = false
    }
  }

  function crearOtra() {
    dispatch({ tipo: 'reiniciar', estado: crearEstado() })
    setEnvio({ estado: 'inactivo' })
    enfocar(TITULO_PANEL_ID)
  }

  function cambiarDato(campo: CampoDatos, valor: string) {
    dispatch({ tipo: 'cambiar-dato', campo, valor })
  }

  function salirDeDato(campo: CampoDatos) {
    dispatch({ tipo: 'tocar', clave: claveDato(campo) })
  }

  function cambiarCandidato(id: string, campo: CampoCandidato, valor: string) {
    dispatch({ tipo: 'cambiar-candidato', id, campo, valor })
  }

  function salirDeCandidato(id: string, campo: CampoCandidato) {
    dispatch({ tipo: 'tocar', clave: claveCandidato(id, campo) })
  }

  function agregarCandidato() {
    const fila = nuevaFila()
    dispatch({ tipo: 'agregar-candidato', fila })
    enfocar(idCampoCandidato(fila.id, 'name'))
  }

  function quitarCandidato(id: string) {
    const indice = estado.filas.findIndex((fila) => fila.id === id)
    const vecina = estado.filas[indice + 1] ?? estado.filas[indice - 1]
    dispatch({ tipo: 'quitar-candidato', id })
    if (vecina) enfocar(idCampoCandidato(vecina.id, 'name'))
  }

  function pegarLista(texto: string): boolean {
    const lineas = parsearLista(texto)
    if (lineas.length === 0) return false
    const filas = lineas.map((linea) => nuevaFila(linea))
    const conErrores = filas.filter((fila) => Object.keys(validarCandidato(fila)).length > 0)
    const revisar =
      conErrores.length === 0
        ? ''
        : ` Revisa los datos marcados en ${conErrores.length === 1 ? '1 de ellos' : `${conErrores.length} de ellos`}.`
    dispatch({ tipo: 'pegar-lista', filas, aviso: `Agregamos ${contarCandidatos(filas.length)} de la lista.${revisar}` })
    // El foco va a la primera fila con algo que corregir o, si todo está bien, a la primera agregada.
    const primera = conErrores[0] ?? filas[0]
    const campo = (['name', 'email', 'phone'] as const).find((c) => validarCandidato(primera)[c]) ?? 'name'
    enfocar(idCampoCandidato(primera.id, campo))
    return true
  }

  // ── Pantalla «Enlaces de invitación» ─────────────────────────────────────
  if (envio.estado === 'listo') {
    const { resultado } = envio
    const fecha = resultado.fechaLimite ? `Fecha límite: ${formatoFecha(resultado.fechaLimite)}` : 'Sin fecha límite'
    const total = resultado.invitaciones.length || resultado.creditos
    return (
      <div className="st-nueva">
        <PageHeader eyebrow="Evaluación creada" title={resultado.nombre} lede={`${contarCandidatos(total)} · ${fecha}`} />
        <PanelPaso
          key="enlaces"
          tituloId={TITULO_PANEL_ID}
          titulo="Enlaces de invitación"
          descripcion="Compártelos por el canal que prefieras."
          acciones={
            <>
              <Button variant="secondary" onClick={crearOtra}>
                Crear otra
              </Button>
              <Button to={`/app/evaluaciones/${resultado.id}`}>Ver evaluación</Button>
            </>
          }
        >
          <Callout
            tone="success"
            title="La invitación ya se envió por correo a cada candidato."
            actions={
              saldo.estado === 'error' && (
                <Button variant="ghost" size="sm" onClick={cargarSaldo}>
                  Reintentar
                </Button>
              )
            }
          >
            Se usaron {textoCreditos(resultado.creditos)}. {textoSaldo(saldo)}
          </Callout>
          {resultado.invitaciones.length > 0 ? (
            <EnlacesInvitacion
              invitaciones={resultado.invitaciones}
              fechaLimite={resultado.fechaLimite}
              onCopiado={() => toast({ message: TOAST_ENLACE_COPIADO, tone: 'success' })}
            />
          ) : (
            <EstadoVacio
              size="sm"
              title="No hay enlaces para mostrar"
              description="La evaluación se creó, pero la respuesta no trajo las invitaciones. Las encuentras en el detalle de la evaluación."
            />
          )}
        </PanelPaso>
      </div>
    )
  }

  // ── Asistente ─────────────────────────────────────────────────────────────
  const panel = PANELES[paso]
  const enviados = candidatosConDatos(estado.filas)
  const pasosServidor = pasosConErroresServidor(estado.servidor)
  const completados = PASOS.map((_, indice) => indice).filter(
    (indice) => indice < estado.pasoMaximo && indice !== paso && pasoValido(estado, indice as IndicePaso),
  )

  let aviso: ReactNode = null
  if (pasosServidor.length > 0) {
    aviso = <AvisoErroresServidor id={AVISO_ID} errores={estado.servidor} pasos={pasosServidor} pasoActual={paso} />
  } else if (paso === PASO_CONFIRMAR) {
    const fallo = envio.estado === 'error' ? envio.fallo : envio.estado === 'enviando' ? envio.previo : undefined
    if (fallo) {
      aviso = (
        <AvisoEnvio
          key={fallo.vez}
          id={AVISO_ID}
          error={fallo.error}
          onReintentar={crear}
          reintentando={envio.estado === 'enviando'}
        />
      )
    }
  }

  // Nota del pie (como «Vence en…» del modal): en Candidatos, la cuenta de créditos;
  // en Confirmar, la fecha límite real o «Sin fecha límite» (P-10).
  let nota: string | undefined
  if (paso === PASO_CANDIDATOS) {
    nota = enviados.length > 0 ? `${contarCandidatos(enviados.length)} · ${textoCreditos(enviados.length)}` : TEXTO_CREDITO
  } else if (paso === PASO_CONFIRMAR) {
    nota = estado.fechaLimite ? `Fecha límite: ${formatoFecha(estado.fechaLimite)}` : 'Sin fecha límite'
  }

  const anterior =
    paso === PASO_DATOS ? (
      <Button variant="neutral" to="/app/evaluaciones">
        Cancelar
      </Button>
    ) : (
      <Button variant="neutral" disabled={ocupado} onClick={() => irAPaso((paso - 1) as IndicePaso)}>
        Atrás
      </Button>
    )

  const siguiente =
    paso === PASO_CONFIRMAR ? (
      <Button type="submit" loading={ocupado} loadingText="Enviando…">
        Crear y enviar
      </Button>
    ) : (
      <Button type="submit">Siguiente</Button>
    )

  return (
    <div className="st-nueva">
      <PageHeader
        eyebrow={`Paso ${paso + 1} de ${PASOS.length} · ${PASOS[paso]}`}
        title="Nueva evaluación"
        lede={`Invita a tus candidatos a responder una prueba. ${SITE.name} les envía su enlace por correo y cada uno usa 1 crédito.`}
      />
      <StepPills
        className="st-nueva__pasos"
        aria-label="Pasos para crear la evaluación"
        steps={PASOS}
        current={paso}
        completed={completados}
        onStepSelect={(indice) => irAPaso(indice as IndicePaso)}
        canSelectStep={(indice) => !ocupado && indice <= estado.pasoMaximo}
      />
      <PanelPaso
        key={paso}
        tituloId={TITULO_PANEL_ID}
        titulo={panel.titulo}
        descripcion={panel.descripcion}
        aviso={aviso}
        nota={nota}
        ocupado={ocupado}
        onSubmit={paso === PASO_CONFIRMAR ? crear : () => irAPaso((paso + 1) as IndicePaso)}
        acciones={
          <>
            {anterior}
            {siguiente}
          </>
        }
      >
        {paso === PASO_DATOS && (
          <PasoDatos datos={estado.datos} errores={erroresDatosVisibles(estado)} onCambiar={cambiarDato} onSalir={salirDeDato} />
        )}
        {paso === PASO_PRUEBA && <PasoPrueba error={estado.servidor.prueba} />}
        {paso === PASO_CANDIDATOS && (
          <PasoCandidatos
            filas={estado.filas}
            errores={erroresCandidatosVisibles(estado)}
            avisoLista={estado.avisoLista}
            onCambiar={cambiarCandidato}
            onSalir={salirDeCandidato}
            onAgregar={agregarCandidato}
            onQuitar={quitarCandidato}
            onPegar={pegarLista}
          />
        )}
        {paso === PASO_CONFIRMAR && (
          <PasoConfirmar
            datos={estado.datos}
            candidatos={enviados}
            fechaLimite={estado.fechaLimite}
            fechaMinima={diaSiguiente(estado.hoy)}
            errorFecha={errorFechaVisible(estado)}
            saldo={saldo}
            onCambiarFecha={(valor) => dispatch({ tipo: 'cambiar-fecha', valor })}
            onEditar={irAPaso}
            onCargarSaldo={cargarSaldo}
          />
        )}
      </PanelPaso>
    </div>
  )
}
