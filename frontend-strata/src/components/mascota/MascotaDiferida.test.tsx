import { act, cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MascotaDiferida } from './MascotaDiferida'
import { CLAVE_MASCOTA_OCULTA, guardarMascotaOculta, reiniciarPreferenciaMascota } from './preferencia'
import { ESPERA_CARGA_MS, RETARDO_ENTRADA_MS, RETARDO_REAPARICION_MS } from './tiempos'

// La mascota real se prueba en Mascota.test.tsx; aquí solo importa cuándo se
// descarga y con qué espera de entrada.
const recibido = vi.hoisted(() => ({ retardos: [] as Array<number | undefined> }))
vi.mock('./Mascota', () => {
  function Mascota({ retardoEntrada }: { retardoEntrada?: number }) {
    recibido.retardos.push(retardoEntrada)
    return <div data-testid="mascota" data-retardo={retardoEntrada} />
  }
  return { Mascota, default: Mascota }
})

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] })
  recibido.retardos = []
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  window.localStorage.clear()
  reiniciarPreferenciaMascota()
})

async function avanzar(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms)
  })
  // El chunk perezoso (vi.mock) llega por import dinámico.
  await act(() => vi.dynamicImportSettled())
}

const mascota = () => document.querySelector('[data-testid="mascota"]')

describe('MascotaDiferida (D-28)', () => {
  it('no descarga la mascota durante la carga; después le pasa lo que falta de los 6 s', async () => {
    render(<MascotaDiferida />)
    await avanzar(ESPERA_CARGA_MS - 1)
    expect(mascota()).toBeNull()
    await avanzar(1)
    expect(mascota()).not.toBeNull()
    // jsdom no tiene requestIdleCallback: carga al terminar la espera.
    expect(recibido.retardos.at(-1)).toBe(RETARDO_ENTRADA_MS - ESPERA_CARGA_MS)
  })

  it('con requestIdleCallback espera además un momento libre del navegador', async () => {
    let libre: (() => void) | null = null
    vi.stubGlobal('requestIdleCallback', (callback: () => void) => {
      libre = callback
      return 1
    })
    vi.stubGlobal('cancelIdleCallback', () => {})
    render(<MascotaDiferida />)
    await avanzar(ESPERA_CARGA_MS)
    expect(mascota()).toBeNull()
    await act(async () => libre?.())
    await act(() => vi.dynamicImportSettled())
    expect(mascota()).not.toBeNull()
  })

  it('con la mascota oculta o movimiento reducido no descarga nada', async () => {
    window.localStorage.setItem(CLAVE_MASCOTA_OCULTA, '1')
    const { unmount } = render(<MascotaDiferida />)
    await avanzar(RETARDO_ENTRADA_MS * 2)
    expect(mascota()).toBeNull()
    unmount()

    window.localStorage.clear()
    reiniciarPreferenciaMascota()
    vi.stubGlobal(
      'matchMedia',
      vi.fn((consulta: string) => ({ matches: consulta.includes('reduce'), media: consulta, addEventListener: () => {}, removeEventListener: () => {} })),
    )
    render(<MascotaDiferida />)
    await avanzar(RETARDO_ENTRADA_MS * 2)
    expect(mascota()).toBeNull()
    expect(recibido.retardos).toHaveLength(0)
  })

  it('al volver a mostrarla desde el pie, la descarga de inmediato y entra casi enseguida', async () => {
    act(() => guardarMascotaOculta(true))
    render(<MascotaDiferida />)
    await avanzar(ESPERA_CARGA_MS)
    expect(mascota()).toBeNull()

    act(() => guardarMascotaOculta(false))
    await avanzar(0)
    expect(mascota()).not.toBeNull()
    expect(recibido.retardos.at(-1)).toBe(RETARDO_REAPARICION_MS)
  })

  it('si la home se desmonta antes de la espera, no descarga nada', async () => {
    const { unmount } = render(<MascotaDiferida />)
    await avanzar(ESPERA_CARGA_MS / 2)
    unmount()
    await avanzar(ESPERA_CARGA_MS)
    expect(recibido.retardos).toHaveLength(0)
    expect(vi.getTimerCount()).toBe(0)
  })
})
