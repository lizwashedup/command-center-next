"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import Card from "@/components/ui/Card";
import InlineStat from "@/components/ui/InlineStat";
import InfoBox from "@/components/ui/InfoBox";

interface Stats {
  total_users: number;
  activated_users: number;
  new_today: number;
  new_7d: number;
  new_28d: number;
  prev_28d: number;
  mom_growth_pct: number;
  women_count: number;
  men_count: number;
  nonbinary_count: number;
  engaged_mau: number;
  wau: number;
  dau: number;
  wau_mau_ratio: number;
  dau_mau_ratio: number;
  plans_completed: number;
  plans_completed_7d: number;
  plans_active: number;
  plans_created_7d: number;
  published_plans: number;
  total_plans: number;
  plans_cancelled: number;
  fill_rate_3plus: number;
  total_creators: number;
  repeat_hosts: number;
  creator_retention_rate: number;
  total_joiners: number;
  repeat_joiners: number;
  physical_participation_rate: number;
  organic_creator_rate: number;
  d1_retained: number;
  d1_eligible: number;
  d7_retained: number;
  d7_eligible: number;
  d30_retained: number;
  d30_eligible: number;
  avg_age_span: number;
  pct_plans_20yr_span: number;
  stranger_friend_pairs: number;
  joiner_to_creator_count: number;
  joiner_to_creator_denom: number;
  users_1_plan: number;
  users_2: number;
  users_3: number;
  users_4: number;
  users_5plus: number;
  signups_by_day: { date: string; count: number }[];
  signups_by_source: { source: string; count: number }[];
}

/* ── KPI Card ────────────────────────────────────────────── */

function KPICard({ label, value, subtitle, benchmark, note }: {
  label: string;
  value: string | number;
  subtitle?: string;
  benchmark?: string;
  note?: string;
}) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: '14px',
      padding: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    }}>
      <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--terracotta)' }}>
        {label}
      </div>
      <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '36px', fontWeight: 700, color: 'var(--parchment)', lineHeight: 1.1 }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: '12px', color: 'var(--parchment-dim)', marginTop: '2px' }}>{subtitle}</div>
      )}
      {benchmark && (
        <div style={{ fontSize: '11px', color: 'var(--parchment-muted)', fontStyle: 'italic', marginTop: '4px' }}>{benchmark}</div>
      )}
      {note && (
        <div style={{ fontSize: '10px', color: 'var(--parchment-dim)', marginTop: '6px', lineHeight: 1.4, borderTop: '1px solid var(--border)', paddingTop: '6px' }}>{note}</div>
      )}
    </div>
  );
}

export default function CommandCenterPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/dashboard/stats");
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();
      setStats(data);
      setLastUpdated(new Date());
      setSecondsAgo(0);
    } catch (err) {
      console.error("Dashboard stats error:", err);
    } finally {
      setLoading(false);
    }
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

  const trustTotal = stats.women_count + stats.men_count + stats.nonbinary_count;
  const trustRatio = trustTotal > 0 ? Math.round(100 * stats.women_count / trustTotal) : 0;
  const activationPct = stats.total_users > 0 ? Math.round(100 * stats.activated_users / stats.total_users) : 0;
  const d1Pct = stats.d1_eligible > 0 ? Math.round(100 * stats.d1_retained / stats.d1_eligible) : 0;
  const d7Pct = stats.d7_eligible > 0 ? Math.round(100 * stats.d7_retained / stats.d7_eligible) : 0;
  const d30Pct = stats.d30_eligible > 0 ? Math.round(100 * stats.d30_retained / stats.d30_eligible) : 0;
  const jcRate = stats.joiner_to_creator_denom > 0 ? Math.round(100 * stats.joiner_to_creator_count / stats.joiner_to_creator_denom) : 0;
  const signupMax = Math.max(...(stats.signups_by_day || []).map(d => d.count), 1);
  const repeatMax = Math.max(stats.users_1_plan, stats.users_2, stats.users_3, stats.users_4, stats.users_5plus, 1);

  return (
    <div style={{ maxWidth: 1200, display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <PageHeader title="Command Center" subtitle="WashedUp — measuring physical-world engagement" badge="Live" badgeColor="green" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '8px' }}>
          {lastUpdated && (
            <span style={{ fontSize: '11px', color: 'var(--parchment-muted)' }}>
              {secondsAgo < 5 ? "Just updated" : `Updated ${secondsAgo}s ago`}
            </span>
          )}
          <button onClick={fetchStats} style={{
            fontSize: '11px', fontWeight: 500, color: 'var(--terracotta)', padding: '6px 14px', borderRadius: '24px',
            border: '1px solid rgba(217,119,70,0.3)', background: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
          }}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* ── Hero KPI Row ──────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
        <KPICard
          label="Plans Completed"
          value={stats.plans_completed}
          subtitle={`${stats.plans_completed_7d} this week · ${stats.plans_active} active now`}
          benchmark="North Star metric"
          note="Events with status = 'completed'. Equivalent to Airbnb's Nights Booked."
        />
        <KPICard
          label="Physical Participation"
          value={`${stats.physical_participation_rate}%`}
          subtitle={`${stats.total_joiners} of ${stats.activated_users} activated users joined a plan`}
          benchmark="vs 1% internet content creation rate"
          note="Unique users who joined a plan (status = 'joined') / total activated users. Measures physical commitment, not app opens."
        />
        <KPICard
          label="Organic Creator Rate"
          value={`${stats.organic_creator_rate}%`}
          subtitle={`${stats.total_creators} creators, $0 spent on supply`}
          benchmark="vs 1% internet avg (90-9-1 rule)"
          note="Unique plan creators / total activated users. No incentives, no payments — people post plans because they want to do things."
        />
        <KPICard
          label="Trust Ratio"
          value={`${trustRatio}% women`}
          subtitle={`${stats.women_count}W · ${stats.men_count}M · ${stats.nonbinary_count}NB`}
          benchmark="vs 39% Bumble, 24% Tinder"
          note="% of activated users identifying as women. No social app exceeds 58%. WashedUp achieves this with zero product mechanics forcing it."
        />
        <KPICard
          label="Total Users"
          value={stats.total_users.toLocaleString()}
          subtitle={`${stats.activated_users} activated (${activationPct}%) · $0 CAC`}
          benchmark={`+${stats.new_7d} this week`}
          note="All profiles. Activated = completed onboarding. $0 CAC — 100% organic via social posts and word of mouth."
        />
      </div>

      {/* ── Growth ────────────────────────────────────────────── */}
      <Card title="Growth">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          <InlineStat label="New This Week" value={stats.new_7d} highlight="orange" />
          <InlineStat label="New (28 Days)" value={stats.new_28d} sub={`${stats.prev_28d} the 28d before`} />
          <InlineStat label="MoM Growth" value={`${stats.mom_growth_pct >= 0 ? "+" : ""}${stats.mom_growth_pct}%`} accent={stats.mom_growth_pct >= 0 ? 'var(--success)' : 'var(--error)'} />
        </div>

        {/* 7-day signup bar chart */}
        <div style={{ background: 'var(--bg-elevated)', borderRadius: '14px', padding: '16px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--parchment-muted)', marginBottom: '12px' }}>
            Signups — Last 7 Days
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px', height: '96px' }}>
            {(stats.signups_by_day || []).map((day, i) => {
              const d = new Date(day.date + "T12:00:00Z");
              const isToday = i === stats.signups_by_day.length - 1;
              const label = isToday ? "Today" : d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
              return (
                <div key={day.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--terracotta)' }}>{day.count}</span>
                  <div style={{ width: '100%', background: 'var(--terracotta)', borderRadius: '4px 4px 0 0', height: `${Math.max((day.count / signupMax) * 70, 4)}px`, transition: 'height 0.3s' }} />
                  <span style={{ fontSize: '10px', color: 'var(--parchment-muted)' }}>{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top referral sources */}
        {stats.signups_by_source && stats.signups_by_source.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--parchment-muted)', marginBottom: '8px' }}>
              Top Sources
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {stats.signups_by_source.slice(0, 8).map((s) => (
                <div key={s.source} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '20px', border: '1px solid var(--border)', background: 'var(--bg-elevated)', fontSize: '12px' }}>
                  <span style={{ color: 'var(--parchment)', fontWeight: 500 }}>{s.source}</span>
                  <span style={{ color: 'var(--terracotta)', fontWeight: 700 }}>{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* ── Retention ─────────────────────────────────────────── */}
      <Card title="Retention">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          {[
            { label: 'D1 Retention', pct: d1Pct, retained: stats.d1_retained, eligible: stats.d1_eligible, desc: 'Had a session on day 1 after signup', bench: 'Global D1 avg: 26.5% (AppsFlyer 2025)', note: 'Bounded retention. % of users who opened the app on the day after signup. Session-based (user_sessions table). Tracking live since March 30 — D1 accurate for signups after March 30.' },
            { label: 'D7 Retention', pct: d7Pct, retained: stats.d7_retained, eligible: stats.d7_eligible, desc: 'Had a session within days 1–7', bench: 'Global D7 avg: 10.7% (AppsFlyer 2025)', note: 'Bounded retention. % of users who opened the app at least once within days 1-7 after signup. Session-based. Fully accurate by ~April 13.' },
            { label: 'D30 Retention', pct: d30Pct, retained: stats.d30_retained, eligible: stats.d30_eligible, desc: 'Had a session within days 1–30', bench: 'Global D30 avg: 4.2% (AppsFlyer 2025)', note: 'Bounded retention. % of users who opened the app at least once within days 1-30 after signup. Session-based. Fully accurate by ~May 9.' },
          ].map((r) => (
            <div key={r.label} style={{ borderRadius: '14px', padding: '20px', border: '1px solid var(--border)', background: 'var(--bg-surface)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--parchment-muted)', marginBottom: '8px' }}>{r.label}</div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '42px', fontWeight: 700, color: 'var(--parchment)' }}>{r.pct}%</div>
              <div style={{ fontSize: '12px', color: 'var(--parchment-dim)', margin: '4px 0 8px' }}>{r.retained} of {r.eligible} eligible users · {r.desc}</div>
              <div style={{ height: '8px', background: 'var(--bg-elevated)', borderRadius: '20px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'var(--terracotta)', borderRadius: '20px', width: `${r.pct}%`, transition: 'width 0.3s' }} />
              </div>
              <div style={{ fontSize: '11px', color: 'var(--parchment-muted)', fontStyle: 'italic', marginTop: '6px' }}>{r.bench}</div>
              <div style={{ fontSize: '10px', color: 'var(--parchment-dim)', marginTop: '6px', lineHeight: 1.4 }}>{r.note}</div>
            </div>
          ))}
        </div>
        <InfoBox>
          <span style={{ fontWeight: 600, color: 'var(--parchment)' }}>Bounded vs unbounded retention: </span>
          Bounded retention = user returned at any point within the window. Unbounded retention = user returned on that specific day. We use bounded because WashedUp&apos;s natural frequency is weekly, not daily — users don&apos;t open the app every day, they open it when they&apos;re planning something. Global average D7 bounded retention (app open): 10.7% (AppsFlyer 2025).
        </InfoBox>
      </Card>

      {/* ── WashedUp-Only Metrics ─────────────────────────────── */}
      <Card title="Only on WashedUp" action={<span style={{ fontSize: '11px', color: 'var(--parchment-muted)' }}>Metrics no other app can claim</span>}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {/* Generational Bridge */}
          <div style={{ borderRadius: '14px', padding: '20px', background: 'rgba(217,119,70,0.05)', border: '1px solid rgba(217,119,70,0.15)' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--terracotta)', marginBottom: '8px' }}>
              Generational Bridge Index
            </div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '36px', fontWeight: 700, color: 'var(--parchment)' }}>
              {stats.avg_age_span} years
            </div>
            <div style={{ fontSize: '12px', color: 'var(--parchment-dim)', marginTop: '4px' }}>
              Average age span across completed plans
            </div>
            <div style={{ fontSize: '12px', color: 'var(--terracotta)', fontWeight: 600, marginTop: '4px' }}>
              {stats.pct_plans_20yr_span}% of plans span 20+ years
            </div>
            <div style={{ fontSize: '10px', color: 'var(--parchment-dim)', marginTop: '6px', lineHeight: 1.4 }}>
              For each completed plan with 2+ attendees who provided birthdays, we calculate max(age) - min(age). No other social app tracks or creates cross-generational engagement.
            </div>
          </div>

          {/* Strangers-to-Friends */}
          <div style={{ borderRadius: '14px', padding: '20px', background: 'rgba(46,125,50,0.05)', border: '1px solid rgba(46,125,50,0.15)' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--success)', marginBottom: '8px' }}>
              Strangers to Friends
            </div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '36px', fontWeight: 700, color: 'var(--parchment)' }}>
              {stats.stranger_friend_pairs}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--parchment-dim)', marginTop: '4px' }}>
              Unique pairs who met at a plan and chose to do something together again
            </div>
            <div style={{ fontSize: '10px', color: 'var(--parchment-dim)', marginTop: '6px', lineHeight: 1.4 }}>
              Unique user pairs who attended 2+ different completed plans together, excluding pairs where one person created all their shared plans.
            </div>
          </div>

          {/* Joiner-to-Creator Flywheel */}
          <div style={{ borderRadius: '14px', padding: '20px', background: 'rgba(21,101,192,0.05)', border: '1px solid rgba(21,101,192,0.15)' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1565C0', marginBottom: '8px' }}>
              Joiner → Creator Flywheel
            </div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '36px', fontWeight: 700, color: 'var(--parchment)' }}>
              {jcRate}%
            </div>
            <div style={{ fontSize: '12px', color: 'var(--parchment-dim)', marginTop: '4px' }}>
              {stats.joiner_to_creator_count} of {stats.joiner_to_creator_denom} joiners later created their own plan
            </div>
            <div style={{ fontSize: '11px', color: 'var(--parchment-muted)', fontStyle: 'italic', marginTop: '4px' }}>
              vs 1-2% guest-to-host on Airbnb
            </div>
            <div style={{ fontSize: '10px', color: 'var(--parchment-dim)', marginTop: '6px', lineHeight: 1.4 }}>
              Users whose first action was joining (role = &apos;guest&apos;) and who later created their own plan. Temporal ordering enforced — the join must come before the creation.
            </div>
          </div>

          {/* Repeat Attendance Distribution */}
          <div style={{ borderRadius: '14px', padding: '20px', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--parchment-muted)', marginBottom: '12px' }}>
              Repeat Attendance
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '80px' }}>
              {[
                { label: '1', count: stats.users_1_plan },
                { label: '2', count: stats.users_2 },
                { label: '3', count: stats.users_3 },
                { label: '4', count: stats.users_4 },
                { label: '5+', count: stats.users_5plus },
              ].map((b) => (
                <div key={b.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--terracotta)' }}>{b.count}</span>
                  <div style={{ width: '100%', background: 'var(--terracotta)', borderRadius: '4px 4px 0 0', height: `${Math.max((b.count / repeatMax) * 56, 4)}px`, opacity: 0.85 }} />
                  <span style={{ fontSize: '10px', color: 'var(--parchment-muted)' }}>{b.label}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--parchment-muted)', textAlign: 'center', marginTop: '4px' }}>plans attended</div>
            <div style={{ fontSize: '10px', color: 'var(--parchment-dim)', marginTop: '6px', lineHeight: 1.4 }}>
              Distribution of how many plans each user has joined. Each additional plan = deeper habit formation and higher switching cost.
            </div>
          </div>
        </div>
      </Card>

      {/* ── Marketplace Health ────────────────────────────────── */}
      <Card title="Marketplace Health">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
          <InlineStat label="Created (7d)" value={stats.plans_created_7d} highlight="orange" />
          <InlineStat label="Completed (7d)" value={stats.plans_completed_7d} highlight="green" />
          <InlineStat label="Fill Rate (3+)" value={`${stats.fill_rate_3plus}%`} sub={`of ${stats.published_plans} published plans`} />
          <InlineStat label="Creator Retention" value={`${stats.creator_retention_rate}%`} sub={`${stats.repeat_hosts} of ${stats.total_creators} posted 2+ plans`} highlight="blue" />
          <InlineStat label="Active Now" value={stats.plans_active} sub="forming, active, or full" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginTop: '4px' }}>
          <div />
          <div />
          <div style={{ fontSize: '10px', color: 'var(--parchment-dim)', lineHeight: 1.4 }}>% of published plans reaching 3+ members. Measures supply meeting demand.</div>
          <div style={{ fontSize: '10px', color: 'var(--parchment-dim)', lineHeight: 1.4 }}>% of creators who made a 2nd plan. Supply-side retention — hardest metric for a two-sided marketplace.</div>
          <div />
        </div>
      </Card>

      {/* ── For Investors ─────────────────────────────────────── */}
      <InfoBox>
        <span style={{ fontWeight: 600, color: 'var(--parchment)' }}>For investors: </span>
        WashedUp measures physical-world engagement — people showing up to meet strangers. A {stats.physical_participation_rate}% participation rate means ~1 in 4 activated users commits to physically being somewhere with people they&apos;ve never met. The internet standard for content creation (posting a comment) is 1%. We&apos;re {Math.round(stats.physical_participation_rate)}x that for an action that&apos;s 100x harder. {stats.stranger_friend_pairs} stranger pairs have now met through WashedUp and chose to do something together again — that&apos;s the social graph forming.
      </InfoBox>

      {/* ── Cross-link to Ops ─────────────────────────────────── */}
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <Link href="/admin/ops" style={{ fontSize: '13px', color: 'var(--terracotta)', textDecoration: 'none', fontWeight: 500 }}>
          View operational dashboard →
        </Link>
      </div>
    </div>
  );
}
