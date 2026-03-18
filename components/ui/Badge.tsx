type BadgeVariant = 'high' | 'med' | 'active' | 'pending' | 'done' | 'idea' | 'default'

const styles: Record<BadgeVariant, { background: string; color: string }> = {
  high: { background: 'rgba(198,40,40,0.1)', color: 'var(--error)' },
  med: { background: 'rgba(232,154,32,0.12)', color: 'var(--warning)' },
  active: { background: 'rgba(46,125,50,0.1)', color: 'var(--success)' },
  pending: { background: 'rgba(217,119,70,0.12)', color: 'var(--terracotta)' },
  done: { background: 'rgba(155,139,122,0.15)', color: 'var(--parchment-muted)' },
  idea: { background: 'rgba(103,58,183,0.1)', color: '#7C3AED' },
  default: { background: 'var(--bg-elevated)', color: 'var(--parchment-dim)' },
}

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
}

export default function Badge({ variant = 'default', children }: BadgeProps) {
  const s = styles[variant]
  return (
    <span style={{
      fontSize: '10px',
      fontWeight: 500,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      padding: '3px 10px',
      borderRadius: '20px',
      ...s,
    }}>
      {children}
    </span>
  )
}
