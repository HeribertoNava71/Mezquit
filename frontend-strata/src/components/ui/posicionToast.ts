// Dónde va el toast cuando hay un Modal o un Drawer abierto (Fase 8). Por
// defecto va abajo y al centro (Strata.dc.html:1420-1425), pero a 360 px el
// drawer ocupa toda la pantalla y el toast tapaba durante 2.6 s su botón
// «Cerrar». Se prueban varias posiciones y gana la que tapa menos controles del
// overlay; a igualdad, la que no toca el panel y, después, la primera de la lista.
// Solo geometría: el ToastProvider mide la página y aplica el resultado.

/** Caja en px de la ventana (como DOMRect). */
export interface Caja {
  left: number
  top: number
  right: number
  bottom: number
}

/**
 * Posición de la región de toasts: pegada abajo o arriba a `distancia` px del
 * borde, entre `izquierda` y `derecha` px de los lados de la ventana.
 */
export interface PosicionToast {
  lado: 'abajo' | 'arriba'
  distancia: number
  izquierda: number
  derecha: number
}

export interface DatosPosicion {
  ventana: { ancho: number; alto: number }
  /** Tamaño actual de la pila de toasts, ya pintada en la posición por defecto. */
  toast: { ancho: number; alto: number }
  /** Distancia por defecto al borde (26 px, como el prototipo). */
  margen: number
  /** Relleno lateral de la región (el de la página). */
  relleno: number
  /** Panel del overlay abierto. */
  panel: Caja
  /** Pie del panel, donde van sus acciones, si tiene. */
  pie?: Caja | null
  /** Controles visibles del panel. */
  controles: readonly Caja[]
}

/** Hueco entre el toast y el pie del panel cuando va encima de él. */
const SEPARACION = 12
/** Ancho mínimo de un hueco lateral para poner ahí el toast. */
const LATERAL_MINIMO = 280

export const POSICION_POR_DEFECTO: PosicionToast = { lado: 'abajo', distancia: 0, izquierda: 0, derecha: 0 }

function seCruzan(a: Caja, b: Caja): boolean {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
}

/** Caja que ocuparía la pila de toasts en una posición. */
export function cajaDelToast(posicion: PosicionToast, datos: Pick<DatosPosicion, 'ventana' | 'toast' | 'relleno'>): Caja {
  const { ventana, toast, relleno } = datos
  const disponible = Math.max(1, ventana.ancho - posicion.izquierda - posicion.derecha - 2 * relleno)
  const ancho = Math.min(toast.ancho, disponible)
  // Más angosto que ahora: el texto baja de línea y la pila crece.
  const alto = toast.alto * Math.max(1, Math.ceil(toast.ancho / disponible))
  const centro = posicion.izquierda + (ventana.ancho - posicion.izquierda - posicion.derecha) / 2
  const top = posicion.lado === 'abajo' ? ventana.alto - posicion.distancia - alto : posicion.distancia
  return { left: centro - ancho / 2, right: centro + ancho / 2, top, bottom: top + alto }
}

/** Posiciones candidatas, en orden de preferencia. */
export function candidatas({ ventana, margen, panel, pie }: Pick<DatosPosicion, 'ventana' | 'margen' | 'panel' | 'pie'>): PosicionToast[] {
  const lista: PosicionToast[] = [
    { lado: 'abajo', distancia: margen, izquierda: 0, derecha: 0 },
    { lado: 'arriba', distancia: margen, izquierda: 0, derecha: 0 },
  ]
  // Drawer en tableta o escritorio: el hueco del fondo a su izquierda.
  if (panel.left >= LATERAL_MINIMO) lista.push({ lado: 'abajo', distancia: margen, izquierda: 0, derecha: ventana.ancho - panel.left })
  // Sobre el pie del panel, dentro de su ancho: no tapa sus acciones.
  const borde = pie ? pie.top : panel.bottom
  lista.push({
    lado: 'abajo',
    distancia: Math.max(margen, ventana.alto - borde + SEPARACION),
    izquierda: Math.max(0, panel.left),
    derecha: Math.max(0, ventana.ancho - panel.right),
  })
  return lista
}

/**
 * La posición que tapa menos controles del overlay; a igualdad, la que no toca
 * el panel y, después, la de mayor preferencia.
 */
export function elegirPosicion(datos: DatosPosicion): PosicionToast {
  const evaluadas = candidatas(datos).map((posicion, orden) => {
    const caja = cajaDelToast(posicion, datos)
    const tapados = datos.controles.filter((control) => seCruzan(caja, control)).length
    return { posicion, puntaje: [tapados, seCruzan(caja, datos.panel) ? 1 : 0, orden] }
  })
  evaluadas.sort((a, b) => compararPuntajes(a.puntaje, b.puntaje))
  return evaluadas[0]?.posicion ?? POSICION_POR_DEFECTO
}

/** Orden lexicográfico: decide el primer criterio que difiere. */
function compararPuntajes(a: readonly number[], b: readonly number[]): number {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] - b[i]
  }
  return 0
}
