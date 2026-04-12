'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/layout/PageHeader'
import StatCard from '@/components/ui/StatCard'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

interface QuickCapture {
  id: string
  content: string
  category: string
  created_at: string
}

const CATEGORIES = ['note', 'idea', 'todo', 'risk', 'win']

const categoryColors: Record<string, string> = {
  note: 'var(--parchment-dim)',
  idea: '#7C3AED',
  todo: 'var(--terracotta)',
  risk: 'var(--error)',
  win: 'var(--success)',
}

const categoryBg: Record<string, string> = {
  note: 'var(--bg-elevated)',
  idea: 'rgba(103,58,183,0.1)',
  todo: 'rgba(217,119,70,0.12)',
  risk: 'rgba(198,40,40,0.1)',
  win: 'rgba(46,125,50,0.1)',
}

function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Los_Angeles' })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' })
}

const MOTIVATIONAL = [
  "Every rep counts. Show up.",
  "The comeback is always louder than the setback.",
  "You're not done yet.",
  "Washed? Never. Just warming up.",
  "The arena rewards the ones who stay.",
  "Build the thing worth building.",
  "Grit is a competitive moat.",
]

export default function CommandCenterPage() {
  const [captures, setCaptures] = useState<QuickCapture[]>([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [category, setCategory] = useState('note')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const motivation = MOTIVATIONAL[today.getDate() % MOTIVATIONAL.length]

  useEffect(() => {
    fetchCaptures()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchCaptures() {
    setLoading(true)
    const { data } = await supabase
      .from('quick_captures')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    setCaptures(data || [])
    setLoading(false)
  }

  async function handleCapture(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    setSaving(true)
    await supabase.from('quick_captures').insert({ content: input.trim(), category })
    setInput('')
    await fetchCaptures()
    setSaving(false)
  }

  async function handleDelete(id: string) {
    await supabase.from('quick_captures').delete().eq('id', id)
    setCaptures(c => c.filter(x => x.id !== id))
  }

  const todayCaptures = captures.filter(c => c.created_at.slice(0, 10) === todayStr)
  const weekAgo = new Date(today)
  weekAgo.setDate(today.getDate() - 7)
  const weekCaptures = captures.filter(c => new Date(c.created_at) >= weekAgo)

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Command Center"
        subtitle={formatDate(today)}
        badge="Live"
        badgeColor="green"
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' }}>
        <StatCard label="Captures Today" value={todayCaptures.length} />
        <StatCard label="This Week" value={weekCaptures.length} />
        <StatCard label="Total Captures" value={captures.length} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Card title="Quick Capture">
            <form onSubmit={handleCapture} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="What's on your mind? Capture it now..."
                rows={3}
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  fontSize: '15px',
                  width: '100%',
                  color: 'var(--parchment)',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'DM Sans, sans-serif',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '8px 14px',
                    fontSize: '13px',
                    color: 'var(--parchment)',
                    outline: 'none',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
                <Button type="submit" variant="primary" disabled={saving || !input.trim()}>
                  {saving ? 'Saving…' : '+ Capture'}
                </Button>
                <span style={{ fontSize: '11px', color: 'var(--parchment-muted)', marginLeft: 'auto' }}>⌘↵ to save</span>
              </div>
            </form>
          </Card>

          <Card title="Recent Activity">
            {loading ? (
              <p style={{ color: 'var(--parchment-dim)', fontSize: '14px' }}>Loading...</p>
            ) : captures.length === 0 ? (
              <p style={{ color: 'var(--parchment-muted)', fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>
                No captures yet. Start capturing.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {captures.map(cap => (
                  <div key={cap.id} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px 14px',
                    background: 'var(--bg-elevated)',
                    borderRadius: '10px',
                  }}>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      padding: '3px 8px',
                      borderRadius: '20px',
                      background: categoryBg[cap.category] || 'var(--bg-elevated)',
                      color: categoryColors[cap.category] || 'var(--parchment-dim)',
                      whiteSpace: 'nowrap',
                      marginTop: '1px',
                      flexShrink: 0,
                    }}>{cap.category}</span>
                    <span style={{ flex: 1, fontSize: '14px', color: 'var(--parchment)', lineHeight: 1.5 }}>
                      {cap.content}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--parchment-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {formatTime(cap.created_at)}
                    </span>
                    <button
                      onClick={() => handleDelete(cap.id)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--parchment-muted)', fontSize: '16px', padding: '0 2px', lineHeight: 1, flexShrink: 0,
                      }}
                      title="Delete"
                    >×</button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card>
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--parchment-muted)', marginBottom: '12px' }}>
                Today's Focus
              </div>
              <div style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '56px',
                fontWeight: 700,
                color: 'var(--terracotta)',
                lineHeight: 1,
                marginBottom: '6px',
              }}>
                {today.toLocaleDateString('en-US', { day: 'numeric', timeZone: 'America/Los_Angeles' })}
              </div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', color: 'var(--parchment)', marginBottom: '4px' }}>
                {today.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'America/Los_Angeles' })}
              </div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--parchment-muted)', marginBottom: '24px' }}>
                {today.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'America/Los_Angeles' })}
              </div>
              <div style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '16px',
                fontStyle: 'italic',
                color: 'var(--parchment-dim)',
                lineHeight: 1.6,
                padding: '14px 16px',
                background: 'var(--bg-elevated)',
                borderRadius: '10px',
              }}>
                "{motivation}"
              </div>
            </div>
          </Card>

          {todayCaptures.length > 0 && (
            <Card title="Today's Breakdown">
              {CATEGORIES.map(cat => {
                const count = todayCaptures.filter(c => c.category === cat).length
                if (!count) return null
                return (
                  <div key={cat} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{
                      fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
                      padding: '3px 8px', borderRadius: '20px',
                      background: categoryBg[cat], color: categoryColors[cat],
                    }}>{cat}</span>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--parchment)' }}>{count}</span>
                  </div>
                )
              })}
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
