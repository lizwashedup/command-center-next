'use client'

import { useState, useMemo, useEffect } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────
type Transaction = {
  id: number
  date: string
  description: string
  amount: number
  category: string
  source: 'Credit Card' | 'Personal Card' | 'Business Checking' | 'Checking'
  card: string | null
  notes: string
  tax_deductible?: boolean
  recurring?: boolean
  vendor_url?: string
}

// ── Brand constants ───────────────────────────────────────────────────────────
const C = {
  parchment:   '#F5F0E8',
  parchmentDk: '#EDE6D6',
  terracotta:  '#C4603B',
  amber:       '#D4A853',
  ink:         '#2C2416',
  inkMid:      '#6B5B45',
  inkLight:    '#9E8E78',
  surface:     '#FDFAF4',
  border:      '#E0D8C8',
  refundGreen: '#2D7A4F',
}

const CATEGORY_COLORS: Record<string, string> = {
  'AI Tools':       '#D4A853',
  'Dev Tools':      '#C4603B',
  'Legal':          '#6B5B45',
  'Marketing':      '#B8956A',
  'Productivity':   '#A09070',
  'Website':        '#C9A96E',
  'Infrastructure': '#8B7355',
  'Networking':     '#B8A080',
  'Design':         '#9E8A6E',
  'SaaS':           '#7A8E78',
  'Platform':       '#D0B89A',
  'Misc':           '#C8C0B0',
  'Events':         '#7B9E87',
  'Finance':        '#8E7B9E',
  'Equity':         '#D8D0C0',
}

const CATEGORIES = Object.keys(CATEGORY_COLORS).filter(c => c !== 'Equity')
const SOURCES = ['Credit Card', 'Personal Card', 'Business Checking', 'Checking'] as const

// ── Seed data (61 transactions, Oct 2025 – Mar 2026) ─────────────────────────
const SEED: Transaction[] = [
  // OCT 2025 — founder Google Sheets
  { id: 1,    date: '2025-10-26', description: 'Wordpress — First Website',                            amount: 76.00,   category: 'Website',        source: 'Personal Card',     card: null,   notes: 'Creating washedup landing page' },
  { id: 2,    date: '2025-10-26', description: 'Notion',                                               amount: 32.51,   category: 'Productivity',   source: 'Personal Card',     card: null,   notes: 'AI for org' },
  { id: 3,    date: '2025-10-26', description: 'Oct 2025 Misc Tools',                                  amount: 26.99,   category: 'Misc',           source: 'Personal Card',     card: null,   notes: 'Remaining Oct expenses (see original ledger)' },

  // NOV 2025 — founder Google Sheets
  { id: 4,    date: '2025-11-15', description: 'ExpressVPN',                                           amount: 12.95,   category: 'Infrastructure', source: 'Personal Card',     card: null,   notes: 'VPN for work from Lisbon' },
  { id: 5,    date: '2025-11-15', description: 'Website (Framer / Squarespace / Zeroqode)',            amount: 53.27,   category: 'Website',        source: 'Personal Card',     card: null,   notes: 'Framer early access site' },
  { id: 6,    date: '2025-11-15', description: 'Legal — Delaware INC Formation',                       amount: 279.00,  category: 'Legal',          source: 'Personal Card',     card: null,   notes: '' },
  { id: 7,    date: '2025-11-15', description: 'Eleven Labs — Voiceovers for Content',                 amount: 11.00,   category: 'AI Tools',       source: 'Personal Card',     card: null,   notes: '' },
  { id: 8,    date: '2025-11-15', description: 'Kit — Emails & Forms',                                amount: 39.00,   category: 'Marketing',      source: 'Personal Card',     card: null,   notes: '' },
  { id: 9,    date: '2025-11-15', description: 'LLMs (AI Subscriptions)',                              amount: 64.21,   category: 'AI Tools',       source: 'Personal Card',     card: null,   notes: '' },
  { id: 10,   date: '2025-11-15', description: 'Google GSuite',                                        amount: 37.62,   category: 'Productivity',   source: 'Personal Card',     card: null,   notes: '' },

  // DEC 2025 — founder Google Sheets
  { id: 11,   date: '2025-12-15', description: 'ExpressVPN',                                           amount: 12.95,   category: 'Infrastructure', source: 'Personal Card',     card: null,   notes: 'Express VPN' },
  { id: 12,   date: '2025-12-15', description: 'Website (Framer / Squarespace / Zeroqode)',            amount: 27.91,   category: 'Website',        source: 'Personal Card',     card: null,   notes: '' },
  { id: 13,   date: '2025-12-15', description: 'Eleven Labs — Voiceovers for Content',                 amount: 22.00,   category: 'AI Tools',       source: 'Personal Card',     card: null,   notes: '' },
  { id: 14,   date: '2025-12-15', description: 'LLMs (AI Subscriptions)',                              amount: 65.00,   category: 'AI Tools',       source: 'Personal Card',     card: null,   notes: '' },
  { id: 15,   date: '2025-12-15', description: 'Google GSuite',                                        amount: 108.00,  category: 'Productivity',   source: 'Personal Card',     card: null,   notes: '' },
  { id: 16,   date: '2025-12-15', description: 'Cloudflare Hosting',                                   amount: 42.60,   category: 'Infrastructure', source: 'Personal Card',     card: null,   notes: '' },
  { id: 17,   date: '2025-12-15', description: 'Fiverr — Logo / Branding',                             amount: 45.00,   category: 'Design',         source: 'Personal Card',     card: null,   notes: '' },

  // JAN 2026 — founder Google Sheets
  { id: 18,   date: '2026-01-15', description: 'Website (Framer / Squarespace / Zeroqode)',            amount: 28.24,   category: 'Website',        source: 'Personal Card',     card: null,   notes: '' },
  { id: 19,   date: '2026-01-15', description: 'Eleven Labs — Voiceovers for Content',                 amount: 22.00,   category: 'AI Tools',       source: 'Personal Card',     card: null,   notes: '' },
  { id: 20,   date: '2026-01-15', description: 'LLMs (AI Subscriptions)',                              amount: 100.61,  category: 'AI Tools',       source: 'Personal Card',     card: null,   notes: '' },
  { id: 21,   date: '2026-01-15', description: 'Google GSuite',                                        amount: 56.00,   category: 'Productivity',   source: 'Personal Card',     card: null,   notes: '' },
  { id: 22,   date: '2026-01-15', description: 'Xano — Original Backend',                              amount: 29.00,   category: 'Dev Tools',      source: 'Personal Card',     card: null,   notes: '' },
  { id: 23,   date: '2026-01-15', description: 'Lovable — Company Jan Switch',                         amount: 480.00,  category: 'Dev Tools',      source: 'Personal Card',     card: null,   notes: 'Switch to Lovable for app' },
  { id: 24,   date: '2026-01-15', description: 'Resend — Email Automation',                            amount: 20.00,   category: 'Infrastructure', source: 'Personal Card',     card: null,   notes: '' },
  { id: 24.1, date: '2026-01-31', description: 'Personal / Out-of-Pocket Expenses',                    amount: 215.00,  category: 'Marketing',      source: 'Personal Card',     card: null,   notes: 'Founder out-of-pocket — January' },

  // FEB 2026 — Google Sheets non-CC items
  { id: 25,   date: '2026-02-15', description: 'ExpressVPN',                                           amount: 12.95,   category: 'Infrastructure', source: 'Personal Card',     card: null,   notes: '' },
  { id: 26,   date: '2026-02-15', description: 'Xano — Backend',                                       amount: 29.00,   category: 'Dev Tools',      source: 'Personal Card',     card: null,   notes: '' },
  { id: 27,   date: '2026-02-15', description: 'Lovable — Dev Platform',                               amount: 480.00,  category: 'Dev Tools',      source: 'Personal Card',     card: null,   notes: 'Feb recurring' },
  { id: 29,   date: '2026-02-15', description: 'Google GSuite',                                        amount: 123.40,  category: 'Productivity',   source: 'Personal Card',     card: null,   notes: '' },
  { id: 30,   date: '2026-02-15', description: 'Flyers — Marketing Print',                             amount: 175.00,  category: 'Marketing',      source: 'Personal Card',     card: null,   notes: 'Out-of-pocket founder expense' },
  { id: 31,   date: '2026-02-15', description: 'Twilio',                                               amount: 50.00,   category: 'Infrastructure', source: 'Personal Card',     card: null,   notes: '' },
  { id: 32,   date: '2026-02-15', description: 'Legal — Delaware PBC Conversion + 2025 Franchise Tax', amount: 1357.00, category: 'Legal',          source: 'Personal Card',     card: null,   notes: 'Delaware Switch to PBC 2025' },
  { id: 32.1, date: '2026-02-28', description: 'Personal / Out-of-Pocket Expenses',                    amount: 275.00,  category: 'Marketing',      source: 'Personal Card',     card: null,   notes: 'Founder out-of-pocket — February' },

  // FEB 2026 — Citi Credit Card ••0716
  { id: 33,   date: '2026-02-17', description: 'Harvard Business Services',                            amount: 69.00,   category: 'Legal',          source: 'Credit Card',       card: '0716', notes: '2025 DE Franchise Tax — refunded 02/23, net $0' },
  { id: 34,   date: '2026-02-23', description: 'Harvard Business Services REFUND',                     amount: -69.00,  category: 'Legal',          source: 'Credit Card',       card: '0716', notes: 'Refund of 02/17 charge — net $0' },
  { id: 35,   date: '2026-02-24', description: 'Apple AI Tools',                                       amount: 5.99,    category: 'AI Tools',       source: 'Credit Card',       card: '0716', notes: '' },
  { id: 36,   date: '2026-02-24', description: 'Apple AI Tools',                                       amount: 9.99,    category: 'AI Tools',       source: 'Credit Card',       card: '0716', notes: '' },
  { id: 37,   date: '2026-02-24', description: 'Apple AI Tools',                                       amount: 19.99,   category: 'AI Tools',       source: 'Credit Card',       card: '0716', notes: '' },
  { id: 38,   date: '2026-02-24', description: 'Apple AI Tools',                                       amount: 60.00,   category: 'AI Tools',       source: 'Credit Card',       card: '0716', notes: '' },
  { id: 39,   date: '2026-02-24', description: 'Cursor IDE',                                           amount: 60.00,   category: 'Dev Tools',      source: 'Credit Card',       card: '0716', notes: 'Sub-card ••3539' },
  { id: 40,   date: '2026-02-24', description: 'LA Tech Mixer Event',                                  amount: 19.64,   category: 'Networking',     source: 'Credit Card',       card: '0716', notes: '' },
  { id: 41,   date: '2026-02-26', description: 'Apple AI Tools',                                       amount: 99.00,   category: 'AI Tools',       source: 'Credit Card',       card: '0716', notes: '' },
  { id: 42,   date: '2026-02-26', description: 'Shopify',                                              amount: 1.00,    category: 'Platform',       source: 'Credit Card',       card: '0716', notes: 'Sub-card ••8123' },
  { id: 43,   date: '2026-02-27', description: 'Cursor IDE',                                           amount: 200.00,  category: 'Dev Tools',      source: 'Credit Card',       card: '0716', notes: 'Sub-card ••3539' },
  { id: 44,   date: '2026-02-27', description: 'Cursor IDE REFUND',                                    amount: -54.10,  category: 'Dev Tools',      source: 'Credit Card',       card: '0716', notes: 'Partial refund, sub-card ••3539' },
  { id: 45,   date: '2026-02-28', description: 'Resend',                                               amount: 20.00,   category: 'Infrastructure', source: 'Credit Card',       card: '0716', notes: 'Sub-card ••5339' },
  { id: 45.1, date: '2026-02-26', description: 'Dusty Vinyl LA — WashedUp Event',                      amount: 48.69,   category: 'Events',         source: 'Personal Card',     card: '7429', notes: '3 tabs — WashedUp crew/activation night. Checking ••8485' },

  // MAR 2026 — Citi Credit Card ••0716
  { id: 46,   date: '2026-03-01', description: 'Twilio REFUND',                                        amount: -30.77,  category: 'Infrastructure', source: 'Credit Card',       card: '0716', notes: 'Credit from previous charge' },
  { id: 47,   date: '2026-03-02', description: 'Apple AI Tools',                                       amount: 80.00,   category: 'AI Tools',       source: 'Credit Card',       card: '0716', notes: '' },
  { id: 48,   date: '2026-03-02', description: 'Apple AI Tools REFUND',                                amount: -47.21,  category: 'AI Tools',       source: 'Credit Card',       card: '0716', notes: 'Partial refund' },
  { id: 49,   date: '2026-03-04', description: 'Google One',                                           amount: 2.99,    category: 'AI Tools',       source: 'Credit Card',       card: '0716', notes: '' },
  { id: 50,   date: '2026-03-05', description: 'Apple AI Tools',                                       amount: 9.99,    category: 'AI Tools',       source: 'Credit Card',       card: '0716', notes: '' },
  { id: 51,   date: '2026-03-05', description: 'Apple AI Tools',                                       amount: 100.00,  category: 'AI Tools',       source: 'Credit Card',       card: '0716', notes: '' },
  { id: 52,   date: '2026-03-05', description: 'Apple AI Tools REFUND',                                amount: -72.36,  category: 'AI Tools',       source: 'Credit Card',       card: '0716', notes: 'Partial refund' },
  { id: 53,   date: '2026-03-07', description: 'Vercel',                                               amount: 20.00,   category: 'Infrastructure', source: 'Credit Card',       card: '0716', notes: 'Sub-card ••4990' },
  { id: 54,   date: '2026-03-07', description: 'Cursor Usage',                                         amount: 21.03,   category: 'Dev Tools',      source: 'Credit Card',       card: '0716', notes: 'Sub-card ••3539' },
  { id: 55,   date: '2026-03-07', description: 'Claude AI Subscription',                               amount: 174.52,  category: 'AI Tools',       source: 'Credit Card',       card: '0716', notes: 'Sub-card ••1954' },
  { id: 56,   date: '2026-03-09', description: 'Perplexity AI',                                        amount: 20.00,   category: 'AI Tools',       source: 'Business Checking', card: null,   notes: 'Mercury ••8898 ACH Pull' },
  { id: 57,   date: '2026-03-10', description: 'Runway Pro Plan',                                      amount: 35.00,   category: 'AI Tools',       source: 'Credit Card',       card: '0716', notes: '' },
  { id: 58,   date: '2026-03-15', description: 'LA Tech Industry Event',                               amount: 41.04,   category: 'Networking',     source: 'Credit Card',       card: '0716', notes: '' },
  { id: 58.1, date: '2026-03-06', description: 'Florentin DTLA — WashedUp Event',                      amount: 121.98,  category: 'Events',         source: 'Personal Card',     card: '7429', notes: '3 tabs — WashedUp crew/activation night. Checking ••8485' },
  { id: 58.2, date: '2026-03-14', description: 'The High-Low LA — WashedUp Event',                     amount: 59.07,   category: 'Events',         source: 'Personal Card',     card: '7429', notes: '3 tabs — WashedUp crew/activation night. Checking ••8485' },
  { id: 59,   date: '2026-03-18', description: 'Dropbox DocSend',                                      amount: 15.00,   category: 'SaaS',           source: 'Business Checking', card: null,   notes: 'Mercury ••8898 ACH Pull' },
  { id: 59.1, date: '2026-03-16', description: 'CC Interest — Standard Purchases',                     amount: 87.47,   category: 'Finance',        source: 'Credit Card',       card: '0716', notes: 'Interest on business card — cost of financing' },
  { id: 59.2, date: '2026-03-16', description: 'CC Interest — Prior Period (Dec 2025)',                 amount: 70.43,   category: 'Finance',        source: 'Credit Card',       card: '0716', notes: 'Interest carried from Dec 2025 purchases' },
  { id: 60,   date: '2026-03-19', description: 'Personal / Out-of-Pocket Expenses',                    amount: 175.00,  category: 'Marketing',      source: 'Personal Card',     card: null,   notes: 'Founder out-of-pocket — March' },

  // EQUITY — owner contribution, excluded from all expense totals
  { id: 61,   date: '2026-02-23', description: 'Owner Contribution',                                   amount: 300.00,  category: 'Equity',         source: 'Checking',          card: null,   notes: 'Personal ••8485 → Business ••8898. NOT an expense.' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}
function fmtDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' })
}
function monthKey(iso: string) { return iso.slice(0, 7) }

const NOW = new Date()
const THIS_MONTH = `${NOW.getFullYear()}-${String(NOW.getMonth() + 1).padStart(2, '0')}`
const lastM = new Date(NOW.getFullYear(), NOW.getMonth() - 1, 1)
const LAST_MONTH = `${lastM.getFullYear()}-${String(lastM.getMonth() + 1).padStart(2, '0')}`
const threeM = new Date(NOW.getFullYear(), NOW.getMonth() - 2, 1)
const THREE_MONTHS_AGO = `${threeM.getFullYear()}-${String(threeM.getMonth() + 1).padStart(2, '0')}`

const emptyForm = {
  date: NOW.toISOString().slice(0, 10),
  description: '',
  amount: '',
  category: 'AI Tools',
  source: 'Credit Card' as Transaction['source'],
  card: '',
  notes: '',
  tax_deductible: true,
  recurring: false,
  vendor_url: '',
  is_refund: false,
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function FinancePage() {
  const [txns, setTxns] = useState<Transaction[]>(SEED)

  // Filter state
  const [dateRange, setDateRange] = useState<'all' | 'this-month' | 'last-month' | 'last-3'>('all')
  const [specificMonth, setSpecificMonth] = useState('all')
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set(CATEGORIES))
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set(SOURCES))
  const [sort, setSort] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest')
  const [showRefunds, setShowRefunds] = useState(true)
  const [showEquity, setShowEquity] = useState(false)
  const [search, setSearch] = useState('')
  const [breakdownOpen, setBreakdownOpen] = useState(true)

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [toast, setToast] = useState<string | null>(null)

  // Unique months in data
  const allMonths = useMemo(() =>
    [...new Set(txns.map(t => monthKey(t.date)))].sort().reverse()
  , [txns])

  // Filtered transactions
  const filtered = useMemo(() => {
    let r = [...txns]

    // Equity
    if (!showEquity) r = r.filter(t => t.category !== 'Equity')

    // Refunds
    if (!showRefunds) r = r.filter(t => t.amount >= 0)

    // Date
    if (specificMonth !== 'all') {
      r = r.filter(t => monthKey(t.date) === specificMonth)
    } else {
      if (dateRange === 'this-month')   r = r.filter(t => monthKey(t.date) === THIS_MONTH)
      if (dateRange === 'last-month')   r = r.filter(t => monthKey(t.date) === LAST_MONTH)
      if (dateRange === 'last-3')       r = r.filter(t => monthKey(t.date) >= THREE_MONTHS_AGO)
    }

    // Category (equity rows bypass — controlled separately)
    r = r.filter(t => t.category === 'Equity' || selectedCats.has(t.category))

    // Source
    r = r.filter(t => selectedSources.has(t.source))

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      r = r.filter(t => t.description.toLowerCase().includes(q) || t.notes.toLowerCase().includes(q))
    }

    // Sort
    if (sort === 'newest')  r.sort((a, b) => b.date.localeCompare(a.date))
    if (sort === 'oldest')  r.sort((a, b) => a.date.localeCompare(b.date))
    if (sort === 'highest') r.sort((a, b) => b.amount - a.amount)
    if (sort === 'lowest')  r.sort((a, b) => a.amount - b.amount)

    return r
  }, [txns, dateRange, specificMonth, selectedCats, selectedSources, sort, showRefunds, showEquity, search])

  // Stats (computed from filtered non-equity rows)
  const filteredNonEquity = filtered.filter(t => t.category !== 'Equity')
  const totalNet = filteredNonEquity.reduce((s, t) => s + t.amount, 0)
  const totalRefunded = Math.abs(filteredNonEquity.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0))
  const thisMonthNet = filtered.filter(t => t.category !== 'Equity' && monthKey(t.date) === THIS_MONTH).reduce((s, t) => s + t.amount, 0)

  // Top category from FULL data (stable reference)
  const topCat = useMemo(() => {
    const spend: Record<string, number> = {}
    SEED.filter(t => t.category !== 'Equity' && t.amount > 0).forEach(t => { spend[t.category] = (spend[t.category] || 0) + t.amount })
    return Object.entries(spend).sort((a, b) => b[1] - a[1])[0] || ['—', 0]
  }, [])

  // Category breakdown (always full data, positive only, no Equity)
  const catBreakdown = useMemo(() => {
    const spend: Record<string, number> = {}
    SEED.filter(t => t.category !== 'Equity' && t.amount > 0).forEach(t => { spend[t.category] = (spend[t.category] || 0) + t.amount })
    const total = Object.values(spend).reduce((s, v) => s + v, 0)
    return Object.entries(spend)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amt]) => ({ cat, amt, pct: total > 0 ? (amt / total) * 100 : 0, color: CATEGORY_COLORS[cat] }))
  }, [])

  // Any filter active?
  const anyFilter = dateRange !== 'all' || specificMonth !== 'all' ||
    selectedCats.size < CATEGORIES.length || selectedSources.size < (SOURCES.length) ||
    !showRefunds || showEquity || search.trim() !== ''

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(t)
  }, [toast])

  function toggleCat(c: string) {
    setSelectedCats(prev => { const n = new Set(prev); n.has(c) ? n.delete(c) : n.add(c); return n })
  }
  function toggleSrc(s: string) {
    setSelectedSources(prev => { const n = new Set(prev); n.has(s) ? n.delete(s) : n.add(s); return n })
  }
  function clearFilters() {
    setDateRange('all'); setSpecificMonth('all')
    setSelectedCats(new Set(CATEGORIES)); setSelectedSources(new Set(SOURCES))
    setSort('newest'); setShowRefunds(true); setShowEquity(false); setSearch('')
  }
  function addTxn() {
    if (!form.description.trim() || !form.amount) return
    const raw = parseFloat(String(form.amount))
    const amount = form.is_refund ? -Math.abs(raw) : raw
    const t: Transaction = {
      id: Date.now(),
      date: form.date,
      description: form.description.trim() + (form.is_refund ? ' REFUND' : ''),
      amount,
      category: form.category,
      source: form.source,
      card: form.card.trim() || null,
      notes: form.notes.trim(),
      tax_deductible: form.tax_deductible,
      recurring: form.recurring,
      vendor_url: form.vendor_url.trim() || undefined,
    }
    setTxns(prev => [t, ...prev])
    setForm({ ...emptyForm })
    setShowForm(false); setShowMore(false)
    setToast('✓ Transaction added')
  }

  const inputSt: React.CSSProperties = {
    background: C.parchment, border: `1px solid ${C.border}`, borderRadius: '6px',
    padding: '8px 12px', fontSize: '13px', color: C.ink, outline: 'none',
    fontFamily: 'DM Sans, sans-serif', width: '100%',
  }
  const smallSel: React.CSSProperties = { ...inputSt, padding: '5px 10px', fontSize: '12px', width: 'auto' }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=DM+Sans:wght@400;500&display=swap');
        .fin * { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }
        .fin .serif { font-family: 'Cormorant Garamond', serif; }
        .fin-row:hover { background: rgba(196,96,59,0.06) !important; }
        .fin-pill {
          cursor: pointer; border: 1px solid ${C.border}; border-radius: 20px;
          padding: 4px 12px; font-size: 11px; font-weight: 500;
          background: ${C.surface}; color: ${C.inkMid}; transition: all 0.15s;
          white-space: nowrap; line-height: 1.6;
        }
        .fin-pill.on { background: ${C.terracotta}; color: white; border-color: ${C.terracotta}; }
        .fin-pill.cat-on { color: white; }
        .fin-seg {
          cursor: pointer; padding: 5px 14px; font-size: 12px; font-weight: 500;
          background: ${C.surface}; color: ${C.inkMid};
          border: 1px solid ${C.border}; transition: all 0.15s;
        }
        .fin-seg.on { background: ${C.terracotta}; color: white; border-color: ${C.terracotta}; }
        .fin-seg:first-child { border-radius: 6px 0 0 6px; }
        .fin-seg:last-child  { border-radius: 0 6px 6px 0; }
        .fin-seg:not(:first-child) { border-left: none; }
        .fin-input:focus { outline: 2px solid ${C.terracotta}; outline-offset: -1px; }
        .fin-bar-wrap { position: relative; }
        .fin-bar-seg { position: relative; }
        .fin-bar-seg:hover .fin-tip { display: block; }
        .fin-tip {
          display: none; position: absolute; bottom: 36px; left: 50%;
          transform: translateX(-50%); background: ${C.ink}; color: ${C.parchment};
          padding: 4px 10px; border-radius: 6px; font-size: 11px;
          white-space: nowrap; z-index: 20; pointer-events: none;
        }
        .fin-tip::after {
          content: ''; position: absolute; top: 100%; left: 50%;
          transform: translateX(-50%); border: 5px solid transparent;
          border-top-color: ${C.ink};
        }
        select.fin-input, select { -webkit-appearance: auto; }
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        .stat-card { background: white; border: 1px solid ${C.border}; border-radius: 8px; border-left: 3px solid ${C.terracotta}; padding: 16px 20px; box-shadow: 0 1px 4px rgba(44,36,22,0.06); }
      `}</style>

      <div className="fin" style={{ background: C.surface, minHeight: '100vh', padding: '28px 32px', fontFamily: 'DM Sans, sans-serif' }}>

        {/* DATA NOTE */}
        <div style={{ background: '#FFF8E6', border: `1px solid ${C.amber}`, borderRadius: '8px', padding: '10px 16px', marginBottom: '24px', fontSize: '12px', color: C.inkMid, lineHeight: 1.6 }}>
          <strong style={{ color: C.terracotta }}>⚠ Data Note:</strong>&nbsp;
          Oct 2025 – Jan 2026: founder Google Sheets (monthly line items, approx dates).&nbsp;
          Feb 2026: Sheets + Citi CC ••0716 statement — CC is source of truth, duplicates resolved.&nbsp;
          Mar 2026: Citi CC ••0716 (closed Mar 16) + Mercury ••8898.&nbsp;
          <strong>Owner Contribution ($300) excluded from all totals.</strong>
        </div>

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <h1 className="serif" style={{ fontSize: '30px', fontWeight: 600, color: C.ink, margin: 0, lineHeight: 1 }}>
            Finances
          </h1>
          <button
            onClick={() => setShowForm(f => !f)}
            style={{ background: 'none', border: `1.5px solid ${C.terracotta}`, borderRadius: '8px', padding: '8px 18px', color: C.terracotta, fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
          >
            {showForm ? '× Cancel' : '+ Add Transaction'}
          </button>
        </div>

        {/* ── ZONE 1: STAT BAR ──────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total Spent (Net)',   value: fmt(totalNet),         sub: 'All time · excl. equity',  green: false },
            { label: 'This Month',          value: fmt(thisMonthNet),     sub: 'Mar 2026',                 green: false },
            { label: 'Top Category',        value: String(topCat[0]),     sub: fmt(Number(topCat[1])),     green: false },
            { label: 'Refunded',            value: fmt(totalRefunded),    sub: 'back',                     green: true  },
          ].map(card => (
            <div className="stat-card" key={card.label}>
              <div className="serif" style={{ fontSize: '30px', fontWeight: 500, color: card.green ? C.refundGreen : C.ink, lineHeight: 1.1, marginBottom: '6px' }}>
                {card.value}
              </div>
              <div style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.inkLight }}>
                {card.label}
              </div>
              {card.sub && <div style={{ fontSize: '11px', color: C.inkLight, marginTop: '2px' }}>{card.sub}</div>}
            </div>
          ))}
        </div>

        {/* ── ZONE 2: CATEGORY BREAKDOWN ────────────────────────────────────── */}
        <div style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '16px 20px', marginBottom: '20px' }}>
          <button
            onClick={() => setBreakdownOpen(o => !o)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: C.inkMid, display: 'flex', alignItems: 'center', gap: '6px', padding: 0, marginBottom: breakdownOpen ? '16px' : 0, fontFamily: 'DM Sans, sans-serif' }}
          >
            {breakdownOpen ? '▾' : '▸'} Category Breakdown
          </button>

          {breakdownOpen && (
            <>
              {/* Segmented bar */}
              <div className="fin-bar-wrap" style={{ display: 'flex', height: '28px', borderRadius: '14px', overflow: 'hidden', marginBottom: '14px' }}>
                {catBreakdown.filter(c => c.pct >= 0.5).map(({ cat, amt, pct, color }) => (
                  <div key={cat} className="fin-bar-seg" style={{ width: `${pct}%`, background: color, cursor: 'default' }}>
                    <div className="fin-tip">{cat} · {fmt(amt)} · {pct.toFixed(1)}%</div>
                  </div>
                ))}
              </div>
              {/* Legend */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 20px' }}>
                {catBreakdown.map(({ cat, amt, color }) => (
                  <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: '12px', color: C.inkMid }}>{cat}</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: C.ink }}>{fmt(amt)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── ZONE 3: FILTER BAR + TABLE ────────────────────────────────────── */}
        <div style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: '8px', marginBottom: '20px', overflow: 'hidden' }}>

          {/* Filter Bar */}
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Row 1: Date segments + month picker + sort + clear */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex' }}>
                {([
                  { v: 'all',        label: 'All Time' },
                  { v: 'this-month', label: 'This Month' },
                  { v: 'last-month', label: 'Last Month' },
                  { v: 'last-3',     label: 'Last 3 Months' },
                ] as const).map(({ v, label }) => (
                  <button
                    key={v}
                    className={`fin-seg${dateRange === v && specificMonth === 'all' ? ' on' : ''}`}
                    onClick={() => { setDateRange(v); setSpecificMonth('all') }}
                  >{label}</button>
                ))}
              </div>

              <select
                className="fin-input"
                style={smallSel}
                value={specificMonth}
                onChange={e => { setSpecificMonth(e.target.value); if (e.target.value !== 'all') setDateRange('all') }}
              >
                <option value="all">All Months</option>
                {allMonths.map(m => (
                  <option key={m} value={m}>
                    {new Date(m + '-15').toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'America/Los_Angeles' })}
                  </option>
                ))}
              </select>

              <select className="fin-input" style={{ ...smallSel, marginLeft: 'auto' }} value={sort} onChange={e => setSort(e.target.value as typeof sort)}>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Amount</option>
                <option value="lowest">Lowest Amount</option>
              </select>

              {anyFilter && (
                <button onClick={clearFilters} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.terracotta, fontSize: '12px', fontWeight: 500, padding: 0, fontFamily: 'DM Sans, sans-serif' }}>
                  × clear filters
                </button>
              )}
            </div>

            {/* Row 2: Category pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: C.inkLight, marginRight: '2px', whiteSpace: 'nowrap' }}>Category</span>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  className={`fin-pill${selectedCats.has(cat) ? ' cat-on' : ''}`}
                  onClick={() => toggleCat(cat)}
                  style={selectedCats.has(cat) ? { background: CATEGORY_COLORS[cat], borderColor: CATEGORY_COLORS[cat] } : {}}
                >{cat}</button>
              ))}
            </div>

            {/* Row 3: Source + show/hide + search */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: C.inkLight, marginRight: '2px', whiteSpace: 'nowrap' }}>Source</span>
              {SOURCES.map(s => (
                <button key={s} className={`fin-pill${selectedSources.has(s) ? ' on' : ''}`} onClick={() => toggleSrc(s)}>{s}</button>
              ))}
              <div style={{ width: '1px', height: '20px', background: C.border, margin: '0 2px' }} />
              <button className={`fin-pill${showRefunds ? ' on' : ''}`} onClick={() => setShowRefunds(r => !r)}>↩ Refunds</button>
              <button className={`fin-pill${showEquity ? ' on' : ''}`} onClick={() => setShowEquity(e => !e)}>Equity</button>
              <input
                className="fin-input"
                type="text"
                placeholder="Search descriptions…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ ...inputSt, marginLeft: 'auto', maxWidth: '220px', padding: '5px 12px', fontSize: '12px' }}
              />
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.border}`, background: C.parchmentDk }}>
                  {['Date', 'Description', 'Category', 'Source', 'Card', 'Amount', 'Notes'].map(h => (
                    <th key={h} style={{
                      padding: '10px 14px', textAlign: h === 'Amount' ? 'right' : 'left',
                      fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: '0.08em', color: C.inkLight, whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: C.inkLight, fontSize: '14px' }}>
                      No transactions match your filters.
                    </td>
                  </tr>
                ) : filtered.map((tx, i) => {
                  const isRefund = tx.amount < 0
                  const isEquity = tx.category === 'Equity'
                  const rowBg = isRefund
                    ? 'rgba(45,122,79,0.05)'
                    : isEquity ? 'transparent'
                    : i % 2 === 0 ? C.surface : C.parchment
                  return (
                    <tr key={tx.id} className="fin-row" style={{ background: rowBg, opacity: isEquity ? 0.4 : 1 }}>
                      <td style={{ padding: '9px 14px', color: C.inkMid, whiteSpace: 'nowrap' }}>{fmtDate(tx.date)}</td>
                      <td style={{ padding: '9px 14px', color: C.ink, fontStyle: isEquity ? 'italic' : 'normal', maxWidth: '280px' }}>
                        {isRefund && <span style={{ color: C.refundGreen, marginRight: '4px', fontWeight: 700 }}>↩</span>}
                        {tx.description}
                      </td>
                      <td style={{ padding: '9px 14px' }}>
                        <span style={{
                          display: 'inline-block', padding: '2px 8px', borderRadius: '20px',
                          fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
                          background: (CATEGORY_COLORS[tx.category] || '#ccc') + '28',
                          color: CATEGORY_COLORS[tx.category] || C.inkMid,
                        }}>{tx.category}</span>
                      </td>
                      <td style={{ padding: '9px 14px', color: C.inkMid, fontSize: '12px', whiteSpace: 'nowrap' }}>{tx.source}</td>
                      <td style={{ padding: '9px 14px', color: tx.card ? C.inkMid : C.inkLight, fontFamily: 'monospace', fontSize: '12px' }}>
                        {tx.card ? `····${tx.card}` : '—'}
                      </td>
                      <td style={{ padding: '9px 14px', textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap', color: isRefund ? C.refundGreen : C.ink }}>
                        {isRefund ? `↩ ${fmt(Math.abs(tx.amount))}` : fmt(tx.amount)}
                      </td>
                      <td style={{ padding: '9px 14px', color: C.inkLight, fontStyle: 'italic', fontSize: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {tx.notes}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          <div style={{ padding: '10px 20px', borderTop: `1px solid ${C.border}`, fontSize: '12px', color: C.inkLight, display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <span>Showing <strong style={{ color: C.ink }}>{filtered.length}</strong> transactions</span>
            <span>·</span>
            <span>Net Spend: <strong style={{ color: C.ink }}>{fmt(totalNet)}</strong></span>
            <span>·</span>
            <span>Refunds: <strong style={{ color: C.refundGreen }}>{fmt(totalRefunded)} back</strong></span>
          </div>
        </div>

        {/* ── ZONE 4: ADD TRANSACTION (inline) ──────────────────────────────── */}
        {showForm && (
          <div style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
            <h3 className="serif" style={{ fontSize: '20px', fontWeight: 500, color: C.ink, margin: '0 0 20px' }}>New Transaction</h3>

            {/* Main fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 130px 190px 130px 110px', gap: '12px', marginBottom: '12px', alignItems: 'end' }}>
              {[
                { label: 'Date',          field: 'date',        type: 'date'   },
                { label: 'Description *', field: 'description', type: 'text',   placeholder: 'Vendor / Description' },
                { label: 'Amount ($) *',  field: 'amount',      type: 'number', placeholder: '0.00' },
                { label: 'Category',      field: 'category',    type: 'select', opts: Object.keys(CATEGORY_COLORS) },
                { label: 'Source',        field: 'source',      type: 'select', opts: [...SOURCES] },
                { label: 'Card Last 4',   field: 'card',        type: 'text',   placeholder: '0716', maxLen: 4 },
              ].map(f => (
                <div key={f.field}>
                  <label style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.inkLight, display: 'block', marginBottom: '4px' }}>{f.label}</label>
                  {f.type === 'select' ? (
                    <select
                      className="fin-input"
                      style={inputSt}
                      value={(form as Record<string, unknown>)[f.field] as string}
                      onChange={e => setForm(p => ({ ...p, [f.field]: e.target.value }))}
                    >
                      {f.opts?.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      className="fin-input"
                      style={inputSt}
                      type={f.type}
                      placeholder={f.placeholder}
                      maxLength={f.maxLen}
                      value={(form as Record<string, unknown>)[f.field] as string}
                      onChange={e => setForm(p => ({ ...p, [f.field]: e.target.value }))}
                      autoFocus={f.field === 'description'}
                    />
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.inkLight, display: 'block', marginBottom: '4px' }}>Notes</label>
              <input className="fin-input" style={inputSt} type="text" placeholder="Optional notes…" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
            </div>

            {/* More fields toggle */}
            <button
              onClick={() => setShowMore(m => !m)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: C.terracotta, padding: '0 0 14px', fontWeight: 500, fontFamily: 'DM Sans, sans-serif' }}
            >
              {showMore ? '▾ fewer fields' : '▸ + more fields'}
            </button>

            {showMore && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '16px', padding: '14px', background: C.parchment, borderRadius: '8px' }}>
                {[
                  { field: 'tax_deductible', label: 'Tax Deductible' },
                  { field: 'recurring',       label: 'Recurring Subscription' },
                  { field: 'is_refund',       label: 'This is a Refund (amount becomes negative)' },
                ].map(f => (
                  <label key={f.field} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: C.inkMid, cursor: 'pointer' }}>
                    <input type="checkbox" checked={(form as Record<string, unknown>)[f.field] as boolean} onChange={e => setForm(p => ({ ...p, [f.field]: e.target.checked }))} />
                    {f.label}
                  </label>
                ))}
                <div style={{ flexBasis: '100%' }}>
                  <label style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.inkLight, display: 'block', marginBottom: '4px' }}>Vendor URL / Receipt</label>
                  <input className="fin-input" style={{ ...inputSt, maxWidth: '340px' }} type="url" placeholder="https://…" value={form.vendor_url} onChange={e => setForm(p => ({ ...p, vendor_url: e.target.value }))} />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={addTxn}
                disabled={!form.description.trim() || !form.amount}
                style={{
                  background: C.terracotta, color: 'white', border: 'none', borderRadius: '8px',
                  padding: '10px 28px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                  opacity: (!form.description.trim() || !form.amount) ? 0.5 : 1,
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >Add</button>
              <button
                onClick={() => { setShowForm(false); setShowMore(false) }}
                style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '10px 18px', fontSize: '13px', color: C.inkMid, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
              >Cancel</button>
            </div>
          </div>
        )}

      </div>

      {/* TOAST */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px',
          background: C.terracotta, color: 'white',
          padding: '10px 22px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
          boxShadow: '0 4px 16px rgba(44,36,22,0.25)', zIndex: 1000,
          fontFamily: 'DM Sans, sans-serif',
        }}>
          {toast}
        </div>
      )}
    </>
  )
}
