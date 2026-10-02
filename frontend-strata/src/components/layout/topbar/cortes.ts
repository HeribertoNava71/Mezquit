// Ancho desde el que cada barra superior muestra su diseño de escritorio
// (navegación de texto, pastilla y acciones). Por debajo, todo pasa al menú móvil.
//
// Fase 8: las medidas salen de e2e/barras.mjs (fuentes de Fontshare cargadas):
// - pública: cabe en una fila desde 862 px sin sesión y desde 938 px con un nombre
//   de 30 caracteres en la pastilla → 960 px;
// - RR. HH.: con una organización de 30 caracteres en la pastilla, desde 882 px → 900 px;
// - super admin: cabe desde menos de 700 px → se queda en el corte común de 768 px.
// Los media queries no aceptan variables: TopBar.css repite estos números en las
// reglas .st-topbar--corte-*; si cambias uno, cambia los dos.

/** Corte de cada barra. base es el común (design-tokens.md, regla 17). */
export const CORTES_BARRA = {
  base: 768,
  rh: 900,
  publica: 960,
} as const

export type CorteBarra = keyof typeof CORTES_BARRA

/** Media query del diseño de escritorio de la barra («(min-width: 900px)»). */
export function consultaEscritorio(corte: CorteBarra): string {
  return `(min-width: ${CORTES_BARRA[corte]}px)`
}
