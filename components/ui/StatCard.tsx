interface StatCardProps {
  label: string
  value: string | number
  trend?: string
  trendUp?: boolean
}

export default function StatCard({ label, value, trend, trendUp }: StatCardProps) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: '14px',
      padding: '20px 24px',
      textAlign: 'center',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{
        fontFamily: 'Cormorant Garamond, serif',
        fontSize: '32px',
        fontWeight: 700,
        color: 'var(--terracotta)',
        lineHeight: 1.1,
        marginBottom: '4px',
      }}>{value}</div>
      <div style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--parchment-dim)' }}>
        {label}
      </div>
      {trend && (
        <div style={{ fontSize: '11px', color: trendUp ? 'var(--success)' : 'var(--error)', marginTop: '4px' }}>
          {trendUp ? '↑' : '↓'} {trend}
        </div>
      )}
    </div>
  )
}
