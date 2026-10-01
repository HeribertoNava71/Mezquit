import { Outlet, useNavigate } from 'react-router-dom'
import { logout } from '@/api/auth'
import { useAuth } from '@/context/AuthContext'
import './AdminLayout.css'

export default function AdminLayout() {
  const { setUser } = useAuth()
  const navigate = useNavigate()
  async function handleLogout() { await logout(); setUser(null); navigate('/login') }

  return (
    <div className="admin">
      <header className="admin__bar">
        <span className="admin__brand">Mez <span className="admin__tag">· operación</span></span>
        <button className="applayout__logout" onClick={handleLogout}>Salir</button>
      </header>
      <main className="admin__main"><Outlet /></main>
    </div>
  )
}
