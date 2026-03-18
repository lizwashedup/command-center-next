'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/layout/PageHeader'
import StatCard from '@/components/ui/StatCard'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

interface Expense {
  id: string
  name: string
  category: string
  amount: number
  month: string
  created_at: string
}

const EXPENSE_CATEGORIES = ['infrastructure', 'tools', 'marketing', 'legal', 'other']

const categoryColors: Record<string, string> = {
  infrastructure: '#7C3AED',
  tools: 'var(--terracotta)',
  marketing: 'var(--amber)',
  legal: 'var(--parchment-dim)',
  other: 'var(--parchment-muted)',
}

const categoryBg: Record<string, string> = {
  infrastructure: 'rgba(103,58,183,0.1)',
  tools: 'rgba(217,119,70,0.12)',
  marketing: 'rgba(232,154,32,0.12)',
  legal: 'var(--bg-elevated)',
  other: 'var(--bg-elevated)',
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
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n)
}

function getCurrentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function getPrevMonth(month: string) {
  const [y, m] = month.split('-').map(Number)
  if (m === 1) return `${y - 1}-12`
  return `${y}-${String(m - 1).padStart(2, '0')}`
}

function formatMonthLabel(month: string) {
  const [y, m] = month.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

const emptyForm = { name: '', category: 'tools', amount: '' }

export default function FinancePage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchExpenses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchExpenses() {
    setLoading(true)
    const { data } = await supabase.from('expenses').select('*').order('created_at', { ascending: false })
    setExpenses(data || [])
    setLoading(false)
  }

  async function addExpense() {
    if (!form.name.trim() || !form.amount) return
    setSaving(true)
    const { data } = await supabase.from('expenses').insert({
      name: form.name.trim(),
      category: form.category,
      amount: parseFloat(String(form.amount)),
      month: selectedMonth,
    }).select().single()
    if (data) setExpenses(prev => [data, ...prev])
    setForm({ ...emptyForm })
    setShowForm(false)
    setSaving(false)
  }

  async function deleteExpense(id: string) {
    await supabase.from('expenses').delete().eq('id', id)
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  const monthExpenses = expenses.filter(e => e.month === selectedMonth)
  const prevMonth = getPrevMonth(selectedMonth)
  const prevExpenses = expenses.filter(e => e.month === prevMonth)
  const thisTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0)
  const prevTotal = prevExpenses.reduce((sum, e) => sum + e.amount, 0)

  // Category breakdown
  const categoryTotals = EXPENSE_CATEGORIES.map(cat => ({
    cat,
    total: monthExpenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0),
  })).filter(x => x.total > 0).sort((a, b) => b.total - a.total)

  const trendUp = thisTotal > prevTotal
  const trendDiff = Math.abs(thisTotal - prevTotal)

  // Month selector: last 12 months
  const months: string[] = []
  for (let i = 0; i < 12; i++) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Finance"
        subtitle="Track burn and expenses"
        badge="Financials"
        badgeColor="amber"
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              style={{ ...smallInput, width: 'auto', minWidth: '180px' }}
            >
              {months.map(m => (
                <option key={m} value={m}>{formatMonthLabel(m)}</option>
              ))}
            </select>
            <Button variant="primary" onClick={() => setShowForm(true)}>+ Add Expense</Button>
          </div>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '32px' }}>
        <StatCard
          label={`${formatMonthLabel(selectedMonth)} Burn`}
          value={formatMoney(thisTotal)}
          trend={trendDiff > 0 ? `${formatMoney(trendDiff)} vs last month` : undefined}
          trendUp={!trendUp}
        />
        <StatCard label="Last Month" value={formatMoney(prevTotal)} />
        <StatCard label="Expense Count" value={monthExpenses.length} />
      </div>

      {/* Add expense form inline */}
      {showForm && (
        <Card style={{ marginBottom: '24px' }} title="Add Expense">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px 120px auto', gap: '12px', alignItems: 'end' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--parchment-dim)', display: 'block', marginBottom: '4px' }}>Name</label>
              <input
                autoFocus
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Expense name"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--parchment-dim)', display: 'block', marginBottom: '4px' }}>Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inputStyle}>
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--parchment-dim)', display: 'block', marginBottom: '4px' }}>Amount ($)</label>
              <input
                type="number"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="0"
                min="0"
                step="0.01"
                style={inputStyle}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="primary" onClick={addExpense} disabled={saving || !form.name.trim() || !form.amount}>
                {saving ? 'Saving…' : 'Add'}
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '24px' }}>
        {/* Expense list */}
        <Card title={`${formatMonthLabel(selectedMonth)} Expenses`}>
          {loading ? (
            <p style={{ color: 'var(--parchment-dim)', fontSize: '14px' }}>Loading...</p>
          ) : monthExpenses.length === 0 ? (
            <p style={{ color: 'var(--parchment-muted)', fontSize: '14px', textAlign: 'center', padding: '24px 0' }}>
              No expenses for {formatMonthLabel(selectedMonth)}
            </p>
          ) : (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 100px 40px', gap: '8px', padding: '8px 12px', borderBottom: '1px solid var(--border)', marginBottom: '8px' }}>
                {['Name', 'Category', 'Amount', ''].map(h => (
                  <div key={h} style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--parchment-muted)' }}>{h}</div>
                ))}
              </div>
              {monthExpenses.map(exp => (
                <div key={exp.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 140px 100px 40px',
                  gap: '8px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  alignItems: 'center',
                  transition: 'background 0.1s',
                }}>
                  <div style={{ fontSize: '14px', color: 'var(--parchment)', fontWeight: 500 }}>{exp.name}</div>
                  <div>
                    <span style={{
                      fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
                      padding: '3px 8px', borderRadius: '20px',
                      background: categoryBg[exp.category] || 'var(--bg-elevated)',
                      color: categoryColors[exp.category] || 'var(--parchment-dim)',
                    }}>{exp.category}</span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--parchment)' }}>
                    {formatMoney(exp.amount)}
                  </div>
                  <button
                    onClick={() => deleteExpense(exp.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--parchment-muted)', fontSize: '16px', padding: 0, lineHeight: 1 }}
                  >×</button>
                </div>
              ))}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 140px 100px 40px', gap: '8px',
                padding: '12px 12px 0', borderTop: '1px solid var(--border)', marginTop: '8px',
              }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--parchment)', gridColumn: '1 / 3' }}>Total Burn</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--terracotta)' }}>{formatMoney(thisTotal)}</div>
              </div>
            </div>
          )}
        </Card>

        {/* Category breakdown */}
        <Card title="Category Breakdown">
          {categoryTotals.length === 0 ? (
            <p style={{ color: 'var(--parchment-muted)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No data</p>
          ) : categoryTotals.map(({ cat, total }) => {
            const pct = thisTotal > 0 ? (total / thisTotal) * 100 : 0
            return (
              <div key={cat} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{
                    fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
                    padding: '3px 8px', borderRadius: '20px',
                    background: categoryBg[cat], color: categoryColors[cat],
                  }}>{cat}</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--parchment)' }}>{formatMoney(total)}</span>
                </div>
                <div style={{ background: 'var(--bg-elevated)', borderRadius: '4px', height: '6px' }}>
                  <div style={{
                    width: `${pct}%`, height: '100%', borderRadius: '4px',
                    background: categoryColors[cat] || 'var(--terracotta)',
                    transition: 'width 0.4s ease',
                  }} />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--parchment-muted)', textAlign: 'right', marginTop: '3px' }}>
                  {pct.toFixed(0)}%
                </div>
              </div>
            )
          })}
        </Card>
      </div>
    </div>
  )
}
