// El toast no tapa los controles de un drawer o modal abierto (Fase 8). Abre el
// drawer «Solicitar créditos», envía la solicitud y, mientras se ve el toast
// «Solicitud registrada», comprueba que su caja no cruza ningún control del drawer
// («Cerrar» y la X). Lo mismo con el modal «Enlace de invitación» al copiar el enlace.
//
// Uso, desde frontend-strata y con el sitio corriendo:
//   node e2e/toast-overlay.mjs [--url http://localhost:5188] [--anchos 360,768,1440]

import { chromium } from '@playwright/test'
import { abrir, leerOpciones, nuevoContexto, URL_POR_DEFECTO } from './comun.mjs'

const opciones = leerOpciones(process.argv.slice(2), {
  url: { porDefecto: URL_POR_DEFECTO, convertir: (v) => String(v ?? '').replace(/\/+$/, '') },
  anchos: { porDefecto: [360, 768, 1440], convertir: (v) => String(v).split(',').map(Number) },
})

/** Controles del overlay que cruza la caja del toast. */
function tapados(page) {
  return page.evaluate(() => {
    const toast = document.querySelector('.st-toast')
    const panel = document.querySelector('[role="dialog"], [role="alertdialog"]')
    if (!toast || !panel) return { error: !toast ? 'sin toast' : 'sin overlay' }
    const t = toast.getBoundingClientRect()
    const cruza = (c) => t.left < c.right && c.left < t.right && t.top < c.bottom && c.top < t.bottom
    const controles = [...panel.querySelectorAll('button, a[href], input, textarea, select')].filter((c) => c.getBoundingClientRect().width > 0)
    return {
      tapados: controles.filter((c) => cruza(c.getBoundingClientRect())).map((c) => (c.getAttribute('aria-label') || c.textContent || c.tagName).trim().slice(0, 30)),
      posicion: document.querySelector('.st-toaster')?.dataset.posicion ?? 'por defecto',
    }
  })
}

let fallos = 0
const browser = await chromium.launch()
try {
  for (const ancho of opciones.anchos) {
    // Drawer de créditos
    {
      const ctx = await nuevoContexto(browser, 'rh', { ancho, alto: 800 })
      const page = await ctx.newPage()
      await abrir(page, opciones.url, '/app/creditos', { espera: 300 })
      await page.getByRole('button', { name: 'Solicitar créditos' }).first().click()
      await page.locator('[role="dialog"] button[type="submit"]').click()
      await page.locator('.st-toast').waitFor({ timeout: 5_000 })
      await page.waitForTimeout(250)
      const r = await tapados(page)
      const ok = !r.error && r.tapados.length === 0
      if (!ok) fallos++
      console.log(`${ok ? 'ok   ' : 'FALLA'} ${ancho}px drawer «Solicitar créditos»: toast ${r.posicion}${r.error ? ` · ${r.error}` : r.tapados.length ? ` · tapa ${r.tapados.join(', ')}` : ', sin tapar controles'}`)
      await ctx.close()
    }
    // Modal «Enlace de invitación»: copiar el enlace muestra un toast
    {
      const ctx = await nuevoContexto(browser, 'rh', { ancho, alto: 800 })
      await ctx.grantPermissions(['clipboard-read', 'clipboard-write'])
      const page = await ctx.newPage()
      await abrir(page, opciones.url, '/app/evaluaciones/13', { espera: 300 })
      await page.locator('button:has-text("Compartir")').filter({ visible: true }).first().click()
      const dialogo = page.locator('[role="dialog"]')
      await dialogo.waitFor()
      await dialogo.getByRole('button', { name: /copiar/i }).first().click()
      await page.locator('.st-toast').waitFor({ timeout: 5_000 })
      await page.waitForTimeout(250)
      const r = await tapados(page)
      const ok = !r.error && r.tapados.length === 0
      if (!ok) fallos++
      console.log(`${ok ? 'ok   ' : 'FALLA'} ${ancho}px modal «Enlace de invitación»: toast ${r.posicion}${r.error ? ` · ${r.error}` : r.tapados.length ? ` · tapa ${r.tapados.join(', ')}` : ', sin tapar controles'}`)
      await ctx.close()
    }
  }
} finally {
  await browser.close()
}
process.exit(fallos > 0 ? 1 : 0)
