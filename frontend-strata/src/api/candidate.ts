import api, { asegurarCsrf } from './axios'

// Los POST del portal son públicos: antes del primero se pide la cookie
// XSRF-TOKEN una vez (asegurarCsrf), como defensa; hoy el GET del portal ya la
// deja. Un 419 posterior se reintenta una vez con csrf() (interceptor de api).

export interface PortalTest { id: number; name: string; duration_min: number; item_count: number; allows_back: boolean }
export interface PortalState { status: string; organization: string; position: string | null; tests: PortalTest[]; consented: boolean }
export interface PortalItem { id: number; order: number; prompt: string; options: { label: string; value: number }[]; answered: number | null }

export async function getPortal(token: string): Promise<PortalState> {
  const { data } = await api.get(`/api/evaluar/${token}`)
  return data.data
}
export async function getItems(token: string, testId: number): Promise<{ test: { id: number; name: string; allows_back: boolean }; items: PortalItem[] }> {
  const { data } = await api.get(`/api/evaluar/${token}/pruebas/${testId}`)
  return data.data
}
export async function sendConsent(token: string): Promise<void> {
  await asegurarCsrf()
  await api.post(`/api/evaluar/${token}/consent`, { privacy_version: 'v1' })
}
export async function saveAnswer(token: string, testId: number, itemId: number, value: number, elapsedMs: number): Promise<void> {
  await asegurarCsrf()
  await api.post(`/api/evaluar/${token}/answers`, { test_id: testId, item_id: itemId, value, elapsed_ms: elapsedMs })
}
export async function sendEvent(token: string, testId: number, type: string): Promise<void> {
  await asegurarCsrf()
  await api.post(`/api/evaluar/${token}/events`, { test_id: testId, type })
}
export async function complete(token: string): Promise<void> {
  await asegurarCsrf()
  await api.post(`/api/evaluar/${token}/complete`)
}
