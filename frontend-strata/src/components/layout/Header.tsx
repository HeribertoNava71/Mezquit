import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { SITE } from '@/config/site'
import { useAuth } from '@/context/AuthContext'
import Button from '@/components/ui/Button'
import UserDropdown from '@/components/ui/UserDropdown'
import './Header.css'

const NAV_LINKS = [
  { to: '/pruebas', label: 'Pruebas' },
  { to: '/como-funciona', label: 'Cómo funciona' },
  { to: '/precios', label: 'Precios' },
  { to: '/ayuda', label: 'Ayuda' },
]

export default function Header() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const { user, loading } = useAuth()

  // eslint-disable-next-line react-hooks/set-state-in-effect -- reconstrucción: efecto del plan tal cual (cierra el menú al cambiar de ruta); ver docs/rediseno/reconstruccion.md
  useEffect(() => { setOpen(false) }, [pathname])

  return (
    <header className="header" role="banner">
      <div className="header__inner">
        <Link to="/" className="header__logo-link" aria-label={`${SITE.name} — inicio`}>
          <img src="/logo.png" alt={SITE.name} className="header__logo-img" width={53} height={36} />
          <span className="header__logo-name" aria-hidden="true">{SITE.name}</span>
        </Link>

        <nav className="header__nav" aria-label="Navegación principal">
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `header__nav-link${isActive ? ' header__nav-link--active' : ''}`}>
              <span className="header__nav-text" aria-hidden="true">{label}</span>
              <span className="header__nav-text--hover" aria-hidden="true">{label}</span>
              <span className="sr-only">{label}</span>
            </NavLink>
          ))}
        </nav>

        {!loading && (
          <div className="header__auth">
            {user ? (
              <UserDropdown />
            ) : (
              <>
                <Link to="/login" className="header__login">Entrar</Link>
                <Button to="/registro">Crear cuenta</Button>
              </>
            )}
          </div>
        )}

        <button className="header__burger" aria-label={open ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={open} onClick={() => setOpen(v => !v)}>
          <span className="header__burger-bar" />
          <span className="header__burger-bar" />
          <span className="header__burger-bar" />
        </button>
      </div>

      {open && (
        <div className="header__mobile" role="dialog" aria-label="Menú">
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink key={to} to={to} className="header__mobile-link">{label}</NavLink>
          ))}
          <Link to="/evaluar" className="header__mobile-link header__mobile-link--muted">¿Te invitaron a una evaluación?</Link>
          {!loading && user ? (
            <>
              <Link to="/perfil" className="header__mobile-link">Mi perfil</Link>
              {user.organization_id && <Link to="/app" className="header__mobile-link">Panel de RH</Link>}
            </>
          ) : (
            <>
              <Link to="/login" className="header__mobile-link">Entrar</Link>
              <Button to="/registro">Crear cuenta</Button>
            </>
          )}
        </div>
      )}
    </header>
  )
}
