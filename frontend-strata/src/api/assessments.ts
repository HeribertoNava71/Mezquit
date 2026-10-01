import api from './axios'

export interface CandidateInput { name: string; email: string; phone?: string }

export interface CreateAssessmentPayload {
  name: string
  position: string
  test_ids: number[]
  candidates: CandidateInput[]
  deadline: string | null
}

export interface InvitationLink {
  id: number
  candidate: string
  email: string
  status: string
  link: string
}

export async function createAssessment(payload: CreateAssessmentPayload): Promise<{ id: number; name: string; invitations: InvitationLink[] }> {
  const { data } = await api.post('/api/assessments', payload)
  return data.data
}

export async function getAssessment(id: number): Promise<{ id: number; name: string; position: string; invitations: InvitationLink[] }> {
  const { data } = await api.get(`/api/assessments/${id}`)
  return data.data
}
