import { Suspense, lazy, type ReactNode } from 'react'
import { Navigate, Routes, Route } from 'react-router-dom'
import { CargaDeRuta } from '@/components/CargaDeRuta'
import RootLayout from '@/components/layout/RootLayout'
import RedirectIfAuthenticated from '@/components/RedirectIfAuthenticated'
import RequireAuth from '@/components/RequireAuth'
import RequireOrganization from '@/components/RequireOrganization'
import RequirePlatformAdmin from '@/components/RequirePlatformAdmin'
import SessionWatcher from '@/components/SessionWatcher'
import HomePage from '@/pages/HomePage'

// Carga perezosa por ruta (D-28): cada pantalla llega en su propio chunk la
// primera vez que se visita. La home, su layout (RootLayout, con la barra y el
// pie públicos) y las guardas van en el bundle principal: la home es la página
// de entrada y no espera un chunk más. Las URL y las guardas no cambian.
const PruebasPage = lazy(() => import('@/pages/PruebasPage'))
const PruebaDetallePage = lazy(() => import('@/pages/PruebaDetallePage'))
const ComoFuncionaPage = lazy(() => import('@/pages/ComoFuncionaPage'))
const PreciosPage = lazy(() => import('@/pages/PreciosPage'))
const DemoPage = lazy(() => import('@/pages/DemoPage'))
const AyudaPage = lazy(() => import('@/pages/AyudaPage'))
const AvisoPrivacidadPage = lazy(() => import('@/pages/AvisoPrivacidadPage'))
const TerminosPage = lazy(() => import('@/pages/TerminosPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))
const PerfilPage = lazy(() => import('@/pages/PerfilPage'))
const Login = lazy(() => import('@/pages/auth/Login'))
const Registro = lazy(() => import('@/pages/auth/Registro'))
const EvaluarLanding = lazy(() => import('@/pages/candidate/EvaluarLanding'))
const CandidateFlow = lazy(() => import('@/pages/candidate/CandidateFlow'))
const AppLayout = lazy(() => import('@/pages/app/AppLayout'))
const ResumenPage = lazy(() => import('@/pages/app/ResumenPage'))
const EvaluacionesPage = lazy(() => import('@/pages/app/EvaluacionesPage'))
const NuevaEvaluacion = lazy(() => import('@/pages/app/NuevaEvaluacion'))
const EvaluacionDetallePage = lazy(() => import('@/pages/app/EvaluacionDetallePage'))
const CompararPage = lazy(() => import('@/pages/app/CompararPage'))
const CreditosPage = lazy(() => import('@/pages/app/CreditosPage'))
const ReporteCandidato = lazy(() => import('@/pages/app/ReporteCandidato'))
const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout'))
const AdminCreditosPage = lazy(() => import('@/pages/admin/AdminCreditosPage'))
const AdminUsuariosPage = lazy(() => import('@/pages/admin/AdminUsuariosPage'))
const AdminUsuarioDetallePage = lazy(() => import('@/pages/admin/AdminUsuarioDetallePage'))
const AdminPerfilPage = lazy(() => import('@/pages/admin/AdminPerfilPage'))

/**
 * Pantalla perezosa: mientras llega su chunk, EstadoCarga en el hueco del
 * contenido (CargaDeRuta). Dentro de un layout, la barra y el pie siguen a la vista.
 */
function Perezosa({ children }: { children: ReactNode }) {
  return <Suspense fallback={<CargaDeRuta />}>{children}</Suspense>
}

/**
 * Rutas. Las URL existentes no cambian; lo nuevo es lo aprobado en D-07:
 * - /app/pruebas: catálogo dentro del panel. Es la misma PruebasPage: detecta el
 *   panel por la ruta y cambia la entradilla y la acción «Solicitar créditos».
 * - Índice de /admin → /admin/creditos.
 * - /app/* exige sesión y empresa (sin empresa → /perfil con aviso).
 * - /perfil exige sesión (sin sesión → /login).
 * - /login y /registro con sesión → /app o /perfil.
 * - Las guardas recuerdan la ruta de origen y Login vuelve a ella.
 * - SessionWatcher: sesión vencida en /app, /admin o /perfil → /login con aviso.
 * Cada pantalla, salvo la home, es perezosa (D-28): las guardas siguen igual y
 * envuelven a la pantalla o al layout, como antes.
 */
export default function App() {
  return (
    <>
      <SessionWatcher />
      <Routes>
        <Route path="/login" element={<RedirectIfAuthenticated><Perezosa><Login /></Perezosa></RedirectIfAuthenticated>} />
        <Route path="/registro" element={<RedirectIfAuthenticated><Perezosa><Registro /></Perezosa></RedirectIfAuthenticated>} />
        <Route path="/evaluar" element={<Perezosa><EvaluarLanding /></Perezosa>} />
        <Route path="/evaluar/:token" element={<Perezosa><CandidateFlow /></Perezosa>} />
        <Route element={<RootLayout />}>
          <Route index element={<HomePage />} />
          <Route path="pruebas" element={<Perezosa><PruebasPage /></Perezosa>} />
          <Route path="pruebas/:slug" element={<Perezosa><PruebaDetallePage /></Perezosa>} />
          <Route path="como-funciona" element={<Perezosa><ComoFuncionaPage /></Perezosa>} />
          <Route path="precios" element={<Perezosa><PreciosPage /></Perezosa>} />
          <Route path="demo" element={<Perezosa><DemoPage /></Perezosa>} />
          <Route path="ayuda" element={<Perezosa><AyudaPage /></Perezosa>} />
          <Route path="aviso-de-privacidad" element={<Perezosa><AvisoPrivacidadPage /></Perezosa>} />
          <Route path="terminos" element={<Perezosa><TerminosPage /></Perezosa>} />
          {/* El aviso de RequireOrganization (location.state) lo muestra PerfilPage, unificado con el suyo (Fase 7). */}
          <Route path="perfil" element={<RequireAuth><Perezosa><PerfilPage /></Perezosa></RequireAuth>} />
          <Route path="*" element={<Perezosa><NotFoundPage /></Perezosa>} />
        </Route>
        <Route path="/app" element={<RequireAuth><RequireOrganization><Perezosa><AppLayout /></Perezosa></RequireOrganization></RequireAuth>}>
          <Route index element={<Perezosa><ResumenPage /></Perezosa>} />
          <Route path="pruebas" element={<Perezosa><PruebasPage /></Perezosa>} />
          <Route path="evaluaciones" element={<Perezosa><EvaluacionesPage /></Perezosa>} />
          <Route path="evaluaciones/nueva" element={<Perezosa><NuevaEvaluacion /></Perezosa>} />
          <Route path="evaluaciones/:id" element={<Perezosa><EvaluacionDetallePage /></Perezosa>} />
          <Route path="evaluaciones/:id/comparar" element={<Perezosa><CompararPage /></Perezosa>} />
          <Route path="creditos" element={<Perezosa><CreditosPage /></Perezosa>} />
          <Route path="candidatos/:invitationId/reporte" element={<Perezosa><ReporteCandidato /></Perezosa>} />
        </Route>
        <Route path="/admin" element={<RequirePlatformAdmin><Perezosa><AdminLayout /></Perezosa></RequirePlatformAdmin>}>
          <Route index element={<Navigate to="/admin/creditos" replace />} />
          <Route path="creditos" element={<Perezosa><AdminCreditosPage /></Perezosa>} />
          <Route path="usuarios" element={<Perezosa><AdminUsuariosPage /></Perezosa>} />
          <Route path="usuarios/:id" element={<Perezosa><AdminUsuarioDetallePage /></Perezosa>} />
          <Route path="perfil" element={<Perezosa><AdminPerfilPage /></Perezosa>} />
        </Route>
      </Routes>
    </>
  )
}
