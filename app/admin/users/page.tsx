"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Card from "@/components/ui/Card";

type User = {
  id: string;
  created_at: string;
  first_name_display: string | null;
  profile_photo_url: string | null;
  bio: string | null;
  gender: string | null;
  onboarding_status: string | null;
  last_active_at: string | null;
  referral_source: string | null;
  phone_number: string | null;
  phone_verified: boolean | null;
  plans_created: number;
  plans_joined: number;
};

type FlaggedUser = {
  id: string;
  first_name_display: string | null;
  handle: string | null;
  email: string | null;
  created_at: string;
  last_active_at: string | null;
  bio: string | null;
  phone_number: string | null;
  profile_photo_url: string | null;
  last_sign_in_at: string | null;
  plans_joined: number;
  messages_sent: number;
  score_never_returned: number;
  score_no_phone: number;
  score_no_bio: number;
  score_rapid_join: number;
  score_active_engagement: number;
  suspicion_score: number;
};

type Filter = "all" | "complete" | "incomplete" | "has_photo" | "no_photo" | "active_7d" | "creators" | "joiners" | "lurking";
type Tab = "all" | "botwatch";

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

const thStyle: React.CSSProperties = {
  padding: '10px 16px',
  textAlign: 'left',
  fontSize: '11px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--parchment-muted)',
  background: 'var(--bg-elevated)',
};

export default function AdminUsersPage() {
  const [tab, setTab] = useState<Tab>("all");
  const [users, setUsers] = useState<User[]>([]);
  const [flaggedUsers, setFlaggedUsers] = useState<FlaggedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [flaggedLoading, setFlaggedLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sortBy, setSortBy] = useState<"created_at" | "last_active_at">("created_at");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [clearingId, setClearingId] = useState<string | null>(null);

  const handleClearBot = useCallback(async (userId: string) => {
    setClearingId(userId);
    try {
      const res = await fetch("/api/admin/users/clear-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        setFlaggedUsers((prev) => prev.filter((u) => u.id !== userId));
      } else {
        alert("Failed to clear user");
      }
    } catch {
      alert("Failed to clear user");
    } finally {
      setClearingId(null);
    }
  }, []);

  const handleDelete = useCallback(async (userId: string) => {
    setDeletingId(userId);
    try {
      const res = await fetch("/api/admin/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        setFlaggedUsers((prev) => prev.filter((u) => u.id !== userId));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete user");
      }
    } catch {
      alert("Failed to delete user");
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  }, []);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));

    fetch("/api/admin/users/flagged")
      .then((r) => r.json())
      .then((d) => setFlaggedUsers(d.users ?? []))
      .catch(console.error)
      .finally(() => setFlaggedLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = users;

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.first_name_display?.toLowerCase().includes(q) ||
          u.id.toLowerCase().includes(q) ||
          u.referral_source?.toLowerCase().includes(q)
      );
    }

    switch (filter) {
      case "complete":
        list = list.filter((u) => u.onboarding_status === "complete");
        break;
      case "incomplete":
        list = list.filter((u) => u.onboarding_status !== "complete");
        break;
      case "has_photo":
        list = list.filter((u) => u.profile_photo_url);
        break;
      case "no_photo":
        list = list.filter((u) => !u.profile_photo_url);
        break;
      case "active_7d": {
        const week = new Date(Date.now() - 7 * 86400000);
        list = list.filter((u) => u.last_active_at && new Date(u.last_active_at) >= week);
        break;
      }
      case "creators":
        list = list.filter((u) => u.plans_created > 0);
        break;
      case "joiners":
        list = list.filter((u) => u.plans_created === 0 && u.plans_joined > 0);
        break;
      case "lurking":
        list = list.filter((u) => u.plans_created === 0 && u.plans_joined === 0);
        break;
    }

    list.sort((a, b) => {
      const aVal = a[sortBy] ?? "";
      const bVal = b[sortBy] ?? "";
      return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
    });

    return list;
  }, [users, search, filter, sortBy]);

  const isLoading = tab === "all" ? loading : flaggedLoading;

  if (isLoading) {
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
      <PageHeader
        title="Users"
        subtitle={tab === "all" ? `${users.length} total` : `${flaggedUsers.length} flagged`}
      />

      {/* Tab Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '24px', borderBottom: '1px solid var(--border)' }}>
        <button
          onClick={() => setTab("all")}
          style={{
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: 500,
            color: tab === "all" ? 'var(--terracotta)' : 'var(--parchment-muted)',
            background: 'none',
            border: 'none',
            borderBottom: tab === "all" ? '2px solid var(--terracotta)' : '2px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.15s',
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          All Users
        </button>
        <button
          onClick={() => setTab("botwatch")}
          style={{
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: 500,
            color: tab === "botwatch" ? 'var(--terracotta)' : 'var(--parchment-muted)',
            background: 'none',
            border: 'none',
            borderBottom: tab === "botwatch" ? '2px solid var(--terracotta)' : '2px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.15s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          Bot Watch
          {flaggedUsers.length > 0 && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '20px',
              height: '20px',
              padding: '0 6px',
              fontSize: '11px',
              fontWeight: 700,
              color: 'white',
              background: 'var(--error)',
              borderRadius: '20px',
            }}>
              {flaggedUsers.length}
            </span>
          )}
        </button>
      </div>

      {tab === "all" ? (
        <>
          {/* Filters */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="Search name, ID, or referral source..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...inputStyle, width: '288px' }}
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as Filter)}
              style={inputStyle}
            >
              <option value="all">All Users</option>
              <option value="complete">Onboarding Complete</option>
              <option value="incomplete">Incomplete Onboarding</option>
              <option value="has_photo">Has Photo</option>
              <option value="no_photo">No Photo</option>
              <option value="active_7d">Active (Last 7 Days)</option>
              <option value="creators">Creators</option>
              <option value="joiners">Joiners Only</option>
              <option value="lurking">Lurking</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "created_at" | "last_active_at")}
              style={inputStyle}
            >
              <option value="created_at">Sort: Newest First</option>
              <option value="last_active_at">Sort: Recently Active</option>
            </select>
            <span style={{ fontSize: '11px', color: 'var(--parchment-muted)', marginLeft: 'auto' }}>
              Showing {filtered.length} results
            </span>
          </div>

          {/* Users Table */}
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={thStyle}>User</th>
                    <th style={thStyle}>Gender</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Activity</th>
                    <th style={thStyle}>Signed Up</th>
                    <th style={thStyle}>Last Active</th>
                    <th style={thStyle}>Source</th>
                    <th style={thStyle}>SMS</th>
                    <th style={{ ...thStyle, width: '80px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {u.profile_photo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={u.profile_photo_url} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--parchment-muted)', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                              {u.first_name_display?.[0]?.toUpperCase() || "?"}
                            </div>
                          )}
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 500, color: 'var(--parchment)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {u.first_name_display || "No name"}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--parchment-muted)' }}>{u.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '10px 16px', color: 'var(--parchment-dim)', textTransform: 'capitalize' }}>{u.gender || "—"}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{
                          display: 'inline-flex',
                          fontSize: '10px',
                          fontWeight: 500,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          padding: '3px 10px',
                          borderRadius: '20px',
                          background: u.onboarding_status === "complete" ? 'rgba(46,125,50,0.1)' : 'rgba(232,154,32,0.12)',
                          color: u.onboarding_status === "complete" ? 'var(--success)' : 'var(--warning)',
                        }}>
                          {u.onboarding_status === "complete" ? "Complete" : "Incomplete"}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        {(() => {
                          const created = u.plans_created;
                          const joined = u.plans_joined;
                          let label: string;
                          let bg: string;
                          let color: string;
                          if (created > 0) {
                            label = "Creator";
                            bg = 'rgba(217,119,70,0.12)';
                            color = 'var(--terracotta)';
                          } else if (joined > 0) {
                            label = "Joiner";
                            bg = 'rgba(46,125,50,0.1)';
                            color = 'var(--success)';
                          } else {
                            label = "Lurking";
                            bg = 'rgba(255,255,255,0.04)';
                            color = 'var(--parchment-muted)';
                          }
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-start' }}>
                              <span style={{
                                display: 'inline-flex',
                                fontSize: '10px',
                                fontWeight: 500,
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                padding: '3px 10px',
                                borderRadius: '20px',
                                background: bg,
                                color,
                              }}>
                                {label}
                              </span>
                              {(created > 0 || joined > 0) && (
                                <span style={{ fontSize: '10px', color: 'var(--parchment-muted)' }}>
                                  {created > 0 && `${created} made`}
                                  {created > 0 && joined > 0 && ' · '}
                                  {joined > 0 && `${joined} joined`}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td style={{ padding: '10px 16px', color: 'var(--parchment-dim)' }}>
                        {new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/Los_Angeles" })}
                      </td>
                      <td style={{ padding: '10px 16px', color: 'var(--parchment-dim)' }}>
                        {u.last_active_at ? new Date(u.last_active_at).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Los_Angeles" }) : "—"}
                      </td>
                      <td style={{ padding: '10px 16px', color: 'var(--parchment-dim)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {u.referral_source || "—"}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        {u.phone_number && u.phone_verified ? (
                          <span style={{ color: 'var(--success)' }}>✓</span>
                        ) : (
                          <span style={{ color: 'var(--parchment-muted)' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        {confirmId === u.id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              onClick={() => handleDelete(u.id)}
                              disabled={deletingId === u.id}
                              style={{
                                fontSize: '11px', fontWeight: 700, color: 'white',
                                background: 'var(--error)', padding: '4px 10px',
                                borderRadius: '24px', border: 'none', cursor: 'pointer',
                                opacity: deletingId === u.id ? 0.5 : 1,
                              }}
                            >
                              {deletingId === u.id ? "..." : "Yes"}
                            </button>
                            <button
                              onClick={() => setConfirmId(null)}
                              style={{
                                fontSize: '11px', fontWeight: 500, color: 'var(--parchment-dim)',
                                padding: '4px 8px', borderRadius: '24px',
                                border: 'none', background: 'none', cursor: 'pointer',
                              }}
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmId(u.id)}
                            style={{
                              fontSize: '11px', fontWeight: 500, color: 'var(--error)',
                              padding: '4px 10px', borderRadius: '24px',
                              border: 'none', background: 'rgba(198,40,40,0.08)',
                              cursor: 'pointer', transition: 'background 0.15s',
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : (
        <>
          {/* Bot Watch Tab */}
          {flaggedUsers.length === 0 ? (
            <Card style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'rgba(46,125,50,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px',
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', fontWeight: 700, color: 'var(--parchment)', marginBottom: '4px' }}>
                No suspicious accounts detected
              </div>
              <div style={{ fontSize: '13px', color: 'var(--parchment-muted)' }}>
                All clear — no accounts currently meet the flagging threshold.
              </div>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {flaggedUsers.map((u) => (
                <Card key={u.id} style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                    {/* Left: Avatar + Info */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', minWidth: 0, flex: 1 }}>
                      {u.profile_photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={u.profile_photo_url} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--parchment-muted)', fontSize: '14px', fontWeight: 700, flexShrink: 0 }}>
                          {u.first_name_display?.[0]?.toUpperCase() || "?"}
                        </div>
                      )}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 500, color: 'var(--parchment)' }}>
                            {u.first_name_display || "No name"}
                          </span>
                          {u.handle && (
                            <span style={{ fontSize: '12px', color: 'var(--parchment-muted)' }}>@{u.handle}</span>
                          )}
                          <span style={{
                            display: 'inline-flex', alignItems: 'center',
                            padding: '2px 8px', fontSize: '11px', fontWeight: 700,
                            color: 'white', background: 'var(--terracotta)',
                            borderRadius: '20px',
                          }}>
                            {u.suspicion_score} pts
                          </span>
                        </div>

                        {u.email && (
                          <div style={{ fontSize: '12px', color: 'var(--parchment-muted)', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                        )}

                        {/* Signal Chips */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                          {u.score_never_returned > 0 && (
                            <span style={{ display: 'inline-flex', fontSize: '10px', fontWeight: 500, padding: '3px 10px', borderRadius: '20px', background: 'rgba(198,40,40,0.1)', color: 'var(--error)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                              Never returned +3
                            </span>
                          )}
                          {u.score_rapid_join > 0 && (
                            <span style={{ display: 'inline-flex', fontSize: '10px', fontWeight: 500, padding: '3px 10px', borderRadius: '20px', background: 'rgba(198,40,40,0.1)', color: 'var(--error)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                              Rapid joins +3
                            </span>
                          )}
                          {u.score_no_phone > 0 && (
                            <span style={{ display: 'inline-flex', fontSize: '10px', fontWeight: 500, padding: '3px 10px', borderRadius: '20px', background: 'rgba(232,154,32,0.12)', color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                              No phone +1
                            </span>
                          )}
                          {u.score_no_bio > 0 && (
                            <span style={{ display: 'inline-flex', fontSize: '10px', fontWeight: 500, padding: '3px 10px', borderRadius: '20px', background: 'rgba(232,154,32,0.12)', color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                              No bio +1
                            </span>
                          )}
                        </div>

                        {/* Stats Row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px', color: 'var(--parchment-muted)' }}>
                          <span>Joined {new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/Los_Angeles" })}</span>
                          <span>{u.plans_joined} plan{u.plans_joined !== 1 ? "s" : ""} joined</span>
                          <span>{u.messages_sent} message{u.messages_sent !== 1 ? "s" : ""} sent</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* Clear from Bot Watch */}
                      <button
                        onClick={() => handleClearBot(u.id)}
                        disabled={clearingId === u.id}
                        style={{
                          fontSize: '11px', fontWeight: 500, color: 'var(--success)',
                          padding: '6px 14px', borderRadius: '24px',
                          border: '1px solid rgba(46,125,50,0.3)', background: 'none',
                          cursor: 'pointer', transition: 'opacity 0.15s',
                          opacity: clearingId === u.id ? 0.5 : 1,
                        }}
                      >
                        {clearingId === u.id ? "..." : "Not a Bot"}
                      </button>

                      {/* Delete & Ban */}
                      {confirmId === u.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => handleDelete(u.id)}
                            disabled={deletingId === u.id}
                            style={{
                              fontSize: '11px', fontWeight: 700, color: 'white',
                              background: 'var(--error)', padding: '6px 14px',
                              borderRadius: '24px', border: 'none', cursor: 'pointer',
                              opacity: deletingId === u.id ? 0.5 : 1,
                            }}
                          >
                            {deletingId === u.id ? "..." : "Confirm"}
                          </button>
                          <button
                            onClick={() => setConfirmId(null)}
                            style={{
                              fontSize: '11px', fontWeight: 500, color: 'var(--parchment-dim)',
                              padding: '6px 10px', borderRadius: '24px',
                              border: 'none', background: 'none', cursor: 'pointer',
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmId(u.id)}
                          style={{
                            fontSize: '11px', fontWeight: 600, color: 'white',
                            background: 'var(--error)', padding: '6px 14px',
                            borderRadius: '24px', border: 'none', cursor: 'pointer',
                            transition: 'opacity 0.15s',
                          }}
                        >
                          Delete & Ban
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
