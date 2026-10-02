import { IconButton, Input } from '@/components/ui'
import { IconoCerrar } from '@/components/ui/Iconos'
import { idCampoCandidato } from './estadoAsistente'
import { LIMITES, esCorreoValido, type CampoCandidato, type CandidatoBorrador, type ErroresCandidato } from './modelo'
import './FilaCandidato.css'

export interface FilaCandidatoProps {
  fila: CandidatoBorrador
  /** Posición en la lista (desde 0). */
  indice: number
  errores: ErroresCandidato
  /** Muestra «Quitar» (no en la única fila). */
  puedeQuitar: boolean
  onCambiar: (campo: CampoCandidato, valor: string) => void
  onSalir: (campo: CampoCandidato) => void
  onQuitar: () => void
}

/**
 * Un candidato: nombre y correo obligatorios y teléfono opcional (el backend lo
 * acepta, D-10). El correo se valida en vivo: palomita en cuanto es válido y
 * error al salir del campo si no lo es (como el acceso del prototipo,
 * Strata.dc.html:1045-1063).
 */
export function FilaCandidato({ fila, indice, errores, puedeQuitar, onCambiar, onSalir, onQuitar }: FilaCandidatoProps) {
  const numero = indice + 1
  const nombre = fila.name.trim()

  return (
    <fieldset className="st-nueva-fila">
      <legend className="st-nueva-fila__titulo">Candidato {numero}</legend>
      {puedeQuitar && (
        <IconButton
          className="st-nueva-fila__quitar"
          aria-label={nombre ? `Quitar a ${nombre} (candidato ${numero})` : `Quitar candidato ${numero}`}
          onClick={onQuitar}
        >
          <IconoCerrar />
        </IconButton>
      )}
      <div className="st-nueva-fila__campos">
        <Input
          id={idCampoCandidato(fila.id, 'name')}
          label="Nombre"
          required
          autoComplete="off"
          maxLength={LIMITES.nombreCandidato}
          placeholder="Ana López"
          value={fila.name}
          error={errores.name}
          onChange={(evento) => onCambiar('name', evento.target.value)}
          onBlur={() => onSalir('name')}
        />
        <Input
          id={idCampoCandidato(fila.id, 'email')}
          label="Correo"
          type="email"
          inputMode="email"
          required
          autoComplete="off"
          spellCheck={false}
          maxLength={LIMITES.correo}
          placeholder="ana@correo.com"
          value={fila.email}
          error={errores.email}
          valid={esCorreoValido(fila.email)}
          onChange={(evento) => onCambiar('email', evento.target.value)}
          onBlur={() => onSalir('email')}
        />
        <Input
          id={idCampoCandidato(fila.id, 'phone')}
          label="Teléfono"
          hint="Opcional"
          type="tel"
          inputMode="tel"
          autoComplete="off"
          maxLength={LIMITES.telefono}
          placeholder="55 1234 5678"
          value={fila.phone}
          error={errores.phone}
          onChange={(evento) => onCambiar('phone', evento.target.value)}
          onBlur={() => onSalir('phone')}
        />
      </div>
    </fieldset>
  )
}
