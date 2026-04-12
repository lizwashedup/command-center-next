'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/layout/PageHeader'
import StatCard from '@/components/ui/StatCard'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

interface Investor {
  id: string
  name: string
  fund: string
  stage: string
  check_size: string
  thesis_fit: string
  last_contact: string
  notes: string
  created_at: string
}

type BadgeVariant = 'high' | 'med' | 'active' | 'pending' | 'done' | 'idea' | 'default'

const STAGES = ['Intro', 'Meeting scheduled', 'Met', 'Follow-up sent', 'In diligence', 'Term sheet', 'Closed', 'Passed']

const stageBadge: Record<string, BadgeVariant> = {
  Intro: 'default',
  'Meeting scheduled': 'pending',
  Met: 'med',
  'Follow-up sent': 'med',
  'In diligence': 'active',
  'Term sheet': 'active',
  Closed: 'active',
  Passed: 'done',
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

function formatDate(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Los_Angeles' })
}

const emptyForm = {
  name: '', fund: '', stage: 'Intro', check_size: '', thesis_fit: '', last_contact: '', notes: '',
}

export default function InvestorsPage() {
  const [investors, setInvestors] = useState<Investor[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editNotes, setEditNotes] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchInvestors()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchInvestors() {
    setLoading(true)
    const { data } = await supabase.from('investors').select('*').order('created_at', { ascending: false })
    setInvestors(data || [])
    setLoading(false)
  }

  async function addInvestor() {
    if (!form.name.trim()) return
    setSaving(true)
    const { data } = await supabase.from('investors').insert({ ...form }).select().single()
    if (data) setInvestors(prev => [data, ...prev])
    setShowModal(false)
    setForm({ ...emptyForm })
    setSaving(false)
  }

  async function deleteInvestor(id: string) {
    if (!confirm('Remove this investor from the CRM?')) return
    await supabase.from('investors').delete().eq('id', id)
    setInvestors(prev => prev.filter(i => i.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  async function saveNotes(id: string) {
    await supabase.from('investors').update({ notes: editNotes }).eq('id', id)
    setInvestors(prev => prev.map(i => i.id === id ? { ...i, notes: editNotes } : i))
    setExpandedId(null)
  }

  async function updateStage(id: string, stage: string) {
    await supabase.from('investors').update({ stage }).eq('id', id)
    setInvestors(prev => prev.map(i => i.id === id ? { ...i, stage } : i))
  }

  function toggleExpand(inv: Investor) {
    if (expandedId === inv.id) {
      setExpandedId(null)
    } else {
      setExpandedId(inv.id)
      setEditNotes(inv.notes || '')
    }
  }

  const total = investors.length
  const meetings = investors.filter(i => ['Met', 'Follow-up sent', 'In diligence', 'Term sheet', 'Closed'].includes(i.stage)).length
  const passed = investors.filter(i => i.stage === 'Passed').length
  const active = investors.filter(i => ['In diligence', 'Term sheet'].includes(i.stage)).length

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Investor CRM"
        subtitle="Track every relationship in your raise"
        badge="Fundraising"
        badgeColor="terracotta"
        action={<Button variant="primary" onClick={() => setShowModal(true)}>+ Add Investor</Button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
        <StatCard label="In Pipeline" value={total} />
        <StatCard label="Meetings Had" value={meetings} />
        <StatCard label="Active Diligence" value={active} />
        <StatCard label="Passed" value={passed} />
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div style={{
            background: 'var(--bg-surface)', borderRadius: '18px', padding: '32px', width: '520px',
            maxHeight: '85vh', overflowY: 'auto',
          }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '24px', fontWeight: 700, marginBottom: '20px', color: 'var(--parchment)' }}>
              Add Investor
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Name *', key: 'name', placeholder: 'Investor name' },
                { label: 'Fund', key: 'fund', placeholder: 'Fund or firm name' },
                { label: 'Check Size', key: 'check_size', placeholder: '$250K – $500K' },
                { label: 'Thesis Fit', key: 'thesis_fit', placeholder: 'Why they are a fit...' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--parchment-dim)', display: 'block', marginBottom: '4px' }}>
                    {f.label}
                  </label>
                  <input
                    value={(form as any)[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    style={smallInput}
                  />
                </div>
              ))}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--parchment-dim)', display: 'block', marginBottom: '4px' }}>
                  Stage
                </label>
                <select
                  value={form.stage}
                  onChange={e => setForm(prev => ({ ...prev, stage: e.target.value }))}
                  style={smallInput}
                >
                  {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--parchment-dim)', display: 'block', marginBottom: '4px' }}>
                  Last Contact
                </label>
                <input
                  type="date"
                  value={form.last_contact}
                  onChange={e => setForm(prev => ({ ...prev, last_contact: e.target.value }))}
                  style={smallInput}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--parchment-dim)', display: 'block', marginBottom: '4px' }}>
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notes..."
                  rows={3}
                  style={{ ...smallInput, resize: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <Button variant="primary" onClick={addInvestor} disabled={saving || !form.name.trim()}>
                  {saving ? 'Saving…' : 'Add Investor'}
                </Button>
                <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <p style={{ color: 'var(--parchment-dim)' }}>Loading...</p>
      ) : investors.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--parchment-muted)' }}>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px' }}>No investors yet</p>
          <p style={{ fontSize: '14px', marginTop: '8px' }}>Add your first investor to start tracking your raise.</p>
        </div>
      ) : (
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          overflow: 'hidden',
        }}>
          {/* Header row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 1.2fr 130px 120px 150px 120px 80px',
            padding: '10px 20px',
            background: 'var(--bg-elevated)',
            borderBottom: '1px solid var(--border)',
          }}>
            {['Name', 'Fund', 'Stage', 'Check Size', 'Thesis Fit', 'Last Contact', ''].map(h => (
              <div key={h} style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--parchment-muted)' }}>
                {h}
              </div>
            ))}
          </div>

          {investors.map((inv, idx) => (
            <div key={inv.id}>
              <div
                onClick={() => toggleExpand(inv)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.5fr 1.2fr 130px 120px 150px 120px 80px',
                  padding: '14px 20px',
                  borderBottom: idx < investors.length - 1 ? '1px solid var(--border)' : 'none',
                  cursor: 'pointer',
                  background: expandedId === inv.id ? 'rgba(217,119,70,0.04)' : 'transparent',
                  transition: 'background 0.15s',
                  alignItems: 'center',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--parchment)' }}>{inv.name}</div>
                <div style={{ fontSize: '13px', color: 'var(--parchment-dim)' }}>{inv.fund || '—'}</div>
                <div>
                  <Badge variant={stageBadge[inv.stage] || 'default'}>{inv.stage}</Badge>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--parchment-dim)' }}>{inv.check_size || '—'}</div>
                <div style={{ fontSize: '12px', color: 'var(--parchment-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {inv.thesis_fit || '—'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--parchment-dim)' }}>{formatDate(inv.last_contact)}</div>
                <div style={{ display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => deleteInvestor(inv.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--parchment-muted)', fontSize: '14px', padding: '2px 4px' }}
                    title="Delete"
                  >×</button>
                </div>
              </div>

              {/* Expanded row */}
              {expandedId === inv.id && (
                <div style={{
                  padding: '20px 24px 24px',
                  background: 'var(--bg-elevated)',
                  borderBottom: idx < investors.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '24px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--parchment-dim)', display: 'block', marginBottom: '6px' }}>
                        Stage
                      </label>
                      <select
                        value={inv.stage}
                        onChange={e => updateStage(inv.id, e.target.value)}
                        style={smallInput}
                      >
                        {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--parchment-dim)', display: 'block', marginBottom: '6px' }}>
                        Notes
                      </label>
                      <textarea
                        value={editNotes}
                        onChange={e => setEditNotes(e.target.value)}
                        rows={3}
                        placeholder="Meeting notes, context, follow-ups..."
                        style={{ ...smallInput, resize: 'none', background: 'var(--bg-surface)' }}
                      />
                      <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                        <Button variant="small" onClick={() => saveNotes(inv.id)}>Save Notes</Button>
                        <Button variant="ghost" style={{ padding: '5px 12px', fontSize: '11px' }} onClick={() => setExpandedId(null)}>Close</Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
