import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  CLAVE_MASCOTA_OCULTA,
  guardarMascotaOculta,
  mascotaOculta,
  reaparecioHaceUnMomento,
  reiniciarPreferenciaMascota,
  useMascotaOculta,
} from './preferencia'

afterEach(() => {
  vi.useRealTimers()
  window.localStorage.clear()
  reiniciarPreferenciaMascota()
})

describe('preferencia de la mascota (D-27)', () => {
  it('lee y guarda en localStorage', () => {
    expect(mascotaOculta()).toBe(false)
    guardarMascotaOculta(true)
    expect(window.localStorage.getItem(CLAVE_MASCOTA_OCULTA)).toBe('1')
    reiniciarPreferenciaMascota()
    expect(mascotaOculta()).toBe(true)
    guardarMascotaOculta(false)
    expect(window.localStorage.getItem(CLAVE_MASCOTA_OCULTA)).toBeNull()
  })

  it('si localStorage falla, la preferencia vale para la pestaña y nada se rompe', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    expect(mascotaOculta()).toBe(false)
    expect(() => guardarMascotaOculta(true)).not.toThrow()
    expect(mascotaOculta()).toBe(true)
  })

  it('useMascotaOculta reacciona al cambio y a otra pestaña (evento storage)', () => {
    const { result } = renderHook(() => useMascotaOculta())
    expect(result.current).toBe(false)
    act(() => guardarMascotaOculta(true))
    expect(result.current).toBe(true)

    window.localStorage.removeItem(CLAVE_MASCOTA_OCULTA)
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: CLAVE_MASCOTA_OCULTA }))
    })
    expect(result.current).toBe(false)
  })

  it('reaparecioHaceUnMomento solo vale justo después de volver a mostrarla', () => {
    vi.useFakeTimers({ toFake: ['performance'] })
    expect(reaparecioHaceUnMomento()).toBe(false)
    guardarMascotaOculta(false)
    expect(reaparecioHaceUnMomento()).toBe(false)
    guardarMascotaOculta(true)
    guardarMascotaOculta(false)
    expect(reaparecioHaceUnMomento()).toBe(true)
    vi.advanceTimersByTime(2500)
    expect(reaparecioHaceUnMomento()).toBe(false)
  })
})
