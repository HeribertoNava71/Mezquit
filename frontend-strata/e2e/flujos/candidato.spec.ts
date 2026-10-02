// Recorrido del candidato (mapa.md, CA-1 a CA-6): /evaluar, invitación
// verificada, consentimiento, examen de dos pruebas, fin y bloqueos.

import type { Page } from '@playwright/test'
import { datosDe, esperarRuta, expect, respuestaDe, test, type RespuestaDeMock } from './api.ts'

/** Invitación 61 (e2e/mocks/candidato.json): pendiente, 2 pruebas y sin consentimiento. */
const TOKEN = 'Lvpx1u6OcvNbil7ZnhYuLFbhCbZ1PGcQ42CVRM9p'
/** Así llega en el correo de invitación (FRONTEND_URL de desarrollo). */
const ENLACE = `http://localhost:5173/evaluar/${TOKEN}`
/** Invitación 46 (e2e/mocks/candidato-expirada.json). */
const TOKEN_EXPIRADA = 'OgpzND7tD3NaZsGIjV5KPVCu8wMuqenvIJCL8pj8'
const ORGANIZACION = 'Comercializadora Río Claro'
const PORTAL = `/api/evaluar/${TOKEN}`

interface Reactivo {
  id: number
  order: number
  prompt: string
  options: { label: string; value: number }[]
  answered: number | null
}

interface DatosPrueba {
  test: { id: number; name: string; allows_back: boolean }
  items: Reactivo[]
}

const claveDePrueba = (id: number) => `GET /api/evaluar/:token/pruebas/${id}`

/** Reactivos de una prueba del mock del candidato. */
function reactivosDe(id: number): Reactivo[] {
  return datosDe<DatosPrueba>('candidato', claveDePrueba(id)).items
}

/** La prueba del mock con los primeros `respondidos` reactivos ya contestados (valor 4). */
function pruebaConRespuestas(id: number, respondidos: number): RespuestaDeMock {
  const respuesta = respuestaDe('candidato', claveDePrueba(id))
  const { data } = respuesta.body as { data: DatosPrueba }
  data.items.forEach((reactivo, indice) => {
    reactivo.answered = indice < respondidos ? 4 : null
  })
  return respuesta
}

/** GET /api/evaluar/{token} del mock con otro estado de la invitación. */
function portalCon(cambios: { status: string; consented: boolean }): RespuestaDeMock {
  const respuesta = respuestaDe('candidato', 'GET /api/evaluar/:token')
  const { data } = respuesta.body as { data: Record<string, unknown> }
  Object.assign(data, cambios)
  return respuesta
}

function boton(page: Page, nombre: string) {
  return page.getByRole('button', { name: nombre, exact: true })
}

test.describe('Portal del candidato', () => {
  test('pega el enlace, acepta el aviso, responde las dos pruebas y llega al fin', async ({ page, simular }) => {
    // 32 preguntas con sus comprobaciones: test.slow() triplica el tiempo límite.
    test.slow()
    const api = await simular('candidato')
    const pruebas = [
      { id: 1, nombre: 'Prueba de demostración', reactivos: reactivosDe(1), conAnterior: true },
      { id: 4, nombre: 'Estilos de trabajo', reactivos: reactivosDe(4), conAnterior: false },
    ]
    const total = pruebas.reduce((suma, prueba) => suma + prueba.reactivos.length, 0)

    // /evaluar: sin texto, el error va junto al campo; con el enlace pegado, a la invitación.
    await page.goto('/evaluar')
    await expect(page.getByRole('heading', { level: 1, name: 'Ingresa tu enlace o código' })).toBeVisible()
    await boton(page, 'Continuar').click()
    await expect(page.getByRole('alert')).toHaveText('Pega el enlace completo o el código que te dieron.')
    await page.getByLabel('Enlace o código').focus()
    await page.keyboard.insertText(ENLACE)
    await boton(page, 'Continuar').click()
    await esperarRuta(page, `/evaluar/${TOKEN}`)

    // Invitación verificada con los datos reales del portal.
    await expect(page.getByText('Invitación verificada')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      `${ORGANIZACION} te ha invitado a realizar una evaluación para el puesto de Ejecutivo de ventas`,
    )
    const listaDePruebas = page.getByRole('list', { name: 'Pruebas de la evaluación' })
    await expect(listaDePruebas.getByRole('listitem')).toHaveCount(2)
    await expect(listaDePruebas).toContainText('Prueba de demostración')
    await expect(listaDePruebas).toContainText('Estilos de trabajo')

    // «Iniciar» queda deshabilitado (y no hace nada) hasta aceptar el aviso.
    const iniciar = boton(page, 'Iniciar evaluación')
    await expect(iniciar).toBeDisabled()
    await expect(page.getByText('Acepta el aviso de privacidad para continuar.')).toBeVisible()
    await iniciar.click({ force: true })
    await expect(page.getByRole('heading', { level: 1 })).toContainText('te ha invitado')
    expect(api.llamadas('POST', `${PORTAL}/consent`)).toHaveLength(0)

    const aviso = page.getByRole('checkbox', { name: /Acepto el tratamiento de mis respuestas/ })
    await expect(aviso).not.toBeChecked()
    await aviso.check()
    await expect(iniciar).toBeEnabled()
    // Doble clic: el consentimiento sale una sola vez.
    await iniciar.dblclick()

    // Examen: una pregunta por vista; «Siguiente» deshabilitado sin respuesta y
    // cada respuesta se guarda con su propio POST.
    const elegidas: { test_id: number; item_id: number; value: number }[] = []
    const indicador = page.locator('.st-guardado').getByRole('status')
    for (const [indicePrueba, prueba] of pruebas.entries()) {
      const ultimaPrueba = indicePrueba === pruebas.length - 1
      await expect(page.getByRole('heading', { level: 1, name: prueba.nombre })).toBeVisible()
      await expect(page.getByText(`Prueba ${indicePrueba + 1} de ${pruebas.length}`, { exact: true })).toBeVisible()

      for (const [indice, reactivo] of prueba.reactivos.entries()) {
        const ultimo = indice === prueba.reactivos.length - 1
        const siguiente = boton(page, !ultimo ? 'Siguiente pregunta' : ultimaPrueba ? 'Finalizar examen' : 'Siguiente prueba')

        await expect(page.getByRole('heading', { level: 2, name: reactivo.prompt })).toBeVisible()
        await expect(page.getByText(`Pregunta ${indice + 1} de ${prueba.reactivos.length}`, { exact: true })).toBeVisible()
        await expect(siguiente).toBeDisabled()
        await expect(page.getByText('Elige una opción para continuar.')).toBeVisible()
        // «Anterior» solo en la prueba con allows_back, y deshabilitado en la primera pregunta.
        const anterior = boton(page, 'Anterior')
        if (prueba.conAnterior) {
          if (indice === 0) await expect(anterior).toBeDisabled()
          else await expect(anterior).toBeEnabled()
        } else {
          await expect(anterior).toHaveCount(0)
        }

        // Antes de la primera respuesta, el indicador solo avisa del guardado automático.
        if (indicePrueba === 0 && indice === 0) await expect(indicador).toHaveText('Guardado automático')

        // Sin respuesta, el clic en «Siguiente» no avanza.
        if (indice === 0) {
          await siguiente.click({ force: true })
          await expect(page.getByRole('heading', { level: 2, name: reactivo.prompt })).toBeVisible()
        }

        const opcion = reactivo.options[(indice + indicePrueba) % reactivo.options.length]
        const guardado = page.waitForRequest(
          (peticion) => peticion.method() === 'POST' && new URL(peticion.url()).pathname === `${PORTAL}/answers`,
        )
        await page.getByRole('radio', { name: opcion.label, exact: true }).check()
        expect((await guardado).postDataJSON()).toMatchObject({ test_id: prueba.id, item_id: reactivo.id, value: opcion.value })
        elegidas.push({ test_id: prueba.id, item_id: reactivo.id, value: opcion.value })
        await expect(indicador).toHaveText('Guardado')
        await expect(siguiente).toBeEnabled()

        // Con allows_back se puede regresar: la respuesta anterior sigue marcada.
        if (prueba.conAnterior && indice === 1) {
          const previo = prueba.reactivos[0]
          await anterior.click()
          await expect(page.getByRole('heading', { level: 2, name: previo.prompt })).toBeVisible()
          await expect(page.getByRole('radio', { name: previo.options[0].label, exact: true })).toBeChecked()
          await boton(page, 'Siguiente pregunta').click()
          await expect(page.getByRole('heading', { level: 2, name: reactivo.prompt })).toBeVisible()
          await expect(page.getByRole('radio', { name: opcion.label, exact: true })).toBeChecked()
        }

        // En la última, doble clic: el cierre sale una sola vez.
        if (ultimaPrueba && ultimo) await siguiente.dblclick()
        else await siguiente.click()
      }
    }

    // Fin con los datos reales del examen.
    await expect(page.getByRole('heading', { level: 1, name: '¡Examen completado con éxito!' })).toBeVisible()
    await expect(page.getByText(`Tus respuestas se enviaron a ${ORGANIZACION}.`)).toBeVisible()
    await expect(page.getByText(`${total} de ${total}`, { exact: true })).toBeVisible()
    await expect(page.getByText('Tus respuestas quedaron registradas. No es necesario hacer nada más.')).toBeVisible()

    // Peticiones: consentimiento antes del primer reactivo, una por respuesta y un solo cierre.
    const consentimientos = api.llamadas('POST', `${PORTAL}/consent`)
    expect(consentimientos).toHaveLength(1)
    expect(consentimientos[0].cuerpo).toEqual({ privacy_version: 'v1' })
    const cargas = api.llamadas('GET', new RegExp(`^${PORTAL}/pruebas/\\d+$`))
    expect(cargas.map((peticion) => peticion.ruta)).toEqual([`${PORTAL}/pruebas/1`, `${PORTAL}/pruebas/4`])
    expect(api.orden(consentimientos[0])).toBeLessThan(api.orden(cargas[0]))

    const guardadas = api.llamadas('POST', `${PORTAL}/answers`)
    expect(guardadas).toHaveLength(total)
    expect(guardadas.map((peticion) => peticion.cuerpo)).toEqual(elegidas.map((elegida) => expect.objectContaining(elegida)))
    for (const { cuerpo } of guardadas) {
      const { elapsed_ms: transcurrido } = cuerpo as { elapsed_ms: unknown }
      expect(Number.isInteger(transcurrido) && (transcurrido as number) >= 0, `elapsed_ms entero: ${String(transcurrido)}`).toBe(true)
    }

    const cierres = api.llamadas('POST', `${PORTAL}/complete`)
    expect(cierres).toHaveLength(1)
    expect(api.orden(cierres[0])).toBeGreaterThan(api.orden(guardadas.at(-1)))
    expect(api.llamadas('POST', `${PORTAL}/events`)).toHaveLength(0)
  })

  test('un 409 al finalizar bloquea el portal y dice que la evaluación ya se completó', async ({ page, simular }) => {
    const api = await simular('candidato', {
      // Ya había aceptado el aviso y solo le falta la última pregunta de la segunda prueba.
      'GET /api/evaluar/:token': portalCon({ status: 'iniciada', consented: true }),
      [claveDePrueba(1)]: pruebaConRespuestas(1, 12),
      [claveDePrueba(4)]: pruebaConRespuestas(4, 19),
      // La terminó en otra pestaña: el cierre responde 409 y el portal ya dice «completada».
      'POST /api/evaluar/:token/complete': (_peticion, simulada) => {
        simulada.definir({ 'GET /api/evaluar/:token': portalCon({ status: 'completada', consented: true }) })
        return { status: 409, body: { message: 'La evaluación ya no admite respuestas.' } }
      },
    })
    const ultimo = reactivosDe(4).at(-1)!

    await page.goto(`/evaluar/${TOKEN}`)
    await expect(page.getByText('Ya aceptaste el aviso de privacidad.')).toBeVisible()
    await boton(page, 'Continuar evaluación').click()

    // Retoma en la primera pregunta sin respuesta: la última de la segunda prueba.
    await expect(page.getByRole('heading', { level: 2, name: ultimo.prompt })).toBeVisible()
    await expect(page.getByText('Pregunta 20 de 20', { exact: true })).toBeVisible()
    await expect(page.getByText('Prueba 2 de 2', { exact: true })).toBeVisible()
    await page.getByRole('radio', { name: 'Neutral', exact: true }).check()
    await boton(page, 'Finalizar examen').click()

    await expect(page.getByRole('heading', { level: 1, name: 'Esta evaluación ya se completó' })).toBeVisible()
    await expect(page.getByText('Tus respuestas quedaron registradas. No es necesario hacer nada más.')).toBeVisible()
    await expect(page.getByText(`Si tienes dudas, contacta a ${ORGANIZACION}.`)).toBeVisible()
    await expect(boton(page, 'Finalizar examen')).toHaveCount(0)
    await expect(page.getByRole('heading', { name: '¡Examen completado con éxito!' })).toHaveCount(0)

    expect(api.llamadas('POST', `${PORTAL}/consent`)).toHaveLength(0)
    expect(api.llamadas('POST', `${PORTAL}/answers`).map((peticion) => peticion.cuerpo)).toEqual([
      expect.objectContaining({ test_id: 4, item_id: ultimo.id, value: 3 }),
    ])
    expect(api.llamadas('POST', `${PORTAL}/complete`)).toHaveLength(1)
  })

  test('una invitación expirada se bloquea sin pedir preguntas', async ({ page, simular }) => {
    const api = await simular('candidato-expirada')

    // Esta vez, solo el código.
    await page.goto('/evaluar')
    await page.getByLabel('Enlace o código').fill(TOKEN_EXPIRADA)
    await boton(page, 'Continuar').click()
    await esperarRuta(page, `/evaluar/${TOKEN_EXPIRADA}`)

    await expect(page.getByRole('heading', { level: 1, name: 'Esta invitación ya venció' })).toBeVisible()
    await expect(page.getByText('La fecha límite para responder la evaluación ya pasó.')).toBeVisible()
    await expect(
      page.getByText(`Si todavía quieres responder o crees que es un error, contacta a ${ORGANIZACION}.`),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: /evaluación/ })).toHaveCount(0)
    await expect(page.getByRole('checkbox')).toHaveCount(0)

    // Solo se consultó la invitación: ni consentimiento, ni reactivos, ni respuestas.
    const delPortal = api.peticiones.filter((peticion) => peticion.ruta.startsWith('/api/evaluar/'))
    expect(delPortal.length).toBeGreaterThan(0)
    expect(delPortal.every((peticion) => peticion.metodo === 'GET' && peticion.ruta === `/api/evaluar/${TOKEN_EXPIRADA}`)).toBe(true)
  })
})
