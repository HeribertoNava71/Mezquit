import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { EVENTO_SESION_VENCIDA } from '@/api/axios'
import { AVISO_SESION_VENCIDA, esRutaProtegida, rutaDeUbicacion, type EstadoDeRuta } from './rutasDeSesion'

/**
 * Sesión vencida (D-07, punto 8). Escucha el evento que emite el cliente api
 * ante un 401 o un 419 de una petición hecha con sesión. Si la ruta actual es
 * /app, /admin o /perfil, lleva a /login con la ruta de origen y el aviso
 * «Tu sesión expiró. Vuelve a entrar.»; en las páginas públicas no navega
 * (AuthProvider ya limpió la sesión). Va dentro del Router, junto a <Routes>.
 */
export default function SessionWatcher() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    function alVencerSesion() {
      if (!esRutaProtegida(location.pathname)) return
      const estado: EstadoDeRuta = { from: rutaDeUbicacion(location), aviso: AVISO_SESION_VENCIDA }
      // replace: tras volver a entrar, Login regresa a la ruta de origen sin duplicarla en el historial.
      navigate('/login', { replace: true, state: estado })
    }
    window.addEventListener(EVENTO_SESION_VENCIDA, alVencerSesion)
    return () => window.removeEventListener(EVENTO_SESION_VENCIDA, alVencerSesion)
  }, [location, navigate])

  return null
}
