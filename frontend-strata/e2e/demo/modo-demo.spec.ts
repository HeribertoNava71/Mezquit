// Modo demo sin backend (npm run dev:mock), tal como se usa en el navegador: el
// servidor de Vite con --mode mock responde la API con e2e/mocks (proyecto
// «demo» de playwright.config.ts, puerto 5190, sin retardo). Aquí no hay
// page.route para la API: lo que se prueba es ese servidor, la cookie del
// escenario y la pastilla «Modo demo».

import { AxeBuilder } from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

/** Escenario guardado en la cookie del modo demo (undefined: visitante, sin cookie). */
async function escenarioEnCookie(page: Page): Promise<string | undefined> {
  return (await page.context().cookies()).find((cookie) => cookie.name === 'strata-mock-escenario')?.value
}

const pastilla = (page: Page, escenario: string) => page.getByRole('button', { name: `Modo demo, escenario ${escenario}` })

async function entrar(page: Page, correo: string) {
  await page.goto('/login')
  await page.getByLabel('Correo electrónico').fill(correo)
  await page.getByLabel('Contraseña').fill('demo-1234')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
}

test.beforeEach(async ({ page }) => {
  // Fuentes de Fontshare (index.html): hoja vacía, para no depender de la red.
  await page.route(/^https:\/\/(api|cdn)\.fontshare\.com\//, (route) =>
    route.fulfill({ status: 200, contentType: 'text/css', body: '' }),
  )
})

test('sin backend: el catálogo responde, el login entra como RR. HH. y salir vuelve a visitante', async ({ page }) => {
  await page.goto('/pruebas')
  await expect(pastilla(page, 'visitante')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Adaptabilidad' })).toBeVisible()

  await entrar(page, 'mariana@rioclaro.mx')
  await expect(page).toHaveURL((url) => url.pathname === '/app')
  await expect(page.getByRole('heading', { level: 1, name: 'Resultados' })).toBeVisible()
  await expect(pastilla(page, 'rh')).toBeVisible()
  expect(await escenarioEnCookie(page)).toBe('rh')

  await page.getByRole('button', { name: /menú de cuenta/i }).click()
  await page.getByRole('menuitem', { name: 'Salir' }).click()
  await expect(page).toHaveURL((url) => url.pathname === '/login')
  await expect(pastilla(page, 'visitante')).toBeVisible()
  expect(await escenarioEnCookie(page)).toBe('visitante')
})

test('login con un correo admin… entra como super admin y el atajo lleva a /admin/creditos', async ({ page }) => {
  await entrar(page, 'admin@strata.mx')
  await expect(pastilla(page, 'admin')).toBeVisible()

  await pastilla(page, 'admin').click()
  await page.getByRole('region', { name: 'Ir a' }).getByRole('link', { name: /Super admin/ }).click()
  await expect(page).toHaveURL((url) => url.pathname === '/admin/creditos')
  await expect(page.getByRole('heading', { level: 1, name: 'Solicitudes de créditos' })).toBeVisible()
})

test('la pastilla cambia de escenario: recarga con ?escenario= y guarda la cookie', async ({ page }) => {
  await page.goto('/login')
  await pastilla(page, 'visitante').click()
  await page.getByRole('region', { name: 'Escenario' }).getByRole('link', { name: /^sin-org/ }).click()

  // Con la sesión sin empresa, /login lleva a /perfil; la dirección queda sin el parámetro.
  await expect(page).toHaveURL((url) => url.pathname === '/perfil' && url.search === '')
  await expect(page.getByRole('heading', { level: 1, name: 'Mi perfil' })).toBeVisible()
  await expect(pastilla(page, 'sin-org')).toBeVisible()
  expect(await escenarioEnCookie(page)).toBe('sin-org')
})

test('el portal del candidato responde en cualquier escenario, en /evaluar/demo', async ({ page }) => {
  await page.goto('/evaluar/demo?escenario=admin')
  await expect(page).toHaveURL((url) => url.pathname === '/evaluar/demo' && url.search === '')
  await expect(page.getByText('Invitación verificada')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Comercializadora Río Claro te ha invitado')
  await expect(pastilla(page, 'admin')).toBeVisible()
})

test('la pastilla y su panel pasan axe (WCAG 2.2 AA)', async ({ page }) => {
  await page.goto('/')
  await pastilla(page, 'visitante').click()
  await expect(page.getByRole('region', { name: 'Escenario' })).toBeVisible()

  const resultado = await new AxeBuilder({ page })
    .include('.st-modo-demo')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
  expect(resultado.violations).toEqual([])
})
