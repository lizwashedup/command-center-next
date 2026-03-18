'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginForm() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/'

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      router.push(next)
    } else {
      setError('Incorrect password.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        padding: '40px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 2px 20px rgba(217,119,70,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
          <div style={{
            width: '36px', height: '36px',
            background: 'var(--terracotta)',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: '16px',
            fontFamily: 'Cormorant Garamond, serif',
          }}>W</div>
          <div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, fontSize: '18px' }}>WashedUp HQ</div>
            <div style={{ fontSize: '11px', color: 'var(--parchment-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Command Center</div>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '26px', fontWeight: 700, marginBottom: '6px' }}>Welcome back</div>
          <p style={{ color: 'var(--parchment-dim)', fontSize: '13px' }}>Enter the password to access the command center.</p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--parchment-dim)', marginBottom: '8px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoFocus
              style={{
                width: '100%',
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '15px',
                color: 'var(--parchment)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div style={{ fontSize: '13px', color: 'var(--error)', marginBottom: '12px' }}>{error}</div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            style={{
              width: '100%',
              background: 'var(--terracotta)',
              color: 'white',
              border: 'none',
              borderRadius: '24px',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading || !password ? 0.6 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
