import api from './axios'
import type { AuthUser } from './auth'

export async function getProfile(): Promise<AuthUser & { organization?: { name: string }; phone?: string; birth_date?: string; position?: string }> {
  const { data } = await api.get('/api/user/profile')
  return data.data
}

export async function updateProfile(payload: {
  name: string; last_name: string; phone?: string; birth_date?: string; position?: string
}): Promise<void> {
  await api.put('/api/user/profile', payload)
}

export async function updatePassword(payload: {
  current_password: string; password: string; password_confirmation: string
}): Promise<void> {
  await api.put('/api/user/password', payload)
}
