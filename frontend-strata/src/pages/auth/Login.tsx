import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '@/api/auth'
import { useAuth } from '@/context/AuthContext'
import Button from '@/components/ui/Button'
import FloatingInput from '@/components/ui/FloatingInput'
import { SITE } from '@/config/site'
import './Auth.css'

export default function Login() {
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const user = await login(email, password)
      setUser(user)
      navigate(user.organization_id ? '/app' : '/perfil')
    } catch {
      setError('Correo o contraseña incorrectos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth">
      <form className="auth__card" onSubmit={handleSubmit} style={{ maxWidth: '440px' }}>
        <div className="auth__brand">
          <img src="/logo.png" alt={SITE.name} className="auth__logo" />
          <span className="auth__brand-name">{SITE.name}</span>
        </div>
        <h1 className="auth__title">Entrar</h1>

        {error && <p className="auth__error-global">{error}</p>}

        <FloatingInput id="email" type="email" label="Correo electrónico" autoComplete="email"
          value={email} onChange={e => setEmail(e.target.value)} required />
        <FloatingInput id="password" type="password" label="Contraseña" autoComplete="current-password"
          value={password} onChange={e => setPassword(e.target.value)} required />

        <Button type="submit" loading={loading} size="lg">Entrar</Button>
        <p className="auth__foot">¿No tienes cuenta? <Link to="/registro">Regístrate</Link></p>
      </form>
    </div>
  )
}
