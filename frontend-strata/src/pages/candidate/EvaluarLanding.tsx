import { useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input } from '@/components/ui'
import { CandidateFrame } from './CandidateFrame'
import { IconoFlecha } from './iconos'
import './EvaluarLanding.css'

const MENSAJE_ERROR = 'Pega el enlace completo o el código que te dieron.'

/**
 * Token de la invitación a partir de lo que pegó el candidato: un enlace con
 * /evaluar/{token} o el token solo (alfanumérico). Sin forzar mayúsculas: el
 * token distingue mayúsculas y minúsculas (mapa.md, CA-3). El servidor lo
 * valida al abrir /evaluar/{token}.
 */
function extraerToken(texto: string): string | null {
  const limpio = texto.trim()
  if (!limpio) return null
  const enlace = limpio.match(/\/evaluar\/([^/?#\s]+)/)
  if (enlace) return enlace[1]
  if (/^[A-Za-z0-9]+$/.test(limpio)) return limpio
  return null
}

/**
 * /evaluar: acceso manual con el enlace o el código de la invitación
 * (Strata.dc.html:1107-1120). Un solo campo acepta los dos, así que no hay
 * «Tengo un enlace de invitación». El código corto del prototipo depende de PB-11.
 */
export default function EvaluarLanding() {
  const navigate = useNavigate()
  const [valor, setValor] = useState('')
  const [error, setError] = useState('')
  const campo = useRef<HTMLInputElement>(null)

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const token = extraerToken(valor)
    if (!token) {
      setError(MENSAJE_ERROR)
      campo.current?.focus()
      return
    }
    navigate(`/evaluar/${token}`)
  }

  return (
    <CandidateFrame>
      <form className="st-evaluar" onSubmit={enviar} noValidate>
        <h1 className="st-evaluar__titulo">Ingresa tu enlace o código</h1>
        <p className="st-evaluar__texto">
          Lo encontrarás en el correo de invitación de la empresa. Pega el enlace completo o solo el código.
        </p>
        <Input
          ref={campo}
          variant="token"
          label="Enlace o código"
          name="invitacion"
          value={valor}
          onChange={(evento) => {
            setValor(evento.target.value)
            setError('')
          }}
          error={error || undefined}
        />
        <div className="st-evaluar__acciones">
          <Button type="submit" className="st-evaluar__continuar" iconRight={<IconoFlecha />}>
            Continuar
          </Button>
        </div>
      </form>
    </CandidateFrame>
  )
}
