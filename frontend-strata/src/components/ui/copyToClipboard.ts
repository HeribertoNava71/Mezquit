/**
 * Copia texto al portapapeles.
 *
 * Usa navigator.clipboard (contexto seguro) y, si no existe o falla, el respaldo
 * clásico: un textarea temporal con document.execCommand('copy'). El respaldo
 * devuelve el foco y la selección que había antes.
 *
 * @returns true si se copió; false si ninguno de los dos caminos funcionó.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && typeof navigator.clipboard?.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Permiso denegado o documento sin foco: se intenta el respaldo.
    }
  }
  return copyWithTextarea(text)
}

function copyWithTextarea(text: string): boolean {
  if (typeof document === 'undefined' || typeof document.execCommand !== 'function') return false

  const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  const selection = document.getSelection()
  const previousRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.setAttribute('aria-hidden', 'true')
  // Fuera de la vista, sin mover el scroll ni el layout.
  textarea.style.position = 'fixed'
  textarea.style.top = '0'
  textarea.style.left = '0'
  textarea.style.width = '1px'
  textarea.style.height = '1px'
  textarea.style.opacity = '0'
  textarea.style.pointerEvents = 'none'
  document.body.append(textarea)
  textarea.select()
  textarea.setSelectionRange(0, text.length)

  let copied: boolean
  try {
    copied = document.execCommand('copy')
  } catch {
    copied = false
  }

  textarea.remove()
  if (selection && previousRange) {
    selection.removeAllRanges()
    selection.addRange(previousRange)
  }
  previousFocus?.focus({ preventScroll: true })
  return copied
}
