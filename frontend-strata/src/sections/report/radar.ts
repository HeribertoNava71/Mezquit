// Geometría del radar del reporte (Strata.dc.html:894-913), generalizada a N
// ejes. El prototipo fija 6 dimensiones; el reporte real trae las escalas de
// cada prueba, así que los ejes, las etiquetas y el viewBox se calculan aquí.
// Coordenadas con el centro en (0, 0): el primer eje apunta hacia arriba y los
// demás siguen en el sentido del reloj, como en el prototipo.

export interface Punto {
  x: number
  y: number
}

/**
 * Radio del radar en unidades del viewBox: 110, como el prototipo (centro 140,140 y
 * vértice superior en 140,30). Con el SVG a su ancho máximo, 1 unidad = 1 px.
 */
export const RADIO_RADAR = 110

/** Anillos de la retícula: 25, 50, 75 y 100 % (Strata.dc.html:895-898). */
export const ANILLOS_RADAR = [0.25, 0.5, 0.75, 1] as const

/** Radio del halo que marca la escala elegida en la lista. */
export const RADIO_HALO = 7

// Medidas de las etiquetas: General Sans 600 a 11 px (--fs-eyebrow). El ancho
// por carácter es un estimado prudente; el viewBox deja margen y el SVG usa
// overflow visible, así que un texto un poco más ancho no se recorta.
const SEPARACION_ETIQUETA = 12
const ALTO_LINEA = 13
const BASE_EN_LINEA = 10
const ANCHO_CARACTER = 6.3
const MARGEN = 6
const CARACTERES_POR_LINEA = 14
// Arriba y abajo del todo cabe más texto: 26 caracteres miden unos 164 px,
// menos que el ancho del radar.
const CARACTERES_POR_LINEA_VERTICAL = 26
const LINEAS_MAXIMAS = 2

/** Ancla horizontal del texto SVG (text-anchor). */
export type AnclaTexto = 'start' | 'middle' | 'end'

export interface CajaRadar {
  x: number
  y: number
  ancho: number
  alto: number
}

export interface EtiquetaRadar {
  /** Líneas visibles (el nombre partido; si no cabe, la última termina en «…»). */
  lineas: string[]
  x: number
  /** Línea base de cada línea, en el mismo orden. */
  ys: number[]
  ancla: AnclaTexto
  /** Caja estimada del texto, para calcular el viewBox. */
  caja: CajaRadar
}

/** Redondea a centésimas y evita «-0» en los atributos. */
function redondear(valor: number): number {
  const redondeado = Math.round(valor * 100) / 100
  return redondeado === 0 ? 0 : redondeado
}

/** Ángulo del eje en radianes: el primero arriba (−90°) y los demás en el sentido del reloj. */
export function anguloDelEje(indice: number, total: number): number {
  return -Math.PI / 2 + (2 * Math.PI * indice) / total
}

/** Punto del eje a la distancia indicada del centro. */
export function puntoDelEje(indice: number, total: number, radio: number): Punto {
  const angulo = anguloDelEje(indice, total)
  return { x: redondear(radio * Math.cos(angulo)), y: redondear(radio * Math.sin(angulo)) }
}

/** Distancia al centro de un valor de 0 a 100 (se limita a ese rango; sin dato, 0). */
export function radioDelValor(valor: number | null | undefined, radio = RADIO_RADAR): number {
  if (valor == null || !Number.isFinite(valor)) return 0
  return (Math.min(100, Math.max(0, valor)) / 100) * radio
}

/** Atributo points de un polígono con un radio por eje. */
export function puntosDelPoligono(radios: readonly number[]): string {
  return radios
    .map((radio, indice) => {
      const punto = puntoDelEje(indice, radios.length, radio)
      return `${punto.x},${punto.y}`
    })
    .join(' ')
}

/**
 * Parte un nombre en líneas de hasta maxCaracteres sin cortar palabras (una
 * palabra más larga ocupa su propia línea). Si sobran líneas, la última visible
 * termina en «…»; el nombre completo está en la lista y en la tabla alternativa.
 */
export function partirEtiqueta(texto: string, maxCaracteres: number, maxLineas: number): string[] {
  const palabras = texto.trim().split(/\s+/).filter(Boolean)
  const lineas: string[] = []
  let actual = ''
  for (const palabra of palabras) {
    const candidata = actual ? `${actual} ${palabra}` : palabra
    if (!actual || candidata.length <= maxCaracteres) {
      actual = candidata
    } else {
      lineas.push(actual)
      actual = palabra
    }
  }
  if (actual) lineas.push(actual)
  if (lineas.length <= maxLineas) return lineas

  // La última línea visible deja lugar para «…»: primero quita palabras enteras
  // y solo corta una palabra si es la única que queda.
  const visibles = lineas.slice(0, maxLineas)
  let ultima = visibles[maxLineas - 1]
  while (ultima.length + 1 > maxCaracteres && ultima.includes(' ')) {
    ultima = ultima.slice(0, ultima.lastIndexOf(' '))
  }
  if (ultima.length + 1 > maxCaracteres) ultima = ultima.slice(0, maxCaracteres - 1).trimEnd()
  visibles[maxLineas - 1] = `${ultima}…`
  return visibles
}

/**
 * Posición de la etiqueta de un eje, como en el prototipo: centrada sobre o bajo
 * el vértice cuando el eje apunta claramente hacia arriba o hacia abajo, y
 * alineada hacia afuera cuando apunta hacia un lado.
 */
export function etiquetaDelEje(indice: number, total: number, texto: string, radio = RADIO_RADAR): EtiquetaRadar {
  const angulo = anguloDelEje(indice, total)
  const coseno = Math.cos(angulo)
  const seno = Math.sin(angulo)
  const enColumna = Math.abs(coseno) < 0.3
  const ancla: AnclaTexto = enColumna || Math.abs(seno) > 0.45 ? 'middle' : coseno > 0 ? 'start' : 'end'

  const lineas = partirEtiqueta(texto, enColumna ? CARACTERES_POR_LINEA_VERTICAL : CARACTERES_POR_LINEA, LINEAS_MAXIMAS)
  const distancia = radio + SEPARACION_ETIQUETA
  const x = redondear(distancia * coseno)
  const yAncla = distancia * seno
  const altoBloque = lineas.length * ALTO_LINEA

  // Borde superior del bloque: arriba del vértice crece hacia arriba, abajo
  // crece hacia abajo y a los lados queda centrado.
  const arriba = seno < -0.45 ? yAncla - altoBloque : seno > 0.45 ? yAncla : yAncla - altoBloque / 2
  const ys = lineas.map((_, i) => redondear(arriba + BASE_EN_LINEA + i * ALTO_LINEA))

  const ancho = Math.max(...lineas.map((linea) => linea.length)) * ANCHO_CARACTER
  const izquierda = ancla === 'start' ? x : ancla === 'end' ? x - ancho : x - ancho / 2

  return {
    lineas,
    x,
    ys,
    ancla,
    caja: { x: redondear(izquierda), y: redondear(arriba), ancho: redondear(ancho), alto: redondear(altoBloque) },
  }
}

/**
 * viewBox que contiene el polígono exterior (con lugar para el halo de la escala
 * elegida) y todas las etiquetas, con margen. Se ajusta al polígono y no al
 * círculo: un triángulo no deja un hueco debajo.
 */
export function cajaDelRadar(etiquetas: readonly EtiquetaRadar[], total: number, radio = RADIO_RADAR): CajaRadar {
  const holgura = RADIO_HALO + 1
  const vertices = Array.from({ length: total }, (_, indice) => puntoDelEje(indice, total, radio))
  let minX = Math.min(0, ...vertices.map((punto) => punto.x)) - holgura
  let maxX = Math.max(0, ...vertices.map((punto) => punto.x)) + holgura
  let minY = Math.min(0, ...vertices.map((punto) => punto.y)) - holgura
  let maxY = Math.max(0, ...vertices.map((punto) => punto.y)) + holgura
  for (const { caja } of etiquetas) {
    minX = Math.min(minX, caja.x)
    maxX = Math.max(maxX, caja.x + caja.ancho)
    minY = Math.min(minY, caja.y)
    maxY = Math.max(maxY, caja.y + caja.alto)
  }
  return {
    x: redondear(minX - MARGEN),
    y: redondear(minY - MARGEN),
    ancho: redondear(maxX - minX + MARGEN * 2),
    alto: redondear(maxY - minY + MARGEN * 2),
  }
}
