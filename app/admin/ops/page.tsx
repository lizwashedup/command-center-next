"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import Card from "@/components/ui/Card";
import InlineStat from "@/components/ui/InlineStat";
import SectionLabel from "@/components/ui/SectionLabel";
import InfoBox from "@/components/ui/InfoBox";

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
  unengaged_wau: number;
  unengaged_mau: number;
  unengaged_wau_mau_ratio: number;
  plans_completed: number;
  plans_active: number;
  published_plans: number;
  total_plans: number;
  plans_cancelled: number;
  total_creators: number;
  creator_retention_rate: number;
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

const noteStyle: React.CSSProperties = {
  fontSize: '10px', color: 'var(--parchment-dim)', lineHeight: 1.4, marginTop: '4px',
};

function Note({ children }: { children: React.ReactNode }) {
  return <div style={noteStyle}>{children}</div>;
}

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
    { label: "Total Signups", value: stats.total_users, pct: 100, note: "COUNT(*) FROM profiles. Every account ever created." },
    { label: "Activated", value: stats.activated_users, pct: activationPct, note: "profiles WHERE onboarding_status = 'complete'. Finished name, gender, photo, vibes." },
    { label: "Engaged MAU", value: stats.engaged_mau, pct: mauPct, note: "Unique users who sent a message, joined a plan, OR created a plan in the last 28 days. Joined to activated profiles only." },
    { label: "Joined a Plan", value: stats.total_joiners, pct: planJoinPct, note: "COUNT(DISTINCT user_id) FROM event_members WHERE status = 'joined'. All-time, any plan." },
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
              <Note>{step.note}</Note>
            </div>
          ))}
        </div>

        <SectionLabel label="Onboarding drop-off" />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <div style={{ borderRadius: '14px', padding: '16px', background: 'rgba(198,40,40,0.06)', border: '1px solid rgba(198,40,40,0.15)' }}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', fontWeight: 700, color: 'var(--error)' }}>{stats.stuck_never_started}</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--error)' }}>Never started</div>
            <Note>onboarding_status != &apos;complete&apos; AND first_name_display IS NULL AND gender IS NULL AND profile_photo_url IS NULL. Signed up but never entered any info.</Note>
          </div>
          <div style={{ borderRadius: '14px', padding: '16px', background: 'rgba(232,154,32,0.08)', border: '1px solid rgba(232,154,32,0.2)' }}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', fontWeight: 700, color: 'var(--warning)' }}>{stats.stuck_at_photo}</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--warning)' }}>Stopped before photo</div>
            <Note>onboarding_status != &apos;complete&apos; AND first_name_display IS NOT NULL AND profile_photo_url IS NULL. Entered name/gender but didn&apos;t upload a photo.</Note>
          </div>
          <div style={{ borderRadius: '14px', padding: '16px', background: 'rgba(46,125,50,0.06)', border: '1px solid rgba(46,125,50,0.15)' }}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', fontWeight: 700, color: 'var(--success)' }}>{stats.stuck_almost_done}</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--success)' }}>Almost there</div>
            <Note>onboarding_status != &apos;complete&apos; AND profile_photo_url IS NOT NULL. Has a photo but didn&apos;t finish the flow (vibes step).</Note>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
          <div style={{ flex: 1, borderRadius: '14px', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', fontWeight: 700, color: 'var(--parchment)' }}>{stats.has_photo}</div>
            <div style={{ fontSize: '11px', color: 'var(--parchment-muted)' }}>Has Photo</div>
            <Note>profile_photo_url IS NOT NULL. All users, not just activated.</Note>
          </div>
          <div style={{ flex: 1, borderRadius: '14px', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', fontWeight: 700, color: 'var(--parchment)' }}>{stats.has_bio}</div>
            <div style={{ fontSize: '11px', color: 'var(--parchment-muted)' }}>Has Bio</div>
            <Note>bio IS NOT NULL AND bio != &apos;&apos;. All users.</Note>
          </div>
          <div style={{ flex: 1, borderRadius: '14px', padding: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', fontWeight: 700, color: 'var(--parchment)' }}>{stats.sms_enabled}</div>
            <div style={{ fontSize: '11px', color: 'var(--parchment-muted)' }}>SMS Enabled</div>
            <Note>phone_number IS NOT NULL AND phone_verified = true.</Note>
          </div>
        </div>

        <InfoBox>
          <strong>Data source:</strong> All funnel numbers come from the profiles table via the get_command_center_stats() RPC. Percentages use the row above as denominator. Engaged MAU uses a UNION of messages, event_members, and events tables — only counting activated profiles.
        </InfoBox>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginTop: '4px' }}>
          <Note>Activated users with last_active_at since PT midnight today.</Note>
          <Note>Engaged users (messaged/joined/created) in last 7 days. Same definition as MAU but 7-day window.</Note>
          <Note>UNION of: message senders + plan joiners + plan creators in 28d, filtered to activated profiles.</Note>
          <Note>DAU / Engaged MAU × 100. a16z benchmark: &gt;25% is good.</Note>
          <Note>WAU / Engaged MAU × 100. a16z benchmark: &gt;40% is great. Ours: {stats.wau_mau_ratio}%.</Note>
        </div>
        <InfoBox>
          <strong>Why &quot;Engaged MAU&quot; not just &quot;MAU&quot;:</strong> Standard MAU counts anyone who opened the app. For an IRL social app, app opens are meaningless — what matters is whether users messaged, joined a plan, or created a plan. This is a stricter definition that gives a more honest picture. DAU still uses last_active_at (any app open) because that&apos;s the standard daily metric.
        </InfoBox>
      </Card>

      {/* Chat Engagement */}
      <Card title="Chat Engagement">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          <InlineStat label="Total Messages" value={stats.total_messages.toLocaleString()} />
          <InlineStat label="Plans with Chat" value={stats.published_plans > 0 ? `${Math.round(100 * stats.chat_plans_count / stats.published_plans)}%` : "0%"} sub={`${stats.chat_plans_count} of ${stats.published_plans}`} highlight="green" />
          <InlineStat label="Users Who Chatted" value={stats.users_who_chatted} sub={`${stats.activated_users > 0 ? Math.round(100 * stats.users_who_chatted / stats.activated_users) : 0}% of activated`} />
          <InlineStat label="Msgs / Plan" value={stats.avg_msgs_per_plan} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '4px' }}>
          <Note>COUNT(*) FROM messages WHERE message_type = &apos;user&apos;. Excludes system messages (joins, location shares).</Note>
          <Note>COUNT(DISTINCT event_id) from user messages / total published plans (status != &apos;draft&apos;).</Note>
          <Note>COUNT(DISTINCT user_id) from user messages. Percentage uses activated users as denominator.</Note>
          <Note>Total user messages / plans that have at least 1 message. Average chat depth per active plan.</Note>
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
                <th style={{ ...thStyle, fontWeight: 400, fontStyle: 'italic' }}>How We Calculate</th>
              </tr>
            </thead>
            <tbody>
              {[
                { metric: 'WAU / MAU', value: `${stats.wau_mau_ratio}%`, good: '25%', great: '40%+', how: 'Engaged WAU / Engaged MAU. Both use messaged/joined/created definition.' },
                { metric: 'D7 Retention', value: stats.d7_eligible >= 30 ? `${d7Pct}%` : 'Collecting...', good: '15%', great: '25%+', how: 'Classic retention. Session on days 6-8 after signup. Post-March-30 cohort only. Accurate by ~April 13.' },
                { metric: 'D30 Retention', value: stats.d30_eligible >= 30 ? `${d30Pct}%` : 'Collecting...', good: '10%', great: '20%+', how: 'Classic retention. Session on days 29-31 after signup. Post-March-30 cohort only. Accurate by ~April 29.' },
                { metric: 'Creator Retention', value: `${stats.creator_retention_rate}%`, good: '20%', great: '40%+', how: 'Creators with 2+ published plans / total creators. Supply-side retention.' },
              ].map((row) => (
                <tr key={row.metric} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 16px 10px 0', fontWeight: 500, color: 'var(--parchment)' }}>{row.metric}</td>
                  <td style={{ padding: '10px 16px 10px 0', fontWeight: 700, color: 'var(--terracotta)' }}>{row.value}</td>
                  <td style={{ padding: '10px 16px 10px 0', color: 'var(--parchment-dim)' }}>{row.good}</td>
                  <td style={{ padding: '10px 16px 10px 0', color: 'var(--success)' }}>{row.great}</td>
                  <td style={{ padding: '10px 16px 10px 0', fontSize: '11px', color: 'var(--parchment-dim)', maxWidth: '280px' }}>{row.how}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <InfoBox>
          <strong>Source:</strong> a16z benchmarks from &quot;16 Startup Metrics&quot; (Andreessen Horowitz). Retention benchmarks from AppsFlyer 2025 App Retention Report. Our retention uses session-based classic/unbounded measurement (industry standard). D7 and D30 will show real numbers once enough post-March-30 users reach those windows.
        </InfoBox>
      </Card>

      {/* Weekly Data Table */}
      {stats.weekly_data && stats.weekly_data.length > 0 && (() => {
        const wd = stats.weekly_data;
        const weeks = wd.map((row, i) => {
          const prev = i > 0 ? wd[i - 1] : null;
          return {
            ...row,
            new_plans: prev ? row.total_plans - prev.total_plans : row.total_plans,
            new_2plus: prev ? row.plans_two_plus - prev.plans_two_plus : row.plans_two_plus,
            new_3plus: prev ? row.plans_three_plus - prev.plans_three_plus : row.plans_three_plus,
            new_msgs: prev ? row.total_messages - prev.total_messages : row.total_messages,
          };
        });
        const last = wd[wd.length - 1];
        return (
          <Card title="Weekly Data" action={<span style={{ fontSize: '11px', color: 'var(--parchment-muted)' }}>Per-week numbers, not cumulative</span>}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                    {["Wk", "Ending", "New Users", "Plans Created", "w/ 2+", "w/ 3+", "Avg Mbr", "Messages", "Active"].map((h) => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {weeks.map((row) => (
                    <tr key={row.week_number} style={{ borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '8px 16px 8px 0', fontWeight: 500, color: 'var(--parchment)' }}>Wk {row.week_number}</td>
                      <td style={{ padding: '8px 16px 8px 0', color: 'var(--parchment-dim)', whiteSpace: 'nowrap' }}>
                        {new Date(row.week_end).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Los_Angeles" })}
                      </td>
                      <td style={{ padding: '8px 16px 8px 0', fontWeight: 600, color: 'var(--success)' }}>+{row.new_users}</td>
                      <td style={{ padding: '8px 16px 8px 0', fontWeight: 600, color: 'var(--terracotta)' }}>+{row.new_plans}</td>
                      <td style={{ padding: '8px 16px 8px 0', color: 'var(--parchment-dim)' }}>+{row.new_2plus}</td>
                      <td style={{ padding: '8px 16px 8px 0', color: 'var(--parchment-dim)' }}>+{row.new_3plus}</td>
                      <td style={{ padding: '8px 16px 8px 0', color: 'var(--parchment-dim)' }}>{row.avg_members_per_plan}</td>
                      <td style={{ padding: '8px 16px 8px 0', color: 'var(--parchment-dim)' }}>+{row.new_msgs}</td>
                      <td style={{ padding: '8px 16px 8px 0', color: 'var(--parchment-dim)' }}>{row.active_plans}</td>
                    </tr>
                  ))}
                  {/* Totals row */}
                  <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--bg-elevated)' }}>
                    <td style={{ padding: '10px 16px 10px 0', fontWeight: 700, color: 'var(--parchment)' }} colSpan={2}>Total ({wd.length} weeks)</td>
                    <td style={{ padding: '10px 16px 10px 0', fontWeight: 700, color: 'var(--success)' }}>{last.total_users}</td>
                    <td style={{ padding: '10px 16px 10px 0', fontWeight: 700, color: 'var(--terracotta)' }}>{last.total_plans}</td>
                    <td style={{ padding: '10px 16px 10px 0', fontWeight: 700, color: 'var(--parchment-dim)' }}>{last.plans_two_plus}</td>
                    <td style={{ padding: '10px 16px 10px 0', fontWeight: 700, color: 'var(--parchment-dim)' }}>{last.plans_three_plus}</td>
                    <td style={{ padding: '10px 16px 10px 0', fontWeight: 700, color: 'var(--parchment-dim)' }}>{last.avg_members_per_plan}</td>
                    <td style={{ padding: '10px 16px 10px 0', fontWeight: 700, color: 'var(--parchment-dim)' }}>{last.total_messages}</td>
                    <td style={{ padding: '10px 16px 10px 0', fontWeight: 700, color: 'var(--parchment-dim)' }}>{last.active_plans}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <InfoBox>
              <strong>Source:</strong> weekly_snapshots table, populated every Sunday by the capture_weekly_snapshot() cron job. Week 1 = Jan 12, 2026 (launch week).<br />
              <strong>All numbers are per-week deltas</strong> (how many that week), not cumulative. The totals row at the bottom shows the running total as of the latest snapshot.<br />
              <strong>Columns:</strong> New Users = signups that week. Plans Created = new published plans. w/ 2+ / 3+ = new plans reaching that member count. Avg Mbr = avg members per plan (snapshot, not delta). Messages = new messages that week. Active = non-draft plans created that week.
            </InfoBox>
          </Card>
        );
      })()}

      {/* Referral Sources */}
      <Card title="How did you hear about us?">
        <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
              <th style={thStyle}>Source</th>
              <th style={{ ...thStyle, textAlign: 'right', width: '80px' }}>Count</th>
              <th style={{ ...thStyle, textAlign: 'right', width: '80px' }}>%</th>
            </tr>
          </thead>
          <tbody>
            {(stats.signups_by_source || []).map((r) => (
              <tr key={r.source} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '8px 16px 8px 0', color: 'var(--parchment)', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.source}</td>
                <td style={{ padding: '8px 0', fontWeight: 700, color: 'var(--terracotta)', textAlign: 'right', width: '80px' }}>{r.count}</td>
                <td style={{ padding: '8px 0', color: 'var(--parchment-muted)', textAlign: 'right', width: '80px' }}>
                  {stats.signups_by_source ? Math.round(100 * r.count / stats.signups_by_source.reduce((s, x) => s + x.count, 0)) : 0}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <InfoBox>
          <strong>Source:</strong> profiles.referral_source column. Set during onboarding when the user answers &quot;How did you hear about us?&quot; Grouped by exact string match. &quot;other: ...&quot; entries are free-text responses. Only shown where referral_source IS NOT NULL and not empty.
        </InfoBox>
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
        <Note>Recipients = profiles WHERE phone_number IS NOT NULL AND phone_verified = true. Currently {stats.sms_enabled} users.</Note>
      </Card>
    </div>
  );
}
