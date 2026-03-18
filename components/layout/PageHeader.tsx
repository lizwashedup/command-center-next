interface PageHeaderProps {
  title: string
  subtitle?: string
  badge?: string
  badgeColor?: 'terracotta' | 'green' | 'amber'
  action?: React.ReactNode
}

export default function PageHeader({ title, subtitle, badge, badgeColor = 'green', action }: PageHeaderProps) {
  const badgeColors: Record<string, { bg: string; color: string }> = {
    terracotta: { bg: 'rgba(217,119,70,0.12)', color: 'var(--terracotta)' },
    green: { bg: 'rgba(46,125,50,0.1)', color: 'var(--success)' },
    amber: { bg: 'rgba(232,154,32,0.12)', color: 'var(--amber)' },
  }
  const bc = badgeColors[badgeColor]

  return (
    <div style={{ marginBottom: '32px' }}>
      <h1 style={{
        fontFamily: 'Cormorant Garamond, serif',
        fontSize: '42px',
        fontWeight: 700,
        lineHeight: 1.1,
        marginBottom: '6px',
        color: 'var(--parchment)',
      }}>{title}</h1>
      {(subtitle || badge || action) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {subtitle && (
            <p style={{ fontSize: '14px', color: 'var(--parchment-dim)' }}>{subtitle}</p>
          )}
          {badge && (
            <span style={{
              fontSize: '10px',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              padding: '3px 10px',
              borderRadius: '20px',
              background: bc.bg,
              color: bc.color,
            }}>{badge}</span>
          )}
          {action && <div style={{ marginLeft: 'auto' }}>{action}</div>}
        </div>
      )}
    </div>
  )
}
