import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { compareAssessment, type CompareData } from '@/api/rh'
import Button from '@/components/ui/Button'
import './CompararPage.css'

export default function CompararPage() {
  const { id } = useParams()
  const [data, setData] = useState<CompareData | null>(null)
  const [sortScale, setSortScale] = useState<string | null>(null)
  const [asc, setAsc] = useState(false)

  useEffect(() => { compareAssessment(Number(id)).then(setData).catch(() => setData(null)) }, [id])

  const rows = useMemo(() => {
    if (!data) return []
    if (!sortScale) return data.rows
    const sorted = [...data.rows].sort((a, b) => {
      const va = a.scores[sortScale]?.normalized ?? -1
      const vb = b.scores[sortScale]?.normalized ?? -1
      return asc ? va - vb : vb - va
    })
    return sorted
  }, [data, sortScale, asc])

  function toggleSort(code: string) {
    if (sortScale === code) setAsc(v => !v)
    else { setSortScale(code); setAsc(false) }
  }

  function exportCsv() {
    if (!data) return
    const header = ['Candidato', ...data.scales.map(s => s.name)]
    const lines = [header.join(',')]
    for (const row of rows) {
      const cells = [row.candidate, ...data.scales.map(s => {
        const sc = row.scores[s.code]
        return sc ? `${sc.category} (${sc.percentile ?? ''})` : ''
      })]
      lines.push(cells.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `comparativa-${data.assessment.name}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  if (!data) return <p>Cargando…</p>

  return (
    <div className="comparar">
      <div className="comparar__head">
        <h1 className="comparar__title">Comparar · {data.assessment.name}</h1>
        {data.rows.length > 0 && <Button variant="ghost" onClick={exportCsv}>Exportar CSV</Button>}
      </div>

      {data.rows.length === 0 ? (
        <p className="comparar__empty">Aún no hay candidatos que hayan completado esta evaluación.</p>
      ) : (
        <div className="comparar__wrap">
          <table className="comparar__table">
            <thead>
              <tr>
                <th>Candidato</th>
                {data.scales.map(s => (
                  <th key={s.code} className="comparar__th" onClick={() => toggleSort(s.code)}>
                    {s.name}{sortScale === s.code ? (asc ? ' ↑' : ' ↓') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.invitation_id}>
                  <td>{row.candidate}</td>
                  {data.scales.map(s => {
                    const sc = row.scores[s.code]
                    return (
                      <td key={s.code} className="comparar__cell">
                        {sc ? <><span className="comparar__cat">{sc.category}</span> · pc {sc.percentile ?? '—'}</> : '—'}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
