// Mascota de la home (Fase 6; carga diferida y control para ocultarla, Fase 8).
// Importa desde '@/components/mascota'.
// - <MascotaDiferida tituloRef={…} /> una vez en la home: descarga la mascota
//   (Mascota.tsx) y GSAP (motor.ts) en sus propios chunks, después de la carga.
// - <ControlMascota /> en el pie de la home: «Ocultar mascota» / «Mostrar mascota».
// - data-mascota-objetivo en los CTA y enlaces hacia los que corre.
// - data-mascota-titular en el H1, si no se pasa tituloRef.
// Mascota.tsx no sale de este barril a propósito: importarlo aquí lo metería en
// el bundle principal. Nada de aquí descarga GSAP.
export type { MascotaProps } from './Mascota'
export { MascotaDiferida } from './MascotaDiferida'
export type { MascotaDiferidaProps } from './MascotaDiferida'
export { ControlMascota } from './ControlMascota'
export type { ControlMascotaProps } from './ControlMascota'
export { ATRIBUTO_OBJETIVO, ATRIBUTO_TITULAR } from './atributos'
export { MENSAJES_MASCOTA, TEXTO_MOSTRAR, TEXTO_OCULTAR } from './mensajes'
export { CLAVE_MASCOTA_OCULTA, guardarMascotaOculta, mascotaOculta, useMascotaOculta } from './preferencia'
export { ESPERA_CARGA_MS, RETARDO_ENTRADA_MS } from './tiempos'
export type { FaseMascota } from './motor'
