import { cx } from './cx'
import { VisuallyHidden } from './VisuallyHidden'
import './PasswordStrength.css'

// Lógica de siempre (2026-09-12-registro-login-crud-usuarios.md:898-954): menos
// de 8 caracteres es «Débil»; con 8 o más, «Media», y «Fuerte» si además lleva
// una mayúscula o un número. Solo informa: no bloquea el envío.
function score(pw: string): number {
  if (pw.length < 8) return 0
  let s = 1
  if (/[A-Z]/.test(pw)) s++
  if (/[0-9]/.test(pw)) s++
  return Math.min(s, 2)
}

const LABELS = ['Débil', 'Media', 'Fuerte']

/** Clase de tono por nivel: rojo de error, ámbar de advertencia y verde de éxito. */
const TONOS = ['debil', 'media', 'fuerte'] as const

export interface PasswordStrengthProps {
  password: string
  /**
   * id del texto del nivel. Pásalo al aria-describedby del campo de contraseña
   * para que se lea junto con él.
   */
  id?: string
  className?: string
}

/**
 * Indicador de seguridad de la contraseña: tres barras y el nivel en texto
 * (nunca solo color). Sin contraseña no muestra nada. El nivel se anuncia con
 * cortesía cuando cambia (aria-live="polite").
 */
export default function PasswordStrength({ password, id, className }: PasswordStrengthProps) {
  if (!password) return null
  const s = score(password)
  return (
    <div className={cx('st-password-strength', `st-password-strength--${TONOS[s]}`, className)}>
      <div className="st-password-strength__bars" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span key={i} className={cx('st-password-strength__bar', i <= s && 'st-password-strength__bar--on')} />
        ))}
      </div>
      <p id={id} className="st-password-strength__label" aria-live="polite">
        <VisuallyHidden>Seguridad de la contraseña:</VisuallyHidden> {LABELS[s]}
      </p>
    </div>
  )
}

export { PasswordStrength }
