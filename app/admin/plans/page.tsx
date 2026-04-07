"use client";

import { useEffect, useState, useMemo } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Card from "@/components/ui/Card";

type Plan = {
  id: string;
  created_at: string;
  title: string;
  description: string | null;
  location_text: string | null;
  start_time: string | null;
  status: string;
  member_count: number;
  max_invites: number | null;
  primary_vibe: string | null;
  gender_rule: string | null;
  creator_user_id: string;
  creator_name: string;
};

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  forming: { bg: 'rgba(21,101,192,0.1)', color: '#1565C0' },
  active: { bg: 'rgba(46,125,50,0.1)', color: 'var(--success)' },
  full: { bg: 'rgba(232,154,32,0.12)', color: 'var(--warning)' },
  completed: { bg: 'rgba(155,139,122,0.15)', color: 'var(--parchment-muted)' },
  cancelled: { bg: 'rgba(198,40,40,0.1)', color: 'var(--error)' },
  draft: { bg: 'var(--bg-elevated)', color: 'var(--parchment-dim)' },
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

const inputStyle: React.CSSProperties = {
  background: 'var(--bg-input)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  padding: '8px 14px',
  fontSize: '13px',
  color: 'var(--parchment)',
  outline: 'none',
  fontFamily: 'DM Sans, sans-serif',
  width: '288px',
};

function PlanTable({ plans }: { plans: Plan[] }) {
  if (plans.length === 0) {
    return <p style={{ fontSize: '13px', color: 'var(--parchment-muted)', padding: '16px' }}>No plans in this section.</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th style={thStyle}>Plan</th>
            <th style={thStyle}>Creator</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Members</th>
            <th style={thStyle}>Vibe</th>
            <th style={thStyle}>Date</th>
            <th style={thStyle}>Created</th>
          </tr>
        </thead>
        <tbody>
          {plans.map((p) => (
            <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <td style={{ padding: '10px 16px' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 500, color: 'var(--parchment)', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                  {p.location_text && (
                    <div style={{ fontSize: '10px', color: 'var(--parchment-muted)', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.location_text}</div>
                  )}
                </div>
              </td>
              <td style={{ padding: '10px 16px', color: 'var(--parchment-dim)' }}>{p.creator_name}</td>
              <td style={{ padding: '10px 16px' }}>
                <span style={{
                  display: 'inline-flex',
                  fontSize: '10px',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  ...(STATUS_STYLES[p.status] || STATUS_STYLES.draft),
                }}>
                  {p.status}
                </span>
              </td>
              <td style={{ padding: '10px 16px' }}>
                <span style={{ fontWeight: 700, color: 'var(--terracotta)' }}>{p.member_count}</span>
                <span style={{ color: 'var(--parchment-muted)' }}>/{(p.max_invites ?? 6) + 1}</span>
              </td>
              <td style={{ padding: '10px 16px', color: 'var(--parchment-dim)', textTransform: 'capitalize' }}>{p.primary_vibe || "—"}</td>
              <td style={{ padding: '10px 16px', color: 'var(--parchment-dim)' }}>
                {p.start_time
                  ? new Date(p.start_time).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
                  : "—"}
              </td>
              <td style={{ padding: '10px 16px', color: 'var(--parchment-dim)' }}>
                {new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pastExpanded, setPastExpanded] = useState(false);

  useEffect(() => {
    fetch("/api/admin/plans")
      .then((r) => r.json())
      .then((d) => setPlans(d.plans ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const { live, drafts, past } = useMemo(() => {
    const q = search.toLowerCase();

    const matches = (p: Plan) =>
      !q ||
      p.title?.toLowerCase().includes(q) ||
      p.creator_name?.toLowerCase().includes(q) ||
      p.location_text?.toLowerCase().includes(q);

    const liveStatuses = new Set(["forming", "active", "full"]);
    const pastStatuses = new Set(["completed", "cancelled"]);

    const live = plans
      .filter((p) => liveStatuses.has(p.status) && matches(p))
      .sort((a, b) => {
        if (!a.start_time) return 1;
        if (!b.start_time) return -1;
        return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
      });

    const drafts = plans
      .filter((p) => p.status === "draft" && matches(p))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const past = plans
      .filter((p) => pastStatuses.has(p.status) && matches(p))
      .sort((a, b) => {
        if (!a.start_time) return 1;
        if (!b.start_time) return -1;
        return new Date(b.start_time).getTime() - new Date(a.start_time).getTime();
      });

    return { live, drafts, past };
  }, [plans, search]);

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
      <PageHeader title="Plans" subtitle={`${plans.length} total`} />

      <div style={{ marginBottom: '24px' }}>
        <input
          type="text"
          placeholder="Search by title, creator, or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* Live & Upcoming */}
      <div style={{ marginBottom: '24px' }}>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 16px 8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} />
            <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--terracotta)' }}>
              Live & Upcoming
            </span>
            <span style={{ fontSize: '11px', color: 'var(--parchment-muted)' }}>({live.length})</span>
          </div>
          <PlanTable plans={live} />
        </Card>
      </div>

      {/* Drafts */}
      <div style={{ marginBottom: '24px' }}>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 16px 8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--parchment-muted)' }} />
            <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--parchment-dim)' }}>
              Drafts
            </span>
            <span style={{ fontSize: '11px', color: 'var(--parchment-muted)' }}>({drafts.length})</span>
          </div>
          <PlanTable plans={drafts} />
        </Card>
      </div>

      {/* Past (collapsed by default) */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <button
          onClick={() => setPastExpanded((v) => !v)}
          style={{
            width: '100%',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textAlign: 'left',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border)' }} />
          <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--parchment-muted)' }}>
            Past
          </span>
          <span style={{ fontSize: '11px', color: 'var(--parchment-muted)' }}>({past.length})</span>
          <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--parchment-muted)' }}>{pastExpanded ? "▲ hide" : "▼ show"}</span>
        </button>
        {pastExpanded && <PlanTable plans={past} />}
      </Card>
    </div>
  );
}
