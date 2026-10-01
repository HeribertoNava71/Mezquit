import { Routes, Route } from 'react-router-dom'
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

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
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
        <Route path="perfil" element={<PerfilPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path="/app" element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route index element={<ResumenPage />} />
        <Route path="evaluaciones" element={<EvaluacionesPage />} />
        <Route path="evaluaciones/nueva" element={<NuevaEvaluacion />} />
        <Route path="evaluaciones/:id" element={<EvaluacionDetallePage />} />
        <Route path="evaluaciones/:id/comparar" element={<CompararPage />} />
        <Route path="creditos" element={<CreditosPage />} />
        <Route path="candidatos/:invitationId/reporte" element={<ReporteCandidato />} />
      </Route>
      <Route path="/admin" element={<RequirePlatformAdmin><AdminLayout /></RequirePlatformAdmin>}>
        <Route path="creditos" element={<AdminCreditosPage />} />
        <Route path="usuarios" element={<AdminUsuariosPage />} />
        <Route path="usuarios/:id" element={<AdminUsuarioDetallePage />} />
        <Route path="perfil" element={<AdminPerfilPage />} />
      </Route>
    </Routes>
  )
}
