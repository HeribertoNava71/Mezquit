import { describe, expect, it } from 'vitest'
import { MENSAJES_ACCESO, correoValido, estadoConfirmacion, validarAcceso } from './validacion'

describe('correoValido', () => {
  it.each(['ana@empresa.mx', 'a.b+rrhh@sub.empresa.com', '  ana@empresa.mx  ', 'ana@localhost'])('acepta «%s»', (valor) => {
    expect(correoValido(valor)).toBe(true)
  })

  it.each(['', 'ana', 'ana@', '@empresa.mx', 'ana @empresa.mx', 'ana@empresa..mx', 'ana@-empresa.mx'])(
    'rechaza «%s»',
    (valor) => {
      expect(correoValido(valor)).toBe(false)
    },
  )
})

describe('validarAcceso', () => {
  it('pide el correo y la contraseña', () => {
    expect(validarAcceso('', '')).toEqual({
      email: MENSAJES_ACCESO.correoVacio,
      password: MENSAJES_ACCESO.contrasenaVacia,
    })
    expect(validarAcceso('   ', 'x')).toEqual({ email: MENSAJES_ACCESO.correoVacio })
  })

  it('revisa el formato del correo', () => {
    expect(validarAcceso('ana@', 'secreta')).toEqual({ email: MENSAJES_ACCESO.correoInvalido })
  })

  it('con los dos bien no devuelve errores (una contraseña de espacios cuenta, como con required)', () => {
    expect(validarAcceso('ana@empresa.mx', 'secreta')).toEqual({})
    expect(validarAcceso('ana@empresa.mx', '   ')).toEqual({})
  })
})

describe('estadoConfirmacion', () => {
  it('vacía es neutra', () => {
    expect(estadoConfirmacion('Secreta123', '', false)).toBe('neutro')
    expect(estadoConfirmacion('Secreta123', '', true)).toBe('neutro')
  })

  it('igual a la contraseña coincide', () => {
    expect(estadoConfirmacion('Secreta123', 'Secreta123', false)).toBe('coincide')
  })

  it('el principio de la contraseña es neutro mientras se escribe y no coincide al terminar', () => {
    expect(estadoConfirmacion('Secreta123', 'Secre', false)).toBe('neutro')
    expect(estadoConfirmacion('Secreta123', 'Secre', true)).toBe('no-coincide')
  })

  it('en cuanto se aparta de la contraseña no coincide, aunque siga escribiendo', () => {
    expect(estadoConfirmacion('Secreta123', 'Secrex', false)).toBe('no-coincide')
    expect(estadoConfirmacion('Secreta123', 'Secreta1234', false)).toBe('no-coincide')
    expect(estadoConfirmacion('', 'algo', false)).toBe('no-coincide')
  })

  it('distingue mayúsculas y minúsculas, como same:password', () => {
    expect(estadoConfirmacion('Secreta123', 'secreta123', false)).toBe('no-coincide')
  })
})
