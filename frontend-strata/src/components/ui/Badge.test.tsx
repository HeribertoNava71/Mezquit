import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Badge } from './Badge'
import { InvitationStatusBadge } from './InvitationStatusBadge'
import { getInvitationStatusMeta, INVITATION_STATUSES, isInvitationStatus } from './invitationStatus'

describe('Badge', () => {
  it('siempre lleva punto decorativo y texto, con el tono como clase', () => {
    render(<Badge tone="sky">En proceso</Badge>)
    const badge = screen.getByText('En proceso')
    expect(badge).toHaveClass('st-badge', 'st-badge--sky')
    const punto = badge.querySelector('.st-badge__dot')
    expect(punto).toHaveAttribute('aria-hidden', 'true')
  })

  it('usa el tono neutro y el tamaño md por defecto; sm es la pastilla compacta', () => {
    const { rerender } = render(<Badge>Borrador</Badge>)
    expect(screen.getByText('Borrador')).toHaveClass('st-badge--neutral')
    expect(screen.getByText('Borrador')).not.toHaveClass('st-badge--sm')
    rerender(<Badge size="sm">Borrador</Badge>)
    expect(screen.getByText('Borrador')).toHaveClass('st-badge--sm')
  })
})

describe('InvitationStatusBadge', () => {
  it.each([
    ['pendiente', 'Pendiente', 'st-badge--neutral'],
    ['iniciada', 'Iniciada', 'st-badge--sky'],
    ['completada', 'Completada', 'st-badge--navy'],
    ['expirada', 'Expirada', 'st-badge--coral'],
  ])('muestra «%s» como «%s»', (estado, texto, tono) => {
    render(<InvitationStatusBadge status={estado} />)
    const badge = screen.getByText(texto)
    expect(badge).toHaveClass('st-badge', tono)
    expect(badge).toHaveAttribute('data-status', estado)
    expect(badge.querySelector('.st-badge__dot')).toHaveAttribute('aria-hidden', 'true')
  })

  it('conserva un estado desconocido con su texto y tono neutro', () => {
    render(<InvitationStatusBadge status="cancelada" />)
    expect(screen.getByText('Cancelada')).toHaveClass('st-badge--neutral')
  })

  it('cada estado conocido tiene un texto distinto: el color nunca es lo único que lo distingue', () => {
    const textos = INVITATION_STATUSES.map((estado) => getInvitationStatusMeta(estado).label)
    expect(new Set(textos).size).toBe(INVITATION_STATUSES.length)
    expect(INVITATION_STATUSES.every(isInvitationStatus)).toBe(true)
    expect(isInvitationStatus('enviada')).toBe(false)
    expect(getInvitationStatusMeta('')).toEqual({ label: 'Sin estado', tone: 'neutral' })
  })
})
