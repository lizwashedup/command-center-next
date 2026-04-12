'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/layout/PageHeader'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

interface GrowthCard {
  id: string
  title: string
  category: string
  status: string
  last_action: string
  next_step: string
  due_date: string
  created_at: string
}

type BadgeVariant = 'high' | 'med' | 'active' | 'pending' | 'done' | 'idea' | 'default'

const COLUMNS: { key: string; label: string }[] = [
  { key: 'Backlog', label: 'Backlog' },
  { key: 'In Progress', label: 'In Progress' },
  { key: 'Waiting', label: 'Waiting' },
  { key: 'Done', label: 'Done' },
]

const CATEGORIES = ['SEO', 'Social', 'Partnerships', 'PR', 'Content', 'Other']

const categoryBadge: Record<string, BadgeVariant> = {
  SEO: 'active',
  Social: 'pending',
  Partnerships: 'med',
  PR: 'high',
  Content: 'idea',
  Other: 'default',
}

const columnAccent: Record<string, string> = {
  Backlog: 'var(--parchment-muted)',
  'In Progress': 'var(--terracotta)',
  Waiting: 'var(--amber)',
  Done: 'var(--success)',
}

const inputStyle = {
  background: 'var(--bg-input)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  padding: '8px 12px',
  fontSize: '13px',
  width: '100%',
  color: 'var(--parchment)',
  outline: 'none',
  fontFamily: 'DM Sans, sans-serif',
  boxSizing: 'border-box' as const,
}

function formatDate(iso: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' })
}

export default function GrowthPage() {
  const [cards, setCards] = useState<GrowthCard[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editCard, setEditCard] = useState<Partial<GrowthCard>>({})
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const [newCard, setNewCard] = useState({ title: '', category: 'SEO' })
  const supabase = createClient()

  useEffect(() => {
    fetchCards()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchCards() {
    setLoading(true)
    const { data } = await supabase.from('growth_cards').select('*').order('created_at', { ascending: true })
    setCards(data || [])
    setLoading(false)
  }

  async function createCard(status: string) {
    if (!newCard.title.trim()) return
    const { data } = await supabase.from('growth_cards').insert({
      title: newCard.title.trim(),
      category: newCard.category,
      status,
      last_action: '',
      next_step: '',
    }).select().single()
    if (data) {
      setCards(prev => [...prev, data])
      setNewCard({ title: '', category: 'SEO' })
      setAddingTo(null)
    }
  }

  function openCard(card: GrowthCard) {
    if (expandedId === card.id) {
      setExpandedId(null)
      setEditCard({})
    } else {
      setExpandedId(card.id)
      setEditCard({ ...card })
    }
  }

  async function saveCard() {
    if (!editCard.id) return
    await supabase.from('growth_cards').update({
      title: editCard.title,
      category: editCard.category,
      last_action: editCard.last_action,
      next_step: editCard.next_step,
      due_date: editCard.due_date,
    }).eq('id', editCard.id)
    setCards(prev => prev.map(c => c.id === editCard.id ? { ...c, ...editCard } as GrowthCard : c))
    setExpandedId(null)
  }

  async function deleteCard(id: string) {
    await supabase.from('growth_cards').delete().eq('id', id)
    setCards(prev => prev.filter(c => c.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  async function moveCard(id: string, newStatus: string) {
    await supabase.from('growth_cards').update({ status: newStatus }).eq('id', id)
    setCards(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c))
  }

  return (
    <div className="page-wrapper">
      <PageHeader title="Growth Pipeline" subtitle="Track and drive every growth initiative" badge="Kanban" badgeColor="terracotta" />

      {loading ? (
        <p style={{ color: 'var(--parchment-dim)' }}>Loading...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', alignItems: 'start' }}>
          {COLUMNS.map(col => {
            const colCards = cards.filter(c => c.status === col.key)
            return (
              <div key={col.key}>
                {/* Column header */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: '14px', padding: '0 4px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: columnAccent[col.key] }} />
                    <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '16px', fontWeight: 700, color: 'var(--parchment)' }}>
                      {col.label}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--parchment-muted)', background: 'var(--bg-elevated)', borderRadius: '10px', padding: '1px 7px' }}>
                      {colCards.length}
                    </span>
                  </div>
                  <button
                    onClick={() => setAddingTo(col.key)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--terracotta)', fontSize: '18px', lineHeight: 1, padding: '0 2px' }}
                    title="Add card"
                  >+</button>
                </div>

                {/* Add card inline form */}
                {addingTo === col.key && (
                  <div style={{
                    background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px',
                    padding: '14px', marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '8px',
                  }}>
                    <input
                      autoFocus
                      value={newCard.title}
                      onChange={e => setNewCard(n => ({ ...n, title: e.target.value }))}
                      placeholder="Card title..."
                      style={inputStyle}
                      onKeyDown={e => { if (e.key === 'Enter') createCard(col.key); if (e.key === 'Escape') setAddingTo(null) }}
                    />
                    <select
                      value={newCard.category}
                      onChange={e => setNewCard(n => ({ ...n, category: e.target.value }))}
                      style={inputStyle}
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <Button variant="small" onClick={() => createCard(col.key)}>Add</Button>
                      <Button variant="ghost" style={{ padding: '5px 12px', fontSize: '11px' }} onClick={() => setAddingTo(null)}>Cancel</Button>
                    </div>
                  </div>
                )}

                {/* Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {colCards.map(card => (
                    <div key={card.id} style={{
                      background: 'var(--bg-surface)',
                      border: `1px solid ${expandedId === card.id ? 'var(--terracotta)' : 'var(--border)'}`,
                      borderRadius: '12px',
                      padding: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}>
                      <div onClick={() => openCard(card)}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--parchment)', lineHeight: 1.4, flex: 1 }}>
                            {card.title}
                          </span>
                          <button
                            onClick={e => { e.stopPropagation(); deleteCard(card.id) }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--parchment-muted)', fontSize: '14px', lineHeight: 1, padding: 0, flexShrink: 0 }}
                          >×</button>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <Badge variant={categoryBadge[card.category] || 'default'}>{card.category}</Badge>
                          {card.due_date && (
                            <span style={{ fontSize: '10px', color: 'var(--parchment-muted)' }}>Due {formatDate(card.due_date)}</span>
                          )}
                        </div>
                        {card.next_step && (
                          <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--parchment-dim)', lineHeight: 1.4 }}>
                            → {card.next_step}
                          </div>
                        )}
                      </div>

                      {/* Expanded editor */}
                      {expandedId === card.id && (
                        <div
                          onClick={e => e.stopPropagation()}
                          style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}
                        >
                          <div style={{ height: '1px', background: 'var(--border)', margin: '0 0 4px' }} />
                          <input
                            value={editCard.title || ''}
                            onChange={e => setEditCard(ec => ({ ...ec, title: e.target.value }))}
                            placeholder="Title"
                            style={inputStyle}
                          />
                          <select
                            value={editCard.category || 'SEO'}
                            onChange={e => setEditCard(ec => ({ ...ec, category: e.target.value }))}
                            style={inputStyle}
                          >
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <textarea
                            value={editCard.last_action || ''}
                            onChange={e => setEditCard(ec => ({ ...ec, last_action: e.target.value }))}
                            placeholder="Last action taken..."
                            rows={2}
                            style={{ ...inputStyle, resize: 'none' }}
                          />
                          <textarea
                            value={editCard.next_step || ''}
                            onChange={e => setEditCard(ec => ({ ...ec, next_step: e.target.value }))}
                            placeholder="Next step..."
                            rows={2}
                            style={{ ...inputStyle, resize: 'none' }}
                          />
                          <input
                            type="date"
                            value={editCard.due_date?.slice(0, 10) || ''}
                            onChange={e => setEditCard(ec => ({ ...ec, due_date: e.target.value }))}
                            style={inputStyle}
                          />
                          {/* Move to column */}
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {COLUMNS.filter(c => c.key !== card.status).map(c => (
                              <button
                                key={c.key}
                                onClick={() => moveCard(card.id, c.key)}
                                style={{
                                  fontSize: '10px', padding: '3px 8px', borderRadius: '6px',
                                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                                  color: 'var(--parchment-dim)', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                                }}
                              >→ {c.label}</button>
                            ))}
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <Button variant="small" onClick={saveCard}>Save</Button>
                            <Button variant="ghost" style={{ padding: '5px 12px', fontSize: '11px' }} onClick={() => setExpandedId(null)}>Cancel</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {colCards.length === 0 && !addingTo && (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--parchment-muted)', fontSize: '12px', border: '1px dashed var(--border)', borderRadius: '12px' }}>
                      No cards
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
