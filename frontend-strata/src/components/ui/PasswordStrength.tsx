import './PasswordStrength.css'

function score(pw: string): number {
  if (pw.length < 8) return 0
  let s = 1
  if (/[A-Z]/.test(pw)) s++
  if (/[0-9]/.test(pw)) s++
  return Math.min(s, 2)
}

const LABELS = ['Débil', 'Media', 'Fuerte']

export default function PasswordStrength({ password }: { password: string }) {
  if (!password) return null
  const s = score(password)
  return (
    <div>
      <div className="pstrength">
        {[0, 1, 2].map(i => (
          <div key={i} className={`pstrength__bar${i <= s ? ` pstrength__bar--active-${s}` : ''}`} />
        ))}
      </div>
      <p className="pstrength__label">{LABELS[s]}</p>
    </div>
  )
}
