'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/layout/PageHeader'
import Button from '@/components/ui/Button'

interface ContentCard {
  id: string
  title: string
  card_type: string
  card_column: string
  notes: string
  due_date: string
  created_at: string
}

const CARD_TYPES = [
  { key: 'Substack', label: 'Substack', color: 'var(--terracotta)', bg: 'rgba(217,119,70,0.12)' },
  { key: 'Social', label: 'Social (Instagram / TikTok)', color: '#7C3AED', bg: 'rgba(103,58,183,0.1)' },
  { key: 'Venue Outreach', label: 'Venue Outreach', color: 'var(--amber)', bg: 'rgba(232,154,32,0.12)' },
]

const CARD_COLUMNS = ['Ideas', 'In Progress', 'Published']

const columnAccent: Record<string, string> = {
  Ideas: 'var(--parchment-muted)',
  'In Progress': 'var(--terracotta)',
  Published: 'var(--success)',
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

export default function ContentPage() {
  const [cards, setCards] = useState<ContentCard[]>([])
  const [loading, setLoading] = useState(true)
  const [addingTo, setAddingTo] = useState<{ type: string; col: string } | null>(null)
  const [newCard, setNewCard] = useState({ title: '', notes: '', due_date: '' })
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editCard, setEditCard] = useState<Partial<ContentCard>>({})
  const supabase = createClient()

  useEffect(() => {
    fetchCards()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchCards() {
    setLoading(true)
    const { data } = await supabase.from('content_cards').select('*').order('created_at', { ascending: true })
    setCards(data || [])
    setLoading(false)
  }

  async function createCard(cardType: string, cardColumn: string) {
    if (!newCard.title.trim()) return
    const { data } = await supabase.from('content_cards').insert({
      title: newCard.title.trim(),
      card_type: cardType,
      card_column: cardColumn,
      notes: newCard.notes,
      due_date: newCard.due_date || null,
    }).select().single()
    if (data) setCards(prev => [...prev, data])
    setNewCard({ title: '', notes: '', due_date: '' })
    setAddingTo(null)
  }

  async function deleteCard(id: string) {
    await supabase.from('content_cards').delete().eq('id', id)
    setCards(prev => prev.filter(c => c.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  async function moveCard(id: string, newCol: string) {
    await supabase.from('content_cards').update({ card_column: newCol }).eq('id', id)
    setCards(prev => prev.map(c => c.id === id ? { ...c, card_column: newCol } : c))
  }

  async function saveCard() {
    if (!editCard.id) return
    await supabase.from('content_cards').update({
      title: editCard.title,
      notes: editCard.notes,
      due_date: editCard.due_date || null,
    }).eq('id', editCard.id)
    setCards(prev => prev.map(c => c.id === editCard.id ? { ...c, ...editCard } as ContentCard : c))
    setExpandedId(null)
  }

  function toggleExpand(card: ContentCard) {
    if (expandedId === card.id) {
      setExpandedId(null)
      setEditCard({})
    } else {
      setExpandedId(card.id)
      setEditCard({ ...card })
    }
  }

  return (
    <div className="page-wrapper">
      <PageHeader title="Content Queue" subtitle="Plan and track every piece of content" badge="Content" badgeColor="terracotta" />

      {loading ? (
        <p style={{ color: 'var(--parchment-dim)' }}>Loading...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          {CARD_TYPES.map(type => {
            const typeCards = cards.filter(c => c.card_type === type.key)
            return (
              <div key={type.key}>
                {/* Type header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <div style={{
                    width: '10px', height: '10px', borderRadius: '50%', background: type.color, flexShrink: 0,
                  }} />
                  <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', fontWeight: 700, color: 'var(--parchment)' }}>
                    {type.label}
                  </h2>
                  <span style={{
                    fontSize: '10px', padding: '2px 8px', borderRadius: '10px',
                    background: type.bg, color: type.color, fontWeight: 600,
                  }}>{typeCards.length}</span>
                </div>

                {/* Columns */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  {CARD_COLUMNS.map(col => {
                    const colCards = typeCards.filter(c => c.card_column === col)
                    const isAdding = addingTo?.type === type.key && addingTo?.col === col
                    return (
                      <div key={col}>
                        {/* Column header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', padding: '0 4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: columnAccent[col] }} />
                            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--parchment-dim)' }}>
                              {col}
                            </span>
                            <span style={{ fontSize: '10px', color: 'var(--parchment-muted)', background: 'var(--bg-elevated)', borderRadius: '8px', padding: '1px 6px' }}>
                              {colCards.length}
                            </span>
                          </div>
                          <button
                            onClick={() => setAddingTo({ type: type.key, col })}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: type.color, fontSize: '16px', lineHeight: 1, padding: '0 2px' }}
                          >+</button>
                        </div>

                        {/* Add form */}
                        {isAdding && (
                          <div style={{
                            background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px',
                            padding: '12px', marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '8px',
                          }}>
                            <input
                              autoFocus
                              value={newCard.title}
                              onChange={e => setNewCard(n => ({ ...n, title: e.target.value }))}
                              placeholder="Card title..."
                              style={inputStyle}
                              onKeyDown={e => { if (e.key === 'Enter') createCard(type.key, col); if (e.key === 'Escape') setAddingTo(null) }}
                            />
                            <input
                              value={newCard.notes}
                              onChange={e => setNewCard(n => ({ ...n, notes: e.target.value }))}
                              placeholder="Notes (optional)"
                              style={inputStyle}
                            />
                            <input
                              type="date"
                              value={newCard.due_date}
                              onChange={e => setNewCard(n => ({ ...n, due_date: e.target.value }))}
                              style={inputStyle}
                            />
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <Button variant="small" onClick={() => createCard(type.key, col)}>Add</Button>
                              <Button variant="ghost" style={{ padding: '5px 10px', fontSize: '11px' }} onClick={() => setAddingTo(null)}>Cancel</Button>
                            </div>
                          </div>
                        )}

                        {/* Cards */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {colCards.map(card => (
                            <div key={card.id} style={{
                              background: 'var(--bg-surface)',
                              border: `1px solid ${expandedId === card.id ? type.color : 'var(--border)'}`,
                              borderRadius: '12px',
                              padding: '12px 14px',
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                            }}>
                              <div onClick={() => toggleExpand(card)}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px' }}>
                                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--parchment)', flex: 1, lineHeight: 1.4 }}>
                                    {card.title}
                                  </span>
                                  <button
                                    onClick={e => { e.stopPropagation(); deleteCard(card.id) }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--parchment-muted)', fontSize: '14px', padding: 0, flexShrink: 0 }}
                                  >×</button>
                                </div>
                                {card.notes && (
                                  <div style={{ fontSize: '11px', color: 'var(--parchment-dim)', marginTop: '6px', lineHeight: 1.4 }}>
                                    {card.notes}
                                  </div>
                                )}
                                {card.due_date && (
                                  <div style={{ fontSize: '10px', color: 'var(--parchment-muted)', marginTop: '6px' }}>
                                    Due {formatDate(card.due_date)}
                                  </div>
                                )}
                              </div>

                              {/* Expanded editor */}
                              {expandedId === card.id && (
                                <div onClick={e => e.stopPropagation()} style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  <div style={{ height: '1px', background: 'var(--border)', margin: '0 0 4px' }} />
                                  <input
                                    value={editCard.title || ''}
                                    onChange={e => setEditCard(ec => ({ ...ec, title: e.target.value }))}
                                    placeholder="Title"
                                    style={inputStyle}
                                  />
                                  <textarea
                                    value={editCard.notes || ''}
                                    onChange={e => setEditCard(ec => ({ ...ec, notes: e.target.value }))}
                                    placeholder="Notes..."
                                    rows={2}
                                    style={{ ...inputStyle, resize: 'none' }}
                                  />
                                  <input
                                    type="date"
                                    value={editCard.due_date?.slice(0, 10) || ''}
                                    onChange={e => setEditCard(ec => ({ ...ec, due_date: e.target.value }))}
                                    style={inputStyle}
                                  />
                                  {/* Move column */}
                                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                    {CARD_COLUMNS.filter(c => c !== card.card_column).map(c => (
                                      <button
                                        key={c}
                                        onClick={() => moveCard(card.id, c)}
                                        style={{
                                          fontSize: '10px', padding: '3px 8px', borderRadius: '6px',
                                          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                                          color: 'var(--parchment-dim)', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                                        }}
                                      >→ {c}</button>
                                    ))}
                                  </div>
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <Button variant="small" onClick={saveCard}>Save</Button>
                                    <Button variant="ghost" style={{ padding: '5px 10px', fontSize: '11px' }} onClick={() => setExpandedId(null)}>Cancel</Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}

                          {colCards.length === 0 && !isAdding && (
                            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--parchment-muted)', fontSize: '11px', border: '1px dashed var(--border)', borderRadius: '10px' }}>
                              Empty
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
