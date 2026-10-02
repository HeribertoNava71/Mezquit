import { describe, expect, it } from 'vitest'
import { POSICION_POR_DEFECTO, cajaDelToast, candidatas, elegirPosicion, type Caja, type DatosPosicion } from './posicionToast'

const caja = (left: number, top: number, right: number, bottom: number): Caja => ({ left, top, right, bottom })

/** Toast de una línea, como «Solicitud registrada» (unos 260 × 46 px). */
const TOAST = { ancho: 260, alto: 46 }

function datos(parcial: Partial<DatosPosicion> & Pick<DatosPosicion, 'ventana' | 'panel'>): DatosPosicion {
  return { toast: TOAST, margen: 26, relleno: 16, pie: null, controles: [], ...parcial }
}

describe('elegirPosicion', () => {
  it('sin choque con el panel se queda abajo y al centro (drawer de 408 px a 1440 px)', () => {
    const d = datos({
      ventana: { ancho: 1440, alto: 900 },
      panel: caja(1032, 0, 1440, 900),
      pie: caja(1032, 820, 1440, 900),
      controles: [caja(1054, 838, 1418, 882), caja(1386, 20, 1418, 52)],
    })
    expect(elegirPosicion(d)).toEqual(candidatas(d)[0])
    expect(candidatas(d)[0]).toEqual({ lado: 'abajo', distancia: 26, izquierda: 0, derecha: 0 })
  })

  it('con el drawer a pantalla completa (360 px) va sobre el pie y no tapa «Cerrar» ni la X', () => {
    const cerrar = caja(22, 726, 338, 770)
    const x = caja(306, 20, 338, 52)
    const d = datos({
      ventana: { ancho: 360, alto: 800 },
      panel: caja(0, 0, 360, 800),
      pie: caja(0, 708, 360, 800),
      controles: [cerrar, x],
    })
    const posicion = elegirPosicion(d)
    expect(posicion).toEqual({ lado: 'abajo', distancia: 800 - 708 + 12, izquierda: 0, derecha: 0 })
    const toast = cajaDelToast(posicion, d)
    expect(toast.bottom).toBeLessThanOrEqual(cerrar.top)
    expect(toast.top).toBeGreaterThan(x.bottom)
  })

  it('con un modal alto (360 px) y controles abajo, sube arriba si ahí no tapa nada', () => {
    const d = datos({
      ventana: { ancho: 360, alto: 800 },
      panel: caja(16, 30, 344, 770),
      pie: caja(16, 690, 344, 770),
      controles: [caja(40, 560, 320, 604), caja(40, 612, 320, 656), caja(230, 706, 320, 750)],
    })
    expect(elegirPosicion(d)).toEqual({ lado: 'arriba', distancia: 26, izquierda: 0, derecha: 0 })
  })

  it('con un drawer en tableta (768 px) usa el hueco del fondo a su izquierda', () => {
    const d = datos({
      ventana: { ancho: 768, alto: 1000 },
      panel: caja(360, 0, 768, 1000),
      pie: caja(360, 920, 768, 1000),
      // El toast centrado en la ventana (abajo) y arriba cruzaría el panel.
      toast: { ancho: 520, alto: 46 },
      controles: [caja(382, 938, 746, 982), caja(714, 20, 746, 52)],
    })
    expect(elegirPosicion(d)).toEqual({ lado: 'abajo', distancia: 26, izquierda: 0, derecha: 768 - 360 })
  })

  it('un toast más angosto que su texto crece en alto al calcular su caja', () => {
    const d = datos({ ventana: { ancho: 360, alto: 800 }, panel: caja(0, 0, 360, 800), toast: { ancho: 500, alto: 46 } })
    const toast = cajaDelToast({ lado: 'abajo', distancia: 26, izquierda: 0, derecha: 0 }, d)
    expect(toast.right - toast.left).toBe(360 - 32)
    expect(toast.bottom - toast.top).toBe(92)
  })

  it('la posición por defecto es abajo, sin desplazamiento', () => {
    expect(POSICION_POR_DEFECTO).toEqual({ lado: 'abajo', distancia: 0, izquierda: 0, derecha: 0 })
  })
})
