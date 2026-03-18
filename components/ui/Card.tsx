import { CSSProperties } from 'react'

interface CardProps {
  children: React.ReactNode
  style?: CSSProperties
  className?: string
  title?: string
  action?: React.ReactNode
}

export default function Card({ children, style, title, action }: CardProps) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: '14px',
      padding: '20px 24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      transition: 'box-shadow 0.15s, border-color 0.15s',
      ...style,
    }}>
      {(title || action) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          {title && (
            <h2 style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--parchment)',
            }}>{title}</h2>
          )}
          {action}
        </div>
      )}
      {children}
    </div>
  )
}
