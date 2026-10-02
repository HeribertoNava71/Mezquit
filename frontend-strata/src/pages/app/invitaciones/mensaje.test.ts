import { describe, expect, it } from 'vitest'
import { ASUNTO_INVITACION, enlaceCorreo, enlaceWhatsApp, fechaNumerica, mensajeInvitacion } from './mensaje'

const INVITACION = {
  candidate: 'Ana López',
  email: 'ana.lopez@correo.com',
  link: 'http://localhost:5173/evaluar/8LtNq9s6T87PtfN6O5iQ?x=1&y=2',
}

/** Separa un mailto: en destinatario y parámetros ya decodificados. */
function leerMailto(href: string) {
  expect(href.startsWith('mailto:')).toBe(true)
  const [destino, consulta = ''] = href.slice('mailto:'.length).split('?')
  const parametros = Object.fromEntries(
    consulta.split('&').map((par) => {
      const [clave, valor = ''] = par.split('=')
      return [clave, decodeURIComponent(valor)]
    }),
  )
  return { destinatario: decodeURIComponent(destino), parametros, consulta }
}

describe('mensajeInvitacion', () => {
  it('saluda, lleva el enlace real y, si hay fecha límite, «Responde antes del dd/mm/aaaa»', () => {
    expect(mensajeInvitacion(INVITACION, null)).toEqual([
      'Hola, Ana López:',
      '',
      'Este es tu enlace personal para responder la evaluación:',
      INVITACION.link,
    ])
    expect(mensajeInvitacion(INVITACION, '2026-10-15').at(-1)).toBe('Responde antes del 15/10/2026.')
    expect(mensajeInvitacion(INVITACION, undefined)).toHaveLength(4)
  })

  it('sin nombre, saluda sin él', () => {
    expect(mensajeInvitacion({ ...INVITACION, candidate: '  ' })[0]).toBe('Hola:')
  })

  it('no promete resultados ni recordatorios (D-16, PB-28)', () => {
    const texto = mensajeInvitacion(INVITACION, '2026-10-15').join(' ')
    expect(texto).not.toMatch(/resultado|copia|recordatorio|recibirás/i)
  })
})

describe('fechaNumerica', () => {
  it('es el formato del correo del backend; un valor que no es fecha se deja tal cual', () => {
    expect(fechaNumerica('2026-10-05')).toBe('05/10/2026')
    expect(fechaNumerica('2026-10-05T00:00:00.000000Z')).toBe('05/10/2026')
    expect(fechaNumerica('próximamente')).toBe('próximamente')
  })
})

describe('enlaceCorreo', () => {
  it('abre un borrador al correo del candidato, con asunto y el enlace real en el cuerpo', () => {
    const href = enlaceCorreo(INVITACION, '2026-10-15')
    const { destinatario, parametros } = leerMailto(href)
    expect(href.startsWith('mailto:ana.lopez@correo.com?subject=')).toBe(true)
    expect(destinatario).toBe('ana.lopez@correo.com')
    expect(parametros.subject).toBe(ASUNTO_INVITACION)
    expect(parametros.body).toBe(mensajeInvitacion(INVITACION, '2026-10-15').join('\r\n'))
  })

  it('codifica espacios como %20 (no «+») y los saltos de línea como CRLF', () => {
    const { consulta } = leerMailto(enlaceCorreo(INVITACION))
    expect(consulta).not.toContain('+')
    expect(consulta).toContain('%20')
    expect(consulta).toContain('%0D%0A')
  })

  it('codifica los caracteres reservados del destinatario y conserva la arroba', () => {
    expect(enlaceCorreo({ ...INVITACION, email: 'ana+rh@acme.mx' }).startsWith('mailto:ana%2Brh@acme.mx?')).toBe(true)
  })
})

describe('enlaceWhatsApp', () => {
  it('es https://wa.me/?text= con el mensaje y el enlace codificados', () => {
    const url = new URL(enlaceWhatsApp(INVITACION, '2026-10-15'))
    expect(url.origin + url.pathname).toBe('https://wa.me/')
    expect(url.searchParams.get('text')).toBe(mensajeInvitacion(INVITACION, '2026-10-15').join('\n'))
  })
})
