import api from './axios'

export interface AssessmentSummary {
  id: number
  name: string
  position: string | null
  deadline: string | null
  status: string
  counts: { total: number; pendiente: number; iniciada: number; completada: number }
  created_at: string | null
}
export interface InvitationRow { id: number; candidate: string; email: string; status: string; link: string }
export interface AssessmentDetail { id: number; name: string; position: string | null; invitations: InvitationRow[] }
export interface CompareScale { code: string; name: string }
export interface CompareRow { invitation_id: number; candidate: string; status: string; scores: Record<string, { category: string; percentile: number | null; normalized: number | null }> }
export interface CompareData { assessment: { id: number; name: string }; scales: CompareScale[]; rows: CompareRow[] }
export interface CreditTx { type: string; amount: number; reference: string | null; created_at: string | null }
export interface CreditsData { balance: number; transactions: CreditTx[] }

export async function listAssessments(): Promise<AssessmentSummary[]> {
  const { data } = await api.get('/api/assessments'); return data.data
}
export async function getAssessment(id: number): Promise<AssessmentDetail> {
  const { data } = await api.get(`/api/assessments/${id}`); return data.data
}
export async function resendInvitation(id: number): Promise<void> {
  await api.post(`/api/invitations/${id}/resend`)
}
export async function compareAssessment(id: number): Promise<CompareData> {
  const { data } = await api.get(`/api/assessments/${id}/compare`); return data.data
}
export async function getCredits(): Promise<CreditsData> {
  const { data } = await api.get('/api/credits'); return data.data
}
export async function requestCredits(amount: number, note: string): Promise<void> {
  await api.post('/api/credit-requests', { requested_amount: amount, note })
}
