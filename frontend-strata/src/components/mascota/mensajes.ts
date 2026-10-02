import { SITE } from '@/config/site'

/**
 * Mensajes de la burbuja, en el orden en que aparecen: el primer toque saluda
 * y los siguientes rotan (Strata.dc.html:1571-1578, :2021).
 *
 * Revisados según D-16 y D-18: ninguno promete resultados ni correos al
 * candidato, ni cifras o garantías sin respaldo. Se quitaron «Tu test dura 15
 * minutos. Sin contraseñas ni registro.» (duración fija y RR. HH. sí se
 * registra) y «Tu informe llega en PDF a tu correo» (el candidato no recibe
 * resultados). Cada texto describe algo que el producto ya hace:
 * - «Tengo un código» (/evaluar) acepta el enlace o el código de la invitación,
 *   y el candidato responde sin cuenta.
 * - Cada respuesta se guarda al contestarla y el mismo enlace retoma la prueba
 *   en el primer reactivo sin respuesta.
 * - Al registrarse con los datos de su empresa, RR. HH. invita candidatos y
 *   consulta sus reportes en el panel.
 * - «No hay respuestas correctas» se acota a las pruebas de personalidad: las
 *   de razonamiento sí las tienen.
 * Son una propuesta de microcopy: el dueño puede ajustarlos (D-18).
 */
export const MENSAJES_MASCOTA: readonly string[] = [
  `Hola, soy la salamandra de ${SITE.name}. Te doy la bienvenida.`,
  '¿Te invitaron a una evaluación? Entra en «Tengo un código» con tu enlace o tu código; no necesitas crear cuenta.',
  'Nosotras regeneramos lo que perdemos. Las personas también evolucionamos.',
  'Cada respuesta se guarda al momento: puedes pausar y retomar con el mismo enlace.',
  'Si vienes de una empresa, crea tu cuenta con sus datos: desde el panel invitas candidatos y consultas sus reportes.',
  'En las pruebas de personalidad no hay respuestas correctas ni incorrectas: responde lo que mejor te describa.',
]

/** Nombre accesible del botón de la mascota. */
export const ETIQUETA_MASCOTA = `Mascota de ${SITE.name}: toca para un consejo`

/** La burbuja se oculta sola a los 5.4 s de cada toque (Strata.dc.html:2026). */
export const DURACION_BURBUJA_MS = 5400

/** Mensaje del toque número `toques` (1 es el primero): el saludo y luego en rueda. */
export function mensajeDelToque(toques: number): string {
  const total = MENSAJES_MASCOTA.length
  return MENSAJES_MASCOTA[(((toques - 1) % total) + total) % total]
}
