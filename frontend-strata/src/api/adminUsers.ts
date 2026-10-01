import api from './axios'

export interface AdminUser {
  id: number; name: string; last_name?: string; email: string; phone?: string
  birth_date?: string; position?: string; role: string; created_at: string
  organization?: { name: string }
}
export interface UserList { total: number; current_page: number; last_page: number; items: AdminUser[] }

export async function listUsers(search?: string, page = 1): Promise<UserList> {
  const { data } = await api.get('/api/admin/users', { params: { search, page } })
  return data.data
}
export async function getUser(id: number): Promise<AdminUser> {
  const { data } = await api.get(`/api/admin/users/${id}`)
  return data.data
}
export async function updateUser(id: number, payload: Partial<AdminUser>): Promise<void> {
  await api.patch(`/api/admin/users/${id}`, payload)
}
export async function deleteUser(id: number): Promise<void> {
  await api.delete(`/api/admin/users/${id}`)
}
export async function updateAdminMe(payload: {
  email: string; current_password: string; password: string; password_confirmation: string
}): Promise<void> {
  await api.put('/api/admin/me', payload)
}
