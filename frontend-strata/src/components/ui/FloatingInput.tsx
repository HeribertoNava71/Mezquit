import type { InputHTMLAttributes } from 'react'
import './FloatingInput.css'

interface FloatingInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  id: string
}

export default function FloatingInput({ label, error, id, className = '', ...props }: FloatingInputProps) {
  return (
    <div className="float">
      <input
        id={id}
        placeholder=" "
        className={`float__input${error ? ' float__input--error' : ''} ${className}`}
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={!!error}
        {...props}
      />
      <label htmlFor={id} className="float__label">{label}</label>
      {error && <span id={`${id}-error`} className="float__error" role="alert">{error}</span>}
    </div>
  )
}
