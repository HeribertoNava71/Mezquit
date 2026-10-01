import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, type AxiosResponse } from 'axios'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { EstadoError } from './EstadoError'
import { estadoErrorTextos, getErrorKind, getErrorKindFromStatus, type EstadoErrorKind } from './errorKind'

const conRespuesta = (status: number) =>
  new AxiosError('Fallo', 'ERR_BAD_RESPONSE', undefined, undefined, { status } as AxiosResponse)

describe('EstadoError', () => {
  it('usa role="alert" y llama a onRetry con «Reintentar»', async () => {
    const user = userEvent.setup()
    const reintentar = vi.fn()
    render(<EstadoError kind="red" onRetry={reintentar} />)

    const alerta = screen.getByRole('alert')
    expect(alerta).toHaveTextContent(estadoErrorTextos.red.title)
    expect(alerta).toHaveTextContent(estadoErrorTextos.red.message)

    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(reintentar).toHaveBeenCalledTimes(1)
  })

  it.each(Object.keys(estadoErrorTextos) as EstadoErrorKind[])('kind="%s" trae textos por defecto en español', (kind) => {
    render(<EstadoError kind={kind} />)
    const alerta = screen.getByRole('alert')
    expect(alerta).toHaveTextContent(estadoErrorTextos[kind].title)
    expect(alerta).toHaveTextContent(estadoErrorTextos[kind].message)
    expect(alerta.querySelector('.st-estado__icon')).toHaveAttribute('aria-hidden', 'true')
  })

  it('sin onRetry no muestra el botón; título, mensaje y acción se sobrescriben', () => {
    render(
      <EstadoError
        kind="no-encontrado"
        title="Prueba no encontrada"
        message="Revisa el enlace o vuelve al catálogo."
        actions={<a href="/pruebas">Volver al catálogo</a>}
      />,
    )
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Prueba no encontrada')
    expect(screen.getByRole('alert')).not.toHaveTextContent(estadoErrorTextos['no-encontrado'].title)
    expect(screen.getByRole('link', { name: 'Volver al catálogo' })).toBeInTheDocument()
  })

  it('titleAs da un encabezado al error que ocupa la página', () => {
    render(<EstadoError kind="permiso" titleAs="h2" title="No tienes acceso a esta evaluación" />)
    const alerta = screen.getByRole('alert')
    const titulo = screen.getByRole('heading', { level: 2, name: 'No tienes acceso a esta evaluación' })
    expect(alerta).toContainElement(titulo)
    expect(alerta).toHaveClass('st-estado', 'st-estado-error')
  })

  it('retrying: el botón dice «Reintentando…», no responde y conserva el foco', async () => {
    const user = userEvent.setup()
    const reintentar = vi.fn()
    render(<EstadoError onRetry={reintentar} retrying />)

    const boton = screen.getByRole('button', { name: 'Reintentando…' })
    expect(boton).toHaveAttribute('aria-disabled', 'true')
    await user.click(boton)
    expect(reintentar).not.toHaveBeenCalled()
    expect(boton).toHaveFocus()
  })
})

describe('getErrorKind', () => {
  it('traduce el código HTTP al tipo de error', () => {
    expect(getErrorKindFromStatus(undefined)).toBe('red')
    expect(getErrorKindFromStatus(401)).toBe('sesion')
    expect(getErrorKindFromStatus(419)).toBe('sesion')
    expect(getErrorKindFromStatus(403)).toBe('permiso')
    expect(getErrorKindFromStatus(404)).toBe('no-encontrado')
    expect(getErrorKindFromStatus(409)).toBe('conflicto')
    expect(getErrorKindFromStatus(500)).toBe('servidor')
  })

  it('acepta ref en la caja con role="alert" (para enfocarla al reemplazar el contenido)', () => {
    const ref = createRef<HTMLDivElement>()
    render(<EstadoError ref={ref} kind="permiso" titleAs="h2" tabIndex={-1} />)
    expect(ref.current).toBe(screen.getByRole('alert'))
    expect(screen.getByRole('heading', { level: 2, name: estadoErrorTextos.permiso.title })).toBeInTheDocument()
  })

  it('reconoce errores de axios con y sin respuesta', () => {
    expect(getErrorKind(new AxiosError('Network Error', 'ERR_NETWORK'))).toBe('red')
    expect(getErrorKind(conRespuesta(403))).toBe('permiso')
    expect(getErrorKind(conRespuesta(503))).toBe('servidor')
    expect(getErrorKind(new Error('otro'))).toBe('servidor')
  })
})
