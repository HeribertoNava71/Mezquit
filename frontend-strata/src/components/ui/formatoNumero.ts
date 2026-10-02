// Cifras con el formato de es-MX («1,250»), compartidas por el sistema de diseño
// (Fase 8). Antes cada pantalla tenía su copia: formatearCreditos y textoCreditos
// (Créditos), formatoNumero y contarCreditos (asistente), formatearNumero
// (Resultados), creditos (Solicitudes del operador) y el Intl.NumberFormat de la
// barra de saldo y del contador de pendientes. Los textos no cambian.

const FORMATO_NUMERO = new Intl.NumberFormat('es-MX')

/** Cifra con separador de miles de es-MX: 1250 → «1,250». */
export function formatearNumero(valor: number): string {
  return FORMATO_NUMERO.format(valor)
}

/**
 * Cifra con su sustantivo: «1 candidato», «1,250 candidatos». El singular va con
 * 1 y con −1, como pide el español («−1 crédito»).
 */
export function textoCantidad(valor: number, singular: string, plural: string): string {
  return `${formatearNumero(valor)} ${Math.abs(valor) === 1 ? singular : plural}`
}

/** «1 crédito», «40 créditos», «1,250 créditos». */
export function textoCreditos(valor: number): string {
  return textoCantidad(valor, 'crédito', 'créditos')
}
