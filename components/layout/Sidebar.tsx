'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const hqItems = [
  { href: '/', label: 'Command Center', icon: '⌂' },
  { href: '/growth', label: 'Growth Pipeline', icon: '↑' },
  { href: '/investors', label: 'Investor CRM', icon: '◈' },
  { href: '/content', label: 'Content Queue', icon: '✦' },
  { href: '/strategy', label: 'Strategy Corner', icon: '◇' },
  { href: '/docs', label: 'Docs Vault', icon: '▤' },
  { href: '/systems', label: 'Systems & Tools', icon: '⚙' },
  { href: '/brand', label: 'Brand Hub', icon: '◉' },
  { href: '/finance', label: 'Finance', icon: '$' },
]

const adminItems = [
  { href: '/admin', label: 'Dashboard', icon: '◎' },
  { href: '/admin/ops', label: 'Ops Dashboard', icon: '⊞' },
  { href: '/admin/users', label: 'Users', icon: '⊹' },
  { href: '/admin/plans', label: 'Plans', icon: '▦' },
  { href: '/admin/messages', label: 'Messages', icon: '◫' },
  { href: '/admin/wtl-cities', label: 'WTL Cities', icon: '🌍' },
]

const linkStyle = (isActive: boolean) => ({
  display: 'flex' as const,
  alignItems: 'center' as const,
  gap: '10px',
  padding: '9px 12px',
  borderRadius: '8px',
  textDecoration: 'none' as const,
  fontSize: '13px',
  fontWeight: isActive ? 500 : 400,
  color: isActive ? 'var(--terracotta)' : 'var(--parchment-dim)',
  background: isActive ? 'rgba(217,119,70,0.08)' : 'transparent',
  borderLeft: isActive ? '3px solid var(--terracotta)' : '3px solid transparent',
  transition: 'all 0.15s',
})

const sectionLabel = {
  fontSize: '9px',
  fontWeight: 600,
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  padding: '12px 12px 6px',
}

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const isHqSection = !pathname.startsWith('/admin')
  const isAdminSection = pathname.startsWith('/admin')

  return (
    <aside style={{
      position: 'fixed',
      top: 0, left: 0,
      width: '220px',
      height: '100vh',
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
      padding: '28px 0',
    }}>
      {/* Logo */}
      <div style={{ padding: '0 24px', marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '36px', height: '36px',
          background: 'var(--terracotta)',
          borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 700, fontSize: '18px',
          fontFamily: 'Cormorant Garamond, serif',
          flexShrink: 0,
        }}>W</div>
        <div>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: '17px', lineHeight: 1.2 }}>WashedUp</div>
          <div style={{ fontSize: '10px', color: 'var(--parchment-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>HQ</div>
        </div>
      </div>

      {/* Scrollable nav area */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* HQ Section */}
        <div style={{ padding: '0 12px' }}>
          <div style={{
            ...sectionLabel,
            color: isHqSection ? 'var(--terracotta)' : 'var(--parchment-muted)',
          }}>
            Headquarters
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {hqItems.map(item => {
              const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
              return (
                <Link key={item.href} href={item.href} style={linkStyle(isActive)}>
                  <span style={{ fontSize: '15px', opacity: isActive ? 1 : 0.5, width: '18px', textAlign: 'center' }}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Divider */}
        <div style={{
          margin: '16px 24px',
          borderTop: '1px solid var(--border)',
        }} />

        {/* App Admin Section */}
        <div style={{ padding: '0 12px' }}>
          <div style={{
            ...sectionLabel,
            color: isAdminSection ? 'var(--terracotta)' : 'var(--parchment-muted)',
          }}>
            App Admin
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {adminItems.map(item => {
              const isActive = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
              return (
                <Link key={item.href} href={item.href} style={linkStyle(isActive)}>
                  <span style={{ fontSize: '15px', opacity: isActive ? 1 : 0.5, width: '18px', textAlign: 'center' }}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '16px 24px 0', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: '10px', color: 'var(--parchment-muted)', letterSpacing: '0.04em', marginBottom: '12px' }}>
          {today}
        </div>
        <button
          onClick={handleSignOut}
          style={{
            fontSize: '11px',
            color: 'var(--parchment-muted)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            letterSpacing: '0.04em',
          }}
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
