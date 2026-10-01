import { useEffect, useState } from 'react'
import { listCreditRequests, approveRequest, rejectRequest, type PendingRequest } from '@/api/admin'
import './AdminCreditosPage.css'

export default function AdminCreditosPage() {
  const [items, setItems] = useState<PendingRequest[] | null>(null)
  const [busy, setBusy] = useState<number | null>(null)

  function load() { listCreditRequests().then(setItems).catch(() => setItems([])) }
  useEffect(load, [])

  async function act(id: number, action: 'approve' | 'reject') {
    setBusy(id)
    try {
      if (action === 'approve') await approveRequest(id)
      else await rejectRequest(id)
      setItems(prev => (prev ?? []).filter(r => r.id !== id))
    } finally { setBusy(null) }
  }

  return (
    <div className="admincred">
      <h1 className="admincred__title">Solicitudes de créditos</h1>
      {items === null && <p className="admincred__empty">Cargando…</p>}
      {items && items.length === 0 && <p className="admincred__empty">No hay solicitudes pendientes.</p>}
      {items && items.length > 0 && (
        <table className="admincred__table">
          <thead>
            <tr><th>Empresa</th><th>Saldo actual</th><th>Solicita</th><th>Nota</th><th>Fecha</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {items.map(r => (
              <tr key={r.id}>
                <td>{r.organization}</td>
                <td>{r.organization_balance}</td>
                <td>{r.requested_amount}</td>
                <td>{r.note ?? '—'}</td>
                <td>{r.created_at ?? '—'}</td>
                <td>
                  <div className="admincred__actions">
                    <button className="admincred__approve" disabled={busy === r.id} onClick={() => act(r.id, 'approve')}>Aprobar</button>
                    <button className="admincred__reject" disabled={busy === r.id} onClick={() => act(r.id, 'reject')}>Rechazar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
