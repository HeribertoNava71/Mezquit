import type { SelectOption } from '@/components/ui'

// Opciones de «Sector» y «Tamaño de la empresa» del registro (R-03). POST
// /api/register ya las aceptaba (RegisterRequest: sector in:comercio,
// manufactura,servicios,otro y company_size in:1-10,11-50,51-250,250+), pero el
// formulario las enviaba vacías. Valores y etiquetas del asistente de registro
// de la fase 1 (2026-09-11-fase1-nucleo.md:2342-2360); «personas», del
// formulario de /demo (2026-09-10-sales-site.md:2273-2277). El valor vacío
// (opción «Selecciona…») conserva el '' que el registro enviaba.

export const PLACEHOLDER_OPCION = 'Selecciona…'

export const SECTORES: readonly SelectOption[] = [
  { value: 'comercio', label: 'Comercio' },
  { value: 'manufactura', label: 'Manufactura o maquila' },
  { value: 'servicios', label: 'Servicios' },
  { value: 'otro', label: 'Otro' },
]

export const TAMANOS_DE_EMPRESA: readonly SelectOption[] = [
  { value: '1-10', label: '1 – 10 personas' },
  { value: '11-50', label: '11 – 50 personas' },
  { value: '51-250', label: '51 – 250 personas' },
  { value: '250+', label: 'Más de 250 personas' },
]
