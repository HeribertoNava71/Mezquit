import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  getPortal, getItems, sendConsent, saveAnswer, sendEvent, complete,
  type PortalState, type PortalItem,
} from '@/api/candidate'
import Button from '@/components/ui/Button'
import './CandidateFlow.css'

type Stage = 'loading' | 'blocked' | 'welcome' | 'consent' | 'instructions' | 'items' | 'done'

export default function CandidateFlow() {
  const { token = '' } = useParams()
  const [stage, setStage] = useState<Stage>('loading')
  const [portal, setPortal] = useState<PortalState | null>(null)
  const [items, setItems] = useState<PortalItem[]>([])
  const [testId, setTestId] = useState<number | null>(null)
  const [idx, setIdx] = useState(0)
  const [consentChecked, setConsentChecked] = useState(false)
  const [busy, setBusy] = useState(false)
  // eslint-disable-next-line react-hooks/purity -- reconstrucción: cronómetro del reactivo como en el plan; ver docs/rediseno/reconstruccion.md
  const itemShownAt = useRef<number>(Date.now())

  useEffect(() => {
    getPortal(token).then(p => {
      setPortal(p)
      if (p.status === 'completada' || p.status === 'expirada') setStage('blocked')
      else setStage('welcome')
    }).catch(() => setStage('blocked'))
  }, [token])

  // Registro de pérdida de foco
  useEffect(() => {
    if (stage !== 'items' || testId == null) return
    function onVis() { if (document.hidden) sendEvent(token, testId!, 'blur').catch(() => {}) }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [stage, testId, token])

  const loadItems = useCallback(async () => {
    const firstTest = portal!.tests[0]
    setTestId(firstTest.id)
    const data = await getItems(token, firstTest.id)
    setItems(data.items)
    const firstUnanswered = data.items.findIndex(i => i.answered == null)
    setIdx(firstUnanswered === -1 ? data.items.length - 1 : firstUnanswered)
    itemShownAt.current = Date.now()
    setStage('items')
  }, [portal, token])

  async function acceptConsent() {
    setBusy(true)
    await sendConsent(token)
    setBusy(false)
    setStage('instructions')
  }

  async function choose(value: number) {
    const item = items[idx]
    // eslint-disable-next-line react-hooks/purity -- reconstrucción: elapsed_ms como en el plan; ver docs/rediseno/reconstruccion.md
    const elapsed = Date.now() - itemShownAt.current
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, answered: value } : it))
    await saveAnswer(token, testId!, item.id, value, elapsed).catch(() => {})
  }

  async function next() {
    if (idx < items.length - 1) {
      setIdx(idx + 1)
      itemShownAt.current = Date.now()
    } else {
      setBusy(true)
      await complete(token)
      setBusy(false)
      setStage('done')
    }
  }

  if (stage === 'loading') return <div className="cand"><div className="cand__inner"><p className="cand__text">Cargando…</p></div></div>

  if (stage === 'blocked') return (
    <div className="cand"><div className="cand__inner">
      <h1 className="cand__title">Este enlace ya no está disponible</h1>
      <p className="cand__text">La evaluación fue completada o su fecha límite pasó. Si crees que es un error, contacta a la empresa que te invitó.</p>
    </div></div>
  )

  if (stage === 'welcome' && portal) return (
    <div className="cand"><div className="cand__inner">
      <h1 className="cand__title">Evaluación de {portal.organization}</h1>
      <p className="cand__text">
        Te invitaron a responder {portal.tests.length} prueba(s), alrededor de {portal.tests.reduce((a, t) => a + t.duration_min, 0)} minutos.
        Puedes pausar y volver con el mismo enlace.
      </p>
      <Button onClick={() => setStage('consent')}>Comenzar</Button>
      <a className="cand__help" href="#" onClick={e => e.preventDefault()}>¿Problemas con la prueba?</a>
    </div></div>
  )

  if (stage === 'consent') return (
    <div className="cand"><div className="cand__inner">
      <h1 className="cand__title">Consentimiento</h1>
      <p className="cand__text">Recabamos tus respuestas para generar un reporte que verá la empresa que te invitó. Se conservan de forma confidencial. Consulta el aviso de privacidad.</p>
      <label className="cand__consent">
        <input type="checkbox" checked={consentChecked} onChange={e => setConsentChecked(e.target.checked)} />
        Acepto que mis respuestas se usen para esta evaluación.
      </label>
      <Button disabled={!consentChecked} loading={busy} onClick={acceptConsent}>Continuar</Button>
    </div></div>
  )

  if (stage === 'instructions') return (
    <div className="cand"><div className="cand__inner">
      <h1 className="cand__title">Instrucciones</h1>
      <p className="cand__text">Responde con sinceridad; no hay respuestas correctas o incorrectas. Una pregunta por pantalla. Tus respuestas se guardan solas.</p>
      <Button loading={busy} onClick={loadItems}>Empezar</Button>
    </div></div>
  )

  if (stage === 'items' && items.length > 0) {
    const item = items[idx]
    const progress = Math.round(((idx) / items.length) * 100)
    return (
      <div className="cand"><div className="cand__inner">
        <div className="cand__progress"><div className="cand__progress-fill" style={{ width: `${progress}%` }} /></div>
        <p className="cand__text">Pregunta {idx + 1} de {items.length}</p>
        <h1 className="cand__title">{item.prompt}</h1>
        <div className="cand__options">
          {item.options.map(o => (
            <button
              key={o.value}
              className={`cand__option${item.answered === o.value ? ' cand__option--selected' : ''}`}
              onClick={() => choose(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
        <Button disabled={item.answered == null} loading={busy} onClick={next}>
          {idx < items.length - 1 ? 'Siguiente' : 'Terminar'}
        </Button>
      </div></div>
    )
  }

  if (stage === 'done') return (
    <div className="cand"><div className="cand__inner">
      <h1 className="cand__title">¡Gracias!</h1>
      <p className="cand__text">Tus respuestas se enviaron. La empresa se pondrá en contacto contigo.</p>
    </div></div>
  )

  return null
}
