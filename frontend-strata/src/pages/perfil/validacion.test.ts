import { describe, expect, it } from 'vitest'
import {
  CONTRASENAS_VACIAS,
  confirmacionEsValida,
  confirmacionInmediata,
  diaAnterior,
  fechaLocal,
  fechaParaEnviar,
  fechaParaInput,
  MENSAJES,
  nuevaEsValida,
  reglasContrasena,
  reglasCorreo,
  reglasDatos,
  type ValoresDatos,
} from './validacion'

const DATOS: ValoresDatos = {
  name: 'Ana',
  last_name: 'López',
  phone: '',
  birth_date: '',
  position: '',
}

describe('reglasDatos (PUT /api/user/profile)', () => {
  const HOY = '2026-10-01'

  it('sin errores con nombre y apellido; teléfono, fecha y puesto son opcionales', () => {
    expect(reglasDatos(DATOS, HOY)).toEqual({})
  })

  it('nombre y apellido son obligatorios; solo espacios cuenta como vacío (PB-27)', () => {
    expect(reglasDatos({ ...DATOS, name: '  ', last_name: '' }, HOY)).toEqual({
      name: MENSAJES.nombre,
      last_name: MENSAJES.apellido,
    })
  })

  it('la fecha de nacimiento debe ser anterior a hoy (before:today)', () => {
    expect(reglasDatos({ ...DATOS, birth_date: '2026-09-30' }, HOY)).toEqual({})
    expect(reglasDatos({ ...DATOS, birth_date: HOY }, HOY)).toEqual({ birth_date: MENSAJES.fechaNoAnterior })
    expect(reglasDatos({ ...DATOS, birth_date: '2030-01-01' }, HOY)).toEqual({ birth_date: MENSAJES.fechaNoAnterior })
  })

  it('rechaza una fecha que no existe o con otro formato', () => {
    expect(reglasDatos({ ...DATOS, birth_date: '1990-02-30' }, HOY)).toEqual({ birth_date: MENSAJES.fechaNoValida })
    expect(reglasDatos({ ...DATOS, birth_date: '15/05/1990' }, HOY)).toEqual({ birth_date: MENSAJES.fechaNoValida })
  })
})

describe('reglasContrasena (PUT /api/user/password y PUT /api/admin/me)', () => {
  it('los tres campos son obligatorios', () => {
    expect(reglasContrasena(CONTRASENAS_VACIAS)).toEqual({
      current_password: MENSAJES.actualVacia,
      password: MENSAJES.nuevaVacia,
      password_confirmation: MENSAJES.confirmacionVacia,
    })
  })

  it('la nueva necesita 8 caracteres y la confirmación debe ser igual', () => {
    expect(reglasContrasena({ current_password: 'x', password: 'corta12', password_confirmation: 'corta12' })).toEqual({
      password: MENSAJES.nuevaCorta,
    })
    expect(
      reglasContrasena({ current_password: 'x', password: 'secreta123', password_confirmation: 'secreta124' }),
    ).toEqual({ password_confirmation: MENSAJES.noCoinciden })
    expect(
      reglasContrasena({ current_password: 'x', password: 'secreta123', password_confirmation: 'secreta123' }),
    ).toEqual({})
  })

  it('la confirmación se valida al momento cuando ya es tan larga como la nueva', () => {
    const valores = { current_password: '', password: 'secreta123', password_confirmation: 'secreta12' }
    expect(confirmacionInmediata('password_confirmation', valores)).toBe(false)
    expect(confirmacionInmediata('password_confirmation', { ...valores, password_confirmation: 'secreta124' })).toBe(true)
    expect(confirmacionInmediata('password_confirmation', { ...valores, password_confirmation: '' })).toBe(false)
    expect(confirmacionInmediata('password', { ...valores, password_confirmation: 'secreta124' })).toBe(false)
  })

  it('estados válidos: la nueva desde 8 caracteres y la confirmación si coincide con una nueva válida', () => {
    expect(nuevaEsValida({ ...CONTRASENAS_VACIAS, password: 'secreta1' })).toBe(true)
    expect(nuevaEsValida({ ...CONTRASENAS_VACIAS, password: 'secreta' })).toBe(false)
    expect(confirmacionEsValida({ ...CONTRASENAS_VACIAS, password: 'secreta1', password_confirmation: 'secreta1' })).toBe(true)
    expect(confirmacionEsValida({ ...CONTRASENAS_VACIAS, password: 'corta', password_confirmation: 'corta' })).toBe(false)
  })
})

describe('reglasCorreo', () => {
  it('pide un correo con forma de correo', () => {
    expect(reglasCorreo({ email: '' })).toEqual({ email: MENSAJES.correoVacio })
    expect(reglasCorreo({ email: 'operador@strata' })).toEqual({ email: MENSAJES.correoNoValido })
    expect(reglasCorreo({ email: ' operador@strata.mx ' })).toEqual({})
  })
})

describe('fechas', () => {
  it('fechaLocal y diaAnterior trabajan en AAAA-MM-DD', () => {
    expect(fechaLocal(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(diaAnterior('2026-01-01')).toBe('2025-12-31')
    expect(diaAnterior('2024-03-01')).toBe('2024-02-29')
  })

  it('fechaParaInput toma el día de la fecha ISO de Laravel', () => {
    expect(fechaParaInput('1990-05-15T00:00:00.000000Z')).toBe('1990-05-15')
    expect(fechaParaInput('1990-05-15')).toBe('1990-05-15')
    expect(fechaParaInput(null)).toBe('')
    expect(fechaParaInput(undefined)).toBe('')
    expect(fechaParaInput('15 de mayo')).toBe('')
  })

  it('fechaParaEnviar manda el valor del campo y no borra una fecha que no se pudo mostrar', () => {
    expect(fechaParaEnviar('1990-05-15', '1990-05-15T00:00:00.000000Z')).toBe('1990-05-15')
    // La persona vació el campo: se borra la fecha.
    expect(fechaParaEnviar('', '1990-05-15T00:00:00.000000Z')).toBe('')
    expect(fechaParaEnviar('', null)).toBe('')
    // Formato desconocido que el selector no muestra: se reenvía como antes.
    expect(fechaParaEnviar('', '15 de mayo de 1990')).toBe('15 de mayo de 1990')
  })
})
