import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getAssessment, resendInvitation, type AssessmentDetail } from '@/api/rh'
import Button from '@/components/ui/Button'
import './EvaluacionDetallePage.css'

const STATUS_LABEL: Record<string, string> = {
  pendiente: '○ Pendiente', iniciada: '◐ Iniciada', completada: '● Completada', expirada: '× Expirada',
}

export default function EvaluacionDetallePage() {
  const { id } = useParams()
  const [data, setData] = useState<AssessmentDetail | null>(null)
  const [busy, setBusy] = useState<number | null>(null)
  const [copied, setCopied] = useState<number | null>(null)

  useEffect(() => { getAssessment(Number(id)).then(setData).catch(() => setData(null)) }, [id])

  async function resend(invId: number) {
    setBusy(invId)
    try { await resendInvitation(invId) } finally { setBusy(null) }
  }

  function copy(link: string, invId: number) {
    navigator.clipboard.writeText(link); setCopied(invId); setTimeout(() => setCopied(null), 1500)
  }

  if (!data) return <p>Cargando…</p>

  return (
    <div className="evdet">
      <div className="evdet__head">
        <div>
          <h1 className="evdet__title">{data.name}</h1>
          <p className="evdet__sub">{data.position ?? 'Sin puesto'}</p>
        </div>
        <Button to={`/app/evaluaciones/${data.id}/comparar`} variant="ghost">Comparar candidatos</Button>
      </div>

      <table className="evdet__table">
        <thead>
          <tr><th>Candidato</th><th>Correo</th><th>Estado</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          {data.invitations.map(inv => (
            <tr key={inv.id}>
              <td>{inv.candidate}</td>
              <td>{inv.email}</td>
              <td><span className="evdet__status">{STATUS_LABEL[inv.status] ?? inv.status}</span></td>
              <td>
                <div className="evdet__actions">
                  <button className="evdet__btn" onClick={() => copy(inv.link, inv.id)}>{copied === inv.id ? 'Copiado' : 'Copiar enlace'}</button>
                  <button className="evdet__btn" disabled={inv.status === 'completada' || busy === inv.id} onClick={() => resend(inv.id)}>
                    {busy === inv.id ? 'Enviando…' : 'Reenviar'}
                  </button>
                  {inv.status === 'completada' && (
                    <Link className="evdet__link" to={`/app/candidatos/${inv.id}/reporte`}>Ver reporte</Link>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
