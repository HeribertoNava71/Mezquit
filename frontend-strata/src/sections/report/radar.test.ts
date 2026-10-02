import { describe, expect, it } from 'vitest'
import {
  RADIO_RADAR,
  cajaDelRadar,
  etiquetaDelEje,
  partirEtiqueta,
  puntoDelEje,
  puntosDelPoligono,
  radioDelValor,
} from './radar'

describe('geometría del radar', () => {
  it('el primer eje apunta hacia arriba y los demás siguen el sentido del reloj', () => {
    expect(puntoDelEje(0, 6, 100)).toEqual({ x: 0, y: -100 })
    // Hexágono del prototipo (centro 140,140 y radio 110): el segundo vértice está arriba a la derecha.
    expect(puntoDelEje(1, 6, 110)).toEqual({ x: 95.26, y: -55 })
    expect(puntoDelEje(3, 6, 100)).toEqual({ x: 0, y: 100 })
    // Triángulo: abajo a la derecha y abajo a la izquierda.
    expect(puntoDelEje(1, 3, 100)).toEqual({ x: 86.6, y: 50 })
    expect(puntoDelEje(2, 3, 100)).toEqual({ x: -86.6, y: 50 })
  })

  it('reproduce el polígono de datos del prototipo (Dirección 78 en el eje superior)', () => {
    // Strata.dc.html:900: primer vértice en (140, 54.2) con radio 110 → 85.8 hacia arriba.
    expect(puntoDelEje(0, 6, radioDelValor(78, 110))).toEqual({ x: 0, y: -85.8 })
  })

  it('el valor se limita a 0–100 y sin dato queda en el centro', () => {
    expect(radioDelValor(50)).toBe(RADIO_RADAR / 2)
    expect(radioDelValor(140)).toBe(RADIO_RADAR)
    expect(radioDelValor(-10)).toBe(0)
    expect(radioDelValor(null)).toBe(0)
  })

  it('arma el atributo points con un radio por eje', () => {
    expect(puntosDelPoligono([100, 100, 100])).toBe('0,-100 86.6,50 -86.6,50')
    expect(puntosDelPoligono([0, 0, 0])).toBe('0,0 0,0 0,0')
  })
})

describe('partirEtiqueta', () => {
  it('parte por palabras sin cortarlas', () => {
    expect(partirEtiqueta('Orientación a resultados', 14, 2)).toEqual(['Orientación a', 'resultados'])
    expect(partirEtiqueta('Colaboración', 14, 2)).toEqual(['Colaboración'])
    expect(partirEtiqueta('Responsabilidades', 14, 2)).toEqual(['Responsabilidades'])
  })

  it('si sobran líneas, la última termina en «…»', () => {
    expect(partirEtiqueta('Estabilidad emocional bajo mucha presión', 14, 2)).toEqual(['Estabilidad', 'emocional…'])
    expect(partirEtiqueta('Uno dos tres cuatro cinco seis siete', 9, 2)).toEqual(['Uno dos', 'tres…'])
  })
})

describe('etiquetas y viewBox', () => {
  it('arriba y abajo van centradas; a los lados, alineadas hacia afuera', () => {
    expect(etiquetaDelEje(0, 4, 'Arriba').ancla).toBe('middle')
    expect(etiquetaDelEje(1, 4, 'Derecha').ancla).toBe('start')
    expect(etiquetaDelEje(2, 4, 'Abajo').ancla).toBe('middle')
    expect(etiquetaDelEje(3, 4, 'Izquierda').ancla).toBe('end')
    // Hexágono: como el prototipo, todas centradas sobre o bajo su vértice.
    expect([0, 1, 2, 3, 4, 5].map((i) => etiquetaDelEje(i, 6, 'Escala').ancla)).toEqual(
      Array(6).fill('middle'),
    )
  })

  it('arriba, el texto termina sobre el vértice; abajo, empieza debajo', () => {
    const arriba = etiquetaDelEje(0, 3, 'Orientación a resultados')
    expect(arriba.lineas).toEqual(['Orientación a resultados'])
    expect(arriba.caja.y + arriba.caja.alto).toBeLessThanOrEqual(-RADIO_RADAR)

    const abajo = etiquetaDelEje(1, 3, 'Colaboración')
    expect(abajo.caja.y).toBeGreaterThan(puntoDelEje(1, 3, RADIO_RADAR).y)
  })

  it('el viewBox contiene el radar y todas las etiquetas', () => {
    const nombres = ['Orientación a resultados', 'Colaboración', 'Adaptabilidad', 'Estabilidad emocional']
    const etiquetas = nombres.map((nombre, i) => etiquetaDelEje(i, nombres.length, nombre))
    const caja = cajaDelRadar(etiquetas, nombres.length)
    expect(caja.x).toBeLessThan(-RADIO_RADAR)
    expect(caja.y).toBeLessThan(-RADIO_RADAR)
    for (const { caja: texto } of etiquetas) {
      expect(texto.x).toBeGreaterThanOrEqual(caja.x)
      expect(texto.y).toBeGreaterThanOrEqual(caja.y)
      expect(texto.x + texto.ancho).toBeLessThanOrEqual(caja.x + caja.ancho)
      expect(texto.y + texto.alto).toBeLessThanOrEqual(caja.y + caja.alto)
    }
  })

  it('el viewBox se ajusta al polígono: un triángulo no deja hueco debajo', () => {
    const nombres = ['Orientación a resultados', 'Colaboración', 'Adaptabilidad']
    const etiquetas = nombres.map((nombre, i) => etiquetaDelEje(i, nombres.length, nombre))
    const caja = cajaDelRadar(etiquetas, nombres.length)
    // Los vértices de abajo están a media altura del radio; el borde inferior queda
    // bajo sus etiquetas, lejos del radio completo.
    expect(caja.y + caja.alto).toBeLessThan(RADIO_RADAR)
    expect(caja.y + caja.alto).toBeGreaterThan(Math.max(...etiquetas.map((e) => e.caja.y + e.caja.alto)))
  })
})
