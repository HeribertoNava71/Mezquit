import type { AdminUser } from '@/api/adminUsers'

// Formulario de /admin/usuarios/:id y cuerpo de PATCH /api/admin/users/{id}.
// AdminUpdateUserRequest acepta solo estos cinco campos:
//   name       sometimes, string, max:255
//   last_name  sometimes, string, max:255
//   phone      nullable, string, max:30
//   position   nullable, string, max:255
//   role       sometimes, in:admin,recruiter,viewer
// Correo, organización y fechas no se editan aquí (solo lectura).

/** Valores editables, como texto de cada control. */
export interface FormularioUsuario {
  name: string
  last_name: string
  phone: string
  position: string
  role: string
}

export type CampoUsuario = keyof FormularioUsuario

/** Orden de los campos en la pantalla: el foco va al primero con error. */
export const CAMPOS_USUARIO: ReadonlyArray<CampoUsuario> = ['name', 'last_name', 'phone', 'position', 'role']

/** Largo máximo de cada campo de texto (las reglas max del servidor). */
export const LARGO_MAXIMO: Record<Exclude<CampoUsuario, 'role'>, number> = {
  name: 255,
  last_name: 255,
  phone: 30,
  position: 255,
}

export type ErroresUsuario = Partial<Record<CampoUsuario, string>>

/** Valores iniciales a partir de GET /api/admin/users/{id} (los null quedan vacíos). */
export function formularioDesde(usuario: AdminUser): FormularioUsuario {
  return {
    name: usuario.name ?? '',
    last_name: usuario.last_name ?? '',
    phone: usuario.phone ?? '',
    position: usuario.position ?? '',
    role: usuario.role ?? '',
  }
}

/**
 * Validación antes de enviar. Solo el nombre: el servidor lo exige como texto
 * y un nombre vacío llegaría como null (422). El resto lo valida el servidor.
 */
export function validarFormulario(formulario: FormularioUsuario): ErroresUsuario {
  const errores: ErroresUsuario = {}
  if (formulario.name.trim() === '') errores.name = 'Escribe el nombre.'
  return errores
}

/**
 * Cuerpo de PATCH /api/admin/users/{id}: name, last_name, phone, position y
 * role, los mismos campos que enviaba la pantalla anterior. last_name no se
 * envía si está vacío (PB-27): el servidor lo valida como texto, un vacío le
 * llegaría como null y respondería 422; sin el campo, conserva el que tenía.
 */
export function payloadDeActualizacion(formulario: FormularioUsuario): Partial<AdminUser> {
  const payload: Partial<AdminUser> = { name: formulario.name }
  if (formulario.last_name.trim() !== '') payload.last_name = formulario.last_name
  payload.phone = formulario.phone
  payload.position = formulario.position
  payload.role = formulario.role
  return payload
}

/** Texto como lo guarda Laravel: sin espacios a los lados; vacío pasa a «sin dato». */
function comoSeGuarda(valor: string | undefined): string | undefined {
  const limpio = valor?.trim()
  return limpio ? limpio : undefined
}

/**
 * Usuario después de un PATCH exitoso, sin volver a pedirlo: el servidor recorta
 * los espacios (TrimStrings), guarda los vacíos como null (ConvertEmptyStringsToNull)
 * y conserva last_name si no se envió.
 */
export function usuarioTrasGuardar(antes: AdminUser, payload: Partial<AdminUser>): AdminUser {
  return {
    ...antes,
    name: comoSeGuarda(payload.name) ?? antes.name,
    last_name: payload.last_name === undefined ? antes.last_name : comoSeGuarda(payload.last_name),
    phone: comoSeGuarda(payload.phone),
    position: comoSeGuarda(payload.position),
    role: payload.role ?? antes.role,
  }
}

/** Errores por campo de un 422 que corresponden a este formulario (los demás se ignoran). */
export function erroresDelFormulario(errores: Record<string, string> | null): ErroresUsuario {
  const campos: ErroresUsuario = {}
  if (!errores) return campos
  for (const campo of CAMPOS_USUARIO) {
    if (errores[campo]) campos[campo] = errores[campo]
  }
  return campos
}

/** Primer campo con error, en el orden de la pantalla. */
export function primerCampoConError(errores: ErroresUsuario): CampoUsuario | null {
  return CAMPOS_USUARIO.find((campo) => Boolean(errores[campo])) ?? null
}
