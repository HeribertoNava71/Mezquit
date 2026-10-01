import { useState, type FormEvent } from 'react'
import { updateAdminMe } from '@/api/adminUsers'
import FloatingInput from '@/components/ui/FloatingInput'
import Button from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'
import './AdminPerfilPage.css'

export default function AdminPerfilPage() {
  const { user } = useAuth()
  const [email, setEmail] = useState(user?.email ?? '')
  const [pw, setPw] = useState({ current_password: '', password: '', password_confirmation: '' })
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await updateAdminMe({ email, ...pw })
      setSaved(true); setTimeout(() => setSaved(false), 3000)
      setPw({ current_password: '', password: '', password_confirmation: '' })
    } catch {
      setError('La contraseña actual es incorrecta o el correo ya está en uso.')
    }
  }

  return (
    <form className="adminperfil" onSubmit={submit}>
      <h1 className="adminperfil__title">Mi perfil de operador</h1>
      <FloatingInput id="ap-email" type="email" label="Correo" value={email} onChange={e => setEmail(e.target.value)} required />
      <FloatingInput id="ap-cur" type="password" label="Contraseña actual" value={pw.current_password} onChange={e => setPw(p => ({ ...p, current_password: e.target.value }))} required />
      <FloatingInput id="ap-new" type="password" label="Nueva contraseña" value={pw.password} onChange={e => setPw(p => ({ ...p, password: e.target.value }))} required />
      <FloatingInput id="ap-new2" type="password" label="Confirmar nueva contraseña" value={pw.password_confirmation} onChange={e => setPw(p => ({ ...p, password_confirmation: e.target.value }))} required />
      {error && <p className="adminperfil__error">{error}</p>}
      <Button type="submit">Guardar</Button>
      {saved && <p className="adminperfil__ok">Credenciales actualizadas.</p>}
    </form>
  )
}
