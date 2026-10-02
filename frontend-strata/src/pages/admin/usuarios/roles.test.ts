import { describe, expect, it } from 'vitest'
import { ROLES, esRolConocido, etiquetaRol, tonoRol } from './roles'

describe('roles de usuario (R-33)', () => {
  it('traduce los tres roles que acepta el servidor', () => {
    expect(etiquetaRol('admin')).toBe('Administrador')
    expect(etiquetaRol('recruiter')).toBe('Reclutador')
    expect(etiquetaRol('viewer')).toBe('Visualizador')
  })

  it('las opciones del Select son exactamente admin, recruiter y viewer, en ese orden', () => {
    expect(ROLES).toEqual([
      { value: 'admin', label: 'Administrador' },
      { value: 'recruiter', label: 'Reclutador' },
      { value: 'viewer', label: 'Visualizador' },
    ])
  })

  it('un rol desconocido se muestra tal como llega; sin rol, «Sin rol»', () => {
    expect(etiquetaRol('auditor')).toBe('auditor')
    expect(etiquetaRol('')).toBe('Sin rol')
    expect(etiquetaRol(null)).toBe('Sin rol')
    expect(esRolConocido('auditor')).toBe(false)
    expect(esRolConocido('viewer')).toBe(true)
  })

  it('cada rol tiene su tono de Badge; uno desconocido, el neutro', () => {
    expect(tonoRol('admin')).toBe('navy')
    expect(tonoRol('recruiter')).toBe('sky')
    expect(tonoRol('viewer')).toBe('neutral')
    expect(tonoRol('auditor')).toBe('neutral')
    expect(tonoRol(undefined)).toBe('neutral')
  })
})
