import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios'
import { describe, expect, it } from 'vitest'
import {
  MENSAJE_CANTIDAD,
  NOTA_MAX,
  leerValidacion,
  textoFallaSolicitud,
  traducirMensaje,
  validarSolicitud,
} from './solicitud'

/** Error de axios con el código HTTP y el cuerpo dados; sin código, un error de red. */
function errorHttp(status?: number, data: unknown = {}): AxiosError {
  if (status === undefined) return new AxiosError('Network Error', AxiosError.ERR_NETWORK)
  const respuesta = { status, statusText: '', data, headers: {}, config: { headers: new AxiosHeaders() } }
  return new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, undefined, undefined, respuesta as AxiosResponse)
}

describe('validarSolicitud', () => {
  it('acepta un entero de 1 o más con una nota de hasta 255 caracteres', () => {
    expect(validarSolicitud(1, '')).toBeNull()
    expect(validarSolicitud(250, 'x'.repeat(NOTA_MAX))).toBeNull()
  })

  it('rechaza cantidades que no son enteras o son menores que 1', () => {
    expect(validarSolicitud(0, '')).toEqual({ cantidad: MENSAJE_CANTIDAD })
    expect(validarSolicitud(-3, '')).toEqual({ cantidad: MENSAJE_CANTIDAD })
    expect(validarSolicitud(2.5, '')).toEqual({ cantidad: MENSAJE_CANTIDAD })
    expect(validarSolicitud(Number.NaN, '')).toEqual({ cantidad: MENSAJE_CANTIDAD })
  })

  it('rechaza una nota de más de 255 caracteres (PB-26)', () => {
    expect(validarSolicitud(5, 'x'.repeat(NOTA_MAX + 1))).toEqual({ nota: 'Usa 255 caracteres o menos.' })
  })
})

describe('traducirMensaje', () => {
  it('traduce los mensajes de Laravel de las reglas del formulario', () => {
    expect(traducirMensaje('The requested amount field must be at least 1.')).toBe('Escribe un número de 1 o más.')
    expect(traducirMensaje('The requested amount field must be an integer.')).toBe('Escribe un número entero.')
    expect(traducirMensaje('The requested amount field is required.')).toBe('Este dato es obligatorio.')
    expect(traducirMensaje('The note field must be a string.')).toBe('Escribe un texto.')
    expect(traducirMensaje('The note field must not be greater than 500 characters.')).toBe('Usa 500 caracteres o menos.')
  })

  it('quita «(and N more errors)» y deja igual lo que no reconoce', () => {
    expect(traducirMensaje('The requested amount field must be at least 1. (and 1 more error)')).toBe(
      'Escribe un número de 1 o más.',
    )
    expect(traducirMensaje('La cantidad debe ser mayor.')).toBe('La cantidad debe ser mayor.')
  })
})

describe('leerValidacion', () => {
  it('lleva requested_amount a la cantidad y note a la nota', () => {
    const error = errorHttp(422, {
      message: 'The requested amount field must be at least 1. (and 1 more error)',
      errors: {
        requested_amount: ['The requested amount field must be at least 1.'],
        note: ['The note field must not be greater than 500 characters.'],
      },
    })
    expect(leerValidacion(error)).toEqual({
      campos: { cantidad: 'Escribe un número de 1 o más.', nota: 'Usa 500 caracteres o menos.' },
      mensaje: null,
    })
  })

  it('sin errores de esos campos, el message va como aviso general', () => {
    expect(leerValidacion(errorHttp(422, { message: 'No se pudo registrar la solicitud.' }))).toEqual({
      campos: {},
      mensaje: 'No se pudo registrar la solicitud.',
    })
    expect(leerValidacion(errorHttp(422, { errors: { organization_id: ['Falta la empresa.'] } }))).toEqual({
      campos: {},
      mensaje: 'Falta la empresa.',
    })
    expect(leerValidacion(errorHttp(422, 'texto'))).toEqual({ campos: {}, mensaje: 'Revisa los datos e inténtalo de nuevo.' })
  })

  it('no es un 422: devuelve null', () => {
    expect(leerValidacion(errorHttp(500))).toBeNull()
    expect(leerValidacion(errorHttp())).toBeNull()
    expect(leerValidacion(new Error('x'))).toBeNull()
  })
})

describe('textoFallaSolicitud', () => {
  it('explica cada falla sin 422', () => {
    expect(textoFallaSolicitud('red')).toBe('Revisa tu conexión a internet e inténtalo de nuevo.')
    expect(textoFallaSolicitud('sesion')).toBe('Tu sesión expiró. Vuelve a entrar para continuar.')
    expect(textoFallaSolicitud('permiso')).toBe('Tu cuenta no tiene permiso para solicitar créditos.')
    expect(textoFallaSolicitud('servidor')).toBe('Ocurrió un error de nuestro lado. Inténtalo de nuevo en unos minutos.')
    expect(textoFallaSolicitud('conflicto')).toBe('Ocurrió un error de nuestro lado. Inténtalo de nuevo en unos minutos.')
  })
})
