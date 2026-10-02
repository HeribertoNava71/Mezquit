import { describe, expect, it } from 'vitest'
import {
  ENLACES_ADMIN,
  ENLACES_PUBLICOS,
  ENLACES_RH,
  esResultados,
  nombreVisible,
  opcionesDeCuenta,
  type OpcionCuenta,
} from './navegacion'

const etiquetas = (opciones: OpcionCuenta[]) => opciones.map((opcion) => opcion.label)

describe('enlaces por rol (D-06 A)', () => {
  it('barra pública: Tests, Para empresas, Cómo funciona y Precios con sus rutas', () => {
    expect(ENLACES_PUBLICOS.map(({ label, to }) => [label, to])).toEqual([
      ['Tests', '/pruebas'],
      ['Para empresas', '/demo'],
      ['Cómo funciona', '/como-funciona'],
      ['Precios', '/precios'],
    ])
  })

  it('barra de RR. HH.: Tests, Créditos, Candidatos y Resultados', () => {
    expect(ENLACES_RH.map(({ label, to }) => [label, to])).toEqual([
      ['Tests', '/app/pruebas'],
      ['Créditos', '/app/creditos'],
      ['Candidatos', '/app/evaluaciones'],
      ['Resultados', '/app'],
    ])
  })

  it('barra de super admin: Solicitudes y Usuarios, sin el Test Builder (PB-20)', () => {
    expect(ENLACES_ADMIN.map(({ label, to }) => [label, to])).toEqual([
      ['Solicitudes', '/admin/creditos'],
      ['Usuarios', '/admin/usuarios'],
    ])
    const nombres = ENLACES_ADMIN.map(({ label }) => label)
    expect(nombres).not.toContain('Test Builder')
    expect(nombres).not.toContain('Reactivos')
    expect(nombres).not.toContain('Algoritmos')
  })

  it.each([
    ['/app', true],
    ['/app/', true],
    ['/APP', true],
    ['/app/candidatos/12/reporte', true],
    ['/app/evaluaciones', false],
    ['/app/evaluaciones/3', false],
    ['/app/creditos', false],
    ['/app/pruebas', false],
    ['/application', false],
  ])('Resultados está activo en «%s»: %s', (ruta, activo) => {
    expect(esResultados(ruta)).toBe(activo)
  })
})

describe('opcionesDeCuenta', () => {
  const sinNada = { organization_id: null, is_platform_admin: false }
  const conOrganizacion = { organization_id: 7, is_platform_admin: false }
  const operador = { organization_id: 1, is_platform_admin: true }
  const operadorSinOrganizacion = { organization_id: null, is_platform_admin: true }

  it('pública sin organización: Mi perfil y Salir, sin Panel de RR. HH. ni Operación', () => {
    expect(etiquetas(opcionesDeCuenta('publica', sinNada))).toEqual(['Mi perfil', 'Salir'])
  })

  it('pública con organización: agrega Panel de RR. HH. → /app', () => {
    const opciones = opcionesDeCuenta('publica', conOrganizacion)
    expect(etiquetas(opciones)).toEqual(['Mi perfil', 'Panel de RR. HH.', 'Salir'])
    expect(opciones[1]).toMatchObject({ tipo: 'enlace', to: '/app' })
  })

  it('pública del operador: agrega Operación → /admin/creditos', () => {
    const opciones = opcionesDeCuenta('publica', operador)
    expect(etiquetas(opciones)).toEqual(['Mi perfil', 'Panel de RR. HH.', 'Operación', 'Salir'])
    expect(opciones[2]).toMatchObject({ tipo: 'enlace', to: '/admin/creditos' })
    expect(etiquetas(opcionesDeCuenta('publica', operadorSinOrganizacion))).toEqual(['Mi perfil', 'Operación', 'Salir'])
  })

  it('RR. HH.: Mi perfil, Sitio público y Salir; Operación solo con is_platform_admin', () => {
    expect(etiquetas(opcionesDeCuenta('rh', conOrganizacion))).toEqual(['Mi perfil', 'Sitio público', 'Salir'])
    expect(etiquetas(opcionesDeCuenta('rh', operador))).toEqual(['Mi perfil', 'Operación', 'Sitio público', 'Salir'])
  })

  it('super admin: Mi perfil de operador → /admin/perfil; Panel de RR. HH. solo con organización', () => {
    const opciones = opcionesDeCuenta('admin', operador)
    expect(etiquetas(opciones)).toEqual(['Mi perfil de operador', 'Panel de RR. HH.', 'Sitio público', 'Salir'])
    expect(opciones[0]).toMatchObject({ to: '/admin/perfil' })
    expect(opciones[2]).toMatchObject({ to: '/' })
    expect(etiquetas(opcionesDeCuenta('admin', operadorSinOrganizacion))).toEqual([
      'Mi perfil de operador',
      'Sitio público',
      'Salir',
    ])
  })

  it('Salir siempre va al final', () => {
    for (const zona of ['publica', 'rh', 'admin'] as const) {
      const opciones = opcionesDeCuenta(zona, operador)
      expect(opciones.at(-1)).toEqual({ tipo: 'salir', label: 'Salir' })
    }
  })
})

describe('nombreVisible', () => {
  it('une nombre y apellido sin espacios de más', () => {
    expect(nombreVisible({ name: ' Valentina ', last_name: 'Ríos', email: 'v@acme.mx' })).toBe('Valentina Ríos')
  })

  it('sin apellido usa solo el nombre', () => {
    expect(nombreVisible({ name: 'Operador Mez', email: 'admin@mez.dev' })).toBe('Operador Mez')
  })

  it('sin nombre ni apellido usa el correo', () => {
    expect(nombreVisible({ name: '', last_name: '', email: 'sin.nombre@acme.mx' })).toBe('sin.nombre@acme.mx')
  })
})
