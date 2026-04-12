"use client";

import { useEffect, useState, useMemo } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Card from "@/components/ui/Card";

type PlanChat = {
  event_id: string;
  event_title: string;
  message_count: number;
  last_message_at: string;
  member_count: number;
  status: string;
};

type Message = {
  id: string;
  event_id: string;
  user_id: string;
  content: string | null;
  created_at: string;
  message_type: string;
  user_name: string;
  profile_photo_url: string | null;
};

type RecentMessage = Message & { event_title: string };

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
  const [plans, setPlans] = useState<PlanChat[]>([]);
  const [recent, setRecent] = useState<RecentMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedRecentId, setExpandedRecentId] = useState<string | null>(null);
  const [recentCache, setRecentCache] = useState<Record<string, Message[]>>({});
  const [recentCacheLoading, setRecentCacheLoading] = useState<Record<string, boolean>>({});
  const [expandFull, setExpandFull] = useState<Record<string, boolean>>({});

  // Fetch plan list with chat stats + most recent messages
  useEffect(() => {
    fetch("/api/admin/messages")
      .then((r) => r.json())
      .then((d) => {
        setPlans(d.plans ?? []);
        setRecent(d.recent ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Fetch messages for selected plan
  useEffect(() => {
    if (!selectedPlan) { setMessages([]); return; }
    setMsgsLoading(true);
    fetch(`/api/admin/messages?plan=${selectedPlan}`)
      .then((r) => r.json())
      .then((d) => setMessages(d.messages ?? []))
      .catch(console.error)
      .finally(() => setMsgsLoading(false));
  }, [selectedPlan]);

  async function ensurePlanCached(eventId: string) {
    if (recentCache[eventId] || recentCacheLoading[eventId]) return;
    setRecentCacheLoading((s) => ({ ...s, [eventId]: true }));
    try {
      const res = await fetch(`/api/admin/messages?plan=${eventId}`);
      const d = await res.json();
      setRecentCache((s) => ({ ...s, [eventId]: d.messages ?? [] }));
    } catch (e) {
      console.error(e);
    } finally {
      setRecentCacheLoading((s) => ({ ...s, [eventId]: false }));
    }
  }

  function handleRecentClick(m: RecentMessage) {
    if (expandedRecentId === m.id) {
      setExpandedRecentId(null);
      return;
    }
    setExpandedRecentId(m.id);
    ensurePlanCached(m.event_id);
  }

  const filteredPlans = useMemo(() => {
    if (!search) return plans;
    const q = search.toLowerCase();
    return plans.filter((p) => p.event_title.toLowerCase().includes(q));
  }, [plans, search]);

  const totalMessages = useMemo(() => plans.reduce((sum, p) => sum + p.message_count, 0), [plans]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ width: 32, height: 32, border: '2px solid var(--terracotta)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Messages" subtitle={`${totalMessages} messages across ${plans.length} plans`} />

      {/* Recent Messages section — separate from the plans list below */}
      <Card style={{ padding: 0, overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '18px', fontWeight: 700, color: 'var(--parchment)' }}>
            Recent Messages
          </div>
          <div style={{ fontSize: '11px', color: 'var(--parchment-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Latest {recent.length} across all plans
          </div>
        </div>
        <div style={{ maxHeight: expandedRecentId ? '620px' : '280px', overflowY: 'auto', transition: 'max-height 0.2s' }}>
          {recent.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', fontSize: '13px', color: 'var(--parchment-muted)' }}>
              No recent messages
            </div>
          ) : recent.map((m) => {
            const isExpanded = expandedRecentId === m.id;
            const planThread = recentCache[m.event_id] || [];
            const planLoading = recentCacheLoading[m.event_id];
            const clickedDate = new Date(m.created_at);
            const ptDayKey = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
            const clickedDayKey = ptDayKey(clickedDate);
            const sameDayMessages = planThread.filter((pm) => ptDayKey(new Date(pm.created_at)) === clickedDayKey);
            const showFull = !!expandFull[m.id];
            const displayedMessages = showFull ? planThread : sameDayMessages;
            const olderCount = planThread.filter((pm) => ptDayKey(new Date(pm.created_at)) < clickedDayKey).length;
            const dayLabel = clickedDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: "America/Los_Angeles" });

            return (
              <div key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <button
                  onClick={() => handleRecentClick(m)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'flex-start',
                    padding: '10px 20px',
                    background: isExpanded ? 'rgba(217,119,70,0.06)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'DM Sans, sans-serif',
                    transition: 'background 0.15s',
                  }}
                >
                  {m.profile_photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.profile_photo_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, marginTop: '2px' }} />
                  ) : (
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: 'var(--parchment-muted)', flexShrink: 0, marginTop: '2px' }}>
                      {m.user_name?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--parchment)' }}>{m.user_name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--terracotta)', fontWeight: 500 }}>
                        {m.event_title}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--parchment-muted)', marginLeft: 'auto' }}>
                        {new Date(m.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Los_Angeles" })}
                      </span>
                    </div>
                    <div style={{
                      fontSize: '13px', color: 'var(--parchment-dim)', lineHeight: 1.5, marginTop: '2px',
                      ...(isExpanded ? {} : { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }),
                    }}>
                      {m.content || <span style={{ fontStyle: 'italic', color: 'var(--parchment-muted)' }}>(no content)</span>}
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--parchment-muted)', marginLeft: '6px', marginTop: '4px' }}>
                    {isExpanded ? '▲' : '▼'}
                  </span>
                </button>

                {isExpanded && (
                  <div style={{
                    padding: '12px 20px 16px 58px',
                    background: 'rgba(217,119,70,0.03)',
                    borderTop: '1px solid var(--border)',
                  }}>
                    <div style={{
                      fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em',
                      color: 'var(--parchment-muted)', marginBottom: '10px',
                    }}>
                      {showFull ? `Full conversation · ${planThread.length} messages` : `${dayLabel} · ${sameDayMessages.length} messages`}
                    </div>

                    {planLoading && displayedMessages.length === 0 ? (
                      <div style={{ padding: '12px 0', fontSize: '12px', color: 'var(--parchment-muted)' }}>
                        loading conversation...
                      </div>
                    ) : displayedMessages.length === 0 ? (
                      <div style={{ padding: '12px 0', fontSize: '12px', color: 'var(--parchment-muted)' }}>
                        no other messages on this day
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {displayedMessages.map((pm) => {
                          const isPivot = pm.id === m.id;
                          return (
                            <div key={pm.id} style={{
                              display: 'flex', gap: '8px', alignItems: 'flex-start',
                              padding: '6px 8px',
                              background: isPivot ? 'rgba(217,119,70,0.08)' : 'transparent',
                              borderRadius: '6px',
                              borderLeft: isPivot ? '2px solid var(--terracotta)' : '2px solid transparent',
                            }}>
                              {pm.profile_photo_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={pm.profile_photo_url} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, marginTop: '2px' }} />
                              ) : (
                                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: 'var(--parchment-muted)', flexShrink: 0, marginTop: '2px' }}>
                                  {pm.user_name?.[0]?.toUpperCase() || '?'}
                                </div>
                              )}
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--parchment)' }}>{pm.user_name}</span>
                                  <span style={{ fontSize: '10px', color: 'var(--parchment-muted)' }}>
                                    {new Date(pm.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Los_Angeles" })}
                                  </span>
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--parchment-dim)', lineHeight: 1.5, marginTop: '1px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                  {pm.message_type === 'user'
                                    ? (pm.content || '(no content)')
                                    : <span style={{ fontStyle: 'italic', color: 'var(--parchment-muted)' }}>{pm.content || `[${pm.message_type}]`}</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
                      {!showFull && olderCount > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandFull((s) => ({ ...s, [m.id]: true }));
                          }}
                          style={{
                            fontSize: '11px', fontWeight: 600, color: 'var(--terracotta)',
                            background: 'rgba(217,119,70,0.1)', border: '1px solid var(--border-active)',
                            borderRadius: '14px', padding: '5px 12px', cursor: 'pointer',
                            fontFamily: 'DM Sans, sans-serif',
                          }}
                        >
                          show full conversation ({planThread.length} messages)
                        </button>
                      )}
                      {showFull && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandFull((s) => ({ ...s, [m.id]: false }));
                          }}
                          style={{
                            fontSize: '11px', fontWeight: 600, color: 'var(--parchment-dim)',
                            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                            borderRadius: '14px', padding: '5px 12px', cursor: 'pointer',
                            fontFamily: 'DM Sans, sans-serif',
                          }}
                        >
                          collapse to same day
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPlan(m.event_id);
                        }}
                        style={{
                          fontSize: '11px', fontWeight: 500, color: 'var(--parchment-dim)',
                          background: 'transparent', border: '1px solid var(--border)',
                          borderRadius: '14px', padding: '5px 12px', cursor: 'pointer',
                          fontFamily: 'DM Sans, sans-serif',
                        }}
                      >
                        open in side pane ↗
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '20px', minHeight: '60vh' }}>
        {/* Left: Plan list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="text"
            placeholder="Search plans..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, width: '100%' }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', maxHeight: 'calc(100vh - 240px)' }}>
            {filteredPlans.map((p) => (
              <button
                key={p.event_id}
                onClick={() => setSelectedPlan(p.event_id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: selectedPlan === p.event_id ? '1px solid var(--terracotta)' : '1px solid var(--border)',
                  background: selectedPlan === p.event_id ? 'rgba(217,119,70,0.06)' : 'var(--bg-surface)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'DM Sans, sans-serif',
                  transition: 'all 0.15s',
                  width: '100%',
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: selectedPlan === p.event_id ? 600 : 500,
                    color: selectedPlan === p.event_id ? 'var(--terracotta)' : 'var(--parchment)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {p.event_title}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--parchment-muted)', marginTop: '2px' }}>
                    {new Date(p.last_message_at).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Los_Angeles" })}
                    {' · '}{p.member_count} members
                    {' · '}<span style={{
                      fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.04em',
                      color: p.status === 'completed' ? 'var(--success)' : p.status === 'cancelled' ? 'var(--error)' : 'var(--terracotta)',
                    }}>{p.status}</span>
                  </div>
                </div>
                <div style={{
                  flexShrink: 0, minWidth: '36px', textAlign: 'right',
                  fontFamily: 'Cormorant Garamond, serif', fontSize: '18px', fontWeight: 700,
                  color: selectedPlan === p.event_id ? 'var(--terracotta)' : 'var(--parchment-dim)',
                }}>
                  {p.message_count}
                </div>
              </button>
            ))}
            {filteredPlans.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', fontSize: '13px', color: 'var(--parchment-muted)' }}>
                No plans with messages found
              </div>
            )}
          </div>
        </div>

        {/* Right: Conversation thread */}
        <Card style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {!selectedPlan ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '400px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', fontWeight: 700, color: 'var(--parchment-muted)', marginBottom: '4px' }}>
                  Select a plan
                </div>
                <div style={{ fontSize: '13px', color: 'var(--parchment-muted)' }}>
                  Click a plan on the left to read the conversation
                </div>
              </div>
            </div>
          ) : msgsLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '400px' }}>
              <div style={{ width: 24, height: 24, border: '2px solid var(--terracotta)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--parchment)' }}>
                  {plans.find((p) => p.event_id === selectedPlan)?.event_title}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--parchment-muted)', marginTop: '2px' }}>
                  {messages.length} messages
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 300px)', padding: '12px 0' }}>
                {messages.map((m) => (
                  <div key={m.id} style={{ padding: '8px 20px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    {/* Avatar */}
                    {m.profile_photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.profile_photo_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, marginTop: '2px' }} />
                    ) : (
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: 'var(--parchment-muted)', flexShrink: 0, marginTop: '2px' }}>
                        {m.user_name?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--parchment)' }}>{m.user_name}</span>
                        <span style={{ fontSize: '10px', color: 'var(--parchment-muted)' }}>
                          {new Date(m.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Los_Angeles" })}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--parchment-dim)', lineHeight: 1.5, marginTop: '2px' }}>
                        {m.message_type === 'user' ? (m.content || "(no content)") : (
                          <span style={{ fontStyle: 'italic', color: 'var(--parchment-muted)' }}>{m.content || `[${m.message_type}]`}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {messages.length === 0 && (
                  <div style={{ padding: '32px', textAlign: 'center', fontSize: '13px', color: 'var(--parchment-muted)' }}>
                    No messages in this plan
                  </div>
                )}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
