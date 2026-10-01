import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'
import './EvaluarLanding.css'

function extractToken(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  const match = trimmed.match(/\/evaluar\/([^/?#\s]+)/)
  if (match) return match[1]
  // token pelón: sin espacios ni barras
  if (/^[A-Za-z0-9]+$/.test(trimmed)) return trimmed
  return null
}

export default function EvaluarLanding() {
  const navigate = useNavigate()
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  function submit(e: FormEvent) {
    e.preventDefault()
    const token = extractToken(value)
    if (!token) {
      setError('Pega el enlace completo o el código que te dieron.')
      return
    }
    navigate(`/evaluar/${token}`)
  }

  return (
    <div className="evaluar-landing">
      <form className="evaluar-landing__card" onSubmit={submit}>
        <h1 className="evaluar-landing__title">¿Te invitaron a una evaluación?</h1>
        <p className="evaluar-landing__text">Pega el enlace o el código que te envió la empresa para comenzar.</p>
        <input
          className="evaluar-landing__input"
          value={value}
          onChange={e => { setValue(e.target.value); setError('') }}
          placeholder="Enlace o código"
          aria-label="Enlace o código de la evaluación"
        />
        {error && <p className="evaluar-landing__error" role="alert">{error}</p>}
        <Button type="submit">Continuar</Button>
      </form>
    </div>
  )
}
