import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios'
import { describe, expect, it } from 'vitest'
import { errorAlEliminar, errorAlGuardar, erroresDeCampos, estadoHttp } from './errores'

/** Error de axios con el código HTTP dado; sin código, un error de red. */
function errorHttp(status?: number, data: unknown = {}): AxiosError {
  if (status === undefined) return new AxiosError('Network Error', AxiosError.ERR_NETWORK)
  const respuesta = { status, statusText: '', data, headers: {}, config: { headers: new AxiosHeaders() } }
  return new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, undefined, undefined, respuesta as AxiosResponse)
}

describe('errores de usuarios', () => {
  it('estadoHttp lee el código de axios', () => {
    expect(estadoHttp(errorHttp(409))).toBe(409)
    expect(estadoHttp(errorHttp())).toBeUndefined()
    expect(estadoHttp(new Error('x'))).toBeUndefined()
  })

  it('el 409 al eliminar es «No puedes eliminar tu propia cuenta.» y no se puede reintentar', () => {
    expect(errorAlEliminar(errorHttp(409, { message: 'No puedes eliminar tu propia cuenta.' }))).toEqual({
      mensaje: 'No puedes eliminar tu propia cuenta.',
      definitivo: true,
    })
  })

  it('un error de red al eliminar sí se puede reintentar', () => {
    expect(errorAlEliminar(errorHttp())).toEqual({
      mensaje: 'No pudimos conectarnos. Revisa tu conexión e inténtalo de nuevo.',
      definitivo: false,
    })
    expect(errorAlEliminar(errorHttp(404)).definitivo).toBe(true)
    expect(errorAlEliminar(errorHttp(500)).definitivo).toBe(false)
  })

  it('al guardar distingue red, 404 y servidor', () => {
    expect(errorAlGuardar(errorHttp()).mensaje).toMatch(/conectarnos/)
    expect(errorAlGuardar(errorHttp(404)).mensaje).toMatch(/ya no existe/)
    expect(errorAlGuardar(errorHttp(500)).mensaje).toBe('No pudimos guardar los cambios. Inténtalo de nuevo en unos minutos.')
  })

  it('erroresDeCampos toma el primer mensaje de cada campo de un 422', () => {
    const error = errorHttp(422, {
      message: 'The name field must be a string. (and 1 more error)',
      errors: { name: ['The name field must be a string.', 'otro'], phone: ['Máximo 30 caracteres.'] },
    })
    expect(erroresDeCampos(error)).toEqual({ name: 'The name field must be a string.', phone: 'Máximo 30 caracteres.' })
    expect(erroresDeCampos(errorHttp(422, { message: 'x' }))).toBeNull()
    expect(erroresDeCampos(errorHttp(500))).toBeNull()
  })
})
