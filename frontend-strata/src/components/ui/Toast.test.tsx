import { act, fireEvent, render, renderHook, screen, within } from '@testing-library/react'
import { useEffect, useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Drawer } from './Drawer'
import { ToastProvider } from './Toast'
import { TOAST_DURATION, useToast, type ToastApi } from './useToast'

/** Entrega la API de useToast a la prueba. */
function Sonda({ alMontar }: { alMontar: (api: ToastApi) => void }) {
  const api = useToast()
  useEffect(() => {
    alMontar(api)
  }, [api, alMontar])
  return null
}

/** Monta el proveedor y devuelve la API de useToast para dispararla desde la prueba. */
function montar(props: { max?: number; duration?: number } = {}) {
  let api: ToastApi | null = null
  render(
    <ToastProvider {...props}>
      <Sonda
        alMontar={(recibida) => {
          api = recibida
        }}
      />
    </ToastProvider>,
  )
  const toast = (...args: Parameters<ToastApi['toast']>) => {
    let id = 0
    act(() => {
      id = api!.toast(...args)
    })
    return id
  }
  const dismiss = (id: number) => act(() => api!.dismiss(id))
  return { toast, dismiss }
}

const region = () => screen.getByRole('status')
const avanzar = (ms: number) => act(() => vi.advanceTimersByTime(ms))

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('la región role="status" (aria-live polite) existe antes del primer toast y lo anuncia', () => {
    const { toast } = montar()
    expect(region()).toHaveAttribute('aria-live', 'polite')
    expect(region()).toBeEmptyDOMElement()
    expect(document.body).toContainElement(region())

    toast({ message: 'Enlace copiado' })
    expect(within(region()).getByText('Enlace copiado')).toBeInTheDocument()
    expect(region().querySelector('.st-toast__dot')).toBeInTheDocument()
  })

  it('se cierra solo a los 2600 ms por defecto', () => {
    const { toast } = montar()
    toast({ message: 'Solicitud registrada', tone: 'success' })

    avanzar(TOAST_DURATION - 1)
    expect(screen.getByText('Solicitud registrada')).toBeInTheDocument()
    avanzar(1)
    expect(screen.queryByText('Solicitud registrada')).not.toBeInTheDocument()
    expect(TOAST_DURATION).toBe(2600)
  })

  it('respeta la duración propia y la del proveedor', () => {
    const { toast } = montar({ duration: 4000 })
    toast({ message: 'Del proveedor' })
    toast({ message: 'Propia', duration: 1000 })

    avanzar(1000)
    expect(screen.queryByText('Propia')).not.toBeInTheDocument()
    expect(screen.getByText('Del proveedor')).toBeInTheDocument()
    avanzar(3000)
    expect(screen.queryByText('Del proveedor')).not.toBeInTheDocument()
  })

  it('apila como máximo tres y quita el más antiguo', () => {
    const { toast } = montar()
    toast({ message: 'Uno' })
    toast({ message: 'Dos' })
    toast({ message: 'Tres' })
    toast({ message: 'Cuatro' })

    const textos = Array.from(region().querySelectorAll('.st-toast')).map((nodo) => nodo.textContent)
    expect(textos).toEqual(['Dos', 'Tres', 'Cuatro'])
  })

  it('un mensaje igual al visible lo reemplaza en lugar de apilarse', () => {
    const { toast } = montar()
    toast({ message: 'Enlace copiado' })
    avanzar(2000)
    toast({ message: 'Enlace copiado' })

    expect(screen.getAllByText('Enlace copiado')).toHaveLength(1)
    avanzar(2000)
    expect(screen.getByText('Enlace copiado')).toBeInTheDocument()
    avanzar(600)
    expect(screen.queryByText('Enlace copiado')).not.toBeInTheDocument()
  })

  it('se pausa con el puntero encima y retoma al salir', () => {
    const { toast } = montar()
    toast({ message: 'Reenviado' })
    const caja = screen.getByText('Reenviado').closest('.st-toast')!

    fireEvent.mouseEnter(caja)
    avanzar(10_000)
    expect(screen.getByText('Reenviado')).toBeInTheDocument()

    fireEvent.mouseLeave(caja)
    avanzar(TOAST_DURATION)
    expect(screen.queryByText('Reenviado')).not.toBeInTheDocument()
  })

  it('el tono error lleva ícono y «Error:» para lectores de pantalla; dismiss lo cierra', () => {
    const { toast, dismiss } = montar()
    const id = toast({ message: 'No se pudo copiar el enlace', tone: 'error', duration: Infinity })

    const caja = screen.getByText(/No se pudo copiar el enlace/).closest('.st-toast')!
    expect(caja).toHaveClass('st-toast--error')
    expect(caja).toHaveTextContent('Error: No se pudo copiar el enlace')
    expect(caja.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')

    avanzar(60_000)
    expect(caja).toBeInTheDocument()
    dismiss(id)
    expect(region()).toBeEmptyDOMElement()
  })

  it('con un drawer a pantalla completa (360 px), el toast sube sobre su pie y no tapa «Cerrar» (Fase 8)', () => {
    // jsdom no calcula cajas: se simulan las de un drawer de 360 × 800 px.
    const cajas: Record<string, [number, number, number, number]> = {
      'st-drawer': [0, 0, 360, 800],
      pie: [0, 708, 360, 800],
      cerrar: [22, 726, 338, 770],
      x: [306, 20, 338, 52],
      'st-toast': [50, 728, 310, 774],
    }
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      const clave =
        Object.keys(cajas).find((nombre) => this.classList.contains(nombre)) ??
        (this.hasAttribute('data-overlay-pie') ? 'pie' : this.getAttribute('aria-label') === 'Cerrar' ? 'x' : this.textContent === 'Cerrar' ? 'cerrar' : null)
      const [left, top, right, bottom] = clave ? cajas[clave] : [0, 0, 0, 0]
      return { left, top, right, bottom, x: left, y: top, width: right - left, height: bottom - top, toJSON: () => ({}) } as DOMRect
    })
    vi.stubGlobal('innerWidth', 360)
    vi.stubGlobal('innerHeight', 800)

    let api: ToastApi | null = null
    function ConDrawer() {
      const [abierto, setAbierto] = useState(true)
      return (
        <Drawer open={abierto} onClose={() => setAbierto(false)} title="Solicitar créditos" footer={<button type="button" onClick={() => setAbierto(false)}>Cerrar</button>}>
          <p>Solicitud registrada.</p>
        </Drawer>
      )
    }
    render(
      <ToastProvider>
        <Sonda alMontar={(recibida) => (api = recibida)} />
        <ConDrawer />
      </ToastProvider>,
    )
    act(() => {
      api!.toast({ message: 'Solicitud registrada', tone: 'success' })
    })
    expect(region()).toHaveAttribute('data-posicion', 'abajo')
    expect(region().style.bottom).toBe(`${800 - 708 + 12}px`)

    // Al cerrar el drawer, la región vuelve a la posición del CSS.
    fireEvent.click(screen.getByText('Cerrar'))
    expect(region()).not.toHaveAttribute('data-posicion')
    expect(region().style.bottom).toBe('')
    vi.unstubAllGlobals()
  })

  it('useToast fuera del proveedor lanza un error claro', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useToast())).toThrow(/ToastProvider/)
  })
})
