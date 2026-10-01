export interface Plan {
  id: string
  name: string
  model: 'creditos' | 'suscripcion'
  price: string
  cadence: string
  includes: string[]
}

export const PLANS: Plan[] = [
  {
    id: 'creditos',
    name: 'Paquete de créditos',
    model: 'creditos',
    price: '[PENDIENTE: precio]',
    cadence: 'Pago único, sin vencimiento',
    includes: [
      'Evaluaciones prepagadas',
      'Reportes con interpretación',
      'Reporte comparativo',
      'Exportación',
    ],
  },
  {
    id: 'suscripcion',
    name: 'Suscripción mensual',
    model: 'suscripcion',
    price: '[PENDIENTE: precio]',
    cadence: 'Al mes',
    includes: [
      'Evaluaciones al mes',
      'Usuarios del equipo',
      'Reporte comparativo',
      'Exportación',
      'Soporte por correo',
    ],
  },
]
