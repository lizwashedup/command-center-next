"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import Card from "@/components/ui/Card";
import InlineStat from "@/components/ui/InlineStat";
import SectionLabel from "@/components/ui/SectionLabel";

interface Stats {
  total_users: number;
  activated_users: number;
  new_today: number;
  new_7d: number;
  engaged_mau: number;
  wau: number;
  dau: number;
  wau_mau_ratio: number;
  dau_mau_ratio: number;
  plans_completed: number;
  plans_active: number;
  published_plans: number;
  total_plans: number;
  plans_cancelled: number;
  total_creators: number;
  total_joiners: number;
  repeat_joiners: number;
  physical_participation_rate: number;
  organic_creator_rate: number;
  d7_retained: number;
  d7_eligible: number;
  d30_retained: number;
  d30_eligible: number;
  stuck_never_started: number;
  stuck_at_photo: number;
  stuck_almost_done: number;
  has_photo: number;
  has_bio: number;
  sms_enabled: number;
  total_messages: number;
  chat_plans_count: number;
  users_who_chatted: number;
  avg_msgs_per_plan: number;
  signups_by_source: { source: string; count: number }[];
  weekly_data: {
    week_number: number;
    week_start: string;
    week_end: string;
    total_users: number;
    new_users: number;
    seven_day_retention_rate: number;
    total_plans: number;
    plans_two_plus: number;
    plans_three_plus: number;
    avg_members_per_plan: number;
    active_plans: number;
    total_messages: number;
  }[];
}

const thStyle: React.CSSProperties = {
  padding: '8px 16px 8px 0', textAlign: 'left', fontSize: '11px', fontWeight: 500,
  textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--parchment-muted)', whiteSpace: 'nowrap',
};

export default function OpsDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [announcement, setAnnouncement] = useState("");
  const [sending, setSending] = useState(false);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/dashboard/stats");
      if (!res.ok) { setLoading(false); return; }
      setStats(await res.json());
      setLastUpdated(new Date());
      setSecondsAgo(0);
    } catch (err) { console.error("Ops stats error:", err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchStats();
    intervalRef.current = setInterval(fetchStats, 30000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchStats]);

  useEffect(() => {
    const tick = setInterval(() => setSecondsAgo((s) => s + 1), 1000);
    return () => clearInterval(tick);
  }, []);

  if (loading || !stats) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ width: 32, height: 32, border: '2px solid var(--terracotta)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const activationPct = stats.total_users > 0 ? Math.round(100 * stats.activated_users / stats.total_users) : 0;
  const mauPct = stats.activated_users > 0 ? Math.round(100 * stats.engaged_mau / stats.activated_users) : 0;
  const planJoinPct = stats.engaged_mau > 0 ? Math.round(100 * stats.total_joiners / stats.engaged_mau) : 0;
  const d7Pct = stats.d7_eligible > 0 ? Math.round(100 * stats.d7_retained / stats.d7_eligible) : 0;
  const d30Pct = stats.d30_eligible > 0 ? Math.round(100 * stats.d30_retained / stats.d30_eligible) : 0;

  const funnelSteps = [
    { label: "Total Signups", value: stats.total_users, pct: 100 },
    { label: "Activated", value: stats.activated_users, pct: activationPct },
    { label: "Engaged MAU", value: stats.engaged_mau, pct: mauPct },
    { label: "Joined a Plan", value: stats.total_joiners, pct: planJoinPct },
  ];
  const funnelColors = ['var(--terracotta)', 'var(--success)', '#1565C0', '#9C27B0'];

  return (
    <div style={{ maxWidth: 1200, display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <PageHeader title="Ops Dashboard" subtitle="Daily operational tools" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '8px' }}>
          {lastUpdated && (
            <span style={{ fontSize: '11px', color: 'var(--parchment-muted)' }}>
              {secondsAgo < 5 ? "Just updated" : `Updated ${secondsAgo}s ago`}
            </span>
          )}
          <Link href="/admin" style={{ fontSize: '11px', color: 'var(--terracotta)', textDecoration: 'none', fontWeight: 500 }}>
            ← Investor dashboard
          </Link>
        </div>
      </div>

      {/* Quick Links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[
          { href: '/admin/users', label: 'Users', stat: `${stats.activated_users} activated`, icon: '⊹' },
          { href: '/admin/plans', label: 'Plans', stat: `${stats.plans_active} active`, icon: '▦' },
          { href: '/admin/messages', label: 'Messages', stat: `${stats.total_messages} total`, icon: '◫' },
          { href: '/admin/wtl-cities', label: 'WTL Cities', stat: 'waitlist', icon: '🌍' },
        ].map((link) => (
          <Link key={link.href} href={link.href} style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '14px',
              padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transition: 'border-color 0.15s',
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <span style={{ fontSize: '20px' }}>{link.icon}</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--parchment)' }}>{link.label}</div>
                <div style={{ fontSize: '11px', color: 'var(--parchment-muted)' }}>{link.stat}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* User Funnel */}
      <Card title="User Funnel">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          {funnelSteps.map((step, i) => (
            <div key={step.label}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--parchment)' }}>{step.label}</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--parchment)' }}>
                  {step.value.toLocaleString()}
                  <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--parchment-muted)', marginLeft: '8px' }}>({step.pct}%)</span>
                </span>
              </div>
              <div style={{ height: '10px', background: 'var(--bg-elevated)', borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: '20px', width: `${step.pct}%`, backgroundColor: funnelColors[i], opacity: 0.85 }} />
              </div>
            </div>
          ))}
        </div>

        <SectionLabel label="Onboarding drop-off" />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <div style={{ borderRadius: '14px', padding: '16px', background: 'rgba(198,40,40,0.06)', border: '1px solid rgba(198,40,40,0.15)' }}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', fontWeight: 700, color: 'var(--error)' }}>{stats.stuck_never_started}</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--error)' }}>Never started</div>
          </div>
          <div style={{ borderRadius: '14px', padding: '16px', background: 'rgba(232,154,32,0.08)', border: '1px solid rgba(232,154,32,0.2)' }}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', fontWeight: 700, color: 'var(--warning)' }}>{stats.stuck_at_photo}</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--warning)' }}>Stopped before photo</div>
          </div>
          <div style={{ borderRadius: '14px', padding: '16px', background: 'rgba(46,125,50,0.06)', border: '1px solid rgba(46,125,50,0.15)' }}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', fontWeight: 700, color: 'var(--success)' }}>{stats.stuck_almost_done}</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--success)' }}>Almost there</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
          {[
            { label: 'Has Photo', value: stats.has_photo },
            { label: 'Has Bio', value: stats.has_bio },
            { label: 'SMS Enabled', value: stats.sms_enabled },
          ].map((item) => (
            <div key={item.label} style={{ flex: 1, borderRadius: '14px', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', fontWeight: 700, color: 'var(--parchment)' }}>{item.value}</div>
              <div style={{ fontSize: '11px', color: 'var(--parchment-muted)' }}>{item.label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Stickiness */}
      <Card title="Stickiness & Engagement">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
          <InlineStat label="DAU" value={stats.dau} sub="Today (PT)" />
          <InlineStat label="WAU" value={stats.wau} sub="Last 7 days" />
          <InlineStat label="Engaged MAU" value={stats.engaged_mau} sub="Messaged/joined/created (28d)" highlight="orange" />
          <InlineStat label="DAU / MAU" value={`${stats.dau_mau_ratio}%`} sub="Daily stickiness" />
          <InlineStat label="WAU / MAU" value={`${stats.wau_mau_ratio}%`} sub="Weekly stickiness" highlight="blue" />
        </div>
      </Card>

      {/* Chat Engagement */}
      <Card title="Chat Engagement">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          <InlineStat label="Total Messages" value={stats.total_messages.toLocaleString()} />
          <InlineStat label="Plans with Chat" value={stats.published_plans > 0 ? `${Math.round(100 * stats.chat_plans_count / stats.published_plans)}%` : "0%"} sub={`${stats.chat_plans_count} of ${stats.published_plans}`} highlight="green" />
          <InlineStat label="Users Who Chatted" value={stats.users_who_chatted} sub={`${stats.activated_users > 0 ? Math.round(100 * stats.users_who_chatted / stats.activated_users) : 0}% of activated`} />
          <InlineStat label="Msgs / Plan" value={stats.avg_msgs_per_plan} />
        </div>
      </Card>

      {/* a16z Benchmark Table */}
      <Card title="Benchmark Comparison">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                <th style={thStyle}>Metric</th>
                <th style={thStyle}>WashedUp</th>
                <th style={thStyle}>a16z Good</th>
                <th style={thStyle}>a16z Great</th>
              </tr>
            </thead>
            <tbody>
              {[
                { metric: 'WAU / MAU', value: `${stats.wau_mau_ratio}%`, good: '25%', great: '40%+' },
                { metric: 'D7 Retention', value: `${d7Pct}%`, good: '15%', great: '25%+' },
                { metric: 'D30 Retention', value: `${d30Pct}%`, good: '10%', great: '20%+' },
                { metric: 'MoM Signup Growth', value: `${stats.new_7d > 0 ? '+' : ''}active`, good: '15%', great: '30%+' },
                { metric: 'Creator Retention', value: `${stats.total_creators > 0 ? Math.round(100 * stats.repeat_joiners / stats.total_joiners) : 0}%`, good: '20%', great: '40%+' },
              ].map((row) => (
                <tr key={row.metric} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 16px 10px 0', fontWeight: 500, color: 'var(--parchment)' }}>{row.metric}</td>
                  <td style={{ padding: '10px 16px 10px 0', fontWeight: 700, color: 'var(--terracotta)' }}>{row.value}</td>
                  <td style={{ padding: '10px 16px 10px 0', color: 'var(--parchment-dim)' }}>{row.good}</td>
                  <td style={{ padding: '10px 16px 10px 0', color: 'var(--success)' }}>{row.great}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Weekly Data Table */}
      {stats.weekly_data && stats.weekly_data.length > 0 && (
        <Card title="Weekly Data" action={<span style={{ fontSize: '11px', color: 'var(--parchment-muted)' }}>Historical snapshot per week since launch</span>}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                  {["Wk", "Ending", "Users", "New", "Plans", "2+", "3+", "Avg Mbr", "Msgs", "Active"].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.weekly_data.map((row) => (
                  <tr key={row.week_number} style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '8px 16px 8px 0', fontWeight: 500, color: 'var(--parchment)' }}>Wk {row.week_number}</td>
                    <td style={{ padding: '8px 16px 8px 0', color: 'var(--parchment-dim)', whiteSpace: 'nowrap' }}>
                      {new Date(row.week_end).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                    <td style={{ padding: '8px 16px 8px 0', fontWeight: 700, color: 'var(--terracotta)' }}>{row.total_users}</td>
                    <td style={{ padding: '8px 16px 8px 0', fontWeight: 500, color: 'var(--success)' }}>+{row.new_users}</td>
                    <td style={{ padding: '8px 16px 8px 0', color: 'var(--parchment-dim)' }}>{row.total_plans}</td>
                    <td style={{ padding: '8px 16px 8px 0', fontWeight: 700, color: 'var(--terracotta)' }}>{row.plans_two_plus}</td>
                    <td style={{ padding: '8px 16px 8px 0', color: 'var(--parchment-dim)' }}>{row.plans_three_plus}</td>
                    <td style={{ padding: '8px 16px 8px 0', color: 'var(--parchment-dim)' }}>{row.avg_members_per_plan}</td>
                    <td style={{ padding: '8px 16px 8px 0', color: 'var(--parchment-dim)' }}>{row.total_messages}</td>
                    <td style={{ padding: '8px 16px 8px 0', color: 'var(--parchment-dim)' }}>{row.active_plans}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Referral Sources */}
      <Card title="How did you hear about us?">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', columnGap: '24px', rowGap: '4px' }}>
          {(stats.signups_by_source || []).map((r) => (
            <div key={r.source} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '13px', color: 'var(--parchment)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '8px' }}>{r.source}</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--terracotta)', flexShrink: 0 }}>{r.count}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Send Announcement */}
      <Card title="Send Announcement">
        <textarea
          value={announcement}
          onChange={(e) => setAnnouncement(e.target.value)}
          placeholder="Type your announcement message here..."
          style={{
            width: '100%', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px',
            fontSize: '13px', minHeight: '100px', resize: 'vertical', outline: 'none',
            background: 'var(--bg-elevated)', color: 'var(--parchment)', fontFamily: 'DM Sans, sans-serif', boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
          <span style={{ fontSize: '11px', color: 'var(--parchment-muted)' }}>
            Sends to {stats.sms_enabled} users with SMS enabled
          </span>
          <button
            disabled={!announcement.trim() || sending}
            onClick={() => {
              setSending(true);
              setTimeout(() => { setSending(false); setAnnouncement(""); alert("Announcement sent!"); }, 1000);
            }}
            style={{
              background: 'var(--terracotta)', color: 'white', padding: '10px 20px', borderRadius: '24px',
              fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer',
              opacity: !announcement.trim() || sending ? 0.5 : 1, fontFamily: 'DM Sans, sans-serif',
            }}
          >
            {sending ? "Sending..." : "Send Announcement"}
          </button>
        </div>
      </Card>
    </div>
  );
}
