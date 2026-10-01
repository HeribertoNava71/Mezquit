import api, { csrf } from './axios'

export interface AuthUser {
  id: number
  name: string
  last_name?: string
  email: string
  role: string
  organization_id: number | null
  is_platform_admin?: boolean
}

export interface RegisterPayload {
  name: string
  last_name: string
  email: string
  password: string
  password_confirmation: string
  company_name?: string
  sector?: string
  company_size?: string
  phone?: string
  birth_date?: string
  position?: string
  privacy_accepted: boolean
}

export async function register(payload: RegisterPayload): Promise<AuthUser> {
  await csrf()
  const { data } = await api.post('/api/register', payload)
  return data.user
}

export async function login(email: string, password: string): Promise<AuthUser> {
  await csrf()
  const { data } = await api.post('/api/login', { email, password })
  return data.user
}

export async function logout(): Promise<void> {
  await api.post('/api/logout')
}

export async function fetchUser(): Promise<AuthUser | null> {
  try {
    const { data } = await api.get('/api/user')
    return data
  } catch {
    return null
  }
}
