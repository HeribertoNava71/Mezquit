import { Callout, RadioCard, RadioGroup } from '@/components/ui'
import { ID_CAMPO } from './estadoAsistente'
import { PRUEBA_DISPONIBLE } from './modelo'

export interface PasoPruebaProps {
  /** Error 422 de test_ids (por ejemplo, si la prueba 1 no existe en el servidor). */
  error?: string
}

const VALOR = String(PRUEBA_DISPONIBLE.id)

/**
 * Paso 2 · Prueba: la prueba fija (id 1) como RadioCard elegida, con la lista
 * del modal de asignación (Strata.dc.html:1390-1401). No hay otras pruebas
 * asignables hasta PB-04: no se inventan opciones.
 */
export function PasoPrueba({ error }: PasoPruebaProps) {
  return (
    <>
      <RadioGroup label="Prueba a aplicar" value={VALOR} error={error}>
        <RadioCard
          id={ID_CAMPO.prueba}
          value={VALOR}
          label={PRUEBA_DISPONIBLE.nombre}
          description={PRUEBA_DISPONIBLE.detalle}
          aside="1 crédito por candidato"
        />
      </RadioGroup>
      <Callout tone="info">
        Por ahora es la única prueba que puedes asignar. Cada candidato la responde con su propio enlace.
      </Callout>
    </>
  )
}
