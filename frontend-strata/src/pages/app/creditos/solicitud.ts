import { isAxiosError } from 'axios'
import { estadoErrorTextos, type EstadoErrorKind } from '@/components/ui'

// Reglas y errores de POST /api/credit-requests (mapa.md, RH-4; D-09).
// Contrato: { requested_amount, note } → 201. El backend valida
// requested_amount required|integer|min:1 y note nullable|string|max:500
// (2026-09-12-fase2-panel-rh.md:906-911), pero la columna note es VARCHAR 255:
// el frontend limita la nota a 255 caracteres (PB-26).

/** Parámetro de /app/creditos que abre el drawer «Solicitar créditos» al llegar (?solicitar=1). */
export const PARAMETRO_SOLICITAR = 'solicitar'

/**
 * Destino de «Solicitar créditos» desde otras pantallas (el catálogo del panel y
 * el saldo insuficiente del asistente): la página de créditos con el drawer abierto.
 */
export const RUTA_SOLICITAR_CREDITOS = `/app/creditos?${PARAMETRO_SOLICITAR}=1`

/** Largo máximo de la nota (PB-26). */
export const NOTA_MAX = 255

/** Faltando estos caracteres o menos, el contador cambia de color y se anuncia. */
export const NOTA_AVISO_RESTANTES = 20

/**
 * Confirmación tras el 201: el mismo texto que responde el backend
 * (2026-09-12-fase2-panel-rh.md:920). La solicitud queda pendiente y el saldo
 * no cambia hasta que un super admin la aprueba (S-10).
 */
export const MENSAJE_EXITO = 'Solicitud registrada. Un asesor la revisará.'

/** Toast de confirmación (D-22: el toast solo confirma acciones). */
export const MENSAJE_TOAST = 'Solicitud de créditos enviada'

/** Errores por campo del formulario. */
export interface ErroresSolicitud {
  cantidad?: string
  nota?: string
}

/** Cantidad mínima que acepta el backend. */
export const CANTIDAD_MIN = 1

export const MENSAJE_CANTIDAD = 'Escribe un número entero de 1 o más.'

/** Las mismas reglas del backend, antes de enviar. null si todo está bien. */
export function validarSolicitud(cantidad: number, nota: string): ErroresSolicitud | null {
  const errores: ErroresSolicitud = {}
  if (!Number.isInteger(cantidad) || cantidad < CANTIDAD_MIN) errores.cantidad = MENSAJE_CANTIDAD
  if (nota.length > NOTA_MAX) errores.nota = `Usa ${NOTA_MAX} caracteres o menos.`
  return errores.cantidad || errores.nota ? errores : null
}

// ── 422 ─────────────────────────────────────────────────────────────────────

// El backend no publica traducciones: Laravel responde sus mensajes de
// validación en inglés («The requested amount field must be at least 1.»).
// Se traducen los de las reglas de este formulario; cualquier otro mensaje
// (por ejemplo, uno que ya venga en español) se muestra tal cual.
const TRADUCCIONES: ReadonlyArray<readonly [RegExp, (coincidencia: RegExpExecArray) => string]> = [
  [/\bis required\.?$/i, () => 'Este dato es obligatorio.'],
  [/\bmust be an integer\.?$/i, () => 'Escribe un número entero.'],
  [/\bmust be at least (\d+)\.?$/i, (c) => `Escribe un número de ${c[1]} o más.`],
  [/\bmust be a string\.?$/i, () => 'Escribe un texto.'],
  [/\bmust not be greater than (\d+) characters\.?$/i, (c) => `Usa ${c[1]} caracteres o menos.`],
]

/** Traduce un mensaje de validación de Laravel; si no lo reconoce, lo devuelve igual (sin «(and N more errors)»). */
export function traducirMensaje(mensaje: string): string {
  const limpio = mensaje.replace(/\s*\(and \d+ more errors?\)\s*$/i, '').trim()
  for (const [regla, texto] of TRADUCCIONES) {
    const coincidencia = regla.exec(limpio)
    if (coincidencia) return texto(coincidencia)
  }
  return limpio
}

/** Errores de un 422: por campo y, si no se pueden mostrar junto a un campo, un mensaje general. */
export interface ValidacionServidor {
  campos: ErroresSolicitud
  mensaje: string | null
}

const MENSAJE_GENERAL = 'Revisa los datos e inténtalo de nuevo.'

function primerMensaje(valor: unknown): string | undefined {
  const texto = Array.isArray(valor) ? valor.find((item) => typeof item === 'string') : valor
  return typeof texto === 'string' && texto.trim() ? traducirMensaje(texto) : undefined
}

/**
 * Lee un 422 de Laravel ({ message, errors: { campo: [mensajes] } }).
 * requested_amount va a la cantidad y note a la nota; si el 422 no trae
 * errores de esos campos, el message va como mensaje general. null si el
 * error no es un 422.
 */
export function leerValidacion(error: unknown): ValidacionServidor | null {
  if (!isAxiosError(error) || error.response?.status !== 422) return null
  const datos: unknown = error.response.data
  const cuerpo = typeof datos === 'object' && datos !== null ? (datos as Record<string, unknown>) : {}
  const errores =
    typeof cuerpo.errors === 'object' && cuerpo.errors !== null ? (cuerpo.errors as Record<string, unknown>) : {}

  const campos: ErroresSolicitud = {}
  const cantidad = primerMensaje(errores.requested_amount)
  const nota = primerMensaje(errores.note)
  if (cantidad) campos.cantidad = cantidad
  if (nota) campos.nota = nota

  const otros = Object.keys(errores)
    .filter((clave) => clave !== 'requested_amount' && clave !== 'note')
    .map((clave) => primerMensaje(errores[clave]))
    .find((texto) => texto !== undefined)

  let mensaje: string | null = null
  if (otros) mensaje = otros
  else if (!cantidad && !nota) mensaje = primerMensaje(cuerpo.message) ?? MENSAJE_GENERAL
  return { campos, mensaje }
}

// ── Fallas sin 422 ──────────────────────────────────────────────────────────

/** Texto del aviso cuando POST /api/credit-requests falla sin un 422 (D-22: inline, con ícono y texto). */
export function textoFallaSolicitud(tipo: EstadoErrorKind): string {
  switch (tipo) {
    case 'red':
      return estadoErrorTextos.red.message
    case 'sesion':
      return 'Tu sesión expiró. Vuelve a entrar para continuar.'
    case 'permiso':
      return 'Tu cuenta no tiene permiso para solicitar créditos.'
    default:
      return estadoErrorTextos.servidor.message
  }
}
