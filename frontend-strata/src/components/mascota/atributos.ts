// Atributos con los que la home le habla a la mascota. Viven aparte del motor
// para que importarlos no descargue GSAP.

/**
 * Atributo de los CTA y enlaces hacia los que corre la mascota al hacer clic
 * en ellos. Sustituye a la búsqueda por texto del prototipo, frágil y con
 * falsos positivos (Strata.dc.html:1587-1588, :1722-1723).
 */
export const ATRIBUTO_OBJETIVO = 'data-mascota-objetivo'

/**
 * Atributo del H1 que vigila la mascota cuando no recibe tituloRef. Sustituye
 * al selector de hermanos `#strata-mascot ~ div h1` (Strata.dc.html:1697), que
 * no funciona desde un portal.
 */
export const ATRIBUTO_TITULAR = 'data-mascota-titular'
