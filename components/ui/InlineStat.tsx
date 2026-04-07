const highlightMap = {
  green: { bg: 'rgba(46,125,50,0.08)', border: 'rgba(46,125,50,0.2)', text: 'var(--success)', sub: 'rgba(46,125,50,0.6)' },
  orange: { bg: 'rgba(217,119,70,0.08)', border: 'rgba(217,119,70,0.2)', text: 'var(--terracotta)', sub: 'rgba(217,119,70,0.6)' },
  blue: { bg: 'rgba(21,101,192,0.08)', border: 'rgba(21,101,192,0.2)', text: '#1565C0', sub: 'rgba(21,101,192,0.6)' },
  dark: { bg: 'var(--parchment)', border: 'transparent', text: '#fff', sub: 'rgba(255,255,255,0.6)' },
};

interface InlineStatProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  highlight?: 'green' | 'orange' | 'blue' | 'dark';
}

export default function InlineStat({ label, value, sub, accent, highlight }: InlineStatProps) {
  const c = highlight ? highlightMap[highlight] : null;
  return (
    <div style={{
      borderRadius: '14px',
      padding: '16px',
      border: `1px solid ${c?.border ?? 'var(--border)'}`,
      background: c?.bg ?? 'var(--bg-surface)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: c?.sub ?? 'var(--parchment-muted)' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', fontWeight: 700, marginTop: '4px', lineHeight: 1.1, color: accent ?? c?.text ?? 'var(--parchment)' }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: '11px', marginTop: '4px', lineHeight: 1.4, color: c?.sub ?? 'var(--parchment-muted)' }}>
          {sub}
        </div>
      )}
    </div>
  );
}
