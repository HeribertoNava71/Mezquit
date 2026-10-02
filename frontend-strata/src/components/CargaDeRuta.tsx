import { EstadoCarga } from '@/components/ui'
import './CargaDeRuta.css'

/**
 * Lo que se ve mientras llega el chunk de una pantalla (carga perezosa por ruta,
 * D-28): el EstadoCarga del sistema, centrado en el hueco del contenido, así la
 * barra y el pie del layout no se mueven. Aparece con un fundido retrasado: con
 * una red rápida no se alcanza a ver (con movimiento reducido, al instante).
 */
export function CargaDeRuta() {
  return (
    <div className="st-carga-ruta">
      <EstadoCarga label="Cargando…" />
    </div>
  )
}

export default CargaDeRuta
