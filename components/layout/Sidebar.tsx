'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const navItems = [
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
  { href: '/admin/users', label: 'Users', icon: '⊹' },
  { href: '/admin/plans', label: 'Plans', icon: '▦' },
  { href: '/admin/messages', label: 'Messages', icon: '◫' },
  { href: '/admin/wtl-cities', label: 'WTL Cities', icon: '🌍' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

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
      <div style={{ padding: '0 24px', marginBottom: '36px', display: 'flex', alignItems: 'center', gap: '10px' }}>
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

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {navItems.map(item => {
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 12px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: isActive ? 500 : 400,
                color: isActive ? 'var(--terracotta)' : 'var(--parchment-dim)',
                background: isActive ? 'rgba(217,119,70,0.08)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--terracotta)' : '3px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: '15px', opacity: isActive ? 1 : 0.5, width: '18px', textAlign: 'center' }}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* App Admin */}
      <div style={{ padding: '0 12px', marginTop: '8px' }}>
        <div style={{
          fontSize: '9px',
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--parchment-muted)',
          padding: '8px 12px 4px',
        }}>
          App Admin
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {adminItems.map(item => {
            const isActive = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? 'var(--terracotta)' : 'var(--parchment-dim)',
                  background: isActive ? 'rgba(217,119,70,0.08)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--terracotta)' : '3px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: '15px', opacity: isActive ? 1 : 0.5, width: '18px', textAlign: 'center' }}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            )
          })}
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
