import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register, type RegisterPayload } from '@/api/auth'
import { useAuth } from '@/context/AuthContext'
import Button from '@/components/ui/Button'
import FloatingInput from '@/components/ui/FloatingInput'
import PasswordStrength from '@/components/ui/PasswordStrength'
import { SITE } from '@/config/site'
import './Auth.css'

const EMPTY: RegisterPayload = {
  name: '', last_name: '', email: '', password: '', password_confirmation: '',
  company_name: '', sector: '', company_size: '', phone: '', birth_date: '', position: '',
  privacy_accepted: false,
}

export default function Registro() {
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState<RegisterPayload>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterPayload, string>>>({})
  const [loading, setLoading] = useState(false)
  const [globalError, setGlobalError] = useState('')

  function set(k: keyof RegisterPayload, v: string | boolean) {
    setForm(p => ({ ...p, [k]: v }))
    if (errors[k]) setErrors(p => ({ ...p, [k]: undefined }))
  }

  function str(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    set(e.target.name as keyof RegisterPayload, e.target.value)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setGlobalError('')
    setErrors({})
    try {
      const user = await register(form)
      setUser(user)
      navigate(user.organization_id ? '/app/evaluaciones/nueva' : '/perfil')
    } catch (err: unknown) {
      const resp = (err as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } }).response
      if (resp?.data?.errors) {
        const mapped: Partial<Record<keyof RegisterPayload, string>> = {}
        for (const k in resp.data.errors) mapped[k as keyof RegisterPayload] = resp.data.errors[k][0]
        setErrors(mapped)
      } else {
        setGlobalError('Ocurrió un error. Intenta de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth">
      <form className="auth__card" onSubmit={submit} noValidate>
        <div className="auth__brand">
          <img src="/logo.png" alt={SITE.name} className="auth__logo" />
          <span className="auth__brand-name">{SITE.name}</span>
        </div>
        <h1 className="auth__title">Crear cuenta</h1>

        {globalError && <p className="auth__error-global">{globalError}</p>}

        <p className="auth__section">Datos personales</p>
        <div className="auth__grid">
          <FloatingInput id="name" name="name" label="Nombre" autoComplete="given-name"
            value={form.name} onChange={str} error={errors.name} required />
          <FloatingInput id="last_name" name="last_name" label="Apellido" autoComplete="family-name"
            value={form.last_name} onChange={str} error={errors.last_name} required />
          <div className="auth__grid--full">
            <FloatingInput id="email" name="email" type="email" label="Correo electrónico" autoComplete="email"
              value={form.email} onChange={str} error={errors.email} required />
          </div>
          <div>
            <FloatingInput id="password" name="password" type="password" label="Contraseña (mín. 8 caracteres)" autoComplete="new-password"
              value={form.password} onChange={str} error={errors.password} required />
            <PasswordStrength password={form.password} />
          </div>
          <FloatingInput id="password_confirmation" name="password_confirmation" type="password" label="Confirmar contraseña" autoComplete="new-password"
            value={form.password_confirmation} onChange={str} error={errors.password_confirmation} required />
          <FloatingInput id="birth_date" name="birth_date" type="date" label="Fecha de nacimiento" autoComplete="bday"
            value={form.birth_date ?? ''} onChange={str} error={errors.birth_date} />
          <FloatingInput id="phone" name="phone" type="tel" label="Teléfono" autoComplete="tel"
            value={form.phone ?? ''} onChange={str} error={errors.phone} />
        </div>

        <p className="auth__section">Empresa (opcional)</p>
        <div className="auth__grid">
          <FloatingInput id="company_name" name="company_name" label="Empresa / Organización" autoComplete="organization"
            value={form.company_name ?? ''} onChange={str} error={errors.company_name} />
          <FloatingInput id="position" name="position" label="Puesto" autoComplete="organization-title"
            value={form.position ?? ''} onChange={str} error={errors.position} />
        </div>

        <label className="auth__privacy">
          <input
            type="checkbox"
            className="auth__privacy-check"
            checked={form.privacy_accepted}
            onChange={e => set('privacy_accepted', e.target.checked)}
            aria-describedby={errors.privacy_accepted ? 'privacy-error' : undefined}
          />
          <span>
            Acepto el{' '}
            <Link to="/aviso-de-privacidad" target="_blank">aviso de privacidad</Link>
            {' '}y el uso de mis datos para la evaluación de candidatos.
            {errors.privacy_accepted && (
              <span id="privacy-error" style={{ display: 'block', color: 'var(--color-error)', fontSize: 'var(--text-xs)' }}>
                {errors.privacy_accepted}
              </span>
            )}
          </span>
        </label>

        <Button type="submit" loading={loading} size="lg">Crear cuenta</Button>
        <p className="auth__foot">¿Ya tienes cuenta? <Link to="/login">Entra aquí</Link></p>
      </form>
    </div>
  )
}
