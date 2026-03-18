'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/layout/PageHeader'
import StatCard from '@/components/ui/StatCard'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

interface Tool {
  id: string
  name: string
  category: string
  cost: number
  billing: string
  url: string
  notes: string
  active: boolean
  created_at: string
}

const TOOL_CATEGORIES = ['dev', 'design', 'marketing', 'communication', 'finance', 'legal', 'other']
const BILLING_OPTIONS = ['monthly', 'annual', 'one-time']

const categoryColors: Record<string, { color: string; bg: string }> = {
  dev: { color: '#7C3AED', bg: 'rgba(103,58,183,0.1)' },
  design: { color: 'var(--terracotta)', bg: 'rgba(217,119,70,0.12)' },
  marketing: { color: 'var(--amber)', bg: 'rgba(232,154,32,0.12)' },
  communication: { color: 'var(--success)', bg: 'rgba(46,125,50,0.1)' },
  finance: { color: '#0288D1', bg: 'rgba(2,136,209,0.1)' },
  legal: { color: 'var(--parchment-dim)', bg: 'var(--bg-elevated)' },
  other: { color: 'var(--parchment-muted)', bg: 'var(--bg-elevated)' },
}

const inputStyle = {
  background: 'var(--bg-input)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  padding: '10px 14px',
  fontSize: '15px',
  width: '100%',
  color: 'var(--parchment)',
  outline: 'none',
  fontFamily: 'DM Sans, sans-serif',
  boxSizing: 'border-box' as const,
}

const smallInput = { ...inputStyle, padding: '8px 12px', fontSize: '13px' }

function formatMoney(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n)
}

function toMonthly(cost: number, billing: string): number {
  if (billing === 'monthly') return cost
  if (billing === 'annual') return cost / 12
  return 0 // one-time doesn't count toward monthly burn
}

const emptyForm = { name: '', category: 'dev', cost: '', billing: 'monthly', url: '', notes: '' }

export default function SystemsPage() {
  const [tools, setTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchTools()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchTools() {
    setLoading(true)
    const { data } = await supabase.from('tools').select('*').order('created_at', { ascending: false })
    setTools(data || [])
    setLoading(false)
  }

  async function addTool() {
    if (!form.name.trim()) return
    setSaving(true)
    const { data } = await supabase.from('tools').insert({
      name: form.name.trim(),
      category: form.category,
      cost: parseFloat(String(form.cost)) || 0,
      billing: form.billing,
      url: form.url.trim(),
      notes: form.notes.trim(),
      active: true,
    }).select().single()
    if (data) setTools(prev => [data, ...prev])
    setForm({ ...emptyForm })
    setShowForm(false)
    setSaving(false)
  }

  async function deleteTool(id: string) {
    if (!confirm('Remove this tool?')) return
    await supabase.from('tools').delete().eq('id', id)
    setTools(prev => prev.filter(t => t.id !== id))
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('tools').update({ active: !current }).eq('id', id)
    setTools(prev => prev.map(t => t.id === id ? { ...t, active: !current } : t))
  }

  const activeTools = tools.filter(t => t.active)
  const monthlyBurn = tools.reduce((sum, t) => sum + toMonthly(t.cost, t.billing), 0)
  const activeMonthlyBurn = activeTools.reduce((sum, t) => sum + toMonthly(t.cost, t.billing), 0)

  // Group by category
  const byCategory = TOOL_CATEGORIES
    .map(cat => ({ cat, items: tools.filter(t => t.category === cat) }))
    .filter(x => x.items.length > 0)

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Systems & Tools"
        subtitle="Every tool in the stack"
        badge="Tech Stack"
        badgeColor="terracotta"
        action={<Button variant="primary" onClick={() => setShowForm(true)}>+ Add Tool</Button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' }}>
        <StatCard label="Total Tools" value={tools.length} />
        <StatCard label="Active Tools" value={activeTools.length} />
        <StatCard label="Monthly Burn" value={formatMoney(activeMonthlyBurn)} />
      </div>

      {/* Add form */}
      {showForm && (
        <Card style={{ marginBottom: '24px' }} title="Add Tool">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 160px 120px', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--parchment-dim)', display: 'block', marginBottom: '4px' }}>Name *</label>
              <input
                autoFocus
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Tool name"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--parchment-dim)', display: 'block', marginBottom: '4px' }}>Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inputStyle}>
                {TOOL_CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--parchment-dim)', display: 'block', marginBottom: '4px' }}>Cost ($)</label>
              <input
                type="number"
                value={form.cost}
                onChange={e => setForm(f => ({ ...f, cost: e.target.value }))}
                placeholder="0"
                min="0"
                step="0.01"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--parchment-dim)', display: 'block', marginBottom: '4px' }}>Billing</label>
              <select value={form.billing} onChange={e => setForm(f => ({ ...f, billing: e.target.value }))} style={inputStyle}>
                {BILLING_OPTIONS.map(b => <option key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--parchment-dim)', display: 'block', marginBottom: '4px' }}>URL</label>
              <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://..." style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--parchment-dim)', display: 'block', marginBottom: '4px' }}>Notes</label>
              <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Brief note..." style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="primary" onClick={addTool} disabled={saving || !form.name.trim()}>
              {saving ? 'Saving…' : 'Add Tool'}
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {loading ? (
        <p style={{ color: 'var(--parchment-dim)' }}>Loading...</p>
      ) : tools.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--parchment-muted)' }}>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px' }}>No tools added yet</p>
          <p style={{ fontSize: '14px', marginTop: '8px' }}>Add your first tool to start tracking your stack.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {byCategory.map(({ cat, items }) => {
            const cc = categoryColors[cat] || categoryColors.other
            const catMonthly = items.reduce((sum, t) => sum + toMonthly(t.cost, t.billing), 0)
            return (
              <div key={cat}>
                {/* Category header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <span style={{
                    fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                    padding: '3px 10px', borderRadius: '20px',
                    background: cc.bg, color: cc.color,
                  }}>{cat}</span>
                  <span style={{ fontSize: '12px', color: 'var(--parchment-muted)' }}>{items.length} tools</span>
                  {catMonthly > 0 && (
                    <span style={{ fontSize: '12px', color: 'var(--parchment-dim)', marginLeft: 'auto' }}>
                      {formatMoney(catMonthly)}/mo
                    </span>
                  )}
                </div>

                {/* Tool rows */}
                <div style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '14px',
                  overflow: 'hidden',
                }}>
                  {items.map((tool, idx) => (
                    <div key={tool.id} style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 120px 100px 80px 60px 80px',
                      padding: '14px 20px',
                      borderBottom: idx < items.length - 1 ? '1px solid var(--border)' : 'none',
                      alignItems: 'center',
                      opacity: tool.active ? 1 : 0.5,
                      transition: 'opacity 0.2s',
                    }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--parchment)' }}>
                          {tool.url ? (
                            <a href={tool.url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                              {tool.name} ↗
                            </a>
                          ) : tool.name}
                        </div>
                        {tool.notes && (
                          <div style={{ fontSize: '11px', color: 'var(--parchment-muted)', marginTop: '2px' }}>{tool.notes}</div>
                        )}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--parchment-dim)' }}>
                        {tool.cost > 0 ? formatMoney(tool.cost) : 'Free'}
                      </div>
                      <div>
                        {tool.billing !== 'one-time' && tool.cost > 0 ? (
                          <span style={{ fontSize: '10px', background: 'var(--bg-elevated)', color: 'var(--parchment-dim)', padding: '3px 8px', borderRadius: '8px', fontWeight: 500 }}>
                            {tool.billing}
                          </span>
                        ) : (
                          <span style={{ fontSize: '10px', color: 'var(--parchment-muted)' }}>{tool.billing}</span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--parchment-muted)', fontWeight: 500 }}>
                        {tool.billing !== 'one-time' && tool.cost > 0 ? `${formatMoney(toMonthly(tool.cost, tool.billing))}/mo` : '—'}
                      </div>
                      {/* Active toggle */}
                      <div>
                        <button
                          onClick={() => toggleActive(tool.id, tool.active)}
                          style={{
                            width: '36px', height: '20px', borderRadius: '10px',
                            background: tool.active ? 'var(--success)' : 'var(--bg-elevated)',
                            border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                            flexShrink: 0,
                          }}
                          title={tool.active ? 'Active — click to deactivate' : 'Inactive — click to activate'}
                        >
                          <span style={{
                            position: 'absolute', top: '2px',
                            left: tool.active ? '18px' : '2px',
                            width: '16px', height: '16px', borderRadius: '50%',
                            background: 'white', transition: 'left 0.2s',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                          }} />
                        </button>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => deleteTool(tool.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--parchment-muted)', fontSize: '16px', padding: '2px 4px' }}
                        >×</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {/* Total summary */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '18px', fontWeight: 700, color: 'var(--parchment)' }}>Total Monthly Burn</div>
                <div style={{ fontSize: '12px', color: 'var(--parchment-muted)', marginTop: '2px' }}>Active tools only (annual ÷ 12)</div>
              </div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '36px', fontWeight: 700, color: 'var(--terracotta)' }}>
                {formatMoney(activeMonthlyBurn)}
              </div>
            </div>
            {monthlyBurn !== activeMonthlyBurn && (
              <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--parchment-muted)', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                All tools (including inactive): {formatMoney(monthlyBurn)}/mo
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
