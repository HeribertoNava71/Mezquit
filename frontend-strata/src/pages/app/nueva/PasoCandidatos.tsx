import { useId, useRef, useState } from 'react'
import { Button, FieldError } from '@/components/ui'
import { IconoMas } from '@/components/ui/Iconos'
import { FilaCandidato } from './FilaCandidato'
import { PegarLista } from './PegarLista'
import type { CampoCandidato, CandidatoBorrador, ErroresCandidatos } from './modelo'
import './PasoCandidatos.css'

export interface PasoCandidatosProps {
  filas: CandidatoBorrador[]
  errores: ErroresCandidatos
  /** Resultado de pegar la lista; se anuncia con role="status". */
  avisoLista: string
  onCambiar: (id: string, campo: CampoCandidato, valor: string) => void
  onSalir: (id: string, campo: CampoCandidato) => void
  onAgregar: () => void
  onQuitar: (id: string) => void
  /** Agrega las líneas pegadas. Devuelve false si no había ninguna con texto. */
  onPegar: (texto: string) => boolean
}

/**
 * Paso 3 · Candidatos (R-18): una fila por candidato, «Agregar otro» y
 * «Pegar lista» con el formato «nombre, correo» por línea del asistente anterior.
 */
export function PasoCandidatos({
  filas,
  errores,
  avisoLista,
  onCambiar,
  onSalir,
  onAgregar,
  onQuitar,
  onPegar,
}: PasoCandidatosProps) {
  const panelId = useId()
  const [pegando, setPegando] = useState(false)
  const botonPegar = useRef<HTMLButtonElement>(null)

  function cerrarPegar() {
    setPegando(false)
    botonPegar.current?.focus()
  }

  function pegar(texto: string): boolean {
    const agregadas = onPegar(texto)
    if (agregadas) setPegando(false)
    return agregadas
  }

  return (
    <>
      {errores.general && <FieldError className="st-nueva-candidatos__error">{errores.general}</FieldError>}
      <ol className="st-nueva-candidatos__lista">
        {filas.map((fila, indice) => (
          <li key={fila.id}>
            <FilaCandidato
              fila={fila}
              indice={indice}
              errores={errores.filas[fila.id] ?? {}}
              puedeQuitar={filas.length > 1}
              onCambiar={(campo, valor) => onCambiar(fila.id, campo, valor)}
              onSalir={(campo) => onSalir(fila.id, campo)}
              onQuitar={() => onQuitar(fila.id)}
            />
          </li>
        ))}
      </ol>
      <div className="st-nueva-candidatos__acciones">
        <Button variant="secondary" size="sm" iconLeft={<IconoMas />} onClick={onAgregar}>
          Agregar otro
        </Button>
        <Button
          ref={botonPegar}
          variant="ghost"
          size="sm"
          aria-expanded={pegando}
          aria-controls={pegando ? panelId : undefined}
          onClick={() => setPegando((abierto) => !abierto)}
        >
          Pegar lista
        </Button>
        {/* Región viva que existe desde el inicio: anuncia el resultado de pegar la lista. */}
        <p className="st-nueva-candidatos__aviso" role="status">
          {avisoLista}
        </p>
      </div>
      {pegando && <PegarLista id={panelId} onAgregar={pegar} onCerrar={cerrarPegar} />}
    </>
  )
}
