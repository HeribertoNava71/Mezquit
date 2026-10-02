import { describe, expect, it } from 'vitest'
import {
  cajaDeMascota,
  chocaConTitular,
  circuitoDesde,
  curvaDeEnlace,
  destinoCarrera,
  easeHermite,
  giroMasCorto,
  largoDeCurva,
  posicionBurbuja,
  rutaMascota,
  tangenteEnVertice,
  verticeAdelante,
} from './geometria'

const ESCRITORIO = { ancho: 1440, alto: 900 }
const MOVIL = { ancho: 360, alto: 700 }

describe('rutaMascota', () => {
  it('da 10 puntos por el borde de la ventana y cierra el circuito', () => {
    const ruta = rutaMascota(ESCRITORIO)
    expect(ruta).toHaveLength(10)
    expect(ruta[9]).toEqual(ruta[0])
    expect(ruta[0]).toEqual({ x: 1440 - 74, y: 900 * 0.28 })
    for (const punto of ruta) {
      expect(punto.x).toBeGreaterThan(0)
      expect(punto.x).toBeLessThan(ESCRITORIO.ancho)
      expect(punto.y).toBeGreaterThan(0)
      expect(punto.y).toBeLessThan(ESCRITORIO.alto)
    }
  })

  it('a 360 px el margen lateral baja al 7 % del ancho (Strata.dc.html:1652)', () => {
    const [primero] = rutaMascota(MOVIL)
    expect(primero.x).toBeCloseTo(360 - 360 * 0.07)
  })
})

describe('circuitoDesde', () => {
  it('empieza y termina en el vértice pedido, en el mismo orden', () => {
    const ruta = rutaMascota(ESCRITORIO)
    const circuito = circuitoDesde(ruta, 3)
    expect(circuito).toHaveLength(10)
    expect(circuito[0]).toEqual(ruta[3])
    expect(circuito[9]).toEqual(ruta[3])
    expect(circuito[1]).toEqual(ruta[4])
    expect(circuito[6]).toEqual(ruta[0])
  })
})

describe('tangenteEnVertice', () => {
  it('es unitaria y sigue el sentido horario del nado', () => {
    const ruta = rutaMascota(ESCRITORIO)
    // Vértice 1, borde derecho: baja. Vértice 3, abajo: va a la izquierda.
    const derecha = tangenteEnVertice(ruta, 1)
    const abajo = tangenteEnVertice(ruta, 3)
    expect(Math.hypot(derecha.x, derecha.y)).toBeCloseTo(1)
    expect(derecha.y).toBeGreaterThan(0.8)
    expect(abajo.x).toBeLessThan(-0.9)
  })
})

describe('curvaDeEnlace', () => {
  it('sale con el rumbo actual y llega con la dirección del nado', () => {
    const [inicio, control1, control2, fin] = curvaDeEnlace({ x: 0, y: 0 }, 0, { x: 100, y: 100 }, { x: 0, y: 1 })
    expect(inicio).toEqual({ x: 0, y: 0 })
    expect(fin).toEqual({ x: 100, y: 100 })
    // Sale hacia la derecha (rumbo 0) y llega bajando (tangente hacia abajo).
    expect(control1.y).toBeCloseTo(0)
    expect(control1.x).toBeGreaterThan(0)
    expect(control2.x).toBeCloseTo(100)
    expect(control2.y).toBeLessThan(100)
  })

  it('una recta mide la distancia entre sus extremos', () => {
    const recta = curvaDeEnlace({ x: 0, y: 0 }, 0, { x: 300, y: 0 }, { x: 1, y: 0 })
    expect(largoDeCurva(recta)).toBeCloseTo(300, 0)
  })
})

describe('verticeAdelante', () => {
  it('elige un vértice por delante del rumbo, aunque haya otro más cerca detrás', () => {
    const ruta = rutaMascota(ESCRITORIO)
    // Cerca del vértice 3 (abajo al centro), pero nadando hacia la izquierda: el 3 queda detrás.
    const desde = { x: ruta[3].x - 40, y: ruta[3].y }
    const k = verticeAdelante(ruta, desde, Math.PI)
    expect(k).not.toBe(3)
    expect(ruta[k].x).toBeLessThan(desde.x)
  })
})

describe('destinoCarrera', () => {
  it('corre al centro del objetivo, 66 px a la derecha y 10 abajo', () => {
    expect(destinoCarrera({ left: 200, top: 300, right: 300, bottom: 340 }, ESCRITORIO)).toEqual({ x: 316, y: 330 })
  })

  it('se queda a 70 px de los bordes', () => {
    expect(destinoCarrera({ left: 1400, top: 0, right: 1440, bottom: 20 }, ESCRITORIO)).toEqual({ x: 1370, y: 70 })
  })
})

describe('giroMasCorto', () => {
  it('gira por el lado corto', () => {
    expect(giroMasCorto(350, 10)).toBe(370)
    expect(giroMasCorto(10, 350)).toBe(-10)
    expect(giroMasCorto(90, 90 + 720)).toBe(90)
  })
})

describe('chocaConTitular', () => {
  const titular = { left: 100, top: 200, right: 600, bottom: 300 }

  it('choca dentro del titular ampliado 70 px a los lados y 50 arriba y abajo', () => {
    expect(chocaConTitular({ x: 40, y: 160 }, titular)).toBe(true)
    expect(chocaConTitular({ x: 660, y: 340 }, titular)).toBe(true)
  })

  it('no choca fuera de ese margen ni sin titular', () => {
    expect(chocaConTitular({ x: 20, y: 250 }, titular)).toBe(false)
    expect(chocaConTitular({ x: 300, y: 360 }, titular)).toBe(false)
    expect(chocaConTitular({ x: 300, y: 250 }, null)).toBe(false)
  })
})

describe('cajaDeMascota', () => {
  it('ocupa 100 × 142 de pie y 142 × 100 de lado, y escala desde el centro', () => {
    const tamano = { ancho: 100, alto: 142 }
    expect(cajaDeMascota({ x: 500, y: 400 }, tamano, 0, 1)).toEqual({ left: 450, top: 329, right: 550, bottom: 471 })
    const deLado = cajaDeMascota({ x: 500, y: 400 }, tamano, 90, 1)
    expect(deLado.right - deLado.left).toBeCloseTo(142)
    expect(deLado.bottom - deLado.top).toBeCloseTo(100)
    const grande = cajaDeMascota({ x: 500, y: 400 }, tamano, 0, 1.5)
    expect(grande.right - grande.left).toBeCloseTo(150)
  })
})

describe('posicionBurbuja', () => {
  const burbuja = { ancho: 232, alto: 60 }

  it('va a la derecha si la mascota está en la mitad izquierda (Strata.dc.html:1686-1687)', () => {
    const lugar = posicionBurbuja({ left: 100, top: 300, right: 200, bottom: 442 }, burbuja, ESCRITORIO)
    expect(lugar).toEqual({ x: 194, y: 248, lado: 'derecha' })
  })

  it('va a la izquierda si está en la mitad derecha', () => {
    const lugar = posicionBurbuja({ left: 1000, top: 300, right: 1100, bottom: 442 }, burbuja, ESCRITORIO)
    expect(lugar).toEqual({ x: 1000 - 232 + 6, y: 248, lado: 'izquierda' })
  })

  it('no se sale de la ventana: 12 px de margen en los cuatro bordes', () => {
    // A 360 px, a la derecha de una mascota en la mitad izquierda, el prototipo se salía.
    const derecha = posicionBurbuja({ left: 120, top: 5, right: 220, bottom: 147 }, burbuja, MOVIL)
    expect(derecha.x).toBe(360 - 232 - 12)
    expect(derecha.y).toBe(12)
    const abajo = posicionBurbuja({ left: 20, top: 690, right: 120, bottom: 832 }, burbuja, MOVIL)
    expect(abajo.y).toBe(700 - 60 - 12)
  })
})

describe('easeHermite', () => {
  it('va de 0 a 1 con las pendientes pedidas y sin retroceder', () => {
    for (const [v0, v1] of [
      [0, 3],
      [1, 1],
      [1.7, 0.3],
      [2, 2],
    ]) {
      const ease = easeHermite(v0, v1)
      expect(ease(0)).toBe(0)
      expect(ease(1)).toBeCloseTo(1)
      const h = 1e-4
      expect(ease(h) / h).toBeCloseTo(v0, 2)
      expect((1 - ease(1 - h)) / h).toBeCloseTo(v1, 2)
      let previo = 0
      for (let p = 0.05; p <= 1; p += 0.05) {
        expect(ease(p)).toBeGreaterThanOrEqual(previo)
        previo = ease(p)
      }
    }
  })
})
