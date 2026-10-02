import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  complete,
  getItems,
  getPortal,
  saveAnswer,
  sendConsent,
  sendEvent,
  type PortalItem,
  type PortalState,
  type PortalTest,
} from '@/api/candidate'
import CandidateFlow from './CandidateFlow'

// Portal del candidato completo (useCandidateFlow y sus pantallas) con
// src/api/candidate simulado. Formas de CandidatePortalController
// (2026-09-11-fase1-nucleo.md:1668-1800) y de e2e/mocks/candidato*.json.

vi.mock('@/api/candidate', () => ({
  getPortal: vi.fn(),
  getItems: vi.fn(),
  sendConsent: vi.fn(),
  saveAnswer: vi.fn(),
  sendEvent: vi.fn(),
  complete: vi.fn(),
}))

const TOKEN = 'Lvpx1u6OcvNbil7ZnhYuLFbhCbZ1PGcQ42CVRM9p'
const EMPRESA = 'Comercializadora Río Claro'

const OPCIONES = [
  { label: 'Totalmente en desacuerdo', value: 1 },
  { label: 'En desacuerdo', value: 2 },
  { label: 'Neutral', value: 3 },
  { label: 'De acuerdo', value: 4 },
  { label: 'Totalmente de acuerdo', value: 5 },
]

const DEMO: PortalTest = { id: 1, name: 'Prueba de demostración', duration_min: 5, item_count: 2, allows_back: true }
const ESTILOS: PortalTest = { id: 4, name: 'Estilos de trabajo', duration_min: 12, item_count: 2, allows_back: false }

function reactivo(id: number, answered: number | null = null): PortalItem {
  return { id, order: id, prompt: `Afirmación ${id}`, options: OPCIONES, answered }
}

function portalDe(parcial: Partial<PortalState> = {}): PortalState {
  return {
    status: 'pendiente',
    organization: EMPRESA,
    position: 'Ejecutivo de ventas',
    tests: [DEMO],
    consented: false,
    ...parcial,
  }
}

/** Respuesta de GET /api/evaluar/{token}/pruebas/{testId}. */
function pruebaDe(test: PortalTest, items: PortalItem[]) {
  return { test: { id: test.id, name: test.name, allows_back: test.allows_back }, items }
}

/** GET …/pruebas/{testId} responde los reactivos de cada prueba. */
function conReactivos(porPrueba: Record<number, PortalItem[]>, tests: PortalTest[] = [DEMO, ESTILOS]) {
  vi.mocked(getItems).mockImplementation(async (_token, testId) => {
    const test = tests.find((t) => t.id === testId)
    if (!test) throw errorHttp(404)
    return pruebaDe(test, porPrueba[testId] ?? [])
  })
}

/** Error de axios con el código HTTP dado; sin código, un error de red. */
function errorHttp(status?: number): AxiosError {
  if (status === undefined) return new AxiosError('Network Error', AxiosError.ERR_NETWORK)
  const respuesta = { status, statusText: '', data: {}, headers: {}, config: { headers: new AxiosHeaders() } }
  return new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, undefined, undefined, respuesta as AxiosResponse)
}

function montar(token = TOKEN) {
  render(
    <MemoryRouter initialEntries={[`/evaluar/${token}`]}>
      <Routes>
        <Route path="/evaluar/:token" element={<CandidateFlow />} />
        <Route path="/evaluar" element={<h1>Acceso manual</h1>} />
        <Route path="/" element={<h1>Inicio</h1>} />
      </Routes>
    </MemoryRouter>,
  )
  return userEvent.setup()
}

type Usuario = ReturnType<typeof userEvent.setup>

const boton = (nombre: string | RegExp) => screen.getByRole('button', { name: nombre })

function esperarAcceso() {
  return screen.findByRole('heading', { level: 1, name: /te ha invitado a realizar una evaluación/ })
}

function esperarPregunta(id: number) {
  return screen.findByRole('heading', { level: 2, name: `Afirmación ${id}` })
}

async function aceptarEIniciar(user: Usuario) {
  await user.click(await screen.findByRole('checkbox', { name: /Acepto el tratamiento/ }))
  await user.click(boton('Iniciar evaluación'))
}

/** Acceso con consentimiento ya guardado: «Continuar evaluación» abre la primera prueba. */
async function continuar(user: Usuario) {
  await esperarAcceso()
  await user.click(boton('Continuar evaluación'))
}

async function responder(user: Usuario, opcion = 'De acuerdo') {
  await user.click(screen.getByRole('radio', { name: opcion }))
}

beforeEach(() => {
  vi.mocked(getPortal).mockReset()
  vi.mocked(getItems).mockReset()
  vi.mocked(sendConsent).mockReset().mockResolvedValue(undefined)
  vi.mocked(saveAnswer).mockReset().mockResolvedValue(undefined)
  vi.mocked(sendEvent).mockReset().mockResolvedValue(undefined)
  vi.mocked(complete).mockReset().mockResolvedValue(undefined)
})

describe('CandidateFlow · acceso', () => {
  it('muestra la invitación verificada con la organización, el puesto y las pruebas reales', async () => {
    vi.mocked(getPortal).mockResolvedValue(portalDe({ tests: [DEMO, ESTILOS] }))
    montar()

    const titulo = await esperarAcceso()
    expect(titulo).toHaveTextContent(`${EMPRESA} te ha invitado a realizar una evaluación para el puesto de Ejecutivo de ventas`)
    expect(titulo).toHaveFocus()
    expect(getPortal).toHaveBeenCalledWith(TOKEN)
    expect(screen.getByText('Invitación verificada')).toBeInTheDocument()

    const pruebas = within(screen.getByRole('list', { name: 'Pruebas de la evaluación' })).getAllByRole('listitem')
    expect(pruebas.map((p) => p.textContent)).toEqual([
      'Prueba de demostración5 min2 reactivos',
      'Estilos de trabajo12 min2 reactivos',
    ])
    // Duración sumada de tests[] y la tercera garantía (D-18), sin «cifrados».
    expect(screen.getByText(/17 minutos de duración estimada/)).toBeInTheDocument()
    expect(screen.getByText('Puedes pausar y retomar con el mismo enlace')).toBeInTheDocument()
    expect(screen.queryByText(/cifrad/i)).not.toBeInTheDocument()
    // Sin formulario de datos (D-11) ni «licencia».
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByText(/licencia/i)).not.toBeInTheDocument()
    // Marco: inicial y nombre de la organización, sin navegación del sitio.
    expect(screen.getByText(EMPRESA, { selector: '.st-cand-frame__org-name' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('guarda el consentimiento antes de pedir el primer reactivo', async () => {
    vi.mocked(getPortal).mockResolvedValue(portalDe())
    conReactivos({ 1: [reactivo(1), reactivo(2)] }, [DEMO])
    let confirmarConsentimiento!: () => void
    vi.mocked(sendConsent).mockReturnValue(
      new Promise<void>((resolver) => {
        confirmarConsentimiento = resolver
      }),
    )
    const user = montar()
    await esperarAcceso()

    const casilla = screen.getByRole('checkbox', { name: /Acepto el tratamiento/ })
    expect(casilla).not.toBeChecked()
    // El aviso se abre en otra pestaña para no salir del flujo (jsdom recorta el espacio del texto oculto).
    const aviso = screen.getByRole('link', { name: /aviso de privacidad\s*\(se abre en otra pestaña\)/ })
    expect(aviso).toHaveAttribute('href', '/aviso-de-privacidad')
    expect(aviso).toHaveAttribute('target', '_blank')
    const iniciar = boton('Iniciar evaluación')
    expect(iniciar).toHaveAttribute('aria-disabled', 'true')
    expect(iniciar).toHaveAccessibleDescription('Acepta el aviso de privacidad para continuar.')
    await user.click(iniciar)
    expect(sendConsent).not.toHaveBeenCalled()

    await user.click(casilla)
    expect(boton('Iniciar evaluación')).toHaveAccessibleDescription('Podrás pausar en cualquier momento.')
    await user.click(boton('Iniciar evaluación'))
    expect(sendConsent).toHaveBeenCalledWith(TOKEN)
    expect(boton('Iniciando…')).toHaveAttribute('aria-busy', 'true')
    expect(getItems).not.toHaveBeenCalled()

    await act(async () => confirmarConsentimiento())
    await esperarPregunta(1)
    expect(sendConsent).toHaveBeenCalledTimes(1)
    expect(getItems).toHaveBeenCalledWith(TOKEN, 1)
    expect(vi.mocked(sendConsent).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(getItems).mock.invocationCallOrder[0],
    )
  })

  it('si el consentimiento ya existe, se salta y la evaluación continúa', async () => {
    vi.mocked(getPortal).mockResolvedValue(portalDe({ status: 'iniciada', consented: true }))
    conReactivos({ 1: [reactivo(1), reactivo(2)] }, [DEMO])
    const user = montar()
    await esperarAcceso()

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    expect(screen.getByText('Ya aceptaste el aviso de privacidad.')).toBeInTheDocument()
    await user.click(boton('Continuar evaluación'))
    await esperarPregunta(1)
    expect(sendConsent).not.toHaveBeenCalled()
  })
})

describe('CandidateFlow · bloqueo', () => {
  it('una invitación completada se bloquea con su mensaje y el contacto de la empresa', async () => {
    vi.mocked(getPortal).mockResolvedValue(portalDe({ status: 'completada', consented: true }))
    montar()

    expect(await screen.findByRole('heading', { level: 1, name: 'Esta evaluación ya se completó' })).toHaveFocus()
    expect(screen.getByText(`Si tienes dudas, contacta a ${EMPRESA}.`)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /evaluación/ })).not.toBeInTheDocument()
    expect(getItems).not.toHaveBeenCalled()
  })

  it('una invitación expirada se bloquea', async () => {
    vi.mocked(getPortal).mockResolvedValue(portalDe({ status: 'expirada' }))
    montar()
    expect(await screen.findByRole('heading', { level: 1, name: 'Esta invitación ya venció' })).toBeInTheDocument()
    expect(screen.getByText(new RegExp(`contacta a ${EMPRESA}`))).toBeInTheDocument()
  })

  it('un 404 dice que no existe y ofrece ingresar otro enlace o código', async () => {
    vi.mocked(getPortal).mockRejectedValue(errorHttp(404))
    const user = montar()
    expect(await screen.findByRole('heading', { level: 1, name: 'No encontramos tu invitación' })).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Ingresar otro enlace o código' }))
    expect(await screen.findByRole('heading', { name: 'Acceso manual' })).toBeInTheDocument()
  })

  describe('un 409 lleva al bloqueo', () => {
    it('en el consentimiento', async () => {
      vi.mocked(getPortal).mockResolvedValueOnce(portalDe()).mockResolvedValueOnce(portalDe({ status: 'expirada' }))
      vi.mocked(sendConsent).mockRejectedValue(errorHttp(409))
      const user = montar()
      await esperarAcceso()
      await aceptarEIniciar(user)

      expect(await screen.findByRole('heading', { level: 1, name: 'Esta invitación ya venció' })).toBeInTheDocument()
      expect(getPortal).toHaveBeenCalledTimes(2)
      expect(getItems).not.toHaveBeenCalled()
    })

    it('al guardar una respuesta (por ejemplo, completada en otra pestaña)', async () => {
      vi.mocked(getPortal)
        .mockResolvedValueOnce(portalDe({ consented: true }))
        .mockResolvedValueOnce(portalDe({ status: 'completada', consented: true }))
      conReactivos({ 1: [reactivo(1), reactivo(2)] }, [DEMO])
      vi.mocked(saveAnswer).mockRejectedValue(errorHttp(409))
      const user = montar()
      await continuar(user)
      await esperarPregunta(1)
      await responder(user)

      expect(await screen.findByRole('heading', { level: 1, name: 'Esta evaluación ya se completó' })).toBeInTheDocument()
      expect(complete).not.toHaveBeenCalled()
    })

    it('al finalizar', async () => {
      vi.mocked(getPortal).mockResolvedValueOnce(portalDe({ consented: true })).mockRejectedValueOnce(errorHttp())
      conReactivos({ 1: [reactivo(1)] }, [DEMO])
      vi.mocked(complete).mockRejectedValue(errorHttp(409))
      const user = montar()
      await continuar(user)
      await esperarPregunta(1)
      await responder(user)
      await user.click(boton('Finalizar examen'))

      // Sin poder consultar el motivo, el mensaje es general.
      expect(
        await screen.findByRole('heading', { level: 1, name: 'Esta evaluación ya no admite respuestas' }),
      ).toBeInTheDocument()
      expect(complete).toHaveBeenCalledTimes(1)
    })
  })
})

describe('CandidateFlow · examen', () => {
  it('no avanza sin responder; cada respuesta se guarda al elegirla, con elapsed_ms', async () => {
    vi.mocked(getPortal).mockResolvedValue(portalDe({ consented: true }))
    conReactivos({ 1: [reactivo(1), reactivo(2)] }, [DEMO])
    const user = montar()
    await continuar(user)
    expect(await esperarPregunta(1)).toHaveFocus()
    // El grupo de opciones se nombra con la pregunta.
    expect(screen.getByRole('radiogroup', { name: 'Afirmación 1' })).toBeInTheDocument()

    const siguiente = boton('Siguiente pregunta')
    expect(siguiente).toHaveAttribute('aria-disabled', 'true')
    expect(siguiente).toHaveAccessibleDescription('Elige una opción para continuar.')
    await user.click(siguiente)
    // Enter dentro de las opciones tampoco avanza sin respuesta.
    screen.getByRole('radio', { name: 'Neutral' }).focus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('heading', { level: 2, name: 'Afirmación 1' })).toBeInTheDocument()
    expect(saveAnswer).not.toHaveBeenCalled()

    await responder(user, 'De acuerdo')
    expect(screen.getByRole('radio', { name: 'De acuerdo' })).toBeChecked()
    expect(saveAnswer).toHaveBeenCalledWith(TOKEN, 1, 1, 4, expect.any(Number))
    const elapsedMs = vi.mocked(saveAnswer).mock.calls[0][4]
    expect(elapsedMs).toBeGreaterThanOrEqual(0)
    expect(boton('Siguiente pregunta')).not.toHaveAttribute('aria-disabled')

    await user.click(boton('Siguiente pregunta'))
    expect(await esperarPregunta(2)).toHaveFocus()
    expect(screen.getByText('Pregunta 2 de 2')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Avance de la prueba' })).toHaveAttribute(
      'aria-valuetext',
      'Pregunta 2 de 2',
    )
  })

  it('las opciones se eligen con el teclado y Enter avanza', async () => {
    vi.mocked(getPortal).mockResolvedValue(portalDe({ consented: true }))
    conReactivos({ 1: [reactivo(1), reactivo(2)] }, [DEMO])
    const user = montar()
    await continuar(user)
    await esperarPregunta(1)

    await user.tab()
    expect(screen.getByRole('radio', { name: 'Totalmente en desacuerdo' })).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('radio', { name: 'En desacuerdo' })).toBeChecked()
    expect(saveAnswer).toHaveBeenLastCalledWith(TOKEN, 1, 1, 2, expect.any(Number))
    await user.keyboard('{Enter}')
    await esperarPregunta(2)
  })

  it('«Anterior» aparece con allows_back y regresa a la pregunta con su respuesta', async () => {
    vi.mocked(getPortal).mockResolvedValue(portalDe({ consented: true }))
    conReactivos({ 1: [reactivo(1), reactivo(2)] }, [DEMO])
    const user = montar()
    await continuar(user)
    await esperarPregunta(1)

    // En la primera pregunta no hay a dónde regresar.
    expect(boton('Anterior')).toHaveAttribute('aria-disabled', 'true')
    await responder(user, 'Neutral')
    await user.click(boton('Siguiente pregunta'))
    await esperarPregunta(2)
    await user.click(boton('Anterior'))
    await esperarPregunta(1)
    expect(screen.getByRole('radio', { name: 'Neutral' })).toBeChecked()
  })

  it('sin allows_back no hay «Anterior»', async () => {
    const sinRegreso = { ...DEMO, allows_back: false }
    vi.mocked(getPortal).mockResolvedValue(portalDe({ consented: true, tests: [sinRegreso] }))
    conReactivos({ 1: [reactivo(1), reactivo(2)] }, [sinRegreso])
    const user = montar()
    await continuar(user)
    await esperarPregunta(1)
    expect(screen.queryByRole('button', { name: 'Anterior' })).not.toBeInTheDocument()
    await responder(user)
    await user.click(boton('Siguiente pregunta'))
    await esperarPregunta(2)
    expect(screen.queryByRole('button', { name: 'Anterior' })).not.toBeInTheDocument()
  })

  it('reanuda en el primer reactivo sin responder', async () => {
    vi.mocked(getPortal).mockResolvedValue(portalDe({ status: 'iniciada', consented: true }))
    conReactivos({ 1: [reactivo(1, 4), reactivo(2, 2), reactivo(3), reactivo(4)] }, [DEMO])
    const user = montar()
    await continuar(user)

    await esperarPregunta(3)
    expect(screen.getByText('Pregunta 3 de 4')).toBeInTheDocument()
    // Las respuestas anteriores siguen ahí al regresar.
    await user.click(boton('Anterior'))
    await esperarPregunta(2)
    expect(screen.getByRole('radio', { name: 'En desacuerdo' })).toBeChecked()
  })

  it('con la primera prueba ya respondida, retoma en la siguiente', async () => {
    vi.mocked(getPortal).mockResolvedValue(portalDe({ status: 'iniciada', consented: true, tests: [DEMO, ESTILOS] }))
    conReactivos({ 1: [reactivo(1, 4), reactivo(2, 5)], 4: [reactivo(11, 3), reactivo(12)] })
    const user = montar()
    await continuar(user)

    await esperarPregunta(12)
    expect(screen.getByRole('heading', { level: 1, name: 'Estilos de trabajo' })).toBeInTheDocument()
    expect(screen.getByText('Prueba 2 de 2')).toBeInTheDocument()
    expect(getItems).toHaveBeenNthCalledWith(1, TOKEN, 1)
    expect(getItems).toHaveBeenNthCalledWith(2, TOKEN, 4)
  })

  it('recorre las dos pruebas y llama a complete una sola vez, al final', async () => {
    vi.mocked(getPortal).mockResolvedValue(portalDe({ tests: [DEMO, ESTILOS] }))
    conReactivos({ 1: [reactivo(1), reactivo(2)], 4: [reactivo(11), reactivo(12)] })
    const user = montar()
    await esperarAcceso()
    await aceptarEIniciar(user)

    await esperarPregunta(1)
    expect(screen.getByRole('heading', { level: 1, name: 'Prueba de demostración' })).toBeInTheDocument()
    expect(screen.getByText('Prueba 1 de 2')).toBeInTheDocument()
    await responder(user, 'De acuerdo')
    await user.click(boton('Siguiente pregunta'))
    await esperarPregunta(2)
    await responder(user, 'Totalmente de acuerdo')
    await user.click(boton('Siguiente prueba'))

    await esperarPregunta(11)
    expect(screen.getByRole('heading', { level: 1, name: 'Estilos de trabajo' })).toBeInTheDocument()
    expect(screen.getByText('Prueba 2 de 2')).toBeInTheDocument()
    expect(complete).not.toHaveBeenCalled()
    await responder(user, 'Neutral')
    await user.click(boton('Siguiente pregunta'))
    await esperarPregunta(12)
    await responder(user, 'En desacuerdo')
    await user.dblClick(boton('Finalizar examen'))

    expect(await screen.findByRole('heading', { level: 1, name: '¡Examen completado con éxito!' })).toHaveFocus()
    expect(complete).toHaveBeenCalledTimes(1)
    expect(complete).toHaveBeenCalledWith(TOKEN)
    expect(vi.mocked(saveAnswer).mock.calls.map(([, testId, itemId, valor]) => [testId, itemId, valor])).toEqual([
      [1, 1, 4],
      [1, 2, 5],
      [4, 11, 3],
      [4, 12, 2],
    ])
    expect(vi.mocked(saveAnswer).mock.invocationCallOrder[3]).toBeLessThan(
      vi.mocked(complete).mock.invocationCallOrder[0],
    )

    // Fin con datos reales y sin promesa de copia (D-16).
    expect(screen.getAllByRole('term').map((t) => t.textContent)).toEqual([
      'Pruebas aplicadas',
      'Reactivos respondidos',
      'Enviado a',
    ])
    expect(screen.getAllByRole('definition').map((d) => d.textContent)).toEqual([
      'Prueba de demostraciónEstilos de trabajo',
      '4 de 4',
      EMPRESA,
    ])
    expect(screen.getByText('Tus respuestas quedaron registradas. No es necesario hacer nada más.')).toBeInTheDocument()
    expect(screen.queryByText(/copia|recibirás/i)).not.toBeInTheDocument()
  })

  it('una prueba sin reactivos muestra el estado vacío con el contacto de la empresa', async () => {
    vi.mocked(getPortal).mockResolvedValue(portalDe({ consented: true }))
    conReactivos({ 1: [] }, [DEMO])
    const user = montar()
    await continuar(user)

    const titulo = await screen.findByRole('heading', { level: 2, name: 'Esta prueba todavía no tiene preguntas' })
    // El botón que trajo aquí ya no existe: el foco pasa al aviso para que se lea.
    expect(titulo.closest('.st-examen__vacio')).toHaveFocus()
    expect(
      screen.getByText(`Contacta a ${EMPRESA}, la empresa que te invitó, para que revise tu evaluación.`),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Siguiente|Finalizar/ })).not.toBeInTheDocument()
  })

  it('registra la pérdida de foco durante el examen (evento blur)', async () => {
    vi.mocked(getPortal).mockResolvedValue(portalDe({ consented: true }))
    conReactivos({ 1: [reactivo(1), reactivo(2)] }, [DEMO])
    const oculta = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
    const user = montar()
    await esperarAcceso()

    // Antes del examen no se registra nada.
    document.dispatchEvent(new Event('visibilitychange'))
    expect(sendEvent).not.toHaveBeenCalled()

    oculta.mockReturnValue(false)
    await user.click(boton('Continuar evaluación'))
    await esperarPregunta(1)
    document.dispatchEvent(new Event('visibilitychange'))
    expect(sendEvent).not.toHaveBeenCalled()

    oculta.mockReturnValue(true)
    document.dispatchEvent(new Event('visibilitychange'))
    expect(sendEvent).toHaveBeenCalledTimes(1)
    expect(sendEvent).toHaveBeenCalledWith(TOKEN, 1, 'blur')
  })
})

describe('CandidateFlow · un error de red ofrece «Reintentar»', () => {
  it('al cargar la invitación', async () => {
    vi.mocked(getPortal).mockRejectedValueOnce(errorHttp()).mockResolvedValueOnce(portalDe())
    const user = montar()

    expect(await screen.findByRole('heading', { level: 1, name: 'No pudimos conectarnos' })).toBeInTheDocument()
    await user.click(boton('Reintentar'))
    await esperarAcceso()
    expect(getPortal).toHaveBeenCalledTimes(2)
  })

  it('al guardar el consentimiento: aviso en línea y el botón sale de la carga', async () => {
    vi.mocked(getPortal).mockResolvedValue(portalDe())
    vi.mocked(sendConsent).mockRejectedValueOnce(errorHttp()).mockResolvedValueOnce(undefined)
    conReactivos({ 1: [reactivo(1)] }, [DEMO])
    const user = montar()
    await esperarAcceso()
    await aceptarEIniciar(user)

    const aviso = await screen.findByRole('alert')
    expect(aviso).toHaveTextContent('No pudimos registrar tu consentimiento')
    expect(aviso).toHaveTextContent('Revisa tu conexión a internet e inténtalo de nuevo.')
    expect(boton('Iniciar evaluación')).not.toHaveAttribute('aria-busy')
    expect(getItems).not.toHaveBeenCalled()

    await user.click(within(aviso).getByRole('button', { name: 'Reintentar' }))
    await esperarPregunta(1)
    expect(sendConsent).toHaveBeenCalledTimes(2)
  })

  it('al cargar los reactivos', async () => {
    vi.mocked(getPortal).mockResolvedValue(portalDe({ consented: true }))
    vi.mocked(getItems)
      .mockRejectedValueOnce(errorHttp())
      .mockResolvedValueOnce(pruebaDe(DEMO, [reactivo(1), reactivo(2)]))
    const user = montar()
    await continuar(user)

    expect(await screen.findByRole('heading', { level: 2, name: 'No pudimos cargar las preguntas' })).toBeInTheDocument()
    await user.click(boton('Reintentar'))
    await esperarPregunta(1)
    expect(getItems).toHaveBeenCalledTimes(2)
  })

  it('al guardar una respuesta: «No se pudo guardar» con reintento', async () => {
    vi.mocked(getPortal).mockResolvedValue(portalDe({ consented: true }))
    conReactivos({ 1: [reactivo(1), reactivo(2)] }, [DEMO])
    vi.mocked(saveAnswer).mockRejectedValueOnce(errorHttp()).mockResolvedValue(undefined)
    const user = montar()
    await continuar(user)
    await esperarPregunta(1)
    expect(screen.getByText('Guardado automático')).toBeInTheDocument()

    await responder(user)
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo guardar')
    await user.click(boton('Reintentar'))
    expect(await screen.findByText('Guardado')).toBeInTheDocument()
    // El guardado confirmado se anuncia con cortesía en la región de estado de la barra.
    expect(screen.getByRole('status')).toHaveTextContent('Guardado')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(saveAnswer).toHaveBeenCalledTimes(2)
    expect(vi.mocked(saveAnswer).mock.calls[1]).toEqual(vi.mocked(saveAnswer).mock.calls[0])
  })

  it('al finalizar, sin perder las respuestas guardadas', async () => {
    vi.mocked(getPortal).mockResolvedValue(portalDe({ consented: true }))
    conReactivos({ 1: [reactivo(1)] }, [DEMO])
    vi.mocked(complete).mockRejectedValueOnce(errorHttp()).mockResolvedValueOnce(undefined)
    const user = montar()
    await continuar(user)
    await esperarPregunta(1)
    await responder(user)
    await user.click(boton('Finalizar examen'))

    const aviso = await screen.findByRole('alert')
    expect(aviso).toHaveTextContent('No pudimos finalizar el examen')
    expect(aviso).toHaveTextContent('Tus respuestas están guardadas.')
    expect(boton('Finalizar examen')).not.toHaveAttribute('aria-busy')
    expect(screen.getByRole('radio', { name: 'De acuerdo' })).toBeChecked()

    await user.click(within(aviso).getByRole('button', { name: 'Reintentar' }))
    await screen.findByRole('heading', { level: 1, name: '¡Examen completado con éxito!' })
    expect(complete).toHaveBeenCalledTimes(2)
    expect(saveAnswer).toHaveBeenCalledTimes(1)
  })

  it('no finaliza mientras haya respuestas sin guardar', async () => {
    vi.mocked(getPortal).mockResolvedValue(portalDe({ consented: true }))
    conReactivos({ 1: [reactivo(1)] }, [DEMO])
    vi.mocked(saveAnswer).mockRejectedValue(errorHttp())
    const user = montar()
    await continuar(user)
    await esperarPregunta(1)
    await responder(user)
    await screen.findByText('No se pudo guardar')
    await user.click(boton('Finalizar examen'))

    const aviso = await screen.findByText('No pudimos guardar todas tus respuestas')
    expect(complete).not.toHaveBeenCalled()
    // Al finalizar se reintentó el guardado.
    expect(saveAnswer).toHaveBeenCalledTimes(2)

    vi.mocked(saveAnswer).mockResolvedValue(undefined)
    const callout = aviso.closest('.st-callout') as HTMLElement
    await user.click(within(callout).getByRole('button', { name: 'Reintentar' }))
    await screen.findByRole('heading', { level: 1, name: '¡Examen completado con éxito!' })
    expect(complete).toHaveBeenCalledTimes(1)
  })
})
