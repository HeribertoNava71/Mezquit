import { useEffect, useState, type FormEvent } from 'react'
import { getProfile, updateProfile, updatePassword } from '@/api/profile'
import FloatingInput from '@/components/ui/FloatingInput'
import Button from '@/components/ui/Button'
import './PerfilPage.css'

export default function PerfilPage() {
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof getProfile>> | null>(null)
  const [saved, setSaved] = useState(false)
  const [pwSaved, setPwSaved] = useState(false)
  const [pw, setPw] = useState({ current_password: '', password: '', password_confirmation: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => { getProfile().then(setProfile).catch(() => {}) }, [])

  async function saveProfile(e: FormEvent) {
    e.preventDefault()
    if (!profile) return
    await updateProfile({ name: profile.name, last_name: profile.last_name ?? '', phone: profile.phone, birth_date: profile.birth_date, position: profile.position })
    setSaved(true); setTimeout(() => setSaved(false), 3000)
  }

  async function savePassword(e: FormEvent) {
    e.preventDefault()
    setErrors({})
    try {
      await updatePassword(pw)
      setPwSaved(true); setTimeout(() => setPwSaved(false), 3000)
      setPw({ current_password: '', password: '', password_confirmation: '' })
    } catch (err: unknown) {
      const resp = (err as { response?: { data?: { errors?: Record<string, string[]> } } }).response
      if (resp?.data?.errors) {
        const m: Record<string, string> = {}
        for (const k in resp.data.errors) m[k] = resp.data.errors[k][0]
        setErrors(m)
      }
    }
  }

  if (!profile) return <p style={{ padding: 'var(--sp-8)' }}>Cargando…</p>

  return (
    <section className="perfil">
      <div className="perfil__inner">
        <h1 className="perfil__title">Mi perfil</h1>

        {!profile.organization_id && (
          <div className="perfil__no-org">
            No tienes una empresa registrada. Para usar el panel de RH y crear evaluaciones, completa el campo "Empresa" y guarda tu perfil.
          </div>
        )}

        <form className="perfil__card" onSubmit={saveProfile}>
          <h2 className="perfil__card-title">Datos personales</h2>
          <div className="perfil__grid">
            <FloatingInput id="p-name" label="Nombre" value={profile.name} onChange={e => setProfile(p => p ? { ...p, name: e.target.value } : p)} required />
            <FloatingInput id="p-last" label="Apellido" value={profile.last_name ?? ''} onChange={e => setProfile(p => p ? { ...p, last_name: e.target.value } : p)} />
            <FloatingInput id="p-phone" type="tel" label="Teléfono" value={profile.phone ?? ''} onChange={e => setProfile(p => p ? { ...p, phone: e.target.value } : p)} />
            <FloatingInput id="p-position" label="Puesto" value={profile.position ?? ''} onChange={e => setProfile(p => p ? { ...p, position: e.target.value } : p)} />
          </div>
          <Button type="submit">Guardar cambios</Button>
          {saved && <p className="perfil__ok">Perfil guardado correctamente.</p>}
        </form>

        <form className="perfil__card" onSubmit={savePassword}>
          <h2 className="perfil__card-title">Cambiar contraseña</h2>
          <FloatingInput id="cur-pw" type="password" label="Contraseña actual" value={pw.current_password} onChange={e => setPw(p => ({ ...p, current_password: e.target.value }))} error={errors.current_password} required />
          <FloatingInput id="new-pw" type="password" label="Nueva contraseña" value={pw.password} onChange={e => setPw(p => ({ ...p, password: e.target.value }))} required />
          <FloatingInput id="new-pw2" type="password" label="Confirmar nueva contraseña" value={pw.password_confirmation} onChange={e => setPw(p => ({ ...p, password_confirmation: e.target.value }))} required />
          <Button type="submit" variant="ghost">Cambiar contraseña</Button>
          {pwSaved && <p className="perfil__ok">Contraseña actualizada.</p>}
        </form>
      </div>
    </section>
  )
}
