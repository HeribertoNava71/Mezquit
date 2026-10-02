import { Navigate, Routes, Route } from 'react-router-dom'
import RootLayout from '@/components/layout/RootLayout'
import HomePage from '@/pages/HomePage'
import PruebasPage from '@/pages/PruebasPage'
import PruebaDetallePage from '@/pages/PruebaDetallePage'
import ComoFuncionaPage from '@/pages/ComoFuncionaPage'
import PreciosPage from '@/pages/PreciosPage'
import DemoPage from '@/pages/DemoPage'
import AyudaPage from '@/pages/AyudaPage'
import AvisoPrivacidadPage from '@/pages/AvisoPrivacidadPage'
import TerminosPage from '@/pages/TerminosPage'
import NotFoundPage from '@/pages/NotFoundPage'
import Login from '@/pages/auth/Login'
import Registro from '@/pages/auth/Registro'
import RequireAuth from '@/components/RequireAuth'
import RequireOrganization from '@/components/RequireOrganization'
import RedirectIfAuthenticated from '@/components/RedirectIfAuthenticated'
import SessionWatcher from '@/components/SessionWatcher'
import { AvisoDeRuta } from '@/components/AvisoDeRuta'
import AppLayout from '@/pages/app/AppLayout'
import NuevaEvaluacion from '@/pages/app/NuevaEvaluacion'
import ReporteCandidato from '@/pages/app/ReporteCandidato'
import CandidateFlow from '@/pages/candidate/CandidateFlow'
import EvaluarLanding from '@/pages/candidate/EvaluarLanding'
import ResumenPage from '@/pages/app/ResumenPage'
import EvaluacionesPage from '@/pages/app/EvaluacionesPage'
import EvaluacionDetallePage from '@/pages/app/EvaluacionDetallePage'
import CompararPage from '@/pages/app/CompararPage'
import CreditosPage from '@/pages/app/CreditosPage'
import RequirePlatformAdmin from '@/components/RequirePlatformAdmin'
import AdminLayout from '@/pages/admin/AdminLayout'
import AdminCreditosPage from '@/pages/admin/AdminCreditosPage'
import PerfilPage from '@/pages/PerfilPage'
import AdminUsuariosPage from '@/pages/admin/AdminUsuariosPage'
import AdminUsuarioDetallePage from '@/pages/admin/AdminUsuarioDetallePage'
import AdminPerfilPage from '@/pages/admin/AdminPerfilPage'

/**
 * Rutas. Las URL existentes no cambian; lo nuevo es lo aprobado en D-07:
 * - /app/pruebas: catálogo dentro del panel (por ahora, la PruebasPage pública; Fase 4).
 * - Índice de /admin → /admin/creditos.
 * - /app/* exige sesión y empresa (sin empresa → /perfil con aviso).
 * - /perfil exige sesión (sin sesión → /login).
 * - /login y /registro con sesión → /app o /perfil.
 * - Las guardas recuerdan la ruta de origen y Login vuelve a ella.
 * - SessionWatcher: sesión vencida en /app, /admin o /perfil → /login con aviso.
 */
export default function App() {
  return (
    <>
      <SessionWatcher />
      <Routes>
        <Route path="/login" element={<RedirectIfAuthenticated><Login /></RedirectIfAuthenticated>} />
        <Route path="/registro" element={<RedirectIfAuthenticated><Registro /></RedirectIfAuthenticated>} />
        <Route path="/evaluar" element={<EvaluarLanding />} />
        <Route path="/evaluar/:token" element={<CandidateFlow />} />
        <Route element={<RootLayout />}>
          <Route index element={<HomePage />} />
          <Route path="pruebas" element={<PruebasPage />} />
          <Route path="pruebas/:slug" element={<PruebaDetallePage />} />
          <Route path="como-funciona" element={<ComoFuncionaPage />} />
          <Route path="precios" element={<PreciosPage />} />
          <Route path="demo" element={<DemoPage />} />
          <Route path="ayuda" element={<AyudaPage />} />
          <Route path="aviso-de-privacidad" element={<AvisoPrivacidadPage />} />
          <Route path="terminos" element={<TerminosPage />} />
          {/* AvisoDeRuta: el aviso de RequireOrganization; la Fase 7 lo pasa al encabezado de PerfilPage. */}
          <Route path="perfil" element={<RequireAuth><AvisoDeRuta /><PerfilPage /></RequireAuth>} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route path="/app" element={<RequireAuth><RequireOrganization><AppLayout /></RequireOrganization></RequireAuth>}>
          <Route index element={<ResumenPage />} />
          <Route path="pruebas" element={<PruebasPage />} />
          <Route path="evaluaciones" element={<EvaluacionesPage />} />
          <Route path="evaluaciones/nueva" element={<NuevaEvaluacion />} />
          <Route path="evaluaciones/:id" element={<EvaluacionDetallePage />} />
          <Route path="evaluaciones/:id/comparar" element={<CompararPage />} />
          <Route path="creditos" element={<CreditosPage />} />
          <Route path="candidatos/:invitationId/reporte" element={<ReporteCandidato />} />
        </Route>
        <Route path="/admin" element={<RequirePlatformAdmin><AdminLayout /></RequirePlatformAdmin>}>
          <Route index element={<Navigate to="/admin/creditos" replace />} />
          <Route path="creditos" element={<AdminCreditosPage />} />
          <Route path="usuarios" element={<AdminUsuariosPage />} />
          <Route path="usuarios/:id" element={<AdminUsuarioDetallePage />} />
          <Route path="perfil" element={<AdminPerfilPage />} />
        </Route>
      </Routes>
    </>
  )
}
