export const SITE = {
  /**
   * Nombre de la marca (D-03). Es la única fuente: no lo escribas a mano en
   * componentes ni textos. index.html lo repite en title y Open Graph porque
   * no puede leer este archivo.
   */
  name: 'Strata',
  /** Titular legal del sitio: pie de página y textos legales. */
  legalName: '[PENDIENTE: razón social del titular]',
  /**
   * Lema del pie (D-18). Sustituye a «Psicometría validada para Latinoamérica»
   * del prototipo hasta que el psicólogo respalde una afirmación verificable.
   */
  claim: '[PENDIENTE: afirmación verificable]',
  domain: '[PENDIENTE: dominio]',
  email: '[PENDIENTE: correo de contacto]',
  calendarUrl: '[PENDIENTE: enlace de agenda]',
  tagline: 'Mide la raíz, no la corteza.',
  /** Imágenes de marca, copiadas del prototipo a public/brand/. */
  brand: {
    /** Salamandra de la barra superior y del pie (Strata.dc.html:56, :1232). */
    salamandra: '/brand/strata-salamandra.png',
    /** Emblema con fondo propio; origen de favicons y og-image (scripts/generate-favicons.mjs). */
    mark: '/brand/strata-mark.png',
    /** Emblema con el nombre debajo. */
    logo: '/brand/strata-logo.png',
    /** Mascota de la home (Fase 6). */
    mascota: '/brand/mascota.png',
  },
  apiBase: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
} as const
