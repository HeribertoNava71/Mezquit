import { useEffect, useState, type FormEvent } from 'react'
import { getCredits, requestCredits, type CreditsData } from '@/api/rh'
import Button from '@/components/ui/Button'
import './CreditosPage.css'

const TYPE_LABEL: Record<string, string> = {
  compra: 'Compra', consumo: 'Consumo', cortesia: 'Cortesía', ajuste: 'Ajuste',
}

export default function CreditosPage() {
  const [data, setData] = useState<CreditsData | null>(null)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  function load() { getCredits().then(setData).catch(() => {}) }
  useEffect(load, [])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    try { await requestCredits(Number(amount), note); setSent(true); setAmount(''); setNote('') } finally { setLoading(false) }
  }

  return (
    <div className="creditos">
      <div>
        <h1 className="creditos__title">Créditos</h1>
        <p className="creditos__balance">{data?.balance ?? '—'}</p>
      </div>

      <div>
        <h2 className="creditos__section-title">Solicitar más créditos</h2>
        <form className="creditos__form" onSubmit={submit}>
          <div className="creditos__field">
            <label className="creditos__label" htmlFor="amount">Cantidad</label>
            <input id="amount" className="creditos__input" type="number" min={1} value={amount} onChange={e => setAmount(e.target.value)} required />
          </div>
          <div className="creditos__field">
            <label className="creditos__label" htmlFor="note">Nota (opcional)</label>
            <textarea id="note" className="creditos__textarea" value={note} onChange={e => setNote(e.target.value)} />
          </div>
          <Button type="submit" loading={loading}>Enviar solicitud</Button>
          {sent && <p className="creditos__ok">Solicitud registrada. Un asesor la revisará.</p>}
        </form>
      </div>

      <div>
        <h2 className="creditos__section-title">Historial</h2>
        <table className="creditos__table">
          <thead><tr><th>Tipo</th><th>Monto</th><th>Referencia</th><th>Fecha</th></tr></thead>
          <tbody>
            {(data?.transactions ?? []).map((t, i) => (
              <tr key={i}>
                <td>{TYPE_LABEL[t.type] ?? t.type}</td>
                <td className={`creditos__amount ${t.amount >= 0 ? 'creditos__amount--pos' : 'creditos__amount--neg'}`}>{t.amount >= 0 ? `+${t.amount}` : t.amount}</td>
                <td>{t.reference ?? '—'}</td>
                <td>{t.created_at ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
