import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { describe, expect, it } from 'vitest'
import { erroresPorCampo, tipoDeFalla } from './fallas'

function errorConStatus(status: number, data: unknown = {}): AxiosError {
  const config = { headers: {} } as InternalAxiosRequestConfig
  const response = { status, data, statusText: String(status), headers: {}, config } as AxiosResponse
  return new AxiosError(String(status), AxiosError.ERR_BAD_REQUEST, config, null, response)
}

describe('tipoDeFalla', () => {
  it('422 es de validación (datos o credenciales)', () => {
    expect(tipoDeFalla(errorConStatus(422))).toBe('validacion')
    // Mismo resultado con un objeto que solo tiene la forma de la respuesta.
    expect(tipoDeFalla({ response: { status: 422 } })).toBe('validacion')
  })

  it('429 es por demasiados intentos', () => {
    expect(tipoDeFalla(errorConStatus(429))).toBe('limite')
  })

  it('un error de axios sin respuesta es de red', () => {
    expect(tipoDeFalla(new AxiosError('Network Error', AxiosError.ERR_NETWORK))).toBe('red')
  })

  it('cualquier otra respuesta, o algo que no viene de axios, es del servidor', () => {
    expect(tipoDeFalla(errorConStatus(500))).toBe('servidor')
    expect(tipoDeFalla(errorConStatus(419))).toBe('servidor')
    expect(tipoDeFalla(new Error('inesperado'))).toBe('servidor')
    expect(tipoDeFalla(null)).toBe('servidor')
  })
})

describe('erroresPorCampo', () => {
  it('toma el primer mensaje de cada campo, como hacía el registro', () => {
    const error = errorConStatus(422, {
      message: 'The given data was invalid.',
      errors: { email: ['El correo ya está registrado.', 'Otro mensaje.'], name: ['Escribe tu nombre.'] },
    })
    expect(erroresPorCampo(error)).toEqual({ email: 'El correo ya está registrado.', name: 'Escribe tu nombre.' })
  })

  it('acepta un mensaje suelto y descarta los vacíos', () => {
    expect(erroresPorCampo({ response: { data: { errors: { phone: 'Muy largo.', sector: [''], position: [] } } } })).toEqual({
      phone: 'Muy largo.',
    })
  })

  it('sin mensajes devuelve null', () => {
    expect(erroresPorCampo(errorConStatus(500, { message: 'Server Error' }))).toBeNull()
    expect(erroresPorCampo({ response: { data: { errors: {} } } })).toBeNull()
    expect(erroresPorCampo(new AxiosError('Network Error', AxiosError.ERR_NETWORK))).toBeNull()
    expect(erroresPorCampo(undefined)).toBeNull()
  })
})
