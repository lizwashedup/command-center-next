'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/layout/PageHeader'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

interface StrategyAnswer {
  id: string
  question: string
  answer: string
  week_of: string
  reflection: string
  created_at: string
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

function getWeekOf(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().slice(0, 10)
}

function formatWeekOf(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return `Week of ${d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/Los_Angeles' })}`
}

function isCurrentWeek(weekOf: string) {
  return weekOf === getWeekOf()
}

export default function StrategyPage() {
  const [entries, setEntries] = useState<StrategyAnswer[]>([])
  const [loading, setLoading] = useState(true)
  const [currentEntry, setCurrentEntry] = useState<StrategyAnswer | null>(null)
  const [editAnswer, setEditAnswer] = useState('')
  const [editReflection, setEditReflection] = useState('')
  const [saving, setSaving] = useState(false)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newQuestion, setNewQuestion] = useState('')
  const supabase = createClient()

  const currentWeek = getWeekOf()

  useEffect(() => {
    fetchEntries()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchEntries() {
    setLoading(true)
    const { data } = await supabase.from('strategy_answers').select('*').order('week_of', { ascending: false })
    const fetched = data || []
    setEntries(fetched)
    const thisWeek = fetched.find(e => e.week_of === currentWeek)
    if (thisWeek) {
      setCurrentEntry(thisWeek)
      setEditAnswer(thisWeek.answer || '')
      setEditReflection(thisWeek.reflection || '')
    }
    setLoading(false)
  }

  async function saveCurrentEntry() {
    if (!currentEntry) return
    setSaving(true)
    await supabase.from('strategy_answers').update({
      answer: editAnswer,
      reflection: editReflection,
    }).eq('id', currentEntry.id)
    setEntries(prev => prev.map(e => e.id === currentEntry.id ? { ...e, answer: editAnswer, reflection: editReflection } : e))
    setSaving(false)
  }

  async function addQuestion() {
    if (!newQuestion.trim()) return
    const { data } = await supabase.from('strategy_answers').insert({
      question: newQuestion.trim(),
      answer: '',
      week_of: currentWeek,
      reflection: '',
    }).select().single()
    if (data) {
      setEntries(prev => [data, ...prev])
      setCurrentEntry(data)
      setEditAnswer('')
      setEditReflection('')
    }
    setNewQuestion('')
    setShowNewForm(false)
  }

  async function deleteEntry(id: string) {
    if (!confirm('Delete this strategy entry?')) return
    await supabase.from('strategy_answers').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
    if (currentEntry?.id === id) {
      setCurrentEntry(null)
      setEditAnswer('')
      setEditReflection('')
    }
  }

  const history = entries.filter(e => !isCurrentWeek(e.week_of))

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Strategy Corner"
        subtitle="Weekly reflection and direction-setting"
        badge="Weekly"
        badgeColor="amber"
        action={<Button variant="primary" onClick={() => setShowNewForm(true)}>+ New Question</Button>}
      />

      {loading ? (
        <p style={{ color: 'var(--parchment-dim)' }}>Loading...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '28px', alignItems: 'start' }}>
          {/* Current week */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--parchment-muted)', marginBottom: '4px' }}>
                  {formatWeekOf(currentWeek)}
                </div>
                <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', fontWeight: 700, color: 'var(--parchment)' }}>
                  This Week's Question
                </h2>
              </div>
            </div>

            {/* New question form */}
            {showNewForm && (
              <Card>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--parchment-dim)' }}>
                    New Strategy Question
                  </label>
                  <textarea
                    autoFocus
                    value={newQuestion}
                    onChange={e => setNewQuestion(e.target.value)}
                    placeholder="What is the most important strategic question for this week?"
                    rows={2}
                    style={{ ...inputStyle, resize: 'none' }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button variant="primary" onClick={addQuestion} disabled={!newQuestion.trim()}>Set Question</Button>
                    <Button variant="ghost" onClick={() => setShowNewForm(false)}>Cancel</Button>
                  </div>
                </div>
              </Card>
            )}

            {currentEntry ? (
              <Card>
                {/* Question */}
                <div style={{
                  padding: '16px 20px',
                  background: 'var(--bg-elevated)',
                  borderRadius: '10px',
                  marginBottom: '20px',
                  borderLeft: '3px solid var(--terracotta)',
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--terracotta)', marginBottom: '6px' }}>
                    The Question
                  </div>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', fontWeight: 600, color: 'var(--parchment)', lineHeight: 1.4 }}>
                    {currentEntry.question}
                  </div>
                </div>

                {/* Answer */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '18px', fontWeight: 700, display: 'block', marginBottom: '10px', color: 'var(--parchment)' }}>
                    Your Answer
                  </label>
                  <textarea
                    value={editAnswer}
                    onChange={e => setEditAnswer(e.target.value)}
                    placeholder="Write your thinking here. Be honest. Be specific."
                    rows={8}
                    style={{
                      ...inputStyle,
                      resize: 'vertical',
                      lineHeight: 1.7,
                      fontSize: '15px',
                    }}
                  />
                </div>

                {/* Reflection */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '18px', fontWeight: 700, display: 'block', marginBottom: '10px', color: 'var(--parchment)' }}>
                    Reflection
                  </label>
                  <textarea
                    value={editReflection}
                    onChange={e => setEditReflection(e.target.value)}
                    placeholder="What does this reveal? What will you do differently?"
                    rows={4}
                    style={{
                      ...inputStyle,
                      resize: 'vertical',
                      lineHeight: 1.7,
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Button variant="primary" onClick={saveCurrentEntry} disabled={saving}>
                    {saving ? 'Saving…' : 'Save Answer'}
                  </Button>
                  {!saving && editAnswer && <span style={{ fontSize: '12px', color: 'var(--parchment-muted)' }}>Unsaved changes</span>}
                </div>
              </Card>
            ) : (
              <Card>
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '24px', color: 'var(--parchment-dim)', marginBottom: '12px' }}>
                    No question set for this week
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--parchment-muted)', marginBottom: '20px' }}>
                    Set a weekly strategy question to guide your thinking and decisions.
                  </p>
                  <Button variant="primary" onClick={() => setShowNewForm(true)}>+ Set This Week's Question</Button>
                </div>
              </Card>
            )}
          </div>

          {/* History */}
          <div>
            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: 'var(--parchment)' }}>
              8-Week History
            </h3>
            {history.length === 0 ? (
              <p style={{ color: 'var(--parchment-muted)', fontSize: '13px' }}>No previous entries yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {history.slice(0, 8).map(entry => (
                  <div key={entry.id} style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '16px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--parchment-muted)' }}>
                        {formatWeekOf(entry.week_of)}
                      </div>
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--parchment-muted)', fontSize: '14px', padding: 0, flexShrink: 0 }}
                      >×</button>
                    </div>
                    <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '15px', fontWeight: 600, color: 'var(--parchment)', marginBottom: '6px', lineHeight: 1.4 }}>
                      {entry.question}
                    </div>
                    {entry.answer && (
                      <div style={{ fontSize: '12px', color: 'var(--parchment-dim)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
                        {entry.answer}
                      </div>
                    )}
                    {!entry.answer && (
                      <div style={{ fontSize: '12px', color: 'var(--parchment-muted)', fontStyle: 'italic' }}>No answer recorded</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
