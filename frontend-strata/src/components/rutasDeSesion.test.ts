import { describe, expect, it } from 'vitest'
import type { AuthUser } from '@/api/auth'
import {
  AVISO_SESION_VENCIDA,
  destinoTrasLogin,
  esRutaProtegida,
  estadoHaciaLogin,
  inicioDe,
  leerEstadoDeRuta,
  rutaDeUbicacion,
} from './rutasDeSesion'

const base: AuthUser = { id: 1, name: 'Ana', email: 'ana@empresa.mx', role: 'admin', organization_id: 7 }
const rh: AuthUser = { ...base }
const sinEmpresa: AuthUser = { ...base, organization_id: null }
const operador: AuthUser = { ...base, is_platform_admin: true }

describe('rutasDeSesion', () => {
  it('rutaDeUbicacion junta pathname, búsqueda y ancla', () => {
    expect(rutaDeUbicacion({ pathname: '/app/creditos', search: '?pagina=2', hash: '#movimientos' })).toBe(
      '/app/creditos?pagina=2#movimientos',
    )
    expect(rutaDeUbicacion({ pathname: '/perfil' })).toBe('/perfil')
  })

  it('leerEstadoDeRuta acepta from como texto o como Location y descarta lo demás', () => {
    expect(leerEstadoDeRuta({ from: '/app', aviso: 'Hola' })).toEqual({ from: '/app', aviso: 'Hola' })
    expect(leerEstadoDeRuta({ from: { pathname: '/admin/usuarios', search: '?q=ana', hash: '' } })).toEqual({
      from: '/admin/usuarios?q=ana',
    })
    expect(leerEstadoDeRuta(null)).toEqual({})
    expect(leerEstadoDeRuta('texto')).toEqual({})
    expect(leerEstadoDeRuta({ from: 42, aviso: '   ' })).toEqual({})
    expect(leerEstadoDeRuta({ aviso: { texto: 'no' } })).toEqual({})
  })

  it('estadoHaciaLogin recuerda el origen y solo agrega el aviso si la sesión venció', () => {
    const ubicacion = { pathname: '/app/evaluaciones/3', search: '', hash: '' }
    expect(estadoHaciaLogin(ubicacion)).toEqual({ from: '/app/evaluaciones/3' })
    expect(estadoHaciaLogin(ubicacion, true)).toEqual({ from: '/app/evaluaciones/3', aviso: AVISO_SESION_VENCIDA })
  })

  it('esRutaProtegida reconoce /app, /admin y /perfil con sus subrutas, y nada más', () => {
    for (const ruta of ['/app', '/app/pruebas', '/admin', '/admin/creditos', '/perfil']) {
      expect(esRutaProtegida(ruta), ruta).toBe(true)
    }
    for (const ruta of ['/', '/apple', '/administracion', '/perfiles', '/pruebas', '/login', '/evaluar/abc']) {
      expect(esRutaProtegida(ruta), ruta).toBe(false)
    }
  })

  it('inicioDe conserva la redirección de siempre: /app con empresa, /perfil sin ella', () => {
    expect(inicioDe(rh)).toBe('/app')
    expect(inicioDe(sinEmpresa)).toBe('/perfil')
  })

  it('destinoTrasLogin vuelve a la ruta de origen si el usuario puede abrirla', () => {
    expect(destinoTrasLogin(rh, '/app/creditos?pagina=2#movimientos')).toBe('/app/creditos?pagina=2#movimientos')
    expect(destinoTrasLogin(sinEmpresa, '/perfil')).toBe('/perfil')
    expect(destinoTrasLogin(operador, '/admin/usuarios/5')).toBe('/admin/usuarios/5')
    expect(destinoTrasLogin(rh, '/pruebas/bigfive')).toBe('/pruebas/bigfive')
  })

  it('destinoTrasLogin usa el inicio si no hay origen o el usuario no puede abrirlo', () => {
    expect(destinoTrasLogin(rh)).toBe('/app')
    expect(destinoTrasLogin(sinEmpresa)).toBe('/perfil')
    expect(destinoTrasLogin(sinEmpresa, '/app/creditos')).toBe('/perfil')
    expect(destinoTrasLogin(rh, '/admin/creditos')).toBe('/app')
    // Una ruta que sube con «..» se resuelve antes de revisar permisos.
    expect(destinoTrasLogin(rh, '/app/../admin/usuarios')).toBe('/app')
  })

  it('destinoTrasLogin descarta rutas externas o que regresan al acceso', () => {
    for (const from of [
      'https://otro.sitio/app',
      '//otro.sitio/app',
      '/\\otro.sitio/app',
      '/\t/otro.sitio',
      'app/creditos',
      '',
      '/login',
      '/login?x=1',
      '/registro',
    ]) {
      expect(destinoTrasLogin(rh, from), JSON.stringify(from)).toBe('/app')
    }
  })
})
