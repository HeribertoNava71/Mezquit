import { Input } from '@/components/ui'
import { ID_CAMPO } from './estadoAsistente'
import { LIMITES, type CampoDatos, type DatosEvaluacion, type ErroresDatos } from './modelo'

export interface PasoDatosProps {
  datos: DatosEvaluacion
  errores: ErroresDatos
  onCambiar: (campo: CampoDatos, valor: string) => void
  /** El campo perdió el foco: desde ahí se muestran sus errores. */
  onSalir: (campo: CampoDatos) => void
}

/** Paso 1 · Datos: nombre de la evaluación (obligatorio) y puesto (opcional), como hoy (R-17). */
export function PasoDatos({ datos, errores, onCambiar, onSalir }: PasoDatosProps) {
  return (
    <>
      <Input
        id={ID_CAMPO.nombre}
        label="Nombre de la evaluación"
        required
        autoComplete="off"
        maxLength={LIMITES.nombre}
        placeholder="Vendedores Q4"
        value={datos.name}
        error={errores.name}
        onChange={(evento) => onCambiar('name', evento.target.value)}
        onBlur={() => onSalir('name')}
      />
      <Input
        id={ID_CAMPO.puesto}
        label="Puesto"
        hint="Opcional"
        autoComplete="off"
        maxLength={LIMITES.puesto}
        placeholder="Ejecutivo de ventas"
        value={datos.position}
        error={errores.position}
        onChange={(evento) => onCambiar('position', evento.target.value)}
        onBlur={() => onSalir('position')}
      />
    </>
  )
}
