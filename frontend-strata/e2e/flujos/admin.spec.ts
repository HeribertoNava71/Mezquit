// Super admin (mapa.md, sección 2; R-30 a R-34): /admin lleva a Solicitudes,
// aprobar pide confirmación, la búsqueda de usuarios espera a que dejes de
// escribir y nadie puede eliminar su propia cuenta (409).

import type { Page } from '@playwright/test'
import { datosDe, esperarRuta, expect, respuestaDe, test, type Peticion } from './api.ts'

interface Solicitud {
  id: number
  organization: string
  requested_amount: number
}

function boton(page: Page, nombre: string) {
  return page.getByRole('button', { name: nombre, exact: true })
}

/** GET /api/admin/users con búsqueda (el parámetro search). */
const busquedas = (peticiones: Peticion[]) => peticiones.filter((peticion) => peticion.consulta.has('search'))

test.describe('Operación (super admin)', () => {
  test('/admin lleva a /admin/creditos', async ({ page, simular }) => {
    await simular('admin')
    await page.goto('/admin')
    await esperarRuta(page, '/admin/creditos')
    await expect(page.getByRole('heading', { level: 1, name: 'Solicitudes de créditos' })).toBeVisible()
  })

  test('aprueba una solicitud después de confirmar', async ({ page, simular }) => {
    const pendientes = datosDe<Solicitud[]>('admin', 'GET /api/admin/credit-requests')
    const lista = respuestaDe('admin', 'GET /api/admin/credit-requests')
    const api = await simular('admin', {
      // El mock recuerda la aprobación: la lista deja de traer la solicitud 8.
      'POST /api/admin/credit-requests/:id/approve': (peticion, simulada) => {
        const id = Number(peticion.ruta.split('/').at(-2))
        const restantes = structuredClone(lista)
        const cuerpo = restantes.body as { data: Solicitud[] }
        cuerpo.data = cuerpo.data.filter((solicitud) => solicitud.id !== id)
        simulada.definir({ 'GET /api/admin/credit-requests': restantes })
        return { status: 200, body: { ok: true } }
      },
    })
    const [primera] = pendientes

    await page.goto('/admin/creditos')
    await expect(page.getByText(`· ${pendientes.length} solicitudes, de la más antigua a la más reciente`)).toBeVisible()
    await expect(page.getByRole('link', { name: `${pendientes.length} solicitudes pendientes` })).toBeVisible()

    // «Aprobar» abre la confirmación; «Cancelar» no aprueba nada.
    const aprobar = boton(page, `Aprobar la solicitud de ${primera.organization} por ${primera.requested_amount} créditos`)
    await aprobar.click()
    const confirmacion = page.getByRole('alertdialog', { name: `¿Aprobar la solicitud de ${primera.organization}?` })
    await expect(confirmacion).toBeVisible()
    await expect(confirmacion).toContainText(
      `Se suman ${primera.requested_amount} créditos al saldo de la empresa. Esta acción no se puede deshacer.`,
    )
    await expect(confirmacion.getByRole('button', { name: 'Cancelar' })).toBeFocused()
    await confirmacion.getByRole('button', { name: 'Cancelar' }).click()
    await expect(confirmacion).toBeHidden()
    expect(api.llamadas('POST', /\/approve$/)).toHaveLength(0)

    await aprobar.click()
    await confirmacion.getByRole('button', { name: 'Aprobar solicitud' }).click()
    await expect(confirmacion).toBeHidden()
    await expect(page.locator('.st-toaster')).toContainText(
      `Solicitud de ${primera.organization} aprobada: se sumaron ${primera.requested_amount} créditos a su saldo.`,
    )
    expect(api.llamadas('POST', /\/approve$/).map((peticion) => peticion.ruta)).toEqual([
      `/api/admin/credit-requests/${primera.id}/approve`,
    ])

    // La fila desaparece y la barra vuelve a contar las pendientes.
    await expect(page.getByText(`· ${pendientes.length - 1} solicitudes, de la más antigua a la más reciente`)).toBeVisible()
    await expect(page.getByRole('rowheader', { name: primera.organization, exact: true })).toHaveCount(0)
    await expect(page.getByRole('link', { name: `${pendientes.length - 1} solicitudes pendientes` })).toBeVisible()
  })

  test('busca usuarios después de que deja de escribir', async ({ page, simular }) => {
    const api = await simular('admin')

    await page.goto('/admin/usuarios')
    await expect(page.getByText('Mostrando 1–15 de 19 usuarios')).toBeVisible()
    await page.waitForLoadState('networkidle')

    // Tres teclas seguidas: una sola búsqueda, con el texto completo y 300 ms
    // después de la última tecla (las teclas van a 60 ms una de otra).
    const campo = page.getByRole('searchbox', { name: 'Buscar usuarios' })
    const inicio = Date.now()
    await campo.pressSequentially('ana', { delay: 60 })
    await expect(page.getByText('Mostrando 1–3 de 3 usuarios')).toBeVisible()
    const hechas = busquedas(api.llamadas('GET', '/api/admin/users'))
    expect(hechas.map((peticion) => peticion.consulta.get('search'))).toEqual(['ana'])
    expect(hechas[0].momento - inicio).toBeGreaterThanOrEqual(2 * 60 + 300 - 20)

    await expect(page.getByText('Resultados de la búsqueda')).toBeVisible()
    for (const nombre of ['Ana Lucía Treviño', 'Bruno Saldaña', 'Mariana Solís']) {
      await expect(page.getByRole('rowheader', { name: nombre })).toBeVisible()
    }

    // Sin coincidencias: el vacío de la búsqueda, distinto del de «sin usuarios».
    await campo.fill('zzz')
    await expect(page.getByText('Ningún usuario coincide con tu búsqueda')).toBeVisible()
    await boton(page, 'Borrar búsqueda').click()
    await expect(page.getByText('Mostrando 1–15 de 19 usuarios')).toBeVisible()
    await expect(campo).toHaveValue('')
    await expect(campo).toBeFocused()
  })

  test('eliminar su propia cuenta responde 409 y se explica en el modal', async ({ page, simular }) => {
    const api = await simular('admin')

    await page.goto('/admin/usuarios')
    await expect(page.getByText('Mostrando 1–15 de 19 usuarios')).toBeVisible()
    // Daniela Ortega (usuario 1, la operadora con sesión) está en la página 2.
    await boton(page, 'Siguiente').click()
    await expect(page.getByText('Página 2 de 2', { exact: true })).toBeVisible()

    const eliminar = boton(page, 'Eliminar a Daniela Ortega')
    await eliminar.click()
    const confirmacion = page.getByRole('alertdialog', { name: '¿Eliminar a Daniela Ortega?' })
    await expect(confirmacion).toBeVisible()
    await expect(confirmacion.getByRole('button', { name: 'Cancelar' })).toBeFocused()
    await confirmacion.getByRole('button', { name: 'Eliminar usuario' }).click()

    await expect(confirmacion.getByRole('alert')).toHaveText('No puedes eliminar tu propia cuenta.')
    // Repetirlo no sirve: el botón queda deshabilitado y no manda otra petición.
    const eliminarUsuario = confirmacion.getByRole('button', { name: 'Eliminar usuario' })
    await expect(eliminarUsuario).toBeDisabled()
    await eliminarUsuario.click({ force: true })
    expect(api.llamadas('DELETE', '/api/admin/users/1')).toHaveLength(1)

    await confirmacion.getByRole('button', { name: 'Cancelar' }).click()
    await expect(confirmacion).toBeHidden()
    await expect(page.getByRole('rowheader', { name: 'Daniela Ortega' })).toBeVisible()
    await expect(eliminar).toBeFocused()
  })
})
