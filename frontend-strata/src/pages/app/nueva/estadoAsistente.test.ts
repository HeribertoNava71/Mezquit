import { describe, expect, it } from 'vitest'
import {
  ID_CAMPO,
  claveCandidato,
  claveDato,
  errorFechaVisible,
  erroresCandidatosVisibles,
  erroresDatosVisibles,
  estadoInicial,
  idCampoCandidato,
  pasoValido,
  primerCampoConError,
  primerPasoInvalido,
  reducerAsistente,
  type AccionAsistente,
  type EstadoAsistente,
} from './estadoAsistente'
import { MENSAJES, mapearErrores422, type CandidatoBorrador } from './modelo'

const HOY = '2026-10-01'

function fila(id: string, name = '', email = '', phone = ''): CandidatoBorrador {
  return { id, name, email, phone }
}

function aplicar(estado: EstadoAsistente, ...acciones: AccionAsistente[]): EstadoAsistente {
  return acciones.reduce(reducerAsistente, estado)
}

const inicial = () => estadoInicial(HOY, fila('c1'))

describe('reducerAsistente', () => {
  it('empieza en Datos con una fila vacía y sin errores visibles', () => {
    const estado = inicial()
    expect(estado.paso).toBe(0)
    expect(estado.filas).toEqual([fila('c1')])
    expect(erroresDatosVisibles(estado)).toEqual({})
    expect(erroresCandidatosVisibles(estado)).toEqual({ filas: {} })
  })

  it('ir recuerda el paso más lejano y renueva «hoy» si se pasa', () => {
    const estado = aplicar(inicial(), { tipo: 'ir', paso: 3, hoy: '2026-10-02' }, { tipo: 'ir', paso: 1 })
    expect(estado.paso).toBe(1)
    expect(estado.pasoMaximo).toBe(3)
    expect(estado.hoy).toBe('2026-10-02')
  })

  it('pegar la lista reemplaza las filas vacías y marca las nuevas para mostrar sus errores', () => {
    const estado = aplicar(
      inicial(),
      { tipo: 'agregar-candidato', fila: fila('c2', 'Rita', 'rita@correo.com') },
      { tipo: 'agregar-candidato', fila: fila('c3') },
      { tipo: 'pegar-lista', filas: [fila('c4', 'Ana', 'ana@correo'), fila('c5', 'Luis', 'luis@correo.com')], aviso: 'Listo' },
    )
    expect(estado.filas.map((f) => f.id)).toEqual(['c2', 'c4', 'c5'])
    expect(estado.avisoLista).toBe('Listo')
    // Sin intentar avanzar, la fila pegada ya muestra su correo no válido.
    expect(erroresCandidatosVisibles(estado).filas).toEqual({ c4: { email: MENSAJES.correoNoValido } })
  })

  it('no quita la última fila', () => {
    const estado = aplicar(inicial(), { tipo: 'quitar-candidato', id: 'c1' })
    expect(estado.filas).toHaveLength(1)
    const dos = aplicar(inicial(), { tipo: 'agregar-candidato', fila: fila('c2') }, { tipo: 'quitar-candidato', id: 'c1' })
    expect(dos.filas.map((f) => f.id)).toEqual(['c2'])
  })

  it('un error del servidor se va al cambiar su campo', () => {
    const servidor = mapearErrores422(
      { name: ['Nombre rechazado.'], 'candidates.0.email': ['Correo rechazado.'], deadline: ['Fecha rechazada.'] },
      ['c1'],
    )
    let estado = aplicar(
      inicial(),
      { tipo: 'cambiar-candidato', id: 'c1', campo: 'name', valor: 'Ana' },
      { tipo: 'cambiar-candidato', id: 'c1', campo: 'email', valor: 'ana@correo.com' },
      { tipo: 'errores-servidor', errores: servidor, paso: 0 },
    )
    expect(estado.paso).toBe(0)
    expect(erroresDatosVisibles(estado)).toEqual({ name: 'Nombre rechazado.' })
    expect(erroresCandidatosVisibles(estado).filas).toEqual({ c1: { email: 'Correo rechazado.' } })
    expect(errorFechaVisible(estado)).toBe('Fecha rechazada.')

    estado = aplicar(
      estado,
      { tipo: 'cambiar-dato', campo: 'name', valor: 'Vendedores' },
      { tipo: 'cambiar-candidato', id: 'c1', campo: 'email', valor: 'ana@empresa.com' },
      { tipo: 'cambiar-fecha', valor: '2026-10-20' },
    )
    expect(erroresDatosVisibles(estado)).toEqual({})
    expect(erroresCandidatosVisibles(estado).filas).toEqual({})
    expect(errorFechaVisible(estado)).toBeUndefined()
  })
})

describe('errores visibles: tarde, al intentar o al salir de un campo con texto', () => {
  it('el nombre vacío se avisa solo al intentar avanzar', () => {
    let estado = aplicar(inicial(), { tipo: 'tocar', clave: claveDato('name') })
    expect(erroresDatosVisibles(estado)).toEqual({})
    estado = aplicar(estado, { tipo: 'intentar', paso: 0 })
    expect(erroresDatosVisibles(estado)).toEqual({ name: MENSAJES.nombreVacio })
  })

  it('el correo no válido se avisa al salir del campo y se quita en vivo al corregirlo', () => {
    let estado = aplicar(
      inicial(),
      { tipo: 'cambiar-candidato', id: 'c1', campo: 'email', valor: 'ana@correo' },
    )
    expect(erroresCandidatosVisibles(estado).filas).toEqual({})
    estado = aplicar(estado, { tipo: 'tocar', clave: claveCandidato('c1', 'email') })
    expect(erroresCandidatosVisibles(estado).filas).toEqual({ c1: { email: MENSAJES.correoNoValido } })
    estado = aplicar(estado, { tipo: 'cambiar-candidato', id: 'c1', campo: 'email', valor: 'ana@correo.com' })
    expect(erroresCandidatosVisibles(estado).filas).toEqual({})
  })

  it('al intentar Candidatos sin datos aparece el error general', () => {
    const estado = aplicar(inicial(), { tipo: 'intentar', paso: 2 })
    expect(erroresCandidatosVisibles(estado)).toEqual({ general: MENSAJES.sinCandidatos, filas: {} })
  })

  it('la fecha se revisa al elegirla', () => {
    const estado = aplicar(inicial(), { tipo: 'cambiar-fecha', valor: HOY })
    expect(errorFechaVisible(estado)).toBe(MENSAJES.fechaPasada)
  })
})

describe('validación por paso y foco', () => {
  it('pasoValido y primerPasoInvalido siguen las reglas del cliente', () => {
    const vacio = inicial()
    expect(pasoValido(vacio, 0)).toBe(false)
    expect(pasoValido(vacio, 1)).toBe(true)
    expect(pasoValido(vacio, 2)).toBe(false)
    expect(pasoValido(vacio, 3)).toBe(true)
    // Revisa los pasos anteriores a «hasta»: para entrar a Prueba, solo Datos.
    expect(primerPasoInvalido(vacio, 0)).toBeNull()
    expect(primerPasoInvalido(vacio, 1)).toBe(0)
    expect(primerPasoInvalido(vacio, 4)).toBe(0)

    const listo = aplicar(
      vacio,
      { tipo: 'cambiar-dato', campo: 'name', valor: 'Vendedores Q4' },
      { tipo: 'cambiar-candidato', id: 'c1', campo: 'name', valor: 'Ana' },
      { tipo: 'cambiar-candidato', id: 'c1', campo: 'email', valor: 'ana@correo.com' },
    )
    expect(primerPasoInvalido(listo, 4)).toBeNull()
    expect(primerPasoInvalido(aplicar(listo, { tipo: 'cambiar-fecha', valor: '2020-01-01' }), 4)).toBe(3)
  })

  it('primerCampoConError da el id del primer control a corregir del paso', () => {
    const estado = aplicar(
      inicial(),
      { tipo: 'agregar-candidato', fila: fila('c2', 'Luis', 'luis@') },
      { tipo: 'cambiar-fecha', valor: '2020-01-01' },
    )
    expect(primerCampoConError(estado, 0)).toBe(ID_CAMPO.nombre)
    expect(primerCampoConError(estado, 1)).toBeNull()
    expect(primerCampoConError(estado, 2)).toBe(idCampoCandidato('c2', 'email'))
    expect(primerCampoConError(estado, 3)).toBe(ID_CAMPO.fecha)
    // Sin candidatos: al nombre de la primera fila.
    expect(primerCampoConError(inicial(), 2)).toBe(idCampoCandidato('c1', 'name'))
  })
})
