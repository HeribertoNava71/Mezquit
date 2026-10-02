import { act, configure, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios'
import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { requestCredits } from '@/api/rh'
import { ToastProvider } from '@/components/ui'
import { SolicitarCreditos } from './SolicitarCreditos'
import { MENSAJE_EXITO, MENSAJE_TOAST } from './solicitud'

// Drawer «Solicitar créditos» (mapa.md, RH-4; D-09) con POST /api/credit-requests simulado.

vi.mock('@/api/rh', () => ({
  getCredits: vi.fn(),
  requestCredits: vi.fn(),
}))

// Pruebas de interacción: con varias suites en paralelo, jsdom y user-event
// pueden pasar de los 5 s por prueba y del segundo de espera de findBy*.
vi.setConfig({ testTimeout: 20_000 })
configure({ asyncUtilTimeout: 4_000 })

/** Error de axios con el código HTTP y el cuerpo dados; sin código, un error de red. */
function errorHttp(status?: number, data: unknown = {}): AxiosError {
  if (status === undefined) return new AxiosError('Network Error', AxiosError.ERR_NETWORK)
  const respuesta = { status, statusText: '', data, headers: {}, config: { headers: new AxiosHeaders() } }
  return new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, undefined, undefined, respuesta as AxiosResponse)
}

/** Promesa que se resuelve o rechaza a mano. */
function diferida() {
  let resolver: () => void = () => {}
  let rechazar: (error: unknown) => void = () => {}
  const promesa = new Promise<void>((res, rej) => {
    resolver = res
    rechazar = rej
  })
  return { promesa, resolver, rechazar }
}

function Arnes({ onClose }: { onClose: () => void }) {
  const [abierto, setAbierto] = useState(true)
  return (
    <>
      <button type="button" onClick={() => setAbierto(true)}>
        Abrir solicitud
      </button>
      <SolicitarCreditos
        open={abierto}
        onClose={() => {
          onClose()
          setAbierto(false)
        }}
      />
    </>
  )
}

function montar() {
  const onClose = vi.fn()
  render(
    <ToastProvider>
      <Arnes onClose={onClose} />
    </ToastProvider>,
  )
  return { user: userEvent.setup(), onClose }
}

const dialogo = () => screen.getByRole('dialog', { name: 'Solicitar créditos' })
const cantidad = () => screen.getByRole('spinbutton', { name: 'Cantidad de créditos' })
const nota = () => screen.getByRole('textbox', { name: 'Nota (opcional)' })
const enviar = () => screen.getByRole('button', { name: 'Enviar solicitud' })

beforeEach(() => {
  vi.mocked(requestCredits).mockReset().mockResolvedValue(undefined)
})

describe('SolicitarCreditos · formulario', () => {
  it('abre con la cantidad enfocada, en 1, y sin pagos, impuestos ni total', () => {
    montar()
    expect(dialogo()).toHaveAccessibleDescription('Un asesor revisa cada solicitud.')
    expect(cantidad()).toHaveFocus()
    expect(cantidad()).toHaveValue(1)
    expect(cantidad()).toHaveAccessibleDescription('1 crédito = 1 candidato invitado')
    expect(nota()).toHaveValue('')
    expect(within(dialogo()).getByText('Tu saldo se actualiza cuando se aprueba la solicitud.')).toBeInTheDocument()
    expect(within(dialogo()).queryByText(/pago|impuesto|total/i)).not.toBeInTheDocument()
  })

  it('cuenta los caracteres de la nota y la limita a 255 (PB-26)', async () => {
    const { user } = montar()
    expect(nota()).toHaveAttribute('maxlength', '255')
    expect(nota()).toHaveAccessibleDescription('0 de 255 caracteres')

    await user.type(nota(), 'Hola')
    expect(within(dialogo()).getByText('4/255')).toBeInTheDocument()

    fireEvent.change(nota(), { target: { value: 'x'.repeat(240) } })
    expect(within(dialogo()).getByText('240/255')).toBeInTheDocument()
    expect(within(dialogo()).getByText('Te quedan 15 caracteres.')).toBeInTheDocument()

    fireEvent.change(nota(), { target: { value: 'x'.repeat(255) } })
    expect(within(dialogo()).getByText('Llegaste al límite de 255 caracteres.')).toBeInTheDocument()
  })
})

describe('SolicitarCreditos · envío', () => {
  it('envía la cantidad y la nota con el contrato actual; al 201 confirma sin tocar el saldo', async () => {
    const { user } = montar()
    await user.clear(cantidad())
    await user.type(cantidad(), '12')
    await user.click(screen.getByRole('button', { name: 'Agregar un crédito' }))
    await user.type(nota(), '  Vacantes de octubre  ')
    await user.click(enviar())

    expect(requestCredits).toHaveBeenCalledTimes(1)
    expect(requestCredits).toHaveBeenCalledWith(13, 'Vacantes de octubre')

    // Callout de éxito con el texto del backend, anunciado por la región de estado.
    expect(within(dialogo()).getAllByText(MENSAJE_EXITO)).toHaveLength(2)
    expect(
      within(dialogo()).getByText('Pediste 13 créditos. Tu saldo no cambia hasta que se apruebe la solicitud.'),
    ).toBeInTheDocument()
    // Toast de confirmación (D-22).
    expect(screen.getByText(MENSAJE_TOAST)).toBeInTheDocument()
    // El formulario se va y el botón del pie pasa a «Cerrar», con el foco.
    expect(screen.queryByRole('spinbutton', { name: 'Cantidad de créditos' })).not.toBeInTheDocument()
    const pie = within(dialogo()).getAllByRole('button', { name: 'Cerrar' }).at(-1)
    expect(pie).toHaveFocus()
  })

  it('si se envía desde un campo (Enter), el foco no se pierde: pasa a «Cerrar»', async () => {
    montar()
    expect(cantidad()).toHaveFocus()
    await act(async () => {
      fireEvent.submit(cantidad().closest('form')!)
    })
    expect(requestCredits).toHaveBeenCalledWith(1, '')
    expect(within(dialogo()).getAllByRole('button', { name: 'Cerrar' }).at(-1)).toHaveFocus()
  })

  it('al cerrar después de enviar, el formulario vuelve a empezar', async () => {
    const { user, onClose } = montar()
    await user.click(screen.getByRole('button', { name: 'Agregar un crédito' }))
    await user.type(nota(), 'Urgente')
    await user.click(enviar())
    await user.click(within(dialogo()).getAllByRole('button', { name: 'Cerrar' }).at(-1)!)
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Abrir solicitud' }))
    expect(cantidad()).toHaveValue(1)
    expect(nota()).toHaveValue('')
  })

  it('cerrar sin enviar conserva lo escrito y quita los avisos', async () => {
    vi.mocked(requestCredits).mockRejectedValueOnce(errorHttp())
    const { user } = montar()
    await user.type(nota(), 'Borrador')
    await user.click(enviar())
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos enviar la solicitud')

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Abrir solicitud' }))
    expect(nota()).toHaveValue('Borrador')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('mientras envía, no cierra ni envía dos veces', async () => {
    const pendiente = diferida()
    vi.mocked(requestCredits).mockReturnValueOnce(pendiente.promesa)
    const { user, onClose } = montar()
    await user.click(enviar())
    const ocupado = screen.getByRole('button', { name: 'Enviando…' })
    expect(ocupado).toHaveAttribute('aria-busy', 'true')
    expect(ocupado).toHaveAttribute('aria-disabled', 'true')

    await user.click(ocupado)
    fireEvent.submit(cantidad().closest('form')!)
    await user.keyboard('{Escape}')
    expect(requestCredits).toHaveBeenCalledTimes(1)
    expect(onClose).not.toHaveBeenCalled()

    await act(async () => pendiente.resolver())
    expect(within(dialogo()).getAllByText(MENSAJE_EXITO)).toHaveLength(2)
  })
})

describe('SolicitarCreditos · errores', () => {
  it('un 422 muestra cada error junto a su campo, en español, y enfoca el primero', async () => {
    vi.mocked(requestCredits).mockRejectedValueOnce(
      errorHttp(422, {
        message: 'The requested amount field must be at least 1. (and 1 more error)',
        errors: {
          requested_amount: ['The requested amount field must be at least 1.'],
          note: ['The note field must not be greater than 500 characters.'],
        },
      }),
    )
    const { user } = montar()
    await user.type(nota(), 'Nota')
    await user.click(enviar())

    expect(cantidad()).toHaveAttribute('aria-invalid', 'true')
    expect(cantidad()).toHaveAccessibleDescription(/Escribe un número de 1 o más\./)
    expect(nota()).toHaveAttribute('aria-invalid', 'true')
    expect(nota()).toHaveAccessibleDescription(/Usa 500 caracteres o menos\./)
    expect(cantidad()).toHaveFocus()
    // Sin aviso general: los dos errores tienen campo.
    expect(within(dialogo()).queryByText('Revisa la solicitud')).not.toBeInTheDocument()

    // Al cambiar el campo, su error se quita.
    await user.click(screen.getByRole('button', { name: 'Agregar un crédito' }))
    expect(cantidad()).not.toHaveAttribute('aria-invalid')
  })

  it('un 422 sin errores de campo muestra el mensaje como aviso general', async () => {
    vi.mocked(requestCredits).mockRejectedValueOnce(errorHttp(422, { message: 'No hay una empresa asociada.' }))
    const { user } = montar()
    await user.click(enviar())
    const aviso = within(dialogo()).getByText('Revisa la solicitud').closest('[role="alert"]')
    expect(aviso).toHaveTextContent('No hay una empresa asociada.')
  })

  it.each([
    ['de red', undefined, 'Revisa tu conexión a internet e inténtalo de nuevo.'],
    ['del servidor', 500, 'Ocurrió un error de nuestro lado. Inténtalo de nuevo en unos minutos.'],
    ['de sesión', 401, 'Tu sesión expiró. Vuelve a entrar para continuar.'],
    ['de permiso', 403, 'Tu cuenta no tiene permiso para solicitar créditos.'],
  ])('un error %s se muestra en un Callout y se puede volver a enviar', async (_nombre, status, texto) => {
    vi.mocked(requestCredits).mockRejectedValueOnce(errorHttp(status))
    const { user } = montar()
    await user.click(enviar())

    const aviso = await screen.findByRole('alert')
    expect(aviso).toHaveTextContent('No pudimos enviar la solicitud')
    expect(aviso).toHaveTextContent(texto)
    expect(enviar()).not.toHaveAttribute('aria-disabled')
    expect(screen.queryByText(MENSAJE_TOAST)).not.toBeInTheDocument()

    await user.click(enviar())
    expect(requestCredits).toHaveBeenCalledTimes(2)
    expect(within(dialogo()).getAllByText(MENSAJE_EXITO)).toHaveLength(2)
    expect(screen.queryByText('No pudimos enviar la solicitud')).not.toBeInTheDocument()
  })
})
