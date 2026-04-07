"use client";

import { useEffect, useState, useMemo } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Card from "@/components/ui/Card";

type Message = {
  id: string;
  event_id: string;
  user_id: string;
  content: string | null;
  created_at: string;
  message_type: string;
  event_title: string;
  user_name: string;
};

const inputStyle: React.CSSProperties = {
  background: 'var(--bg-input)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  padding: '8px 14px',
  fontSize: '13px',
  color: 'var(--parchment)',
  outline: 'none',
  fontFamily: 'DM Sans, sans-serif',
};

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");

  useEffect(() => {
    fetch("/api/admin/messages")
      .then((r) => r.json())
      .then((d) => setMessages(d.messages ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const planOptions = useMemo(() => {
    const map = new Map<string, string>();
    messages.forEach((m) => map.set(m.event_id, m.event_title));
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [messages]);

  const filtered = useMemo(() => {
    let list = messages;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.content?.toLowerCase().includes(q) ||
          m.user_name.toLowerCase().includes(q) ||
          m.event_title.toLowerCase().includes(q)
      );
    }
    if (planFilter !== "all") {
      list = list.filter((m) => m.event_id === planFilter);
    }
    return list;
  }, [messages, search, planFilter]);

  const planStats = useMemo(() => {
    const map = new Map<string, { title: string; count: number; lastMsg: string }>();
    messages.forEach((m) => {
      const existing = map.get(m.event_id);
      if (!existing) {
        map.set(m.event_id, { title: m.event_title, count: 1, lastMsg: m.created_at });
      } else {
        existing.count++;
        if (m.created_at > existing.lastMsg) existing.lastMsg = m.created_at;
      }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [messages]);

  const uniquePlans = planOptions.length;
  const uniqueUsers = useMemo(() => {
    return new Set(messages.map((m) => m.user_id)).size;
  }, [messages]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{
          width: 32, height: 32,
          border: '2px solid var(--terracotta)',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Messages" subtitle={`${messages.length} total across ${uniquePlans} plans`} />

      {/* Most Active Chats */}
      <div style={{ marginBottom: '24px' }}>
        <Card title="Most Active Chats">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {planStats.slice(0, 6).map((ps) => (
              <div key={ps.title} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                border: '1px solid var(--border)',
                borderRadius: '10px',
              }}>
                <span style={{ fontSize: '13px', color: 'var(--parchment)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px' }}>{ps.title}</span>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', fontWeight: 700, color: 'var(--terracotta)', lineHeight: 1 }}>{ps.count}</div>
                  <div style={{ fontSize: '10px', color: 'var(--parchment-muted)' }}>msgs</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Search messages, users, or plans..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, width: '288px' }}
        />
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          style={{ ...inputStyle, maxWidth: '250px' }}
        >
          <option value="all">All Plans</option>
          {planOptions.map(([id, title]) => (
            <option key={id} value={id}>{title}</option>
          ))}
        </select>
        <span style={{ fontSize: '11px', color: 'var(--parchment-muted)', marginLeft: 'auto' }}>
          {uniqueUsers} users chatted
        </span>
      </div>

      {/* Message Log */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div>
          {filtered.slice(0, 200).map((m) => (
            <div key={m.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--parchment)' }}>{m.user_name}</span>
                  <span style={{ fontSize: '10px', color: 'var(--parchment-muted)' }}>in</span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    color: 'var(--terracotta)',
                    maxWidth: '200px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {m.event_title}
                  </span>
                </div>
                <span style={{ fontSize: '10px', color: 'var(--parchment-muted)', flexShrink: 0 }}>
                  {new Date(m.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--parchment-dim)', margin: 0 }}>{m.content || "(no content)"}</p>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: '13px', color: 'var(--parchment-muted)' }}>No messages found</div>
          )}
          {filtered.length > 200 && (
            <div style={{ padding: '12px 16px', textAlign: 'center', fontSize: '11px', color: 'var(--parchment-muted)' }}>
              Showing 200 of {filtered.length} messages
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
