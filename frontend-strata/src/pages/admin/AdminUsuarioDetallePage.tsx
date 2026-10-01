import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getUser, updateUser, deleteUser, type AdminUser } from '@/api/adminUsers'
import FloatingInput from '@/components/ui/FloatingInput'
import Button from '@/components/ui/Button'

export default function AdminUsuarioDetallePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState<AdminUser | null>(null)
  const [saved, setSaved] = useState(false)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => { getUser(Number(id)).then(setUser).catch(() => {}) }, [id])

  async function save() {
    if (!user) return
    await updateUser(user.id, { name: user.name, last_name: user.last_name, phone: user.phone, position: user.position, role: user.role })
    setSaved(true); setTimeout(() => setSaved(false), 3000)
  }

  async function remove() {
    if (!user) return
    await deleteUser(user.id)
    navigate('/admin/usuarios')
  }

  if (!user) return <p>Cargando…</p>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)', maxWidth: 680 }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)', color: 'var(--color-brunswick)' }}>
        {user.name} {user.last_name ?? ''}
      </h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-4)' }}>
        <FloatingInput id="u-name" label="Nombre" value={user.name} onChange={e => setUser(p => p ? { ...p, name: e.target.value } : p)} />
        <FloatingInput id="u-last" label="Apellido" value={user.last_name ?? ''} onChange={e => setUser(p => p ? { ...p, last_name: e.target.value } : p)} />
        <FloatingInput id="u-phone" label="Teléfono" value={user.phone ?? ''} onChange={e => setUser(p => p ? { ...p, phone: e.target.value } : p)} />
        <FloatingInput id="u-pos" label="Puesto" value={user.position ?? ''} onChange={e => setUser(p => p ? { ...p, position: e.target.value } : p)} />
      </div>
      <div>
        <label style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-brunswick)' }}>Rol</label>
        <select value={user.role} onChange={e => setUser(p => p ? { ...p, role: e.target.value } : p)}
          style={{ display: 'block', marginTop: 'var(--sp-2)', padding: 'var(--sp-3) var(--sp-4)', border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)' }}>
          <option value="admin">Admin</option>
          <option value="recruiter">Reclutador</option>
          <option value="viewer">Visualizador</option>
        </select>
      </div>
      <Button onClick={save}>Guardar cambios</Button>
      {saved && <p style={{ color: 'var(--color-success)', fontSize: 'var(--text-sm)' }}>Guardado.</p>}
      <div style={{ borderTop: '1px solid var(--color-timberwolf)', paddingTop: 'var(--sp-4)' }}>
        {confirming ? (
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-error)' }}>
            ¿Eliminar a {user.name}? Esta acción no se puede deshacer.{' '}
            <button onClick={remove} style={{ color: 'var(--color-error)', background: 'none', fontWeight: 600 }}>Sí, eliminar</button>{' · '}
            <button onClick={() => setConfirming(false)} style={{ background: 'none' }}>Cancelar</button>
          </p>
        ) : (
          <Button variant="ghost" onClick={() => setConfirming(true)}>Eliminar usuario</Button>
        )}
      </div>
    </div>
  )
}
