export const dynamic = 'force-static'

const COLORS = [
  { name: 'Terracotta', hex: '#D97746', label: 'Primary Accent', role: 'CTAs, highlights, key brand moments' },
  { name: 'Amber', hex: '#E89A20', label: 'Secondary Accent', role: 'Warnings, secondary highlights, warmth' },
  { name: 'Parchment', hex: '#1C1C1E', label: 'Primary Text', role: 'All body text and headings' },
  { name: 'Parchment Dim', hex: '#636366', label: 'Secondary Text', role: 'Subtitles, meta, supporting copy' },
  { name: 'Parchment Muted', hex: '#9B8B7A', label: 'Muted Text', role: 'Captions, placeholders, tertiary info' },
  { name: 'BG Base', hex: '#F8F5F0', label: 'Background', role: 'Page and layout background' },
  { name: 'BG Surface', hex: '#FFFFFF', label: 'Surface', role: 'Cards and panels' },
  { name: 'BG Elevated', hex: '#F0EBE3', label: 'Elevated Surface', role: 'Input fields, nested cards' },
]

const VOICE_PILLARS = [
  {
    title: 'Raw & Real',
    description: 'No polished athlete PR speak. We talk about failure, doubt, and the grind without a brand filter. The arena is honest.',
    example: '"The comeback starts in the dark, not on the highlight reel."',
  },
  {
    title: 'Earned Authority',
    description: 'We speak from the arena, not the stands. Every piece of content comes from lived athletic experience — not theory or trend-chasing.',
    example: '"This isn\'t advice from someone who watched. It\'s from someone who got cut."',
  },
  {
    title: 'Warm but Wired',
    description: 'Community-first energy with the infrastructure of a real business. Approachable, but never soft. We hug and we hustle.',
    example: '"We\'re here because we still believe. And we\'re building the proof."',
  },
  {
    title: 'Unapologetically Niche',
    description: 'WashedUp is not for everyone. We do not try to be. The athletes who need us will find us — and feel instantly seen.',
    example: '"If you\'ve never had to explain why you still train, this probably isn\'t for you."',
  },
]

const TERMINOLOGY = [
  { term: 'Washed', definition: 'Experienced. Seasoned. Post-prime by conventional sports timelines — but not done. A badge, not an insult.' },
  { term: 'Comeback', definition: 'A WashedUp journey. The active process of returning to competitive sport, building something new, or proving the doubters wrong.' },
  { term: 'The Arena', definition: 'The WashedUp community. The place where athletes gather, share, and compete in the next chapter.' },
  { term: 'Next Chapter', definition: 'The life, business, or athletic endeavor that comes after the primary career. Full of potential, not consolation.' },
  { term: 'The Grind', definition: 'The daily work. Not glamorous. Not optional. The thing that separates comeback stories from wishful thinking.' },
  { term: 'Post-Prime', definition: 'A conventional label we reject. Prime is a mindset, not an age bracket.' },
]

const DO_DONT = [
  { do: 'Authentic, specific storytelling', dont: 'Generic motivational platitudes' },
  { do: 'Respect the athlete\'s intelligence', dont: 'Over-explain or condescend' },
  { do: 'Honor the difficulty honestly', dont: 'Toxic positivity or false promises' },
  { do: '"Comeback" over "retirement"', dont: '"Moving on" or "second career"' },
  { do: 'First-person athlete voice', dont: 'Corporate third-person distance' },
]

export default function BrandPage() {
  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ marginBottom: '48px' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--terracotta)', marginBottom: '10px' }}>
          Brand Identity System
        </div>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '52px', fontWeight: 700, lineHeight: 1.05, color: 'var(--parchment)', marginBottom: '12px' }}>
          WashedUp Brand Hub
        </h1>
        <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '24px', fontStyle: 'italic', color: 'var(--parchment-dim)', lineHeight: 1.4, maxWidth: '600px' }}>
          "For the athletes who aren't done yet."
        </p>
      </div>

      {/* Color Palette */}
      <section style={{ marginBottom: '56px' }}>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '18px', fontWeight: 700, marginBottom: '20px', color: 'var(--parchment)' }}>
          Color Palette
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {COLORS.map(color => (
            <div key={color.hex} style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '80px',
                background: color.hex,
                borderBottom: '1px solid var(--border)',
              }} />
              <div style={{ padding: '14px 16px' }}>
                <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--parchment)', marginBottom: '2px' }}>
                  {color.name}
                </div>
                <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--parchment-dim)', marginBottom: '6px' }}>
                  {color.hex}
                </div>
                <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--terracotta)', marginBottom: '4px' }}>
                  {color.label}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--parchment-muted)', lineHeight: 1.4 }}>
                  {color.role}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Typography */}
      <section style={{ marginBottom: '56px' }}>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '18px', fontWeight: 700, marginBottom: '20px', color: 'var(--parchment)' }}>
          Typography
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Cormorant Garamond */}
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '28px 28px 24px',
          }}>
            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--terracotta)', marginBottom: '16px' }}>
              Display / Headings
            </div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '40px', fontWeight: 700, color: 'var(--parchment)', lineHeight: 1.1, marginBottom: '8px' }}>
              Cormorant Garamond
            </div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', fontWeight: 400, color: 'var(--parchment-dim)', fontStyle: 'italic', marginBottom: '20px' }}>
              Serif elegance, athletic grit.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { size: '52px', weight: 700, label: 'H1 — Page Titles' },
                { size: '32px', weight: 700, label: 'H2 — Section Titles' },
                { size: '22px', weight: 600, label: 'H3 — Card Titles' },
                { size: '18px', weight: 400, label: 'H4 — Subtitles' },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                  <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: s.size, fontWeight: s.weight, color: 'var(--parchment)', lineHeight: 1.2 }}>
                    Aa
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--parchment-muted)' }}>{s.label} — {s.size}</span>
                </div>
              ))}
            </div>
          </div>

          {/* DM Sans */}
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '28px 28px 24px',
          }}>
            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--terracotta)', marginBottom: '16px' }}>
              UI / Body
            </div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '40px', fontWeight: 700, color: 'var(--parchment)', lineHeight: 1.1, marginBottom: '8px' }}>
              DM Sans
            </div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '18px', fontWeight: 400, color: 'var(--parchment-dim)', marginBottom: '20px' }}>
              Clean, modern, functional.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { size: '15px', weight: 400, label: 'Body text — readable and clean' },
                { size: '13px', weight: 500, label: 'UI labels and navigation' },
                { size: '11px', weight: 600, label: 'BADGES, CAPS LABELS, META' },
                { size: '11px', weight: 400, label: 'Captions and secondary info' },
              ].map((s, i) => (
                <div key={i} style={{ fontFamily: 'DM Sans, sans-serif', fontSize: s.size, fontWeight: s.weight, color: i === 2 ? 'var(--parchment-muted)' : 'var(--parchment-dim)', textTransform: i === 2 ? 'uppercase' : 'none', letterSpacing: i === 2 ? '0.06em' : 'normal' }}>
                  {s.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tagline + Mission */}
      <section style={{ marginBottom: '56px' }}>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '18px', fontWeight: 700, marginBottom: '20px', color: 'var(--parchment)' }}>
          Brand Foundation
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {[
            {
              label: 'Tagline',
              content: '"For the athletes who aren\'t done yet."',
              note: 'Use on hero sections, social bios, and marketing materials.',
            },
            {
              label: 'Mission',
              content: 'WashedUp exists to prove that the best chapter of an athlete\'s story hasn\'t been written yet.',
              note: 'Internal compass and long-form brand copy.',
            },
            {
              label: 'Position',
              content: 'The platform for post-prime athletes building their next act — comeback, business, or both.',
              note: 'Use in pitch decks, press, and investor materials.',
            },
          ].map(item => (
            <div key={item.label} style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '22px',
            }}>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--terracotta)', marginBottom: '12px' }}>
                {item.label}
              </div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '17px', fontWeight: 600, color: 'var(--parchment)', lineHeight: 1.5, marginBottom: '12px' }}>
                {item.content}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--parchment-muted)', lineHeight: 1.5 }}>
                {item.note}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Voice & Tone */}
      <section style={{ marginBottom: '56px' }}>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '18px', fontWeight: 700, marginBottom: '20px', color: 'var(--parchment)' }}>
          Voice & Tone — 4 Pillars
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {VOICE_PILLARS.map((pillar, i) => (
            <div key={pillar.title} style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <span style={{
                  width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(217,119,70,0.12)',
                  color: 'var(--terracotta)', fontFamily: 'Cormorant Garamond, serif', fontSize: '15px', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>{i + 1}</span>
                <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', fontWeight: 700, color: 'var(--parchment)' }}>
                  {pillar.title}
                </h3>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--parchment-dim)', lineHeight: 1.6, marginBottom: '14px' }}>
                {pillar.description}
              </p>
              <div style={{
                padding: '12px 16px',
                background: 'var(--bg-elevated)',
                borderRadius: '8px',
                borderLeft: '3px solid var(--terracotta)',
              }}>
                <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--terracotta)', marginBottom: '4px' }}>
                  Example
                </div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '15px', fontStyle: 'italic', color: 'var(--parchment)', lineHeight: 1.5 }}>
                  {pillar.example}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Do / Don't */}
      <section style={{ marginBottom: '56px' }}>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '18px', fontWeight: 700, marginBottom: '20px', color: 'var(--parchment)' }}>
          Do / Don't
        </h2>
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '14px', overflow: 'hidden',
        }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            borderBottom: '1px solid var(--border)', padding: '10px 24px',
            background: 'var(--bg-elevated)',
          }}>
            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--success)' }}>Do</div>
            <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--error)' }}>Don't</div>
          </div>
          {DO_DONT.map((row, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              padding: '14px 24px',
              borderBottom: i < DO_DONT.length - 1 ? '1px solid var(--border)' : 'none',
              alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--parchment)' }}>
                <span style={{ color: 'var(--success)', fontSize: '16px', flexShrink: 0 }}>✓</span>
                {row.do}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--parchment-dim)' }}>
                <span style={{ color: 'var(--error)', fontSize: '16px', flexShrink: 0 }}>✗</span>
                {row.dont}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Terminology */}
      <section style={{ marginBottom: '56px' }}>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '18px', fontWeight: 700, marginBottom: '20px', color: 'var(--parchment)' }}>
          WashedUp Terminology
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
          {TERMINOLOGY.map(item => (
            <div key={item.term} style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px 20px',
            }}>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', fontWeight: 700, color: 'var(--terracotta)', marginBottom: '6px' }}>
                {item.term}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--parchment-dim)', lineHeight: 1.6 }}>
                {item.definition}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer bar */}
      <div style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', fontWeight: 700, color: 'var(--parchment)' }}>
            WashedUp HQ
          </div>
          <div style={{ fontSize: '12px', color: 'var(--parchment-muted)', marginTop: '2px' }}>
            Brand Identity System — Internal Reference
          </div>
        </div>
        <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '16px', fontStyle: 'italic', color: 'var(--parchment-dim)' }}>
          "For the athletes who aren't done yet."
        </div>
      </div>
    </div>
  )
}
