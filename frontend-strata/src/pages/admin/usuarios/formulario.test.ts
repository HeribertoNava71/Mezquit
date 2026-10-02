import { describe, expect, it } from 'vitest'
import type { AdminUser } from '@/api/adminUsers'
import {
  erroresDelFormulario,
  formularioDesde,
  payloadDeActualizacion,
  primerCampoConError,
  usuarioTrasGuardar,
  validarFormulario,
  type FormularioUsuario,
} from './formulario'

const USUARIO: AdminUser = {
  id: 35,
  name: 'Natalia',
  last_name: 'Quiroga',
  email: 'natalia.quiroga@example.com',
  phone: '222 019 4410',
  birth_date: '1993-08-09T00:00:00.000000Z',
  position: 'Reclutadora',
  role: 'recruiter',
  created_at: '2026-09-04T16:40:27.000000Z',
  organization: { name: 'Panificadora La Espiga' },
}

const FORMULARIO: FormularioUsuario = {
  name: 'Natalia',
  last_name: 'Quiroga',
  phone: '222 019 4410',
  position: 'Reclutadora',
  role: 'recruiter',
}

describe('formulario de /admin/usuarios/:id', () => {
  it('parte de GET /api/admin/users/{id}; los null quedan vacíos', () => {
    expect(formularioDesde(USUARIO)).toEqual(FORMULARIO)
    const sinDatos = { ...USUARIO, last_name: null, phone: null, position: null } as unknown as AdminUser
    expect(formularioDesde(sinDatos)).toEqual({ ...FORMULARIO, last_name: '', phone: '', position: '' })
  })

  it('el payload de PATCH lleva exactamente name, last_name, phone, position y role', () => {
    const payload = payloadDeActualizacion(FORMULARIO)
    expect(payload).toStrictEqual({
      name: 'Natalia',
      last_name: 'Quiroga',
      phone: '222 019 4410',
      position: 'Reclutadora',
      role: 'recruiter',
    })
    expect(Object.keys(payload)).toEqual(['name', 'last_name', 'phone', 'position', 'role'])
  })

  it('no envía last_name si está vacío o solo tiene espacios (PB-27)', () => {
    expect(payloadDeActualizacion({ ...FORMULARIO, last_name: '' })).toStrictEqual({
      name: 'Natalia',
      phone: '222 019 4410',
      position: 'Reclutadora',
      role: 'recruiter',
    })
    expect(payloadDeActualizacion({ ...FORMULARIO, last_name: '   ' })).not.toHaveProperty('last_name')
  })

  it('teléfono y puesto vacíos se envían vacíos (el servidor los guarda como null)', () => {
    const payload = payloadDeActualizacion({ ...FORMULARIO, phone: '', position: '' })
    expect(payload).toMatchObject({ phone: '', position: '' })
  })

  it('el nombre es obligatorio antes de enviar', () => {
    expect(validarFormulario({ ...FORMULARIO, name: '  ' })).toEqual({ name: 'Escribe el nombre.' })
    expect(validarFormulario(FORMULARIO)).toEqual({})
  })

  it('después de guardar refleja lo que guarda el servidor: recorta, vacíos sin dato y last_name omitido se conserva', () => {
    const payload = payloadDeActualizacion({ ...FORMULARIO, name: ' Naty ', last_name: '', phone: '', role: 'viewer' })
    const guardado = usuarioTrasGuardar(USUARIO, payload)
    expect(guardado).toMatchObject({ name: 'Naty', last_name: 'Quiroga', role: 'viewer', position: 'Reclutadora' })
    expect(guardado.phone).toBeUndefined()
    // Lo que no se edita aquí no cambia.
    expect(guardado).toMatchObject({ email: USUARIO.email, created_at: USUARIO.created_at, organization: USUARIO.organization })
  })

  it('toma del 422 solo los errores de sus campos y ubica el primero en el orden de la pantalla', () => {
    const errores = erroresDelFormulario({ role: 'The selected role is invalid.', phone: 'Máximo 30.', email: 'otro' })
    expect(errores).toEqual({ role: 'The selected role is invalid.', phone: 'Máximo 30.' })
    expect(primerCampoConError(errores)).toBe('phone')
    expect(erroresDelFormulario(null)).toEqual({})
    expect(primerCampoConError({})).toBeNull()
  })
})
