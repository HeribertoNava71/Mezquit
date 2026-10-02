import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api, { csrf } from '@/api/axios'
import ContactSection from './ContactSection'

vi.mock('@/api/axios', () => ({ default: { post: vi.fn() }, csrf: vi.fn() }))

// SITE.calendarUrl se puede cambiar por prueba: el bloque de agenda lo lee al dibujarse.
const sitio = vi.hoisted(() => ({ calendarUrl: '[PENDIENTE: enlace de agenda]' }))
vi.mock('@/config/site', async (importOriginal) => {
  const { SITE } = await importOriginal<typeof import('@/config/site')>()
  return {
    SITE: {
      ...SITE,
      get calendarUrl() {
        return sitio.calendarUrl
      },
    },
  }
})

/** Error de axios con el código HTTP y el cuerpo dados; sin código, un error de red. */
function errorHttp(status?: number, data: unknown = { message: '' }): AxiosError {
  if (status === undefined) return new AxiosError('Network Error', AxiosError.ERR_NETWORK)
  const respuesta = { status, statusText: '', data, headers: {}, config: { headers: new AxiosHeaders() } }
  return new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, undefined, undefined, respuesta as AxiosResponse)
}

/** Promesa que el test resuelve a mano. */
function pendiente<T>() {
  let resolver!: (valor: T) => void
  const promesa = new Promise<T>((res) => {
    resolver = res
  })
  return { promesa, resolver }
}

const DATOS = {
  name: 'Ana López',
  company: 'Comercializadora Río Claro',
  email: 'ana@rioclaro.mx',
  sector: 'manufactura',
  company_size: '51-250',
  evaluations_per_month: '50-200',
}

// Margen para equipos lentos: cada prueba llena seis campos.
const TIEMPO = 20_000

function montar() {
  render(
    <MemoryRouter>
      <ContactSection />
    </MemoryRouter>,
  )
  return userEvent.setup()
}

type Usuario = ReturnType<typeof userEvent.setup>

const campo = (nombre: string) => screen.getByRole('textbox', { name: nombre })
const lista = (nombre: string) => screen.getByRole('combobox', { name: nombre })
const enviarBoton = () => screen.getByRole('button', { name: /Solicitar información|Enviando…/ })

/** Escribe un texto de una vez (pegar): un solo evento de cambio por campo. */
async function escribir(user: Usuario, elemento: HTMLElement, texto: string) {
  await user.click(elemento)
  await user.paste(texto)
}

async function llenar(user: Usuario) {
  await escribir(user, campo('Nombre'), DATOS.name)
  await escribir(user, campo('Empresa'), DATOS.company)
  await escribir(user, campo('Correo electrónico'), DATOS.email)
  await user.selectOptions(lista('Sector'), DATOS.sector)
  await user.selectOptions(lista('Tamaño de empresa'), DATOS.company_size)
  await user.selectOptions(lista('Evaluaciones al mes'), DATOS.evaluations_per_month)
}

beforeEach(() => {
  sitio.calendarUrl = '[PENDIENTE: enlace de agenda]'
  vi.mocked(csrf).mockReset().mockResolvedValue(undefined)
  vi.mocked(api.post).mockReset()
})

describe('ContactSection · formulario de leads', () => {
  it('tiene los 6 campos obligatorios con sus etiquetas y opciones originales', () => {
    montar()
    const formulario = screen.getByRole('form', { name: '¿Listo para medir?' })
    expect(formulario).toHaveAttribute('novalidate')

    for (const nombre of ['Nombre', 'Empresa', 'Correo electrónico']) expect(campo(nombre)).toBeRequired()
    expect(campo('Correo electrónico')).toHaveAttribute('type', 'email')
    expect(campo('Nombre')).toHaveAttribute('placeholder', 'Tu nombre')
    expect(campo('Empresa')).toHaveAttribute('placeholder', 'Nombre de la empresa')
    expect(campo('Correo electrónico')).toHaveAttribute('placeholder', 'tu@empresa.com')

    const opciones = (nombre: string) =>
      within(lista(nombre))
        .getAllByRole('option')
        .map((opcion) => [(opcion as HTMLOptionElement).value, opcion.textContent])

    expect(lista('Sector')).toBeRequired()
    expect(opciones('Sector')).toEqual([
      ['', 'Selecciona…'],
      ['comercio', 'Comercio'],
      ['manufactura', 'Manufactura o maquila'],
      ['servicios', 'Servicios'],
      ['otro', 'Otro'],
    ])
    expect(opciones('Tamaño de empresa')).toEqual([
      ['', 'Selecciona…'],
      ['1-10', '1 – 10 personas'],
      ['11-50', '11 – 50 personas'],
      ['51-250', '51 – 250 personas'],
      ['250+', 'Más de 250'],
    ])
    expect(opciones('Evaluaciones al mes')).toEqual([
      ['', 'Selecciona…'],
      ['<10', 'Menos de 10'],
      ['10-50', '10 – 50'],
      ['50-200', '50 – 200'],
      ['200+', 'Más de 200'],
    ])
    expect(screen.getByText('Te respondemos en un día hábil.')).toBeInTheDocument()
  })

  it('envía: pide la cookie CSRF antes del POST /api/leads con los seis campos y muestra el éxito con el foco', async () => {
    vi.mocked(api.post).mockResolvedValue({ status: 201, data: { message: 'Tu solicitud fue recibida.' } })
    const user = montar()
    await llenar(user)
    await user.click(enviarBoton())

    expect(csrf).toHaveBeenCalledTimes(1)
    expect(api.post).toHaveBeenCalledWith('/api/leads', DATOS)
    expect(vi.mocked(csrf).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(api.post).mock.invocationCallOrder[0])

    const exito = await screen.findByRole('status')
    expect(exito).toHaveClass('st-callout--success')
    expect(exito.querySelector('.st-callout__icon svg')).not.toBeNull()
    expect(exito).toHaveTextContent('¡Gracias!')
    expect(exito).toHaveTextContent('Tu solicitud fue recibida. Te contactamos en un día hábil.')
    expect(exito).toHaveFocus()
    expect(screen.queryByRole('form')).not.toBeInTheDocument()
  }, TIEMPO)

  it('mientras envía: «Enviando…», aria-busy y sin un segundo POST', async () => {
    const respuesta = pendiente<{ status: number }>()
    vi.mocked(api.post).mockReturnValue(respuesta.promesa)
    const user = montar()
    await llenar(user)
    await user.click(enviarBoton())

    const boton = screen.getByRole('button', { name: 'Enviando…' })
    expect(boton).toHaveAttribute('aria-busy', 'true')
    await user.click(boton)
    await user.click(campo('Nombre'))
    await user.keyboard('{Enter}')
    expect(api.post).toHaveBeenCalledTimes(1)

    await act(async () => respuesta.resolver({ status: 201 }))
    expect(await screen.findByRole('status')).toHaveTextContent('¡Gracias!')
  }, TIEMPO)

  it('422: error por campo con ícono, foco en el primero con error y se borra al editar', async () => {
    vi.mocked(api.post).mockRejectedValue(
      errorHttp(422, {
        message: 'Revisa los datos.',
        errors: {
          email: ['El correo electrónico no es válido.'],
          sector: ['Elige un sector.'],
        },
      }),
    )
    const user = montar()
    await escribir(user, campo('Nombre'), DATOS.name)
    await escribir(user, campo('Correo electrónico'), 'ana@')
    await user.click(enviarBoton())

    const correo = campo('Correo electrónico')
    expect(correo).toHaveAttribute('aria-invalid', 'true')
    expect(correo).toHaveAccessibleDescription('El correo electrónico no es válido.')
    expect(correo).toHaveFocus()
    expect(lista('Sector')).toHaveAccessibleDescription('Elige un sector.')
    expect(campo('Nombre')).not.toHaveAttribute('aria-invalid')

    const errores = screen.getAllByRole('alert')
    expect(errores).toHaveLength(2)
    for (const error of errores) expect(error.querySelector('svg')).not.toBeNull()
    // Un 422 no es una falla de envío: no aparece el aviso con «Reintentar».
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument()

    await escribir(user, correo, 'rioclaro.mx')
    expect(correo).not.toHaveAttribute('aria-invalid')
    expect(screen.queryByText('El correo electrónico no es válido.')).not.toBeInTheDocument()
    expect(screen.getByText('Elige un sector.')).toBeInTheDocument()
  }, TIEMPO)

  it('error de red: aviso visible con ícono y «Reintentar» que vuelve a enviar', async () => {
    vi.mocked(api.post).mockRejectedValueOnce(errorHttp()).mockResolvedValueOnce({ status: 201 })
    const user = montar()
    await llenar(user)
    await user.click(enviarBoton())

    const aviso = await screen.findByRole('alert')
    expect(aviso).toHaveClass('st-callout--error')
    expect(aviso.querySelector('.st-callout__icon svg')).not.toBeNull()
    expect(aviso).toHaveTextContent('No pudimos enviar tu solicitud')
    expect(aviso).toHaveTextContent('Revisa tu conexión a internet e inténtalo de nuevo.')

    await user.click(within(aviso).getByRole('button', { name: 'Reintentar' }))
    expect(api.post).toHaveBeenCalledTimes(2)
    expect(api.post).toHaveBeenLastCalledWith('/api/leads', DATOS)
    expect(await screen.findByRole('status')).toHaveTextContent('¡Gracias!')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  }, TIEMPO)

  it('si falla la cookie CSRF tampoco se queda en silencio', async () => {
    vi.mocked(csrf).mockRejectedValue(errorHttp())
    const user = montar()
    await llenar(user)
    await user.click(enviarBoton())

    expect(await screen.findByRole('alert')).toHaveTextContent('Revisa tu conexión a internet')
    expect(api.post).not.toHaveBeenCalled()
    expect(enviarBoton()).toHaveAccessibleName('Solicitar información')
  }, TIEMPO)

  it.each([
    [419, 'La sesión del formulario expiró', 'Vuelve a enviarlo. Si el error sigue, recarga la página.'],
    [429, 'Demasiados intentos seguidos', 'Espera un momento y vuelve a enviarlo.'],
    [500, 'Ocurrió un error de nuestro lado', 'Tu solicitud no se envió. Inténtalo de nuevo en unos minutos.'],
    [503, 'Ocurrió un error de nuestro lado', 'Tu solicitud no se envió. Inténtalo de nuevo en unos minutos.'],
    [404, 'No pudimos enviar tu solicitud', 'Inténtalo de nuevo en unos minutos.'],
  ])('%i: aviso «%s» con «Reintentar»; los datos siguen en el formulario', async (status, titulo, texto) => {
    vi.mocked(api.post).mockRejectedValue(errorHttp(status))
    const user = montar()
    await llenar(user)
    await user.click(enviarBoton())

    const aviso = await screen.findByRole('alert')
    expect(aviso).toHaveTextContent(titulo)
    expect(aviso).toHaveTextContent(texto)
    expect(within(aviso).getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
    expect(campo('Nombre')).toHaveValue(DATOS.name)
    expect(lista('Sector')).toHaveValue(DATOS.sector)
  }, TIEMPO)

  it('422 sin errores de los campos: aviso general en lugar de silencio', async () => {
    vi.mocked(api.post).mockRejectedValue(errorHttp(422, { message: 'The given data was invalid.' }))
    const user = montar()
    await llenar(user)
    await user.click(enviarBoton())
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos validar tu solicitud')
  }, TIEMPO)
})

describe('ContactSection · agenda', () => {
  it('sin enlace real: el marcador pendiente a la vista y ningún botón a la agenda', () => {
    montar()
    const agenda = screen.getByRole('complementary', { name: 'Agenda una demo de 30 minutos' })
    expect(within(agenda).getByText('[PENDIENTE: enlace de agenda]')).toHaveClass('st-pendiente')
    expect(within(agenda).queryByRole('link')).not.toBeInTheDocument()
  })

  it('con enlace real: «Reservar tiempo» lleva a SITE.calendarUrl', () => {
    sitio.calendarUrl = 'https://cal.com/strata/demo'
    montar()
    const agenda = screen.getByRole('complementary', { name: 'Agenda una demo de 30 minutos' })
    expect(within(agenda).getByRole('link', { name: 'Reservar tiempo' })).toHaveAttribute(
      'href',
      'https://cal.com/strata/demo',
    )
    expect(within(agenda).queryByText(/PENDIENTE/)).not.toBeInTheDocument()
  })
})
