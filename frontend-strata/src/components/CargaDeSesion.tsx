import { EstadoCarga } from '@/components/ui'
import './CargaDeSesion.css'

/**
 * Lo que muestran las guardas mientras AuthProvider pide GET /api/user (D-07):
 * el EstadoCarga del sistema, centrado. Sirve a pantalla completa (/app, /admin,
 * /login y /registro, que no tienen layout mientras carga) y dentro del
 * contenido de RootLayout (/perfil).
 */
export function CargaDeSesion() {
  return (
    <div className="st-carga-sesion">
      <EstadoCarga label="Verificando tu sesión…" />
    </div>
  )
}
