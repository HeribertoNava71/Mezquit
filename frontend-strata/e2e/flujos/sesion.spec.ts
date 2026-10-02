// Sesión vencida (D-07, punto 8): una petición con sesión que recibe 401 lleva
// a /login con el aviso, y al volver a entrar se regresa a la ruta de origen.

import type { Page } from '@playwright/test'
import { esperarRuta, expect, respuestaDe, test } from './api.ts'

function boton(page: Page, nombre: string) {
  return page.getByRole('button', { name: nombre, exact: true })
}

test('una acción con la sesión vencida lleva a /login con el aviso y vuelve a la ruta de origen', async ({ page, simular }) => {
  const api = await simular('rh')
  const titulo = page.getByRole('heading', { level: 1, name: 'Coordinación de almacén · septiembre' })

  await page.goto('/app/evaluaciones/13')
  await expect(titulo).toBeVisible()
  await page.waitForLoadState('networkidle')

  // La sesión vence (o se cierra en otra pestaña): toda ruta con sesión responde 401.
  api.usar('rh-sesion-vencida')
  await boton(page, 'Reenviar la invitación a Andrés Molina').click()

  await esperarRuta(page, '/login')
  await expect(page.getByRole('heading', { level: 1, name: 'Entrar' })).toBeVisible()
  await expect(page.getByRole('alert')).toHaveText('Tu sesión expiró. Vuelve a entrar.')
  const reenvios = api.llamadas('POST', '/api/invitations/45/resend')
  expect(reenvios).toHaveLength(1)
  expect(reenvios[0].clave).toBe('POST /api/*')

  // Vuelve a entrar con el backend ya en orden.
  api.usar('rh', { 'POST /api/login': respuestaDe('rh-sesion-vencida', 'POST /api/login') })
  await page.getByLabel('Correo electrónico').fill('mariana.solis@example.com')
  await page.getByLabel('Contraseña').fill('Contrasena-segura-1')
  await boton(page, 'Entrar').click()

  await esperarRuta(page, '/app/evaluaciones/13')
  await expect(titulo).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
  expect(api.llamadas('POST', '/api/login')).toHaveLength(1)
})
