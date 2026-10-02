import { describe, expect, it } from 'vitest'
import { SITE } from '@/config/site'
import { PLANS } from '@/data/plans'
import { esCorreoReal, esEnlaceReal, esPendiente } from './marcadores'

describe('marcadores [PENDIENTE]', () => {
  it('reconoce los marcadores de config/site.ts y data/plans.ts', () => {
    expect(esPendiente(SITE.calendarUrl)).toBe(true)
    expect(esPendiente(SITE.email)).toBe(true)
    expect(esPendiente(SITE.legalName)).toBe(true)
    for (const plan of PLANS) expect(esPendiente(plan.price)).toBe(true)
    expect(esPendiente('  [pendiente: precio]')).toBe(true)
  })

  it('un dato real no es pendiente', () => {
    expect(esPendiente('$1,200 MXN')).toBe(false)
    expect(esPendiente('Precio [PENDIENTE] más tarde')).toBe(false)
    expect(esPendiente('')).toBe(false)
    expect(esPendiente(undefined)).toBe(false)
    expect(esPendiente(null)).toBe(false)
  })

  it('esEnlaceReal solo acepta http(s)', () => {
    expect(esEnlaceReal('https://cal.com/strata/demo')).toBe(true)
    expect(esEnlaceReal(' http://agenda.ejemplo.mx/30min ')).toBe(true)
    expect(esEnlaceReal(SITE.calendarUrl)).toBe(false)
    expect(esEnlaceReal('[PENDIENTE: https://cal.com/strata]')).toBe(false)
    expect(esEnlaceReal('cal.com/strata')).toBe(false)
    expect(esEnlaceReal('javascript:alert(1)')).toBe(false)
    expect(esEnlaceReal('mailto:hola@strata.mx')).toBe(false)
    expect(esEnlaceReal(undefined)).toBe(false)
  })

  it('esCorreoReal pide una dirección con dominio', () => {
    expect(esCorreoReal('hola@strata.mx')).toBe(true)
    expect(esCorreoReal(SITE.email)).toBe(false)
    expect(esCorreoReal('hola@strata')).toBe(false)
    expect(esCorreoReal('sin arroba.mx')).toBe(false)
    expect(esCorreoReal(null)).toBe(false)
  })
})
