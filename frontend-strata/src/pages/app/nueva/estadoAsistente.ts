import {
  PASO_CANDIDATOS,
  PASO_CONFIRMAR,
  PASO_DATOS,
  PASO_PRUEBA,
  erroresServidorVacios,
  filaVacia,
  hayErroresCandidatos,
  validarCandidatos,
  validarDatos,
  validarFechaLimite,
  type CampoCandidato,
  type CampoDatos,
  type CandidatoBorrador,
  type DatosEvaluacion,
  type ErroresCandidato,
  type ErroresCandidatos,
  type ErroresDatos,
  type ErroresServidor,
  type IndicePaso,
} from './modelo'

// ── Estado del asistente: reducer puro y errores visibles ─────────────────
// Los errores del cliente se muestran «tarde»: al intentar avanzar, o al
// salir de un campo que ya tiene texto (el correo se valida en vivo desde
// ahí). Los del servidor (422) se muestran hasta que cambias el campo.

export interface EstadoAsistente {
  paso: IndicePaso
  /** Paso más lejano al que se llegó: StepPills deja volver a cualquiera hasta él. */
  pasoMaximo: IndicePaso
  datos: DatosEvaluacion
  filas: CandidatoBorrador[]
  /** Fecha límite AAAA-MM-DD, o «» sin fecha. */
  fechaLimite: string
  /** Hoy (AAAA-MM-DD) para validar la fecha límite; se renueva al entrar a Confirmar. */
  hoy: string
  /** Pasos en los que se intentó avanzar: muestran todos sus errores. */
  intentos: readonly [boolean, boolean, boolean, boolean]
  /** Campos que perdieron el foco con texto (clave de campo). */
  tocados: Readonly<Record<string, true>>
  /** Filas que llegaron de la lista pegada: muestran sus errores de inmediato. */
  revisadas: Readonly<Record<string, true>>
  /** Errores 422 por campo. */
  servidor: ErroresServidor
  /** Resultado de pegar la lista (región de estado). */
  avisoLista: string
}

export type AccionAsistente =
  | { tipo: 'ir'; paso: IndicePaso; hoy?: string }
  | { tipo: 'intentar'; paso: IndicePaso }
  | { tipo: 'cambiar-dato'; campo: CampoDatos; valor: string }
  | { tipo: 'cambiar-candidato'; id: string; campo: CampoCandidato; valor: string }
  | { tipo: 'tocar'; clave: string }
  | { tipo: 'agregar-candidato'; fila: CandidatoBorrador }
  | { tipo: 'quitar-candidato'; id: string }
  | { tipo: 'pegar-lista'; filas: CandidatoBorrador[]; aviso: string }
  | { tipo: 'cambiar-fecha'; valor: string }
  | { tipo: 'errores-servidor'; errores: ErroresServidor; paso: IndicePaso }
  | { tipo: 'limpiar-servidor' }
  | { tipo: 'reiniciar'; estado: EstadoAsistente }

export const CAMPOS_CANDIDATO: readonly CampoCandidato[] = ['name', 'email', 'phone']

/** Clave de «tocado» de un campo. */
export const claveDato = (campo: CampoDatos) => `datos.${campo}`
export const claveCandidato = (id: string, campo: CampoCandidato) => `${id}.${campo}`
export const CLAVE_FECHA = 'fechaLimite'

/** ids de los controles, para mover el foco al primer error. */
export const ID_CAMPO = {
  nombre: 'nueva-evaluacion-nombre',
  puesto: 'nueva-evaluacion-puesto',
  prueba: 'nueva-evaluacion-prueba',
  fecha: 'nueva-evaluacion-fecha',
} as const

export function idCampoCandidato(id: string, campo: CampoCandidato): string {
  return `nueva-candidato-${id}-${campo}`
}

const ID_CAMPO_DATOS: Record<CampoDatos, string> = { name: ID_CAMPO.nombre, position: ID_CAMPO.puesto }

export function estadoInicial(hoy: string, primeraFila: CandidatoBorrador): EstadoAsistente {
  return {
    paso: PASO_DATOS,
    pasoMaximo: PASO_DATOS,
    datos: { name: '', position: '' },
    filas: [primeraFila],
    fechaLimite: '',
    hoy,
    intentos: [false, false, false, false],
    tocados: {},
    revisadas: {},
    servidor: erroresServidorVacios(),
    avisoLista: '',
  }
}

function sinCampo<T extends object>(objeto: T, campo: keyof T): T {
  if (!(campo in objeto)) return objeto
  const copia = { ...objeto }
  delete copia[campo]
  return copia
}

/** Quita el error del servidor de un campo de candidato (se cambió el valor). */
function sinErrorDeCandidato(servidor: ErroresServidor, id: string, campo: CampoCandidato): ErroresServidor {
  const fila = servidor.candidatos.filas[id]
  if (!fila?.[campo]) return servidor
  const restante = sinCampo(fila, campo)
  const filas = { ...servidor.candidatos.filas }
  if (Object.keys(restante).length > 0) filas[id] = restante
  else delete filas[id]
  return { ...servidor, candidatos: { ...servidor.candidatos, filas } }
}

function sinErrorGeneralDeCandidatos(servidor: ErroresServidor): ErroresServidor {
  if (!servidor.candidatos.general) return servidor
  return { ...servidor, candidatos: { filas: servidor.candidatos.filas } }
}

export function reducerAsistente(estado: EstadoAsistente, accion: AccionAsistente): EstadoAsistente {
  switch (accion.tipo) {
    case 'ir':
      return {
        ...estado,
        paso: accion.paso,
        pasoMaximo: accion.paso > estado.pasoMaximo ? accion.paso : estado.pasoMaximo,
        hoy: accion.hoy ?? estado.hoy,
        // El resultado de pegar la lista es de ese momento: al cambiar de paso ya no se muestra.
        avisoLista: accion.paso === estado.paso ? estado.avisoLista : '',
      }
    case 'intentar': {
      const intentos = [...estado.intentos] as [boolean, boolean, boolean, boolean]
      intentos[accion.paso] = true
      return { ...estado, intentos }
    }
    case 'cambiar-dato':
      return {
        ...estado,
        datos: { ...estado.datos, [accion.campo]: accion.valor },
        servidor: { ...estado.servidor, datos: sinCampo(estado.servidor.datos, accion.campo) },
      }
    case 'cambiar-candidato':
      return {
        ...estado,
        filas: estado.filas.map((fila) => (fila.id === accion.id ? { ...fila, [accion.campo]: accion.valor } : fila)),
        servidor: sinErrorDeCandidato(estado.servidor, accion.id, accion.campo),
      }
    case 'tocar':
      return estado.tocados[accion.clave] ? estado : { ...estado, tocados: { ...estado.tocados, [accion.clave]: true } }
    case 'agregar-candidato':
      return {
        ...estado,
        filas: [...estado.filas, accion.fila],
        servidor: sinErrorGeneralDeCandidatos(estado.servidor),
        avisoLista: '',
      }
    case 'quitar-candidato': {
      // Siempre queda al menos una fila (la interfaz no ofrece quitar la última).
      if (estado.filas.length <= 1) return estado
      const filas = estado.filas.filter((fila) => fila.id !== accion.id)
      if (filas.length === estado.filas.length) return estado
      const servidor = estado.servidor.candidatos.filas[accion.id]
        ? {
            ...estado.servidor,
            candidatos: { ...estado.servidor.candidatos, filas: sinCampo(estado.servidor.candidatos.filas, accion.id) },
          }
        : estado.servidor
      return { ...estado, filas, servidor, avisoLista: '' }
    }
    case 'pegar-lista': {
      if (accion.filas.length === 0) return estado
      // Las filas vacías (la inicial, o una de «Agregar otro» sin datos) dejan su lugar a la lista.
      const filas = [...estado.filas.filter((fila) => !filaVacia(fila)), ...accion.filas]
      const revisadas = { ...estado.revisadas }
      for (const fila of accion.filas) revisadas[fila.id] = true
      return {
        ...estado,
        filas,
        revisadas,
        servidor: sinErrorGeneralDeCandidatos(estado.servidor),
        avisoLista: accion.aviso,
      }
    }
    case 'cambiar-fecha':
      return {
        ...estado,
        fechaLimite: accion.valor,
        tocados: estado.tocados[CLAVE_FECHA] ? estado.tocados : { ...estado.tocados, [CLAVE_FECHA]: true },
        servidor: sinCampo(estado.servidor, 'fechaLimite'),
      }
    case 'errores-servidor':
      return { ...estado, servidor: accion.errores, paso: accion.paso }
    case 'limpiar-servidor':
      return { ...estado, servidor: erroresServidorVacios() }
    case 'reiniciar':
      return accion.estado
  }
}

// ── Errores visibles ───────────────────────────────────────────────────────

function conTexto(valor: string): boolean {
  return valor.trim() !== ''
}

export function erroresDatosVisibles(estado: EstadoAsistente): ErroresDatos {
  const cliente = validarDatos(estado.datos)
  const visibles: ErroresDatos = {}
  for (const campo of ['name', 'position'] as const) {
    const ver = estado.intentos[PASO_DATOS] || (Boolean(estado.tocados[claveDato(campo)]) && conTexto(estado.datos[campo]))
    const mensaje = (ver ? cliente[campo] : undefined) ?? estado.servidor.datos[campo]
    if (mensaje) visibles[campo] = mensaje
  }
  return visibles
}

export function erroresCandidatosVisibles(estado: EstadoAsistente): ErroresCandidatos {
  const cliente = validarCandidatos(estado.filas)
  const intento = estado.intentos[PASO_CANDIDATOS]
  const visibles: ErroresCandidatos = { filas: {} }
  const general = (intento ? cliente.general : undefined) ?? estado.servidor.candidatos.general
  if (general) visibles.general = general
  for (const fila of estado.filas) {
    const propios = cliente.filas[fila.id] ?? {}
    const delServidor = estado.servidor.candidatos.filas[fila.id] ?? {}
    const revisada = Boolean(estado.revisadas[fila.id])
    const errores: ErroresCandidato = {}
    for (const campo of CAMPOS_CANDIDATO) {
      const ver =
        ((intento || revisada) && !filaVacia(fila)) ||
        (Boolean(estado.tocados[claveCandidato(fila.id, campo)]) && conTexto(fila[campo]))
      const mensaje = (ver ? propios[campo] : undefined) ?? delServidor[campo]
      if (mensaje) errores[campo] = mensaje
    }
    if (Object.keys(errores).length > 0) visibles.filas[fila.id] = errores
  }
  return visibles
}

export function errorFechaVisible(estado: EstadoAsistente): string | undefined {
  const cliente = validarFechaLimite(estado.fechaLimite, estado.hoy)
  const ver = estado.intentos[PASO_CONFIRMAR] || (Boolean(estado.tocados[CLAVE_FECHA]) && conTexto(estado.fechaLimite))
  return (ver ? cliente : undefined) ?? estado.servidor.fechaLimite
}

/** El paso cumple las reglas del cliente (los errores del servidor no bloquean). */
export function pasoValido(estado: EstadoAsistente, paso: IndicePaso): boolean {
  switch (paso) {
    case PASO_DATOS:
      return Object.keys(validarDatos(estado.datos)).length === 0
    case PASO_PRUEBA:
      return true
    case PASO_CANDIDATOS:
      return !hayErroresCandidatos(validarCandidatos(estado.filas))
    case PASO_CONFIRMAR:
      return !validarFechaLimite(estado.fechaLimite, estado.hoy)
  }
}

const ORDEN_PASOS: readonly IndicePaso[] = [PASO_DATOS, PASO_PRUEBA, PASO_CANDIDATOS, PASO_CONFIRMAR]

/** Primer paso, desde el inicio hasta antes de `hasta`, que no cumple sus reglas. */
export function primerPasoInvalido(estado: EstadoAsistente, hasta: number): IndicePaso | null {
  for (const paso of ORDEN_PASOS) {
    if (paso >= hasta) break
    if (!pasoValido(estado, paso)) return paso
  }
  return null
}

/**
 * id del primer control con error visible en un paso, para llevarle el foco.
 * Calcula los errores como si ya se hubiera intentado avanzar.
 */
export function primerCampoConError(estado: EstadoAsistente, paso: IndicePaso): string | null {
  const intentado = { ...estado, intentos: [true, true, true, true] as const }
  switch (paso) {
    case PASO_DATOS: {
      const errores = erroresDatosVisibles(intentado)
      const campo = (['name', 'position'] as const).find((c) => errores[c])
      return campo ? ID_CAMPO_DATOS[campo] : null
    }
    case PASO_PRUEBA:
      return estado.servidor.prueba ? ID_CAMPO.prueba : null
    case PASO_CANDIDATOS: {
      const errores = erroresCandidatosVisibles(intentado)
      for (const fila of estado.filas) {
        const campo = CAMPOS_CANDIDATO.find((c) => errores.filas[fila.id]?.[c])
        if (campo) return idCampoCandidato(fila.id, campo)
      }
      return errores.general && estado.filas[0] ? idCampoCandidato(estado.filas[0].id, 'name') : null
    }
    case PASO_CONFIRMAR:
      return errorFechaVisible(intentado) ? ID_CAMPO.fecha : null
  }
}
