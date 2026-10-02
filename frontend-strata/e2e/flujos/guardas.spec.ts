// Guardas de ruta (D-07): sin empresa, /app va a /perfil con un aviso; sin
// sesión, /perfil va a /login (y se vuelve a /perfil al entrar); con sesión,
// /login y /registro van al inicio de cada usuario.

import { esperarRuta, expect, respuestaDe, test } from './api.ts'

const AVISO_SIN_ORGANIZACION = 'Tu cuenta no tiene una empresa registrada, por eso no puedes entrar al panel de RR. HH.'

test.describe('Guardas de ruta', () => {
  for (const ruta of ['/app', '/app/evaluaciones/nueva']) {
    test(`sin organización, ${ruta} lleva a /perfil con el aviso`, async ({ page, simular }) => {
      await simular('sin-org')
      await page.goto(ruta)
      await esperarRuta(page, '/perfil')
      await expect(page.getByRole('heading', { level: 1, name: 'Mi perfil' })).toBeVisible()
      await expect(page.getByRole('alert')).toContainText(AVISO_SIN_ORGANIZACION)
    })
  }

  test('sin sesión, /perfil lleva a /login y al entrar vuelve a /perfil', async ({ page, simular }) => {
    const api = await simular('visitante')
    await page.goto('/perfil')
    await esperarRuta(page, '/login')
    await expect(page.getByRole('heading', { level: 1, name: 'Entrar' })).toBeVisible()
    // Nada venció: la guarda no deja aviso.
    await expect(page.getByRole('alert')).toHaveCount(0)

    api.usar('rh', { 'POST /api/login': respuestaDe('rh-sesion-vencida', 'POST /api/login') })
    await page.getByLabel('Correo electrónico').fill('mariana.solis@example.com')
    await page.getByLabel('Contraseña').fill('Contrasena-segura-1')
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    await esperarRuta(page, '/perfil')
    await expect(page.getByRole('heading', { level: 1, name: 'Mi perfil' })).toBeVisible()
  })

  for (const ruta of ['/login', '/registro']) {
    test(`con sesión, ${ruta} lleva a /app`, async ({ page, simular }) => {
      await simular('rh')
      await page.goto(ruta)
      await esperarRuta(page, '/app')
      await expect(page.getByRole('heading', { level: 1, name: 'Resultados' })).toBeVisible()
    })
  }
})
