import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Fecha } from './Fecha'
import { formatearFecha } from './formatoFecha'

describe('formatearFecha', () => {
  it('usa el formato del prototipo, «04 sep 2026», con el día en dos cifras y su fecha ISO', () => {
    expect(formatearFecha('2026-09-04')).toEqual({ texto: '04 sep 2026', hora: null, iso: '2026-09-04' })
    expect(formatearFecha('2026-01-15')).toEqual({ texto: '15 ene 2026', hora: null, iso: '2026-01-15' })
    expect(formatearFecha('2026-12-31')).toEqual({ texto: '31 dic 2026', hora: null, iso: '2026-12-31' })
  })

  it('conserva la hora tal como llega, sin cambiar de zona', () => {
    expect(formatearFecha('2026-09-02 10:15')).toEqual({ texto: '02 sep 2026', hora: '10:15', iso: '2026-09-02T10:15' })
    expect(formatearFecha('2026-10-01T23:30:00.000000Z')).toEqual({
      texto: '01 oct 2026',
      hora: '23:30',
      iso: '2026-10-01T23:30',
    })
  })

  it('sin valor devuelve null', () => {
    expect(formatearFecha(null)).toBeNull()
    expect(formatearFecha(undefined)).toBeNull()
    expect(formatearFecha('  ')).toBeNull()
  })

  it('un texto que no es fecha se conserva tal cual, sin ISO', () => {
    expect(formatearFecha('próximamente')).toEqual({ texto: 'próximamente', hora: null, iso: null })
    expect(formatearFecha('2026-13-01')).toEqual({ texto: '2026-13-01', hora: null, iso: null })
    expect(formatearFecha('2026-02-00')).toEqual({ texto: '2026-02-00', hora: null, iso: null })
    expect(formatearFecha('2026-02-10 25:00')).toEqual({ texto: '2026-02-10 25:00', hora: null, iso: null })
  })
})

describe('Fecha', () => {
  it('pinta la fecha en un <time> con su dateTime', () => {
    render(<Fecha valor="2026-10-15" className="extra" />)
    const fecha = screen.getByText('15 oct 2026')
    expect(fecha.tagName).toBe('TIME')
    expect(fecha).toHaveAttribute('datetime', '2026-10-15')
    expect(fecha).toHaveClass('st-fecha', 'extra')
  })

  it('con conHora agrega la hora que trae el valor', () => {
    render(<Fecha valor="2026-09-27 11:42" conHora />)
    expect(screen.getByText('27 sep 2026, 11:42')).toHaveAttribute('datetime', '2026-09-27T11:42')
  })

  it('sin fecha muestra una raya y «Sin fecha» para lectores, o el texto de vacio', () => {
    const { container, rerender } = render(<Fecha valor={null} />)
    expect(container.firstElementChild).toHaveTextContent('—Sin fecha')
    expect(container.querySelector('[aria-hidden="true"]')).toHaveTextContent('—')
    expect(container.querySelector('time')).toBeNull()

    rerender(<Fecha valor="" vacio="Sin fecha límite" />)
    expect(container.firstElementChild).toHaveTextContent(/^Sin fecha límite$/)
  })

  it('un valor que no es fecha se muestra tal cual, sin <time>', () => {
    const { container } = render(<Fecha valor="pendiente" />)
    expect(container.firstElementChild?.tagName).toBe('SPAN')
    expect(container.firstElementChild).toHaveTextContent('pendiente')
  })
})
