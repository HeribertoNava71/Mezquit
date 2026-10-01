import api from './axios'

export interface PendingRequest {
  id: number
  organization: string
  organization_balance: number
  requested_amount: number
  note: string | null
  created_at: string | null
}

export async function listCreditRequests(): Promise<PendingRequest[]> {
  const { data } = await api.get('/api/admin/credit-requests'); return data.data
}
export async function approveRequest(id: number): Promise<void> {
  await api.post(`/api/admin/credit-requests/${id}/approve`)
}
export async function rejectRequest(id: number): Promise<void> {
  await api.post(`/api/admin/credit-requests/${id}/reject`)
}
