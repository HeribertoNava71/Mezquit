const LETTER_OR_DIGIT = /[\p{L}\p{N}]/u

/**
 * Iniciales de un nombre, como en el prototipo (Strata.dc.html:1878): la primera
 * letra de las dos primeras palabras, en mayúsculas.
 * Ignora los títulos abreviados («Dr.», «Lic.») y los signos iniciales.
 *
 * @example getInitials('Valentina Ríos') // 'VR'
 * @example getInitials('Dr. Luis Ordóñez') // 'LO'
 * @example getInitials('Acme Talento', 1) // 'A'
 */
export function getInitials(name: string, max = 2): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const withoutTitles = words.filter((word) => !word.endsWith('.'))
  const source = withoutTitles.length > 0 ? withoutTitles : words
  return source
    .map((word) => Array.from(word).find((char) => LETTER_OR_DIGIT.test(char)) ?? '')
    .filter(Boolean)
    .slice(0, max)
    .join('')
    .toLocaleUpperCase('es-MX')
}
