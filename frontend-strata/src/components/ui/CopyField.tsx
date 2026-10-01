import { useEffect, useRef, useState, type HTMLAttributes, type ReactNode, type Ref } from 'react'
import { copyToClipboard } from './copyToClipboard'
import { cx } from './cx'
import { IconoCopiar, IconoPalomita } from './Iconos'
import { VisuallyHidden } from './VisuallyHidden'
import './CopyField.css'

/** Milisegundos que el botón muestra «Copiado» o «Reintentar» antes de volver a «Copiar». */
const FEEDBACK_MS = 2000

type CopyStatus = 'idle' | 'copied' | 'error'

/**
 * field: fila con el valor y el botón de texto «Copiar»; toda la fila copia (Strata.dc.html:1336-1339).
 * inline: código y botón de ícono de 24 px, para tablas (:737-738).
 * link: enlace en mono y «Copiar» como texto, para tablas (:742-745).
 */
export type CopyFieldVariant = 'field' | 'inline' | 'link'

/** dark: sobre superficie oscura (agrega st-on-dark). light: sobre fondo claro. */
export type CopyFieldTone = 'dark' | 'light'

export interface CopyFieldProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onCopy'> {
  /** Texto que se copia (por ejemplo, el enlace completo de la invitación). */
  value: string
  /**
   * Qué se copia, en minúsculas y sin artículo: «enlace de invitación», «código».
   * Forma el nombre del botón («Copiar enlace de invitación»).
   */
  label: string
  /** Lo que se ve. Por defecto, el mismo value. */
  children?: ReactNode
  /** field, inline o link (ver CopyFieldVariant). Por defecto, field. */
  variant?: CopyFieldVariant
  /** dark: sobre superficie oscura. light: sobre fondo claro. Por defecto, dark en field y light en inline y link. */
  tone?: CopyFieldTone
  /**
   * Se llama después de copiar; úsalo para el toast de confirmación (D-22). Con
   * onCopied, el campo ya no anuncia el éxito por su cuenta (lo hace el toast).
   */
  onCopied?: (value: string) => void
  /**
   * Se llama si no se pudo copiar. El campo ya avisa inline (botón «Reintentar»,
   * anuncio y valor seleccionado para copiarlo a mano): no hace falta un toast.
   */
  onCopyError?: () => void
  ref?: Ref<HTMLDivElement>
}

/** Selecciona el texto del elemento para que se pueda copiar a mano. */
function selectText(element: HTMLElement | null) {
  const selection = document.getSelection()
  if (!element || !selection) return
  const range = document.createRange()
  range.selectNodeContents(element)
  selection.removeAllRanges()
  selection.addRange(range)
}

const BUTTON_TEXT: Record<CopyStatus, string> = { idle: 'Copiar', copied: 'Copiado', error: 'Reintentar' }

const COPIED_ANNOUNCEMENT = 'Copiado al portapapeles.'
const ERROR_ANNOUNCEMENT = 'No se pudo copiar. El texto quedó seleccionado: cópialo con Ctrl+C o Cmd+C.'

/**
 * Valor en mono con botón para copiarlo (navigator.clipboard y, si falla, el
 * respaldo con execCommand). Si ninguno funciona, selecciona el valor para
 * copiarlo a mano.
 * - Éxito: sin onCopied lo anuncia su región role="status"; con onCopied lo
 *   confirma el toast de la página y el campo no agrega región (útil en tablas).
 * - Error (D-22, inline): siempre, con un role="alert" que aparece en cada fallo.
 */
export function CopyField({
  value,
  label,
  children,
  variant = 'field',
  tone = variant === 'field' ? 'dark' : 'light',
  onCopied,
  onCopyError,
  className,
  ref,
  ...rest
}: CopyFieldProps) {
  const [status, setStatus] = useState<CopyStatus>('idle')
  // Cuenta los fallos: la clave del aviso cambia y el lector lo repite en cada intento.
  const [failures, setFailures] = useState(0)
  const valueRef = useRef<HTMLSpanElement>(null)
  const timerRef = useRef<number | undefined>(undefined)
  const mountedRef = useRef(false)

  useEffect(() => {
    const timer = timerRef
    const mounted = mountedRef
    mounted.current = true
    return () => {
      mounted.current = false
      window.clearTimeout(timer.current)
    }
  }, [])

  async function handleCopy() {
    const copied = await copyToClipboard(value)
    if (copied) onCopied?.(value)
    else onCopyError?.()
    if (!mountedRef.current) return
    if (!copied) {
      selectText(valueRef.current)
      setFailures((count) => count + 1)
    }
    setStatus(copied ? 'copied' : 'error')
    window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => setStatus('idle'), FEEDBACK_MS)
  }

  // El nombre incluye el texto visible del botón (WCAG 2.5.3).
  const buttonName =
    status === 'copied' ? `Copiado: ${label}` : status === 'error' ? `Reintentar copiar ${label}` : `Copiar ${label}`
  // El valor truncado se lee completo al pasar el puntero. En field, la fila entera
  // es el área del botón y tapa al valor: el título va en la raíz.
  const isField = variant === 'field'

  return (
    <div
      ref={ref}
      className={cx(
        'st-copy',
        `st-copy--${variant}`,
        `st-copy--${tone}`,
        status !== 'idle' && `st-copy--${status}`,
        tone === 'dark' && 'st-on-dark',
        className,
      )}
      title={isField ? value : undefined}
      {...rest}
    >
      <span ref={valueRef} className="st-copy__value" title={isField ? undefined : value}>
        {children ?? value}
      </span>
      <button type="button" className="st-copy__button" aria-label={buttonName} onClick={handleCopy}>
        {variant === 'inline' ? (
          status === 'copied' ? (
            <IconoPalomita width={12} height={12} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <IconoCopiar />
          )
        ) : (
          BUTTON_TEXT[status]
        )}
      </button>
      {!onCopied && <VisuallyHidden role="status">{status === 'copied' ? COPIED_ANNOUNCEMENT : ''}</VisuallyHidden>}
      {status === 'error' && (
        <VisuallyHidden key={failures} role="alert">
          {ERROR_ANNOUNCEMENT}
        </VisuallyHidden>
      )}
    </div>
  )
}
