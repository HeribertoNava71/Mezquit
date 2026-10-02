import { useState } from 'react'
import { Button, Textarea } from '@/components/ui'
import { MENSAJES } from './modelo'
import './PegarLista.css'

export interface PegarListaProps {
  /** id del panel (para aria-controls del botón que lo abre). */
  id: string
  /** Agrega las líneas a la lista. Devuelve false si no había ninguna con texto. */
  onAgregar: (texto: string) => boolean
  onCerrar: () => void
}

const EJEMPLO = 'Juan Pérez, juan@correo.com\nAna López, ana@correo.com'

/**
 * «Pegar lista»: el área de texto del asistente anterior, una línea por
 * candidato con «nombre, correo» (R-18), ahora con teléfono opcional. Cada
 * línea se vuelve una fila que puedes corregir antes de seguir.
 */
export function PegarLista({ id, onAgregar, onCerrar }: PegarListaProps) {
  const [texto, setTexto] = useState('')
  const [error, setError] = useState<string | undefined>()

  function agregar() {
    if (onAgregar(texto)) {
      setTexto('')
      setError(undefined)
      return
    }
    setError(MENSAJES.listaVacia)
  }

  return (
    <div id={id} className="st-nueva-pegar">
      {/* Se abre con «Pegar lista»: el foco entra directo al área de texto. */}
      <Textarea
        autoFocus
        label="Lista de candidatos"
        hint="Uno por línea: nombre, correo y, si quieres, teléfono"
        rows={5}
        variant="mono"
        placeholder={EJEMPLO}
        value={texto}
        error={error}
        onChange={(evento) => {
          setTexto(evento.target.value)
          if (error) setError(undefined)
        }}
      />
      <div className="st-nueva-pegar__acciones">
        <Button variant="neutral" size="sm" onClick={onCerrar}>
          Cancelar
        </Button>
        <Button variant="secondary" size="sm" onClick={agregar}>
          Agregar a la lista
        </Button>
      </div>
    </div>
  )
}
