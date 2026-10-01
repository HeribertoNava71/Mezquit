export const SITE = {
  name: 'Mezquit',
  domain: '[PENDIENTE: dominio]',
  email: '[PENDIENTE: correo de contacto]',
  calendarUrl: '[PENDIENTE: enlace de agenda]',
  tagline: 'Mide la raíz, no la corteza.',
  apiBase: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
} as const
