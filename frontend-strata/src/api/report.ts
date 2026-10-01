import api from './axios'

export interface ReportScale { code: string; name: string; normalized: number | null; percentile: number | null; category: string | null; interpretation: string }
export interface ReportTest { name: string; integrity: { blur_count: number }; scales: ReportScale[] }
export interface ReportData {
  candidate: string
  position: string | null
  assessment: string
  organization: string
  completed_at: string | null
  tests: ReportTest[]
  interview_questions: string[]
  sample?: boolean
}

export async function getReport(invitationId: number): Promise<ReportData> {
  const { data } = await api.get(`/api/invitations/${invitationId}/report`)
  return data.data
}
