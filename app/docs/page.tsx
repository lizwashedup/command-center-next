'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/layout/PageHeader'
import Button from '@/components/ui/Button'

interface Doc {
  id: string
  title: string
  folder: string
  content: string
  word_count: number
  updated_at: string
  created_at: string
}

const FOLDERS = [
  'Fundraising', 'Legal', 'Finance', 'Brand', 'Product',
  'Growth', 'Meeting Prep', 'Partnerships', 'Operations', 'Notes',
]

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

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function formatUpdated(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function DocsPage() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFolder, setSelectedFolder] = useState('Fundraising')
  const [openDoc, setOpenDoc] = useState<Doc | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchDocs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchDocs() {
    setLoading(true)
    const { data } = await supabase.from('documents').select('*').order('updated_at', { ascending: false })
    setDocs(data || [])
    setLoading(false)
  }

  function openDocument(doc: Doc) {
    setOpenDoc(doc)
    setEditTitle(doc.title)
    setEditContent(doc.content || '')
  }

  const debouncedSave = useCallback((docId: string, title: string, content: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSaving(true)
      const wc = countWords(content)
      await supabase.from('documents').update({
        title,
        content,
        word_count: wc,
        updated_at: new Date().toISOString(),
      }).eq('id', docId)
      setDocs(prev => prev.map(d => d.id === docId ? { ...d, title, content, word_count: wc, updated_at: new Date().toISOString() } : d))
      setSaving(false)
    }, 1000)
  }, [supabase])

  function handleTitleChange(val: string) {
    setEditTitle(val)
    if (openDoc) debouncedSave(openDoc.id, val, editContent)
  }

  function handleContentChange(val: string) {
    setEditContent(val)
    if (openDoc) debouncedSave(openDoc.id, editTitle, val)
  }

  async function createDoc() {
    if (!newTitle.trim()) return
    const { data } = await supabase.from('documents').insert({
      title: newTitle.trim(),
      folder: selectedFolder,
      content: '',
      word_count: 0,
    }).select().single()
    if (data) {
      setDocs(prev => [data, ...prev])
      openDocument(data)
      setShowNewForm(false)
      setNewTitle('')
    }
  }

  async function deleteDoc(id: string) {
    if (!confirm('Delete this document?')) return
    await supabase.from('documents').delete().eq('id', id)
    setDocs(prev => prev.filter(d => d.id !== id))
    if (openDoc?.id === id) setOpenDoc(null)
  }

  const folderDocs = docs.filter(d =>
    d.folder === selectedFolder &&
    (search === '' || d.title.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="page-wrapper">
      <PageHeader title="Docs Vault" subtitle="Your living knowledge base" badge="Auto-save" badgeColor="green" />

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '24px', height: 'calc(100vh - 200px)' }}>
        {/* Folder sidebar */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          padding: '16px 12px',
          overflowY: 'auto',
        }}>
          <div style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--parchment-muted)', marginBottom: '12px', paddingLeft: '8px' }}>
            Folders
          </div>
          {FOLDERS.map(folder => {
            const count = docs.filter(d => d.folder === folder).length
            return (
              <button
                key={folder}
                onClick={() => { setSelectedFolder(folder); setOpenDoc(null) }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: selectedFolder === folder ? 'rgba(217,119,70,0.1)' : 'transparent',
                  color: selectedFolder === folder ? 'var(--terracotta)' : 'var(--parchment)',
                  fontSize: '13px',
                  fontFamily: 'DM Sans, sans-serif',
                  fontWeight: selectedFolder === folder ? 600 : 400,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s',
                  marginBottom: '2px',
                }}
              >
                <span>{folder}</span>
                {count > 0 && (
                  <span style={{
                    fontSize: '10px', background: selectedFolder === folder ? 'rgba(217,119,70,0.15)' : 'var(--bg-elevated)',
                    color: selectedFolder === folder ? 'var(--terracotta)' : 'var(--parchment-muted)',
                    padding: '1px 6px', borderRadius: '10px',
                  }}>{count}</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Main area */}
        <div style={{ display: 'grid', gridTemplateColumns: openDoc ? '280px 1fr' : '1fr', gap: '16px', overflow: 'hidden' }}>
          {/* Doc list */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '14px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search docs..."
                style={{ ...inputStyle, padding: '8px 12px', fontSize: '13px' }}
              />
              <Button variant="small" onClick={() => setShowNewForm(true)}>+ New</Button>
            </div>

            {showNewForm && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: 'var(--bg-elevated)', borderRadius: '10px' }}>
                <input
                  autoFocus
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Document title..."
                  style={{ ...inputStyle, padding: '8px 12px', fontSize: '13px' }}
                  onKeyDown={e => { if (e.key === 'Enter') createDoc(); if (e.key === 'Escape') setShowNewForm(false) }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button variant="small" onClick={createDoc}>Create</Button>
                  <Button variant="ghost" style={{ padding: '5px 12px', fontSize: '11px' }} onClick={() => setShowNewForm(false)}>Cancel</Button>
                </div>
              </div>
            )}

            {loading ? (
              <p style={{ color: 'var(--parchment-dim)', fontSize: '13px' }}>Loading...</p>
            ) : folderDocs.length === 0 ? (
              <p style={{ color: 'var(--parchment-muted)', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>
                No docs in {selectedFolder}
              </p>
            ) : (
              folderDocs.map(doc => (
                <div
                  key={doc.id}
                  onClick={() => openDocument(doc)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: `1px solid ${openDoc?.id === doc.id ? 'var(--terracotta)' : 'var(--border)'}`,
                    background: openDoc?.id === doc.id ? 'rgba(217,119,70,0.05)' : 'var(--bg-elevated)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--parchment)', flex: 1 }}>{doc.title}</div>
                    <button
                      onClick={e => { e.stopPropagation(); deleteDoc(doc.id) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--parchment-muted)', fontSize: '14px', padding: 0, flexShrink: 0 }}
                    >×</button>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--parchment-muted)' }}>{doc.word_count || 0} words</span>
                    <span style={{ fontSize: '11px', color: 'var(--parchment-muted)' }}>·</span>
                    <span style={{ fontSize: '11px', color: 'var(--parchment-muted)' }}>{formatUpdated(doc.updated_at || doc.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Editor */}
          {openDoc && (
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              overflow: 'hidden',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <input
                  value={editTitle}
                  onChange={e => handleTitleChange(e.target.value)}
                  style={{
                    fontFamily: 'Cormorant Garamond, serif',
                    fontSize: '24px',
                    fontWeight: 700,
                    color: 'var(--parchment)',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    flex: 1,
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {saving && <span style={{ fontSize: '11px', color: 'var(--parchment-muted)' }}>Saving…</span>}
                  {!saving && <span style={{ fontSize: '11px', color: 'var(--success)' }}>Saved</span>}
                  <button
                    onClick={() => setOpenDoc(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--parchment-muted)', fontSize: '20px', lineHeight: 1 }}
                  >×</button>
                </div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--parchment-muted)' }}>
                {countWords(editContent)} words · {selectedFolder}
              </div>
              <textarea
                value={editContent}
                onChange={e => handleContentChange(e.target.value)}
                placeholder="Start writing..."
                style={{
                  flex: 1,
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '16px',
                  fontSize: '15px',
                  color: 'var(--parchment)',
                  outline: 'none',
                  resize: 'none',
                  fontFamily: 'DM Sans, sans-serif',
                  lineHeight: 1.7,
                  minHeight: '400px',
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
