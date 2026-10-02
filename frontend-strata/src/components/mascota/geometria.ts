// Geometría de la mascota, sin DOM ni GSAP: ruta por el borde de la ventana,
// curvas de enlace, destino de la carrera, choque con el titular y lugar de la
// burbuja. Todo en px de la ventana (viewport), con y hacia abajo.

/** Punto en coordenadas de la ventana. */
export interface Punto {
  x: number
  y: number
}

/** Caja alineada a los ejes (la forma de un DOMRect que se usa aquí). */
export interface Caja {
  left: number
  top: number
  right: number
  bottom: number
}

/** Ancho y alto en px. */
export interface Medidas {
  ancho: number
  alto: number
}

/**
 * El PNG mira hacia arriba. Con rotation = rumbo + 90, la cabeza apunta hacia
 * donde avanza (GIRO y autoRotate: 90, Strata.dc.html:1586, :1665).
 */
export const GIRO = 90

const RAD = Math.PI / 180

/** Brazo de las curvas de enlace: fracción de la distancia entre sus extremos. */
const BRAZO = 0.42
/** Un vértice más cerca que esto no sirve de destino: no hay espacio para girar. */
const DISTANCIA_MINIMA = 24

export function acotar(valor: number, minimo: number, maximo: number): number {
  return Math.min(Math.max(valor, minimo), maximo)
}

function unitario(dx: number, dy: number): Punto {
  const largo = Math.hypot(dx, dy)
  return largo ? { x: dx / largo, y: dy / largo } : { x: 0, y: 0 }
}

/**
 * Circuito de nado (Strata.dc.html:1650-1658): 10 puntos en sentido horario
 * por el borde de la ventana (baja por la derecha, cruza abajo, sube por la
 * izquierda y cruza arriba). El último repite el primero: el circuito es
 * cerrado y MotionPathPlugin lo curva sin quiebre en la unión.
 */
export function rutaMascota({ ancho, alto }: Medidas): Punto[] {
  const bx = Math.min(74, ancho * 0.07)
  const by = 86
  return [
    { x: ancho - bx, y: alto * 0.28 },
    { x: ancho - bx * 0.7, y: alto * 0.62 },
    { x: ancho * 0.8, y: alto - by },
    { x: ancho * 0.48, y: alto - by * 0.7 },
    { x: ancho * 0.16, y: alto - by },
    { x: bx * 0.7, y: alto * 0.62 },
    { x: bx, y: alto * 0.26 },
    { x: ancho * 0.22, y: by },
    { x: ancho * 0.58, y: by * 0.8 },
    { x: ancho - bx, y: alto * 0.28 },
  ]
}

/** Vértice k del circuito, con índice circular sobre los vértices distintos (sin el punto de cierre). */
function vertice(ruta: readonly Punto[], k: number): Punto {
  const n = ruta.length - 1
  return ruta[((k % n) + n) % n]
}

/**
 * Dirección (vector unitario) con la que el nado pasa por el vértice k. Es la
 * bisectriz de los tramos de llegada y de salida, la misma tangente que da
 * pointsToSegment de GSAP a un circuito cerrado. Una curva de enlace que llega
 * con esta dirección empalma con el nado sin giro brusco.
 */
export function tangenteEnVertice(ruta: readonly Punto[], k: number): Punto {
  const previo = vertice(ruta, k - 1)
  const actual = vertice(ruta, k)
  const siguiente = vertice(ruta, k + 1)
  const llegada = unitario(actual.x - previo.x, actual.y - previo.y)
  const salida = unitario(siguiente.x - actual.x, siguiente.y - actual.y)
  const tangente = unitario(llegada.x + salida.x, llegada.y + salida.y)
  return tangente.x || tangente.y ? tangente : salida
}

/**
 * El mismo circuito, pero empezando y terminando en el vértice k. Con
 * fromCurrent: false cada vuelta empieza donde acabó la anterior: sin el salto
 * de cada 42 s que tenía el prototipo después de una carrera o de un resize
 * (auditoria.md, «Reanudación del nado»).
 */
export function circuitoDesde(ruta: readonly Punto[], k: number): Punto[] {
  const n = ruta.length - 1
  return Array.from({ length: n + 1 }, (_, i) => ({ ...vertice(ruta, k + i) }))
}

/**
 * Curva cúbica [ancla, control, control, ancla] que sale de `desde` con el
 * rumbo actual (radianes) y llega a `hasta` con la dirección `tangente`. Con
 * autoRotate, el giro sigue la curva: no hay marcha atrás ni giro de golpe.
 */
export function curvaDeEnlace(desde: Punto, rumbo: number, hasta: Punto, tangente: Punto): Punto[] {
  const brazo = Math.hypot(hasta.x - desde.x, hasta.y - desde.y) * BRAZO
  return [
    { x: desde.x, y: desde.y },
    { x: desde.x + Math.cos(rumbo) * brazo, y: desde.y + Math.sin(rumbo) * brazo },
    { x: hasta.x - tangente.x * brazo, y: hasta.y - tangente.y * brazo },
    { x: hasta.x, y: hasta.y },
  ]
}

/**
 * Largo de un segmento cúbico plano, con el formato de GSAP
 * [x0, y0, c1x, c1y, c2x, c2y, x1, y1, c1x, …], medido por muestreo.
 */
export function largoDeSegmento(segmento: readonly number[], muestras = 20): number {
  let largo = 0
  for (let i = 0; i + 7 < segmento.length; i += 6) {
    const [x0, y0, x1, y1, x2, y2, x3, y3] = segmento.slice(i, i + 8)
    let px = x0
    let py = y0
    for (let paso = 1; paso <= muestras; paso++) {
      const t = paso / muestras
      const u = 1 - t
      const x = u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3
      const y = u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3
      largo += Math.hypot(x - px, y - py)
      px = x
      py = y
    }
  }
  return largo
}

/** Largo de una curva [ancla, control, control, ancla, …]. */
export function largoDeCurva(curva: readonly Punto[]): number {
  return largoDeSegmento(curva.flatMap((p) => [p.x, p.y]))
}

/** Ángulo entre dos vectores unitarios, en radianes (0 a π). */
function anguloEntre(a: Punto, b: Punto): number {
  return Math.acos(acotar(a.x * b.x + a.y * b.y, -1, 1))
}

/**
 * Vértice donde retomar el nado: el que queda por delante del rumbo y pide el
 * camino más corto con menos giro (el giro para encararlo más el giro para
 * tomar la dirección del nado). Los vértices de atrás o casi encima solo
 * ganan si no hay otro.
 */
export function verticeAdelante(ruta: readonly Punto[], desde: Punto, rumbo: number): number {
  const n = ruta.length - 1
  const frente = { x: Math.cos(rumbo), y: Math.sin(rumbo) }
  let mejor = 0
  let menor = Infinity
  for (let k = 0; k < n; k++) {
    const dx = ruta[k].x - desde.x
    const dy = ruta[k].y - desde.y
    const distancia = Math.hypot(dx, dy)
    const hacia = unitario(dx, dy)
    const giro = anguloEntre(frente, hacia) + anguloEntre(hacia, tangenteEnVertice(ruta, k))
    const util = distancia >= DISTANCIA_MINIMA && hacia.x * frente.x + hacia.y * frente.y > 0
    const costo = distancia * (1 + giro / Math.PI) + (util ? 0 : 1e6)
    if (costo < menor) {
      menor = costo
      mejor = k
    }
  }
  return mejor
}

/**
 * Destino de la carrera (Strata.dc.html:1736-1737): el centro del objetivo
 * corrido 66 px a la derecha y 10 px abajo, a 70 px o más de los bordes.
 */
export function destinoCarrera(objetivo: Caja, ventana: Medidas): Punto {
  const margen = 70
  return {
    x: acotar((objetivo.left + objetivo.right) / 2 + 66, margen, ventana.ancho - margen),
    y: acotar((objetivo.top + objetivo.bottom) / 2 + 10, margen, ventana.alto - margen),
  }
}

/** Ángulo equivalente a `destino` (grados) que queda más cerca de `actual`: gira por el lado corto. */
export function giroMasCorto(actual: number, destino: number): number {
  const delta = ((((destino - actual) % 360) + 540) % 360) - 180
  return actual + delta
}

/**
 * vigilarTitular (Strata.dc.html:1700-1702): el centro de la mascota cae sobre
 * el titular ampliado 70 px a los lados y 50 px arriba y abajo.
 */
export function chocaConTitular(centro: Punto, titular: Caja | null): boolean {
  return (
    titular !== null &&
    centro.x > titular.left - 70 &&
    centro.x < titular.right + 70 &&
    centro.y > titular.top - 50 &&
    centro.y < titular.bottom + 50
  )
}

/** Caja que ocupa en pantalla la mascota girada y escalada alrededor de su centro. */
export function cajaDeMascota(centro: Punto, tamano: Medidas, rotacion: number, escala: number): Caja {
  const coseno = Math.abs(Math.cos(rotacion * RAD))
  const seno = Math.abs(Math.sin(rotacion * RAD))
  const mitadX = ((tamano.ancho * coseno + tamano.alto * seno) / 2) * escala
  const mitadY = ((tamano.ancho * seno + tamano.alto * coseno) / 2) * escala
  return { left: centro.x - mitadX, top: centro.y - mitadY, right: centro.x + mitadX, bottom: centro.y + mitadY }
}

export type LadoBurbuja = 'derecha' | 'izquierda'

/**
 * colocarBurbuja (Strata.dc.html:1682-1689): a la derecha de la mascota si
 * está en la mitad izquierda de la ventana, y a la izquierda si no; su borde
 * superior, 52 px sobre el de la mascota. A diferencia del prototipo, se
 * acota a 12 px de los cuatro bordes (a 360 px se salía por la derecha).
 */
export function posicionBurbuja(
  mascota: Caja,
  burbuja: Medidas,
  ventana: Medidas,
): Punto & { lado: LadoBurbuja } {
  const margen = 12
  const lado: LadoBurbuja = (mascota.left + mascota.right) / 2 < ventana.ancho / 2 ? 'derecha' : 'izquierda'
  const x = lado === 'derecha' ? mascota.right - 6 : mascota.left - burbuja.ancho + 6
  const y = mascota.top - 52
  return {
    x: Math.round(Math.max(margen, Math.min(x, ventana.ancho - burbuja.ancho - margen))),
    y: Math.round(Math.max(margen, Math.min(y, ventana.alto - burbuja.alto - margen))),
    lado,
  }
}

/**
 * Ease de Hermite: sale con pendiente v0 y llega con v1 (velocidad relativa a
 * la media del tramo; 1 es la media). Sirve para entrar y retomar el nado a la
 * misma velocidad que el circuito. Es monótona si v0² + v1² ≤ 9.
 */
export function easeHermite(v0: number, v1: number): (progreso: number) => number {
  const a = v0 + v1 - 2
  const b = 3 - 2 * v0 - v1
  return (p) => ((a * p + b) * p + v0) * p
}
