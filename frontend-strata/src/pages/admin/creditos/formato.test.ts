import { describe, expect, it } from 'vitest'
import { creditos, fechaDeSolicitud } from './formato'
import { puedeReintentarse, textoDeError } from './solicitud'

describe('creditos', () => {
  it('pone la unidad en singular o plural, con separador de miles de es-MX', () => {
    expect(creditos(1)).toBe('1 crédito')
    expect(creditos(0)).toBe('0 créditos')
    expect(creditos(40)).toBe('40 créditos')
    expect(creditos(1250)).toBe('1,250 créditos')
    expect(creditos(-1)).toBe('-1 crédito')
  })

  it('sin un número válido muestra «—»', () => {
    expect(creditos(null)).toBe('—')
    expect(creditos(Number.NaN)).toBe('—')
  })
})

describe('fechaDeSolicitud', () => {
  it('«Y-m-d H:i» del servidor pasa a «27 sep 2026, 11:42», sin convertir de zona', () => {
    expect(fechaDeSolicitud('2026-09-27 11:42')).toEqual({ texto: '27 sep 2026, 11:42', iso: '2026-09-27T11:42' })
    expect(fechaDeSolicitud('2026-01-05 08:07')).toEqual({ texto: '05 ene 2026, 08:07', iso: '2026-01-05T08:07' })
    expect(fechaDeSolicitud('2026-12-31T23:59')).toEqual({ texto: '31 dic 2026, 23:59', iso: '2026-12-31T23:59' })
  })

  it('sin fecha muestra «—»; con otro formato, el texto tal cual', () => {
    expect(fechaDeSolicitud(null)).toEqual({ texto: '—', iso: null })
    expect(fechaDeSolicitud('')).toEqual({ texto: '—', iso: null })
    expect(fechaDeSolicitud('ayer')).toEqual({ texto: 'ayer', iso: null })
    expect(fechaDeSolicitud('2026-13-01 10:00')).toEqual({ texto: '2026-13-01 10:00', iso: null })
  })
})

describe('errores al resolver una solicitud', () => {
  it('se reintenta tras red, servidor o sesión; tras 409, 404 o 403 toca actualizar la lista', () => {
    expect(puedeReintentarse('red')).toBe(true)
    expect(puedeReintentarse('servidor')).toBe(true)
    expect(puedeReintentarse('sesion')).toBe(true)
    expect(puedeReintentarse('conflicto')).toBe(false)
    expect(puedeReintentarse('no-encontrado')).toBe(false)
    expect(puedeReintentarse('permiso')).toBe(false)
  })

  it('cada error dice qué pasó y que la solicitud sigue pendiente cuando así es', () => {
    expect(textoDeError('conflicto', 'aprobar').titulo).toBe('Esta solicitud ya no está pendiente')
    expect(textoDeError('red', 'rechazar').texto).toContain('La solicitud sigue pendiente.')
    expect(textoDeError('servidor', 'rechazar').titulo).toBe('No pudimos rechazar la solicitud')
    expect(textoDeError('servidor', 'aprobar').titulo).toBe('No pudimos aprobar la solicitud')
  })
})
