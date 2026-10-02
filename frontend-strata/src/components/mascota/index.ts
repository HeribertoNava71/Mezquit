// Mascota de la home (Fase 6). Importa desde '@/components/mascota'.
// - <Mascota tituloRef={…} /> una vez en la home.
// - data-mascota-objetivo en los CTA y enlaces hacia los que corre.
// - data-mascota-titular en el H1, si no se pasa tituloRef.
// Nada de aquí descarga GSAP: el motor llega en su propio chunk al montarse.
export { Mascota } from './Mascota'
export type { MascotaProps } from './Mascota'
export { ATRIBUTO_OBJETIVO, ATRIBUTO_TITULAR } from './atributos'
export { MENSAJES_MASCOTA } from './mensajes'
export type { FaseMascota } from './motor'
