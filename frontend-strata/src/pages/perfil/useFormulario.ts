import { useRef, useState, type ChangeEvent } from 'react'
import type { Errores } from './validacion'

// Estado de los formularios de /perfil y /admin/perfil: valores, validación en
// vivo y errores 422 del servidor por campo.
//
// Cuándo se ve el error de un campo:
// - El del servidor, hasta que la persona edita ese campo.
// - El del cliente, cuando la persona sale de un campo que editó, cuando ya
//   intentó enviar (desde ahí se actualiza mientras escribe) o, si el
//   formulario lo pide con `inmediato`, mientras escribe (la confirmación de
//   la contraseña y la fecha).

/** Valores de un formulario: un texto por campo (vacío = sin dato). */
export type ValoresFormulario<V> = Record<keyof V, string>

type Campo<V> = keyof V & string

export interface OpcionesFormulario<V extends ValoresFormulario<V>> {
  /** Valores iniciales, en el orden de los campos en pantalla (define a cuál ir primero). */
  inicial: V
  /** Errores del cliente con los valores actuales, se muestren o no. */
  reglas: (valores: V) => Errores<V>
  /** Campos cuyo error se muestra mientras se escribe. */
  inmediato?: (campo: Campo<V>, valores: V) => boolean
}

/** Props para un Input del sistema: `<Input label="…" {...form.campo('name')} />`. */
export interface PropsDeCampo {
  name: string
  value: string
  onChange: (evento: ChangeEvent<HTMLInputElement>) => void
  onBlur: () => void
  error: string | undefined
  ref: (elemento: HTMLInputElement | null) => void
}

export interface Formulario<V extends ValoresFormulario<V>> {
  valores: V
  /** Props de valor, cambio, salida, error y ref de un campo. */
  campo: (nombre: Campo<V>) => PropsDeCampo
  /** Error visible de un campo. */
  error: (nombre: Campo<V>) => string | undefined
  /**
   * Intento de envío: desde ahora se ven todos los errores del cliente.
   * Devuelve true si no hay ninguno; si hay, lleva el foco al primero.
   */
  validar: () => boolean
  /**
   * Muestra los errores 422 del servidor en sus campos y lleva el foco al
   * primero. Devuelve los que no son de ningún campo del formulario.
   */
  erroresDelServidor: (errores: Record<string, string>) => Record<string, string>
  /** Vuelve a empezar con estos valores (o los iniciales), sin errores ni campos editados. */
  reiniciar: (valores?: V) => void
  /** La persona cambió algún campo desde el inicio o desde reiniciar(). */
  editado: boolean
}

function agregar<T>(conjunto: ReadonlySet<T>, valor: T): ReadonlySet<T> {
  return conjunto.has(valor) ? conjunto : new Set(conjunto).add(valor)
}

export function useFormulario<V extends ValoresFormulario<V>>({
  inicial,
  reglas,
  inmediato,
}: OpcionesFormulario<V>): Formulario<V> {
  const [valores, setValores] = useState<V>(inicial)
  const [editados, setEditados] = useState<ReadonlySet<string>>(() => new Set())
  const [revisados, setRevisados] = useState<ReadonlySet<string>>(() => new Set())
  const [enviado, setEnviado] = useState(false)
  const [delServidor, setDelServidor] = useState<Errores<V>>({})
  const elementos = useRef(new Map<string, HTMLInputElement>())

  const orden = Object.keys(inicial) as Array<Campo<V>>
  const errores = reglas(valores)

  function error(nombre: Campo<V>): string | undefined {
    const delServidorEnCampo = delServidor[nombre]
    if (delServidorEnCampo) return delServidorEnCampo
    if (enviado || revisados.has(nombre) || inmediato?.(nombre, valores)) return errores[nombre]
    return undefined
  }

  function cambiar(nombre: Campo<V>, valor: string) {
    setValores((actuales) => ({ ...actuales, [nombre]: valor }))
    setEditados((actuales) => agregar(actuales, nombre))
    setDelServidor((actuales) => {
      if (!(nombre in actuales)) return actuales
      const resto = { ...actuales }
      delete resto[nombre]
      return resto
    })
  }

  function salir(nombre: Campo<V>) {
    if (editados.has(nombre)) setRevisados((actuales) => agregar(actuales, nombre))
  }

  function enfocarPrimero(nombres: readonly string[]) {
    const primero = orden.find((nombre) => nombres.includes(nombre))
    if (primero) elementos.current.get(primero)?.focus()
  }

  function campo(nombre: Campo<V>): PropsDeCampo {
    return {
      name: nombre,
      value: valores[nombre],
      onChange: (evento) => cambiar(nombre, evento.target.value),
      onBlur: () => salir(nombre),
      error: error(nombre),
      ref: (elemento) => {
        if (elemento) elementos.current.set(nombre, elemento)
        else elementos.current.delete(nombre)
      },
    }
  }

  function validar(): boolean {
    setEnviado(true)
    const conError = orden.filter((nombre) => errores[nombre])
    if (conError.length === 0) return true
    enfocarPrimero(conError)
    return false
  }

  function erroresDelServidor(recibidos: Record<string, string>): Record<string, string> {
    const propios: Errores<V> = {}
    const ajenos: Record<string, string> = {}
    for (const [nombre, mensaje] of Object.entries(recibidos)) {
      if ((orden as string[]).includes(nombre)) propios[nombre as Campo<V>] = mensaje
      else ajenos[nombre] = mensaje
    }
    setDelServidor(propios)
    enfocarPrimero(Object.keys(propios))
    return ajenos
  }

  function reiniciar(nuevos: V = inicial) {
    setValores(nuevos)
    setEditados(new Set())
    setRevisados(new Set())
    setEnviado(false)
    setDelServidor({})
  }

  return { valores, campo, error, validar, erroresDelServidor, reiniciar, editado: editados.size > 0 }
}
