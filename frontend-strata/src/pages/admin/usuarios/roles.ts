import type { BadgeTone, SelectOption } from '@/components/ui'

// Rol de una cuenta (users.role). Es un dato: hoy no autoriza nada (R-33), así
// que ninguna pantalla oculta ni muestra funciones según el rol. Solo se edita
// en /admin/usuarios/:id.

/**
 * Roles que acepta PATCH /api/admin/users/{id} (AdminUpdateUserRequest:
 * in:admin,recruiter,viewer), con su nombre en español. Son las etiquetas del
 * Select anterior (Admin, Reclutador y Visualizador), con «Admin» completo.
 */
export const ROLES: ReadonlyArray<SelectOption> = [
  { value: 'admin', label: 'Administrador' },
  { value: 'recruiter', label: 'Reclutador' },
  { value: 'viewer', label: 'Visualizador' },
]

const TONOS: Record<string, BadgeTone> = {
  admin: 'navy',
  recruiter: 'sky',
  viewer: 'neutral',
}

/** true si el valor es uno de los tres roles que acepta el servidor. */
export function esRolConocido(rol: string | null | undefined): boolean {
  return ROLES.some((opcion) => opcion.value === rol)
}

/**
 * Nombre del rol en español (admin → Administrador, recruiter → Reclutador,
 * viewer → Visualizador). Un valor que no sea de los tres se muestra tal como llega:
 * no se oculta ningún dato.
 */
export function etiquetaRol(rol: string | null | undefined): string {
  const opcion = ROLES.find((item) => item.value === rol)
  if (opcion) return opcion.label
  const crudo = rol?.trim()
  return crudo ? crudo : 'Sin rol'
}

/** Tono del Badge del rol. El texto siempre acompaña al color. */
export function tonoRol(rol: string | null | undefined): BadgeTone {
  return (rol && TONOS[rol]) || 'neutral'
}
