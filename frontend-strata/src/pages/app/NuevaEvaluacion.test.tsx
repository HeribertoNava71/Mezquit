import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createAssessment, type InvitationLink } from '@/api/assessments'
import { getCredits, type CreditsData } from '@/api/rh'
import { avisarCambioDeCreditos } from '@/components/layout/topbar/datosBarra'
import { ToastProvider } from '@/components/ui'
import NuevaEvaluacion from './NuevaEvaluacion'

// Asistente de nueva evaluación con src/api simulado. Formas de
// AssessmentController::store (2026-09-12-fase2-panel-rh.md:412-459) y de
// e2e/mocks/rh.json.

vi.mock('@/api/assessments', () => ({ createAssessment: vi.fn() }))
vi.mock('@/api/rh', () => ({ getCredits: vi.fn() }))
vi.mock('@/components/layout/topbar/datosBarra', () => ({ avisarCambioDeCreditos: vi.fn() }))

// Cada prueba recorre varios pasos del asistente: con la máquina ocupada
// (otras suites en paralelo) los 5 s por defecto no alcanzan.
vi.setConfig({ testTimeout: 30_000 })

type Usuario = ReturnType<typeof userEvent.setup>

const INVITACIONES: InvitationLink[] = [
  {
    id: 62,
    candidate: 'Karla Estrada',
    email: 'karla.estrada@example.com',
    status: 'pendiente',
    link: 'http://localhost:5173/evaluar/8LtNq9s6T87PtfN6O5iQDAxrr5rRcxrN2YFvuxha',
  },
  {
    id: 63,
    candidate: 'Luis Fernando Ortiz',
    email: 'luisfernando.ortiz@example.com',
    status: 'pendiente',
    link: 'http://localhost:5173/evaluar/rxyecmkRjMt9jeLJ2L3zN2m42yoelhXCyxwfHJWn',
  },
]

/** Error de axios con el código HTTP y el cuerpo dados; sin código, un error de red. */
function errorHttp(status?: number, data: unknown = {}): AxiosError {
  if (status === undefined) return new AxiosError('Network Error', AxiosError.ERR_NETWORK)
  const respuesta = { status, statusText: '', data, headers: {}, config: { headers: new AxiosHeaders() } }
  return new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, undefined, undefined, respuesta as AxiosResponse)
}

function saldo(balance: number) {
  vi.mocked(getCredits).mockResolvedValue({ balance, transactions: [] })
}

function montar(): Usuario {
  // Sin pausa entre acciones: las pruebas recorren varios pasos.
  const user = userEvent.setup({ delay: null })
  render(
    <MemoryRouter initialEntries={['/app/evaluaciones/nueva']}>
      <ToastProvider>
        <Routes>
          <Route path="/app/evaluaciones/nueva" element={<NuevaEvaluacion />} />
          <Route path="/app/evaluaciones/:id" element={<h1>Detalle de la evaluación</h1>} />
        </Routes>
      </ToastProvider>
    </MemoryRouter>,
  )
  return user
}

const boton = (nombre: string | RegExp) => screen.getByRole('button', { name: nombre })
const tituloPaso = (nombre: string) => screen.findByRole('heading', { level: 2, name: nombre })
const candidato = (n: number) => within(screen.getByRole('group', { name: `Candidato ${n}` }))
const campoNombre = () => screen.getByRole('textbox', { name: 'Nombre de la evaluación' })

/** Bloque del paso Confirmar por su encabezado (h3). */
function seccion(titulo: string): HTMLElement {
  const bloque = screen.getByRole('heading', { level: 3, name: titulo }).closest('section')
  if (!bloque) throw new Error(`Sin sección para «${titulo}»`)
  return bloque
}

/** Escribe pegando el texto en el campo: un solo evento en lugar de uno por tecla. */
async function escribir(user: Usuario, campo: HTMLElement, texto: string) {
  await user.click(campo)
  await user.paste(texto)
}

async function llenarDatos(user: Usuario, nombre = 'Vendedores Q4', puesto = 'Ejecutivo de ventas') {
  await escribir(user, campoNombre(), nombre)
  if (puesto) await escribir(user, screen.getByRole('textbox', { name: 'Puesto' }), puesto)
  await user.click(boton('Siguiente'))
  await tituloPaso('Prueba')
}

async function llenarCandidato(user: Usuario, n: number, nombre: string, correo: string, telefono = '') {
  const fila = candidato(n)
  await escribir(user, fila.getByRole('textbox', { name: 'Nombre' }), nombre)
  await escribir(user, fila.getByRole('textbox', { name: 'Correo' }), correo)
  if (telefono) await escribir(user, fila.getByRole('textbox', { name: 'Teléfono' }), telefono)
}

/** Recorre los tres primeros pasos con dos candidatos y llega a Confirmar. */
async function hastaConfirmar(user: Usuario) {
  await llenarDatos(user)
  await user.click(boton('Siguiente'))
  await tituloPaso('Candidatos')
  await llenarCandidato(user, 1, 'Karla Estrada', 'karla.estrada@example.com')
  await user.click(boton('Agregar otro'))
  await llenarCandidato(user, 2, 'Luis Fernando Ortiz', 'luisfernando.ortiz@example.com', '55 1234 5678')
  await user.click(boton('Siguiente'))
  await tituloPaso('Confirma y envía')
}

beforeEach(() => {
  saldo(37)
  vi.mocked(createAssessment).mockResolvedValue({ id: 18, name: 'Vendedores Q4', invitations: INVITACIONES })
})

describe('NuevaEvaluacion · pasos', () => {
  it('muestra el encabezado, las pastillas y el paso Datos; Cancelar vuelve a Candidatos', () => {
    montar()
    expect(screen.getByRole('heading', { level: 1, name: 'Nueva evaluación' })).toBeInTheDocument()
    expect(screen.getByText('Paso 1 de 4 · Datos')).toBeInTheDocument()
    const pasos = screen.getByRole('list', { name: 'Pasos para crear la evaluación' })
    expect(within(pasos).getAllByRole('listitem')).toHaveLength(4)
    expect(screen.getByRole('heading', { level: 2, name: 'Datos de la evaluación' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Cancelar' })).toHaveAttribute('href', '/app/evaluaciones')
    expect(getCredits).not.toHaveBeenCalled()
  })

  it('paso 1: no avanza sin nombre, marca el campo y lleva el foco; con Enter avanza', async () => {
    const user = montar()
    await user.click(boton('Siguiente'))

    expect(screen.getByRole('heading', { level: 2, name: 'Datos de la evaluación' })).toBeInTheDocument()
    expect(campoNombre()).toHaveAccessibleDescription(/Escribe el nombre de la evaluación\./)
    expect(campoNombre()).toHaveAttribute('aria-invalid', 'true')
    expect(campoNombre()).toHaveFocus()

    await user.type(campoNombre(), 'Vendedores Q4{Enter}')
    expect(await tituloPaso('Prueba')).toHaveFocus()
    expect(screen.getByText('Paso 2 de 4 · Prueba')).toBeInTheDocument()
  })

  it('paso 2: la prueba fija (id 1) aparece elegida, con la explicación', async () => {
    const user = montar()
    await llenarDatos(user)
    const prueba = screen.getByRole('radio', { name: 'Prueba de demostración' })
    expect(prueba).toBeChecked()
    expect(prueba).toHaveAccessibleDescription(/12 reactivos · 3 escalas/)
    expect(screen.getAllByRole('radio')).toHaveLength(1)
    expect(screen.getByText(/Por ahora es la única prueba que puedes asignar/)).toBeInTheDocument()

    await user.click(boton('Atrás'))
    expect(await tituloPaso('Datos de la evaluación')).toBeInTheDocument()
    expect(campoNombre()).toHaveValue('Vendedores Q4')
  })

  it('paso 3: exige un candidato, valida el correo en vivo y deja agregar y quitar filas', async () => {
    const user = montar()
    await llenarDatos(user)
    await user.click(boton('Siguiente'))
    await tituloPaso('Candidatos')
    expect(screen.getByText('Cada candidato usa 1 crédito.')).toBeInTheDocument()

    await user.click(boton('Siguiente'))
    expect(screen.getByText('Agrega al menos un candidato con nombre y correo.')).toBeInTheDocument()
    expect(candidato(1).getByRole('textbox', { name: 'Nombre' })).toHaveFocus()

    // Correo: error al salir del campo; se quita en vivo al corregirlo.
    const correo = candidato(1).getByRole('textbox', { name: 'Correo' })
    await user.type(correo, 'karla@correo')
    await user.tab()
    expect(correo).toHaveAccessibleDescription(/Escribe un correo válido/)
    await user.type(correo, '.com')
    expect(correo).not.toHaveAccessibleDescription(/Escribe un correo válido/)
    expect(correo).not.toHaveAttribute('aria-invalid')

    await user.click(boton('Agregar otro'))
    expect(candidato(2).getByRole('textbox', { name: 'Nombre' })).toHaveFocus()
    // La fila vacía no cuenta: solo la que tiene datos usa crédito.
    expect(screen.getByText('1 candidato · 1 crédito')).toBeInTheDocument()

    await user.click(boton('Quitar candidato 2'))
    expect(screen.queryByRole('group', { name: 'Candidato 2' })).not.toBeInTheDocument()
    // Con una sola fila no se ofrece quitarla.
    expect(screen.queryByRole('button', { name: /Quitar/ })).not.toBeInTheDocument()

    // Falta el nombre de la única fila: no avanza y el foco va al campo.
    await user.click(boton('Siguiente'))
    const nombre = candidato(1).getByRole('textbox', { name: 'Nombre' })
    expect(nombre).toHaveAccessibleDescription(/Escribe el nombre del candidato\./)
    expect(nombre).toHaveFocus()
    await escribir(user, nombre, 'Karla Estrada')
    await user.click(boton('Siguiente'))
    expect(await tituloPaso('Confirma y envía')).toBeInTheDocument()
  })

  it('paso 3: «Pegar lista» convierte cada línea en una fila y marca la que hay que corregir', async () => {
    const user = montar()
    await llenarDatos(user)
    await user.click(boton('Siguiente'))
    await tituloPaso('Candidatos')

    const pegar = boton('Pegar lista')
    expect(pegar).toHaveAttribute('aria-expanded', 'false')
    await user.click(pegar)
    expect(pegar).toHaveAttribute('aria-expanded', 'true')
    const lista = screen.getByRole('textbox', { name: 'Lista de candidatos' })
    expect(lista).toHaveFocus()

    // Sin texto avisa en el campo.
    await user.click(boton('Agregar a la lista'))
    expect(lista).toHaveAccessibleDescription(/Pega al menos una línea/)

    await user.click(lista)
    await user.paste('Karla Estrada, karla.estrada@example.com\n\nLuis Fernando Ortiz, luis@correo, 55 1234 5678\n')
    await user.click(boton('Agregar a la lista'))

    // La fila vacía inicial deja su lugar a la lista.
    expect(screen.queryByRole('textbox', { name: 'Lista de candidatos' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('group', { name: /Candidato \d/ })).toHaveLength(2)
    expect(candidato(1).getByRole('textbox', { name: 'Nombre' })).toHaveValue('Karla Estrada')
    expect(candidato(2).getByRole('textbox', { name: 'Teléfono' })).toHaveValue('55 1234 5678')
    const correo = candidato(2).getByRole('textbox', { name: 'Correo' })
    expect(correo).toHaveAccessibleDescription(/Escribe un correo válido/)
    expect(correo).toHaveFocus()
    expect(screen.getByText('Agregamos 2 candidatos de la lista. Revisa los datos marcados en 1 de ellos.')).toHaveAttribute(
      'role',
      'status',
    )
  })

  it('las pastillas dejan volver a un paso visitado sin perder lo capturado', async () => {
    const user = montar()
    await hastaConfirmar(user)
    const pasos = within(screen.getByRole('list', { name: 'Pasos para crear la evaluación' }))
    await user.click(pasos.getByRole('button', { name: /Candidatos/ }))
    expect(await tituloPaso('Candidatos')).toBeInTheDocument()
    expect(candidato(2).getByRole('textbox', { name: 'Correo' })).toHaveValue('luisfernando.ortiz@example.com')
    await user.click(pasos.getByRole('button', { name: /Confirmar/ }))
    expect(await tituloPaso('Confirma y envía')).toBeInTheDocument()
  })
})

describe('NuevaEvaluacion · Confirmar', () => {
  it('muestra el resumen, la fecha límite opcional y los créditos frente al saldo', async () => {
    const user = montar()
    await hastaConfirmar(user)

    expect(getCredits).toHaveBeenCalledTimes(1)
    const resumen = within(seccion('Resumen'))
    expect(resumen.getByText('Vendedores Q4')).toBeInTheDocument()
    expect(resumen.getByText('Ejecutivo de ventas')).toBeInTheDocument()
    expect(resumen.getByText('Karla Estrada')).toBeInTheDocument()
    expect(resumen.getByText('luisfernando.ortiz@example.com · 55 1234 5678')).toBeInTheDocument()

    const creditos = within(seccion('Créditos'))
    expect(await creditos.findByText('Después de enviar te quedarán 35 créditos.')).toBeInTheDocument()
    expect(screen.getByText('Sin fecha límite')).toBeInTheDocument()
    expect(screen.getByText(/envía a cada candidato un correo con su enlace/)).toBeInTheDocument()

    // Una fecha de hoy o anterior dejaría los enlaces vencidos.
    const fecha = screen.getByLabelText('Fecha límite')
    fireEvent.change(fecha, { target: { value: '2000-01-01' } })
    expect(fecha).toHaveAccessibleDescription(/Elige una fecha posterior a hoy\./)
    await user.click(boton('Crear y enviar'))
    expect(createAssessment).not.toHaveBeenCalled()
    expect(fecha).toHaveFocus()

    fireEvent.change(fecha, { target: { value: '2099-10-15' } })
    expect(fecha).not.toHaveAttribute('aria-invalid')
    expect(screen.getByText('Fecha límite: 15 oct 2099')).toBeInTheDocument()
  })

  it('«Editar» lleva al paso del bloque', async () => {
    const user = montar()
    await hastaConfirmar(user)
    await user.click(boton('Editar datos de la evaluación'))
    expect(await tituloPaso('Datos de la evaluación')).toBeInTheDocument()
  })

  it('carga del saldo y saldo insuficiente con enlace a Créditos en otra pestaña', async () => {
    let resolver: (valor: CreditsData) => void = () => {}
    vi.mocked(getCredits).mockReturnValue(
      new Promise<CreditsData>((resolve) => {
        resolver = resolve
      }),
    )
    const user = montar()
    await hastaConfirmar(user)

    expect(screen.getByText('Consultando tu saldo…').closest('[role="status"]')).not.toBeNull()
    resolver({ balance: 1, transactions: [] })

    expect(await screen.findByText('No te alcanzan los créditos')).toBeInTheDocument()
    expect(screen.getByText('Necesitas 2 créditos y tienes 1. Solicita más o quita candidatos.')).toBeInTheDocument()
    const enlace = screen.getByRole('link', { name: 'Solicitar créditos (se abre en otra pestaña)' })
    expect(enlace).toHaveAttribute('href', '/app/creditos?solicitar=1')
    expect(enlace).toHaveAttribute('target', '_blank')

    saldo(5)
    await user.click(boton('Actualizar saldo'))
    expect(await screen.findByText('Después de enviar te quedarán 3 créditos.')).toBeInTheDocument()
  })

  it('sin créditos muestra el estado vacío y un error del saldo es distinto, con Reintentar', async () => {
    saldo(0)
    const user = montar()
    await hastaConfirmar(user)
    expect(await screen.findByText('Aún no tienes créditos')).toBeInTheDocument()

    vi.mocked(getCredits).mockRejectedValue(errorHttp())
    await user.click(boton('Actualizar saldo'))
    expect(await screen.findByText('No pudimos consultar tu saldo')).toBeInTheDocument()
    expect(screen.queryByText('Aún no tienes créditos')).not.toBeInTheDocument()

    saldo(12)
    await user.click(boton('Reintentar'))
    expect(await screen.findByText('Después de enviar te quedarán 10 créditos.')).toBeInTheDocument()
    expect(getCredits).toHaveBeenCalledTimes(3)
  })
})

describe('NuevaEvaluacion · envío', () => {
  it('envía el payload de siempre, con phone solo en el candidato que lo tiene', async () => {
    const user = montar()
    await hastaConfirmar(user)
    fireEvent.change(screen.getByLabelText('Fecha límite'), { target: { value: '2099-10-15' } })
    await user.click(boton('Crear y enviar'))

    expect(createAssessment).toHaveBeenCalledTimes(1)
    expect(vi.mocked(createAssessment).mock.calls[0][0]).toStrictEqual({
      name: 'Vendedores Q4',
      position: 'Ejecutivo de ventas',
      test_ids: [1],
      candidates: [
        { name: 'Karla Estrada', email: 'karla.estrada@example.com' },
        { name: 'Luis Fernando Ortiz', email: 'luisfernando.ortiz@example.com', phone: '55 1234 5678' },
      ],
      deadline: '2099-10-15',
    })
  })

  it('un 422 por campo regresa al paso del error y marca el campo de la fila enviada', async () => {
    vi.mocked(createAssessment).mockRejectedValue(
      errorHttp(422, {
        message: 'The given data was invalid.',
        errors: { 'candidates.1.email': ['El correo luisfernando.ortiz@example.com no es válido.'] },
      }),
    )
    const user = montar()
    await hastaConfirmar(user)
    await user.click(boton('Crear y enviar'))

    expect(await tituloPaso('Candidatos')).toBeInTheDocument()
    expect(screen.getByText('Revisa los datos marcados')).toBeInTheDocument()
    const correo = candidato(2).getByRole('textbox', { name: 'Correo' })
    expect(correo).toHaveAccessibleDescription(/El correo luisfernando\.ortiz@example\.com no es válido\./)
    expect(correo).toHaveFocus()

    // Al cambiar el campo, el error del servidor se va.
    await user.type(correo, 'x')
    expect(correo).not.toHaveAccessibleDescription(/no es válido/)
    expect(screen.queryByText('Revisa los datos marcados')).not.toBeInTheDocument()
  })

  it('un 422 por campo en Datos avisa de los otros pasos con errores', async () => {
    vi.mocked(createAssessment).mockRejectedValue(
      errorHttp(422, {
        errors: { name: ['El nombre ya existe.'], 'candidates.0.name': ['Nombre no válido.'] },
      }),
    )
    const user = montar()
    await hastaConfirmar(user)
    await user.click(boton('Crear y enviar'))

    expect(await tituloPaso('Datos de la evaluación')).toBeInTheDocument()
    expect(campoNombre()).toHaveAccessibleDescription(/El nombre ya existe\./)
    expect(screen.getByText('También hay datos por revisar en: Candidatos.')).toBeInTheDocument()
  })

  it('un 422 sin errors es saldo insuficiente: el message del backend y el enlace a Créditos', async () => {
    vi.mocked(createAssessment).mockRejectedValue(
      errorHttp(422, { message: 'Créditos insuficientes: necesitas 2, tienes 1' }),
    )
    const user = montar()
    await hastaConfirmar(user)
    await user.click(boton('Crear y enviar'))

    const aviso = await screen.findByRole('alert')
    expect(aviso).toHaveTextContent('No te alcanzan los créditos')
    expect(aviso).toHaveTextContent('Créditos insuficientes: necesitas 2, tienes 1')
    expect(aviso).toHaveFocus()
    expect(within(aviso).getByRole('link', { name: /Solicitar créditos/ })).toHaveAttribute('href', '/app/creditos?solicitar=1')
    // El saldo se vuelve a pedir para que el bloque de créditos esté al día.
    await waitFor(() => expect(getCredits).toHaveBeenCalledTimes(2))
    expect(screen.getByRole('heading', { level: 2, name: 'Confirma y envía' })).toBeInTheDocument()
  })

  it('un error de red se muestra inline con Reintentar, sin perder lo capturado', async () => {
    vi.mocked(createAssessment).mockRejectedValueOnce(errorHttp())
    const user = montar()
    await hastaConfirmar(user)
    await user.click(boton('Crear y enviar'))

    const aviso = await screen.findByRole('alert')
    expect(aviso).toHaveTextContent('No pudimos conectarnos')
    expect(aviso).toHaveTextContent('Lo que capturaste sigue aquí.')

    await user.click(within(aviso).getByRole('button', { name: 'Reintentar' }))
    expect(createAssessment).toHaveBeenCalledTimes(2)
    expect(vi.mocked(createAssessment).mock.calls[1][0]).toStrictEqual(vi.mocked(createAssessment).mock.calls[0][0])
    expect(await tituloPaso('Enlaces de invitación')).toBeInTheDocument()
  })

  it('un 500 también se puede reintentar; una sesión vencida no ofrece Reintentar', async () => {
    vi.mocked(createAssessment).mockRejectedValueOnce(errorHttp(500)).mockRejectedValueOnce(errorHttp(401))
    const user = montar()
    await hastaConfirmar(user)
    await user.click(boton('Crear y enviar'))
    const aviso = await screen.findByRole('alert')
    expect(aviso).toHaveTextContent('No pudimos crear la evaluación')

    await user.click(within(aviso).getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('Tu sesión expiró')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument()
  })
})

describe('NuevaEvaluacion · Enlaces de invitación', () => {
  it('muestra cada enlace con CopyField y los tiles Correo, WhatsApp y Copiar; vuelve a pedir el saldo', async () => {
    const user = montar()
    await hastaConfirmar(user)
    saldo(35)
    await user.click(boton('Crear y enviar'))

    expect(await tituloPaso('Enlaces de invitación')).toHaveFocus()
    expect(screen.getByRole('heading', { level: 1, name: 'Vendedores Q4' })).toBeInTheDocument()
    expect(screen.getByText('Evaluación creada', { selector: '.st-page-header__eyebrow' })).toBeInTheDocument()
    expect(screen.getByText('2 candidatos · Sin fecha límite')).toBeInTheDocument()
    expect(screen.getByText('La invitación ya se envió por correo a cada candidato.')).toBeInTheDocument()
    expect(await screen.findByText(/Se usaron 2 créditos\. Tu saldo actual es de 35 créditos\./)).toBeInTheDocument()
    expect(avisarCambioDeCreditos).toHaveBeenCalledTimes(1)
    expect(getCredits).toHaveBeenCalledTimes(2)

    const karla = within(screen.getByRole('article', { name: 'Karla Estrada' }))
    expect(karla.getByText('karla.estrada@example.com')).toBeInTheDocument()
    expect(karla.getByText(INVITACIONES[0].link)).toBeInTheDocument()

    const correo = karla.getByRole('link', { name: 'Enviar por Correo a Karla Estrada' })
    expect(correo.getAttribute('href')).toMatch(/^mailto:karla\.estrada@example\.com\?subject=/)
    expect(correo.getAttribute('href')).toContain(encodeURIComponent(INVITACIONES[0].link))
    const whatsapp = karla.getByRole('link', { name: 'Enviar por WhatsApp a Karla Estrada (se abre en otra pestaña)' })
    expect(whatsapp.getAttribute('href')).toMatch(/^https:\/\/wa\.me\/\?text=/)
    expect(whatsapp.getAttribute('href')).toContain(encodeURIComponent(INVITACIONES[0].link))
    expect(whatsapp).toHaveAttribute('target', '_blank')

    // El tile «Copiar» copia el enlace real y lo confirma con un toast.
    const [, tileCopiar] = karla.getAllByRole('button', { name: 'Copiar enlace de Karla Estrada' })
    await user.click(tileCopiar)
    expect(await navigator.clipboard.readText()).toBe(INVITACIONES[0].link)
    expect(await screen.findByText('Enlace copiado')).toBeInTheDocument()

    expect(screen.getByRole('article', { name: 'Luis Fernando Ortiz' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver evaluación' })).toHaveAttribute('href', '/app/evaluaciones/18')
  })

  it('«Crear otra» vuelve al primer paso vacío y «Ver evaluación» lleva al detalle', async () => {
    const user = montar()
    await hastaConfirmar(user)
    await user.click(boton('Crear y enviar'))
    await tituloPaso('Enlaces de invitación')

    await user.click(boton('Crear otra'))
    expect(await tituloPaso('Datos de la evaluación')).toHaveFocus()
    expect(campoNombre()).toHaveValue('')
    expect(screen.getByText('Paso 1 de 4 · Datos')).toBeInTheDocument()

    await llenarDatos(user, 'Auxiliares contables', '')
    await user.click(boton('Siguiente'))
    await tituloPaso('Candidatos')
    expect(screen.getAllByRole('group', { name: /Candidato \d/ })).toHaveLength(1)
    expect(candidato(1).getByRole('textbox', { name: 'Correo' })).toHaveValue('')
  })

  it('si la respuesta no trae invitaciones, lo dice en lugar de dejar la lista vacía', async () => {
    vi.mocked(createAssessment).mockResolvedValue({ id: 18, name: 'Vendedores Q4', invitations: [] })
    const user = montar()
    await hastaConfirmar(user)
    await user.click(boton('Crear y enviar'))
    expect(await screen.findByText('No hay enlaces para mostrar')).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Ver evaluación' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Detalle de la evaluación' })).toBeInTheDocument()
  })
})
