// Tiempos de la mascota que no necesitan GSAP: los usan la home (MascotaDiferida)
// y el motor. Viven aparte para que importarlos no descargue el chunk del motor.

/** Espera antes de entrar en escena (Strata.dc.html:1629), contada desde que la home se monta. */
export const RETARDO_ENTRADA_MS = 6000

/**
 * Espera antes de descargar la mascota y GSAP (D-28): la home termina de cargar,
 * de pintarse y de quedar interactiva sin ellos (unos 40 KB comprimidos y la
 * imagen). Lo que falta de los 6 s se descuenta de la entrada, así que la mascota
 * entra a la misma hora que antes; 1.5 s alcanzan para descargar el chunk.
 */
export const ESPERA_CARGA_MS = 4500

/** Entrada cuando la persona vuelve a mostrar la mascota con «Mostrar mascota». */
export const RETARDO_REAPARICION_MS = 400
