import { useState } from 'react'
import { createAssessment, type InvitationLink } from '@/api/assessments'
import Button from '@/components/ui/Button'
import './NuevaEvaluacion.css'

const DEMO_TEST_ID = 1 // la prueba de demostración es el primer test sembrado

export default function NuevaEvaluacion() {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [position, setPosition] = useState('')
  const [candidatesText, setCandidatesText] = useState('')
  const [deadline, setDeadline] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<InvitationLink[] | null>(null)
  const [error, setError] = useState('')

  function parseCandidates() {
    return candidatesText.split('\n').map(l => l.trim()).filter(Boolean).map(line => {
      const [n, email] = line.split(',').map(s => s.trim())
      return { name: n ?? '', email: email ?? '' }
    })
  }

  async function submit() {
    setLoading(true)
    setError('')
    try {
      const candidates = parseCandidates()
      const res = await createAssessment({
        name, position, test_ids: [DEMO_TEST_ID], candidates,
        deadline: deadline || null,
      })
      setResult(res.invitations)
      setStep(5)
    } catch {
      setError('Revisa los datos: nombre, al menos un candidato con "nombre, correo".')
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <div className="wizard">
        <h1 className="wizard__title">Evaluación creada</h1>
        <p>Comparte estos enlaces con los candidatos (correo o WhatsApp):</p>
        <div className="wizard__links">
          {result.map(inv => (
            <div key={inv.id} className="wizard__link-row">
              <span>{inv.candidate} — {inv.email}</span>
              <button className="wizard__copy" onClick={() => navigator.clipboard.writeText(inv.link)}>Copiar enlace</button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="wizard">
      <h1 className="wizard__title">Nueva evaluación</h1>
      <p className="wizard__step">Paso {step} de 4</p>

      {step === 1 && (
        <>
          <div className="wizard__field">
            <label className="wizard__label" htmlFor="name">Nombre de la evaluación</label>
            <input id="name" className="wizard__input" value={name} onChange={e => setName(e.target.value)} placeholder="Vendedores Q4" />
          </div>
          <div className="wizard__field">
            <label className="wizard__label" htmlFor="position">Puesto</label>
            <input id="position" className="wizard__input" value={position} onChange={e => setPosition(e.target.value)} placeholder="Ejecutivo de ventas" />
          </div>
          <div className="wizard__actions"><Button onClick={() => setStep(2)}>Siguiente</Button></div>
        </>
      )}

      {step === 2 && (
        <>
          <p className="wizard__demo">Prueba incluida: <strong>Prueba de demostración</strong> (12 reactivos, 3 escalas). En esta fase solo está disponible la prueba demo.</p>
          <div className="wizard__actions">
            <Button variant="ghost" onClick={() => setStep(1)}>Atrás</Button>
            <Button onClick={() => setStep(3)}>Siguiente</Button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div className="wizard__field">
            <label className="wizard__label" htmlFor="cands">Candidatos (una línea por candidato: nombre, correo)</label>
            <textarea id="cands" className="wizard__textarea" value={candidatesText} onChange={e => setCandidatesText(e.target.value)} placeholder={'Juan Pérez, juan@correo.com\nAna López, ana@correo.com'} />
          </div>
          <div className="wizard__actions">
            <Button variant="ghost" onClick={() => setStep(2)}>Atrás</Button>
            <Button onClick={() => setStep(4)}>Siguiente</Button>
          </div>
        </>
      )}

      {step === 4 && (
        <>
          <div className="wizard__field">
            <label className="wizard__label" htmlFor="deadline">Fecha límite (opcional)</label>
            <input id="deadline" className="wizard__input" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
          </div>
          {error && <p style={{ color: 'var(--color-error)', fontSize: 'var(--text-sm)' }}>{error}</p>}
          <div className="wizard__actions">
            <Button variant="ghost" onClick={() => setStep(3)}>Atrás</Button>
            <Button onClick={submit} loading={loading}>Crear y enviar</Button>
          </div>
        </>
      )}
    </div>
  )
}
