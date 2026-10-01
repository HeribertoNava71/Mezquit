import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { logout } from '@/api/auth'
import './UserDropdown.css'

export default function UserDropdown() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  async function handleLogout() {
    await logout()
    setUser(null)
    navigate('/')
    setOpen(false)
  }

  if (!user) return null

  const displayName = user.last_name ? `${user.name} ${user.last_name}` : user.name

  return (
    <div className="udrop" ref={ref}>
      <button className="udrop__trigger" onClick={() => setOpen(v => !v)} aria-expanded={open}>
        {displayName}
        <span className={`udrop__chevron${open ? ' udrop__chevron--open' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="udrop__menu" role="menu">
          <Link to="/perfil" className="udrop__item" role="menuitem" onClick={() => setOpen(false)}>Mi perfil</Link>
          {user.organization_id && (
            <Link to="/app" className="udrop__item" role="menuitem" onClick={() => setOpen(false)}>Panel de RH</Link>
          )}
          {user.is_platform_admin && (
            <Link to="/admin/creditos" className="udrop__item" role="menuitem" onClick={() => setOpen(false)}>Operación</Link>
          )}
          <div className="udrop__divider" />
          <button className="udrop__item udrop__item--danger" role="menuitem" onClick={handleLogout}>Salir</button>
        </div>
      )}
    </div>
  )
}
