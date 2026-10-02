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

/** Control para detener la mascota (WCAG 2.2.2; D-27): junto a la burbuja y en el pie de la home. */
export const TEXTO_OCULTAR = 'Ocultar mascota'
/** El mismo control en el pie, con la mascota oculta. */
export const TEXTO_MOSTRAR = 'Mostrar mascota'
/** Lo que anuncia el pie al cambiar la preferencia. */
export const AVISO_OCULTA = 'Ocultaste la mascota. Puedes volver a mostrarla desde el pie de la página.'
export const AVISO_VISIBLE = 'La mascota vuelve en un momento.'

/** La burbuja se oculta sola a los 5.4 s de cada toque (Strata.dc.html:2026). */
export const DURACION_BURBUJA_MS = 5400

/** Mensaje del toque número `toques` (1 es el primero): el saludo y luego en rueda. */
export function mensajeDelToque(toques: number): string {
  const total = MENSAJES_MASCOTA.length
  return MENSAJES_MASCOTA[(((toques - 1) % total) + total) % total]
}
