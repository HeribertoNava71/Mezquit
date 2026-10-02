// Recorrido de RR. HH. (mapa.md, RH-6 a RH-10): entrar, crear una evaluación
// con el asistente, el saldo insuficiente, el detalle con sus acciones y el
// reporte del candidato.

import type { Page } from '@playwright/test'
import { datosDe, esperarRuta, expect, respuestaDe, test } from './api.ts'

const USUARIO = { email: 'mariana.solis@example.com', password: 'Contrasena-segura-1' }

/** Fecha local AAAA-MM-DD dentro de `dias` días (la fecha límite debe ser posterior a hoy). */
function fechaEn(dias: number): string {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() + dias)
  const dos = (n: number) => String(n).padStart(2, '0')
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`
}

function boton(page: Page, nombre: string) {
  return page.getByRole('button', { name: nombre, exact: true })
}

/** Llena los pasos Datos, Prueba y Candidatos del asistente y llega a Confirmar. */
async function llenarAsistente(
  page: Page,
  datos: { nombre: string; puesto: string },
  candidatos: { nombre: string; correo: string; telefono?: string }[],
) {
  await page.goto('/app/evaluaciones/nueva')
  await expect(page.getByRole('heading', { level: 1, name: 'Nueva evaluación' })).toBeVisible()

  // Paso 1 · Datos.
  await page.getByLabel('Nombre de la evaluación').fill(datos.nombre)
  await page.getByLabel('Puesto').fill(datos.puesto)
  await boton(page, 'Siguiente').click()

  // Paso 2 · Prueba: la prueba fija (id 1) ya está elegida.
  await expect(page.getByRole('heading', { level: 2, name: 'Prueba', exact: true })).toBeVisible()
  await expect(page.getByRole('radio', { name: 'Prueba de demostración' })).toBeChecked()
  await boton(page, 'Siguiente').click()

  // Paso 3 · Candidatos.
  await expect(page.getByRole('heading', { level: 2, name: 'Candidatos', exact: true })).toBeVisible()
  for (const [indice, candidato] of candidatos.entries()) {
    if (indice > 0) await boton(page, 'Agregar otro').click()
    const fila = page.getByRole('group', { name: `Candidato ${indice + 1}` })
    await fila.getByLabel('Nombre').fill(candidato.nombre)
    await fila.getByLabel('Correo').fill(candidato.correo)
    if (candidato.telefono) await fila.getByLabel('Teléfono').fill(candidato.telefono)
  }
  await boton(page, 'Siguiente').click()

  // Paso 4 · Confirmar.
  await expect(page.getByRole('heading', { level: 2, name: 'Confirma y envía' })).toBeVisible()
}

test.describe('Portal de RR. HH.', () => {
  test('entra con su cuenta y llega al panel', async ({ page, simular }) => {
    const api = await simular('rh', {
      'GET /api/user': { status: 401, body: { message: 'Unauthenticated.' } },
      'POST /api/login': respuestaDe('rh-sesion-vencida', 'POST /api/login'),
    })

    await page.goto('/login')
    await expect(page.getByRole('heading', { level: 1, name: 'Entrar' })).toBeVisible()
    await page.getByLabel('Correo electrónico').fill(USUARIO.email)
    await page.getByLabel('Contraseña').fill(USUARIO.password)
    await boton(page, 'Entrar').click()

    await esperarRuta(page, '/app')
    await expect(page.getByRole('heading', { level: 1, name: 'Resultados' })).toBeVisible()
    await expect(page.getByRole('link', { name: /^37 créditos/ })).toBeVisible()

    const accesos = api.llamadas('POST', '/api/login')
    expect(accesos).toHaveLength(1)
    expect(accesos[0].cuerpo).toEqual(USUARIO)
    // La cookie CSRF se pide antes de enviar las credenciales.
    const csrf = api.llamadas('GET', '/sanctum/csrf-cookie')
    expect(csrf.length).toBeGreaterThan(0)
    expect(api.orden(csrf[0])).toBeLessThan(api.orden(accesos[0]))
  })

  test('crea una evaluación con el asistente y ve los enlaces de invitación', async ({ page, simular }) => {
    const creada = respuestaDe('rh', 'POST /api/assessments')
    const saldo = respuestaDe('rh', 'GET /api/credits')
    const api = await simular('rh', {
      // El backend descuenta 1 crédito por candidato al crear la evaluación.
      'POST /api/assessments': (_peticion, simulada) => {
        const despues = structuredClone(saldo)
        ;(despues.body as { data: { balance: number } }).data.balance = 35
        simulada.definir({ 'GET /api/credits': despues })
        return creada
      },
    })
    const fechaLimite = fechaEn(14)

    await llenarAsistente(page, { nombre: '  Auxiliares contables ', puesto: 'Auxiliar contable' }, [
      { nombre: 'Karla Estrada', correo: 'karla.estrada@example.com', telefono: ' 55 1234 5678 ' },
      { nombre: 'Luis Fernando Ortiz', correo: 'luisfernando.ortiz@example.com' },
    ])

    await page.getByLabel('Fecha límite').fill(fechaLimite)
    const resumen = page.locator('.st-nueva-resumen')
    await expect(resumen).toContainText('Auxiliares contables')
    await expect(resumen).toContainText('Karla Estrada')
    await expect(resumen).toContainText('Luis Fernando Ortiz')
    await expect(page.getByText('Después de enviar te quedarán 35 créditos.')).toBeVisible()
    expect(api.llamadas('POST', '/api/assessments')).toHaveLength(0)

    // Doble clic: la evaluación se crea una sola vez (y se cobra una sola vez).
    await boton(page, 'Crear y enviar').dblclick()

    // Pantalla de enlaces con la respuesta de POST /api/assessments.
    await expect(page.getByRole('heading', { level: 2, name: 'Enlaces de invitación' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 1, name: 'Auxiliares contables' })).toBeVisible()
    await expect(page.locator('.st-toaster')).toContainText('Evaluación creada')
    await expect(page.getByText('La invitación ya se envió por correo a cada candidato.')).toBeVisible()
    // El saldo se vuelve a pedir: aquí y en la barra.
    await expect(page.getByText('Se usaron 2 créditos. Tu saldo actual es de 35 créditos.')).toBeVisible()
    await expect(page.getByRole('link', { name: /^35 créditos/ })).toBeVisible()
    const invitaciones = datosDe<{ invitations: { candidate: string; link: string }[] }>('rh', 'POST /api/assessments').invitations
    for (const invitacion of invitaciones) {
      const tarjeta = page.getByRole('article', { name: invitacion.candidate })
      await expect(tarjeta).toContainText(invitacion.link)
      await expect(tarjeta.getByRole('button', { name: `Copiar enlace de ${invitacion.candidate}` }).first()).toBeVisible()
    }
    await expect(page.getByRole('link', { name: 'Ver evaluación' })).toHaveAttribute('href', '/app/evaluaciones/18')

    // El payload de siempre (sin espacios sobrantes; phone solo si se capturó).
    const envios = api.llamadas('POST', '/api/assessments')
    expect(envios).toHaveLength(1)
    expect(envios[0].cuerpo).toStrictEqual({
      name: 'Auxiliares contables',
      position: 'Auxiliar contable',
      test_ids: [1],
      candidates: [
        { name: 'Karla Estrada', email: 'karla.estrada@example.com', phone: '55 1234 5678' },
        { name: 'Luis Fernando Ortiz', email: 'luisfernando.ortiz@example.com' },
      ],
      deadline: fechaLimite,
    })
  })

  test('sin saldo, el 422 muestra el aviso con el enlace para solicitar créditos', async ({ page, simular }) => {
    // rh-vacio: saldo 0 y POST /api/assessments responde 422 «Créditos insuficientes…».
    const api = await simular('rh-vacio')

    await llenarAsistente(page, { nombre: 'Floristas de temporada', puesto: '' }, [
      { nombre: 'Rocío Medina', correo: 'rocio.medina@example.com' },
    ])
    await expect(page.getByText('Aún no tienes créditos')).toBeVisible()
    await boton(page, 'Crear y enviar').click()

    const aviso = page.getByRole('alert').filter({ hasText: 'No te alcanzan los créditos' })
    await expect(aviso).toBeVisible()
    await expect(aviso).toContainText('Créditos insuficientes: necesitas 1, tienes 0')
    await expect(aviso).toBeFocused()
    const solicitar = aviso.getByRole('link', { name: 'Solicitar créditos (se abre en otra pestaña)' })
    await expect(solicitar).toHaveAttribute('href', '/app/creditos?solicitar=1')
    await expect(solicitar).toHaveAttribute('target', '_blank')

    // Sigue en Confirmar, con lo capturado.
    await expect(page.getByRole('heading', { level: 2, name: 'Confirma y envía' })).toBeVisible()
    await expect(page.locator('.st-nueva-resumen')).toContainText('Rocío Medina')
    const envios = api.llamadas('POST', '/api/assessments')
    expect(envios).toHaveLength(1)
    expect(envios[0].cuerpo).toStrictEqual({
      name: 'Floristas de temporada',
      position: '',
      test_ids: [1],
      candidates: [{ name: 'Rocío Medina', email: 'rocio.medina@example.com' }],
      deadline: null,
    })
  })

  test('en el detalle copia, reenvía (también con 409) y comparte la invitación', async ({ page, simular }) => {
    const api = await simular('rh', {
      // Sofía Navarro terminó mientras la lista estaba abierta: reenviar responde 409.
      'POST /api/invitations/44/resend': { status: 409, body: { message: 'La invitación ya fue completada.' } },
    })
    const evaluacion = datosDe<{ invitations: { id: number; candidate: string; email: string; link: string }[] }>(
      'rh',
      'GET /api/assessments/13',
    )
    const andres = evaluacion.invitations.find((invitacion) => invitacion.id === 45)!
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])

    await page.goto('/app/evaluaciones/13')
    await expect(page.getByRole('heading', { level: 1, name: 'Coordinación de almacén · septiembre' })).toBeVisible()
    await expect(page.getByText('Mostrando 6 de 6 candidatos')).toBeVisible()

    // Copiar enlace: al portapapeles, con el toast de confirmación.
    await boton(page, 'Copiar enlace de Andrés Molina').click()
    await expect(page.locator('.st-toaster')).toContainText('Enlace copiado')
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(andres.link)

    // Reenviar: POST /api/invitations/45/resend y toast.
    await boton(page, 'Reenviar la invitación a Andrés Molina').click()
    await expect(page.locator('.st-toaster')).toContainText('Invitación reenviada a andres.molina@example.com')
    expect(api.llamadas('POST', '/api/invitations/45/resend')).toHaveLength(1)

    // Reenviar con 409: el error queda en la fila, con ícono y texto.
    await boton(page, 'Reenviar la invitación a Sofía Navarro').click()
    await expect(page.getByRole('alert').filter({ hasText: 'Esta invitación ya se completó' })).toHaveText(
      'Esta invitación ya se completó y no se puede reenviar. Actualiza la lista para ver su estado.',
    )
    expect(api.llamadas('POST', '/api/invitations/44/resend')).toHaveLength(1)

    // Quien ya completó no se puede reenviar.
    const reenviarValentina = boton(page, 'Reenviar la invitación a Valentina Ríos')
    await expect(reenviarValentina).toBeDisabled()
    await reenviarValentina.click({ force: true })
    expect(api.llamadas('POST', '/api/invitations/41/resend')).toHaveLength(0)

    // Compartir: modal con el enlace real, los canales y la fecha límite.
    const compartir = boton(page, 'Compartir la invitación de Andrés Molina')
    await compartir.click()
    const modal = page.getByRole('dialog', { name: 'Enlace de invitación' })
    await expect(modal).toBeVisible()
    await expect(modal).toContainText('Andrés Molina')
    await expect(modal).toContainText(andres.email)
    await expect(modal).toContainText(andres.link)
    await expect(modal).toContainText('La invitación ya se envió por correo. Fecha límite: 30 sep 2026.')
    const correo = modal.getByRole('link', { name: 'Enviar por Correo a Andrés Molina' })
    await expect(correo).toHaveAttribute('href', new RegExp(`^mailto:${andres.email}\\?subject=`))
    await expect(correo).toHaveAttribute('href', new RegExp(encodeURIComponent(andres.link).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    await expect(modal.getByRole('link', { name: /^Enviar por WhatsApp a Andrés Molina/ })).toHaveAttribute(
      'href',
      `https://wa.me/?text=${encodeURIComponent(['Hola, Andrés Molina:', '', 'Este es tu enlace personal para responder la evaluación:', andres.link, '', 'Responde antes del 30/09/2026.'].join('\n'))}`,
    )
    await page.keyboard.press('Escape')
    await expect(modal).toBeHidden()
    await expect(compartir).toBeFocused()
  })

  test('el reporte muestra una sección por prueba y «Descargar PDF» abre la impresión', async ({ page, simular }) => {
    await simular('rh')
    // window.print bloquea en un navegador real; aquí registra el título y avisa afterprint.
    await page.addInitScript(() => {
      const ventana = window as Window & { __impresiones?: string[] }
      ventana.__impresiones = []
      window.print = () => {
        ventana.__impresiones?.push(document.title)
        window.dispatchEvent(new Event('afterprint'))
      }
    })
    const reporte = datosDe<{ tests: { name: string; integrity: { blur_count: number }; scales: { name: string }[] }[]; interview_questions: string[] }>(
      'rh',
      'GET /api/invitations/41/report',
    )

    await page.goto('/app/evaluaciones/13')
    await page.getByRole('link', { name: 'Ver reporte de Valentina Ríos' }).click()
    await esperarRuta(page, '/app/candidatos/41/reporte')

    const articulo = page.getByRole('article', { name: 'Valentina Ríos' })
    await expect(articulo.getByRole('heading', { level: 1, name: 'Valentina Ríos' })).toBeVisible()
    await expect(articulo).toContainText('Coordinación de almacén · septiembre')
    for (const prueba of reporte.tests) {
      const seccion = articulo.getByRole('region', { name: prueba.name })
      await expect(seccion.getByRole('heading', { level: 2, name: prueba.name })).toBeVisible()
      await expect(seccion.getByRole('heading', { name: 'Puntuaciones' })).toBeVisible()
      await expect(seccion.getByRole('heading', { name: 'Integridad de respuesta' })).toBeVisible()
      await expect(seccion).toContainText(`${prueba.integrity.blur_count} vez(ces) que la pantalla perdió el foco`)
      for (const escala of prueba.scales) await expect(seccion).toContainText(escala.name)
    }
    // Una sección por prueba, más las preguntas de entrevista (una sola vez).
    await expect(articulo.getByRole('region')).toHaveCount(reporte.tests.length + 1)
    const preguntas = articulo.getByRole('region', { name: 'Preguntas sugeridas para entrevista' })
    await expect(preguntas.getByRole('listitem')).toHaveCount(reporte.interview_questions.length)

    const tituloAntes = await page.title()
    await boton(page, 'Descargar PDF').click()
    expect(await page.evaluate(() => (window as Window & { __impresiones?: string[] }).__impresiones)).toEqual([
      'Reporte de Valentina Ríos · Strata',
    ])
    expect(await page.title()).toBe(tituloAntes)

    // «Volver» regresa al detalle de donde vino.
    await page.getByRole('link', { name: 'Volver' }).click()
    await esperarRuta(page, '/app/evaluaciones/13')
  })
})
