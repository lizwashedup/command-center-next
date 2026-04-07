export default function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      marginTop: '16px',
      padding: '12px 16px',
      borderRadius: '14px',
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border)',
      fontSize: '12px',
      color: 'var(--parchment-dim)',
      lineHeight: 1.6,
    }}>
      {children}
    </div>
  );
}
