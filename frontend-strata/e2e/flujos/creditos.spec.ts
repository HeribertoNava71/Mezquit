// Créditos (mapa.md, RH-4 y RH-5; D-08, D-09 y S-10): el drawer «Solicitar
// créditos» se abre con ?solicitar=1, envía POST /api/credit-requests y el
// saldo no cambia hasta que un super admin aprueba la solicitud.

import { esperarRuta, expect, test } from './api.ts'

test('solicita créditos desde ?solicitar=1 y el saldo no cambia', async ({ page, simular }) => {
  const api = await simular('rh')

  await page.goto('/app/creditos?solicitar=1')
  const drawer = page.getByRole('dialog', { name: 'Solicitar créditos' })
  await expect(drawer).toBeVisible()
  await expect(drawer).toContainText('Un asesor revisa cada solicitud.')
  const cantidad = drawer.getByRole('spinbutton', { name: 'Cantidad de créditos' })
  await expect(cantidad).toBeFocused()

  // Saldo antes de enviar: la tarjeta «Disponibles» y la barra.
  const resumen = page.getByRole('region', { name: 'Resumen de créditos' })
  const disponibles = resumen.locator('.st-stat').filter({ hasText: 'Disponibles' }).locator('.st-stat__badge')
  await expect(disponibles).toHaveText('37')
  const saldoEnBarra = page.getByRole('link', { name: /^37 créditos/ })
  await expect(saldoEnBarra).toBeVisible()
  await page.waitForLoadState('networkidle')
  const lecturasDeSaldo = api.llamadas('GET', '/api/credits').length

  await cantidad.fill('15')
  await drawer.getByRole('button', { name: 'Agregar un crédito' }).click()
  await expect(cantidad).toHaveValue('16')
  await drawer.getByLabel('Nota (opcional)').fill('Proceso de selección de octubre')
  // Doble clic: una sola solicitud.
  await drawer.getByRole('button', { name: 'Enviar solicitud' }).dblclick()

  // Confirmación en el drawer (visible y anunciada por su región de estado) y toast.
  const exito = 'Solicitud registrada. Un asesor la revisará.'
  const confirmacion = drawer.locator('.st-callout').filter({ hasText: exito })
  await expect(confirmacion).toBeVisible()
  await expect(confirmacion).toContainText('Pediste 16 créditos. Tu saldo no cambia hasta que se apruebe la solicitud.')
  await expect(drawer.getByRole('status')).toHaveText(exito)
  await expect(page.locator('.st-toaster')).toContainText('Solicitud de créditos enviada')

  const solicitudes = api.llamadas('POST', '/api/credit-requests')
  expect(solicitudes).toHaveLength(1)
  expect(solicitudes[0].cuerpo).toStrictEqual({ requested_amount: 16, note: 'Proceso de selección de octubre' })

  // Cerrar quita ?solicitar=1 y devuelve el foco a «Solicitar créditos».
  await drawer.getByRole('button', { name: 'Cerrar' }).last().click()
  await expect(drawer).toBeHidden()
  await esperarRuta(page, '/app/creditos')
  await expect(page).toHaveURL((url) => !url.searchParams.has('solicitar'))
  await expect(page.getByRole('button', { name: 'Solicitar créditos' })).toBeFocused()

  // El saldo sigue igual y no se volvió a pedir.
  await expect(disponibles).toHaveText('37')
  await expect(saldoEnBarra).toBeVisible()
  expect(api.llamadas('GET', '/api/credits')).toHaveLength(lecturasDeSaldo)
})
