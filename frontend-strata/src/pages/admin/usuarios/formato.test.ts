import { describe, expect, it } from 'vitest'
import { fechaCorta, fechaDeCalendario, fechaLarga, nombreCompleto } from './formato'

describe('nombreCompleto', () => {
  it('une nombre y apellido sin espacios de más', () => {
    expect(nombreCompleto({ name: ' Ana Lucía ', last_name: 'Treviño ', email: 'a@x.com' })).toBe('Ana Lucía Treviño')
  })

  it('sin apellido (PB-27: last_name null) usa solo el nombre', () => {
    expect(nombreCompleto({ name: 'Op', last_name: null, email: 'op@x.com' })).toBe('Op')
  })

  it('sin nombre ni apellido usa el correo', () => {
    expect(nombreCompleto({ name: '', last_name: null, email: 'sin@nombre.mx' })).toBe('sin@nombre.mx')
  })
})

describe('fechas', () => {
  // A mediodía UTC, el día es el mismo en cualquier zona entre UTC-11 y UTC+11.
  it('fechaCorta usa el formato del prototipo, con microsegundos de Laravel', () => {
    expect(fechaCorta('2026-10-01T12:00:00.000000Z')).toEqual({ texto: '01 oct 2026', iso: '2026-10-01' })
    expect(fechaCorta('2026-09-12T12:30:00Z')).toEqual({ texto: '12 sep 2026', iso: '2026-09-12' })
  })

  it('fechaLarga escribe el mes completo y el día sin cero', () => {
    expect(fechaLarga('2026-09-02T12:00:00.000000Z')).toEqual({ texto: '2 de septiembre de 2026', iso: '2026-09-02' })
  })

  it('la fecha de nacimiento no cambia de día por la zona horaria', () => {
    // Laravel manda las columnas date como medianoche UTC.
    expect(fechaDeCalendario('1985-09-21T00:00:00.000000Z')).toEqual({
      texto: '21 de septiembre de 1985',
      iso: '1985-09-21',
    })
    expect(fechaDeCalendario('1990-05-14')).toEqual({ texto: '14 de mayo de 1990', iso: '1990-05-14' })
  })

  it('sin valor o con un valor que no es fecha devuelven null', () => {
    expect(fechaCorta(null)).toBeNull()
    expect(fechaCorta('no es fecha')).toBeNull()
    expect(fechaLarga(undefined)).toBeNull()
    expect(fechaDeCalendario(null)).toBeNull()
    expect(fechaDeCalendario('1990-02-31')).toBeNull()
  })
})
