import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { logout } from '@/api/auth'
import { useAuth } from '@/context/AuthContext'
import { getCredits } from '@/api/rh'
import './AppLayout.css'

export default function AppLayout() {
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const [balance, setBalance] = useState<number | null>(null)

  useEffect(() => { getCredits().then(c => setBalance(c.balance)).catch(() => setBalance(null)) }, [])

  async function handleLogout() {
    await logout(); setUser(null); navigate('/login')
  }

  return (
    <div className="applayout">
      <header className="applayout__bar">
        <Link to="/app" className="applayout__brand">Mez</Link>
        <nav className="applayout__nav" aria-label="Panel">
          <NavLink to="/app" end className={({ isActive }) => `applayout__link${isActive ? ' applayout__link--active' : ''}`}>Resumen</NavLink>
          <NavLink to="/app/evaluaciones" className={({ isActive }) => `applayout__link${isActive ? ' applayout__link--active' : ''}`}>Evaluaciones</NavLink>
          <NavLink to="/app/creditos" className={({ isActive }) => `applayout__link${isActive ? ' applayout__link--active' : ''}`}>Créditos</NavLink>
        </nav>
        <div className="applayout__right">
          {balance !== null && <span className="applayout__balance">Créditos: {balance}</span>}
          <button className="applayout__logout" onClick={handleLogout}>Salir</button>
        </div>
      </header>
      <main className="applayout__main">
        <Outlet />
      </main>
    </div>
  )
}
