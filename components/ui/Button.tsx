import { CSSProperties } from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'small' | 'icon'
  children: React.ReactNode
  style?: CSSProperties
}

export default function Button({ variant = 'primary', children, style, ...props }: ButtonProps) {
  const base: CSSProperties = {
    cursor: 'pointer',
    border: 'none',
    borderRadius: '24px',
    fontFamily: 'DM Sans, sans-serif',
    fontWeight: 500,
    transition: 'opacity 0.15s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
  }

  const variants: Record<string, CSSProperties> = {
    primary: {
      background: 'var(--terracotta)',
      color: 'white',
      padding: '10px 20px',
      fontSize: '13px',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--terracotta)',
      border: '1px solid var(--terracotta)',
      padding: '10px 20px',
      fontSize: '13px',
    },
    small: {
      background: 'var(--terracotta)',
      color: 'white',
      padding: '6px 14px',
      fontSize: '11px',
    },
    icon: {
      background: 'var(--bg-elevated)',
      color: 'var(--parchment-dim)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      width: '34px',
      height: '34px',
      padding: 0,
      justifyContent: 'center',
      fontSize: '16px',
    },
  }

  return (
    <button style={{ ...base, ...variants[variant], ...style }} {...props}>
      {children}
    </button>
  )
}
