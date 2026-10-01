import { Link } from 'react-router-dom'
import './Button.css'

interface ButtonProps {
  variant?: 'primary' | 'ghost'
  size?: 'md' | 'lg'
  href?: string
  to?: string
  type?: 'button' | 'submit'
  disabled?: boolean
  loading?: boolean
  className?: string
  children: React.ReactNode
  onClick?: () => void
}

export default function Button({
  variant = 'primary',
  size = 'md',
  href,
  to,
  type = 'button',
  disabled = false,
  loading = false,
  className = '',
  children,
  onClick,
}: ButtonProps) {
  const classes = [
    'btn',
    `btn--${variant}`,
    size === 'lg' ? 'btn--lg' : '',
    loading ? 'btn--loading' : '',
    className,
  ].filter(Boolean).join(' ')

  if (to) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    )
  }

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    )
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={classes}
      onClick={onClick}
    >
      {loading ? 'Enviando…' : children}
    </button>
  )
}
