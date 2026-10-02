import { defineConfig, devices } from '@playwright/test'

// Pruebas de extremo a extremo (Fase 8): `npm run test:e2e`.
// - Recorridos en e2e/flujos/*.spec.ts. Los scripts de QA de e2e/*.mjs (a11y,
//   recorrido, barras…) se corren aparte con node y no son parte de esta suite.
// - El sitio corre con el servidor de desarrollo de Vite en el puerto 5189
//   (StrictMode activo: se notan los efectos que corren dos veces).
// - No hace falta el backend: cada prueba simula la API con page.route a partir
//   de los JSON de e2e/mocks (e2e/flujos/api.ts).
// - Proyecto «demo» (e2e/demo): el modo demo sin backend tal como lo usa el
//   dueño, `vite --mode mock` (npm run dev:mock) en el puerto 5190 y sin retardo.
//   Ahí la API la responde el servidor de Vite, sin page.route.
// - Con prefers-reduced-motion: reduce, las entradas terminan al instante y la
//   mascota de la home no se monta; los recorridos con movimiento son de los
//   scripts de QA (e2e/recorrido.mjs y e2e/fugas-mascota.mjs).

const PUERTO = 5189
const URL_BASE = `http://localhost:${PUERTO}`
const PUERTO_DEMO = 5190
const URL_DEMO = `http://localhost:${PUERTO_DEMO}`

export default defineConfig({
  testDir: './e2e/flujos',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: URL_BASE,
    locale: 'es-MX',
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'demo', testDir: './e2e/demo', use: { ...devices['Desktop Chrome'], baseURL: URL_DEMO } },
  ],
  webServer: [
    {
      command: `npx vite --port ${PUERTO} --strictPort`,
      url: URL_BASE,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: `npx vite --mode mock --port ${PUERTO_DEMO} --strictPort`,
      url: `${URL_DEMO}/__mock`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: { STRATA_MOCK_RETARDO: '0' },
    },
  ],
})
