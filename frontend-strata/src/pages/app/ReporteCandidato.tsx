import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getReport, type ReportData } from '@/api/report'
import Report from '@/sections/Report'
import Button from '@/components/ui/Button'

export default function ReporteCandidato() {
  const { invitationId } = useParams()
  const [data, setData] = useState<ReportData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getReport(Number(invitationId)).then(setData).catch(() => setError('No se pudo cargar el reporte (¿la evaluación está completada?).'))
  }, [invitationId])

  if (error) return <p>{error}</p>
  if (!data) return <p>Cargando reporte…</p>

  return (
    <div>
      <div className="report-toolbar no-print" style={{ marginBottom: 'var(--sp-6)' }}>
        <Button variant="ghost" onClick={() => window.print()}>Descargar PDF</Button>
      </div>
      <Report data={data} />
    </div>
  )
}
