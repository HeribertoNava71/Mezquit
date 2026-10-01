import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listUsers, deleteUser, type AdminUser } from '@/api/adminUsers'
import './AdminUsuariosPage.css'

export default function AdminUsuariosPage() {
  const [items, setItems] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [search, setSearch] = useState('')
  const [confirming, setConfirming] = useState<number | null>(null)

  function load(p = page, s = search) {
    listUsers(s || undefined, p).then(d => { setItems(d.items); setTotal(d.total); setLastPage(d.last_page) }).catch(() => {})
  }

  useEffect(() => { load(1, search) }, [search])
  useEffect(() => { load() }, [page])

  async function remove(id: number) {
    await deleteUser(id)
    setConfirming(null)
    load()
  }

  return (
    <div className="ausuarios">
      <div className="ausuarios__head">
        <h1 className="ausuarios__title">Usuarios ({total})</h1>
        <input className="ausuarios__search" placeholder="Buscar por nombre o correo…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
      </div>
      <table className="ausuarios__table">
        <thead><tr><th>Nombre</th><th>Correo</th><th>Organización</th><th>Rol</th><th>Registro</th><th></th></tr></thead>
        <tbody>
          {items.map(u => (
            <tr key={u.id}>
              <td>{u.name} {u.last_name ?? ''}</td>
              <td>{u.email}</td>
              <td>{u.organization?.name ?? '—'}</td>
              <td>{u.role}</td>
              <td>{u.created_at?.slice(0, 10)}</td>
              <td>
                <div className="ausuarios__actions">
                  <Link to={`/admin/usuarios/${u.id}`} className="ausuarios__link">Editar</Link>
                  {confirming === u.id ? (
                    <span className="ausuarios__confirm">
                      ¿Eliminar? <button onClick={() => remove(u.id)} style={{ color: 'var(--color-error)', background: 'none' }}>Sí</button>{' · '}
                      <button onClick={() => setConfirming(null)} style={{ background: 'none' }}>No</button>
                    </span>
                  ) : (
                    <button className="ausuarios__del" onClick={() => setConfirming(u.id)}>Eliminar</button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {lastPage > 1 && (
        <div className="ausuarios__pages">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Anterior</button>
          <span>Página {page} de {lastPage}</span>
          <button disabled={page === lastPage} onClick={() => setPage(p => p + 1)}>Siguiente →</button>
        </div>
      )}
    </div>
  )
}
