import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios'
import { describe, expect, it } from 'vitest'
import { erroresPorCampo, esValidacion, mensajeAlGuardar } from './errores'

/** Error de axios con el código y el cuerpo dados; sin código, un error de red. */
function errorHttp(status?: number, data: unknown = {}): AxiosError {
  if (status === undefined) return new AxiosError('Network Error', AxiosError.ERR_NETWORK)
  const respuesta = { status, statusText: '', data, headers: {}, config: { headers: new AxiosHeaders() } }
  return new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, undefined, undefined, respuesta as AxiosResponse)
}

describe('erroresPorCampo', () => {
  it('toma el primer mensaje de cada campo de un 422 de Laravel', () => {
    const error = errorHttp(422, {
      message: 'The given data was invalid.',
      errors: {
        current_password: ['La contraseña actual es incorrecta.'],
        password: ['', 'Debe tener al menos 8 caracteres.'],
        phone: 'Máximo 30 caracteres.',
      },
    })
    expect(erroresPorCampo(error)).toEqual({
      current_password: 'La contraseña actual es incorrecta.',
      password: 'Debe tener al menos 8 caracteres.',
      phone: 'Máximo 30 caracteres.',
    })
  })

  it('devuelve null sin errores por campo (PB-24), con otro código o con algo que no es de axios', () => {
    const pb24 = errorHttp(422, { message: '{"message":"La contraseña actual es incorrecta."}' })
    expect(erroresPorCampo(pb24)).toBeNull()
    expect(esValidacion(pb24)).toBe(true)
    expect(erroresPorCampo(errorHttp(422, { errors: { email: [] } }))).toBeNull()
    expect(erroresPorCampo(errorHttp(500, { errors: { email: ['x'] } }))).toBeNull()
    expect(erroresPorCampo(errorHttp())).toBeNull()
    expect(erroresPorCampo(new Error('x'))).toBeNull()
  })
})

describe('mensajeAlGuardar', () => {
  it('distingue el 422 sin campos, la red, la sesión, el permiso y el servidor', () => {
    expect(mensajeAlGuardar(errorHttp(422))).toBe('Revisa los datos e inténtalo de nuevo.')
    expect(mensajeAlGuardar(errorHttp(422), 'Mensaje propio.')).toBe('Mensaje propio.')
    expect(mensajeAlGuardar(errorHttp())).toBe('Revisa tu conexión a internet e inténtalo de nuevo.')
    expect(mensajeAlGuardar(errorHttp(419))).toBe('Tu sesión expiró. Vuelve a entrar para continuar.')
    expect(mensajeAlGuardar(errorHttp(403))).toBe('Tu cuenta no tiene permiso para hacer este cambio.')
    expect(mensajeAlGuardar(errorHttp(500))).toBe('Ocurrió un error de nuestro lado. Inténtalo de nuevo en unos minutos.')
    expect(mensajeAlGuardar(new Error('x'))).toBe('Ocurrió un error de nuestro lado. Inténtalo de nuevo en unos minutos.')
  })
})
