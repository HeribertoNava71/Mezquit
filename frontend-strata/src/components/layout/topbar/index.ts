// Barras superiores por rol (Fase 2; mapa.md, sección 3). Importa desde
// '@/components/layout/topbar'. La barra pública es Header
// ('@/components/layout/Header') y el marco común, TopBar ('@/components/layout').
export { BalanceIndicator } from './BalanceIndicator'
export type { BalanceIndicatorProps } from './BalanceIndicator'
export { BarraAdmin } from './BarraAdmin'
export { BarraRh } from './BarraRh'
export {
  avisarCambioDeCreditos,
  avisarCambioDeSolicitudes,
  useNombreOrganizacion,
  useSaldoCreditos,
  useSolicitudesPendientes,
} from './datosBarra'
export type { NombreOrganizacion } from './datosBarra'
export { ErrorSalida } from './ErrorSalida'
export type { ErrorSalidaProps } from './ErrorSalida'
export { MobileMenu } from './MobileMenu'
export type { MobileMenuProps } from './MobileMenu'
export {
  ENLACE_AYUDA,
  ENLACE_CODIGO,
  ENLACES_ADMIN,
  ENLACES_PUBLICOS,
  ENLACES_RH,
  esResultados,
  nombreVisible,
  opcionesDeCuenta,
} from './navegacion'
export type { CuentaMenu, EnlaceNav, OpcionCuenta, ZonaBarra } from './navegacion'
export { EnlaceNavegacion, NavLinks } from './NavLinks'
export type { EnlaceNavegacionProps, NavLinksProps } from './NavLinks'
export { PendingIndicator } from './PendingIndicator'
export type { PendingIndicatorProps } from './PendingIndicator'
export { UserMenu } from './UserMenu'
export type { UserMenuProps } from './UserMenu'
export { useSalir } from './useSalir'
export type { Salida } from './useSalir'
