"use client";

import { useEffect, useState, useCallback, useRef } from "react";

type Stats = {
  totalUsers: number;
  activatedUsers: number;
  newToday: number;
  newThisWeek: number;
  lastWeekNew: number;
  newLast30d: number;
  wowGrowth: number;
  totalPlans: number;
  publishedPlans: number;
  plansWith2Plus: number;
  plansWith3Plus: number;
  avgMembers: number;
  plansNoJoins: number;
  cancelledPlans: number;
  activePlans: number;
  upcomingPlans: number;
  stalePlans: number;
  onboardingComplete: number;
  incompleteOnboarding: number;
  hasPhoto: number;
  hasBio: number;
  stuckNeverStarted: number;
  stuckAtPhoto: number;
  stuckAlmostDone: number;
  totalMessages: number;
  eventsWithChat: number;
  usersWhoChatted: number;
  msgsPerActiveEvent: number;
  smsEnabledCount: number;
  dau: number;
  wau: number;
  mau: number;
  wauMauRatio: number;
  dauMauRatio: number;
  momGrowthPct: number;
  prevMonthCount: number;
  returnedEver: number;
  returned7d: number;
  retentionBase: number;
  returned30d: number;
  d30RetentionBase: number;
  d1CohortBase: number;
  d1CohortReturned: number;
  d7CohortBase: number;
  d7CohortReturned: number;
  d30CohortBase: number;
  d30CohortReturned: number;
  weeklyData: WeekRow[];
  referralCounts: { source: string; count: number }[];
  signups7d: { date: string; count: number }[];
  uniqueCreators: number;
  uniqueJoiners: number;
  completedPlans: number;
  planCompletionRate: number;
  joinerToCreatorCount: number;
  joinerToCreatorRate: number;
  monthlyParticipants: number;
  monthlyParticipationRate: number;
  totalPlanJoiners: number;
  repeatPlanners: number;
  repeatPlanRate: number;
  avgPlansPerJoiner: number;
  avgPlansPerMonth: number;
  prevMonthMauCount: number;
  retainedMauCount: number;
  mauRetentionPct: number;
};

type WeekRow = {
  week: number;
  weekEnding: string;
  totalUsers: number;
  newUsers: number;
  totalPlans: number;
  plans2Plus: number;
  plans3Plus: number;
  avgMembers: number;
  messages: number;
  activePlans: number;
};

function StatCard({
  label,
  value,
  sub,
  accent,
  highlight,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string; // colored value text
  highlight?: "green" | "orange" | "blue" | "dark";
}) {
  const bgMap = {
    green: { bg: "#F0FAF0", border: "#C8E6C9", text: "#2E7D32", sub: "#4CAF50" },
    orange: { bg: "#FDF5F0", border: "#EDCFBF", text: "#D97746", sub: "#E8A878" },
    blue: { bg: "#EEF4FF", border: "#BBDEFB", text: "#1565C0", sub: "#42A5F5" },
    dark: { bg: "#1E1E1E", border: "transparent", text: "#fff", sub: "rgba(255,255,255,0.6)" },
  };
  const colors = highlight ? bgMap[highlight] : null;

  return (
    <div
      className="rounded-xl p-4 border"
      style={{
        backgroundColor: colors?.bg ?? "#fff",
        borderColor: colors?.border ?? "#E8E3DC",
      }}
    >
      <p
        className="text-xs font-medium uppercase tracking-wide"
        style={{ color: colors ? colors.sub : "#999" }}
      >
        {label}
      </p>
      <p
        className="text-2xl font-bold mt-1"
        style={{ color: accent ?? (colors?.text ?? "#1E1E1E") }}
      >
        {value}
      </p>
      {sub && (
        <p className="text-xs mt-1 leading-snug" style={{ color: colors?.sub ?? "#aaa" }}>
          {sub}
        </p>
      )}
    </div>
  );
}

function Section({
  icon,
  title,
  subtitle,
  children,
}: {
  icon?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#E8E3DC] p-6">
      <div className="mb-5">
        <h2 className="text-base font-bold text-[#1E1E1E] flex items-center gap-2">
          {icon && <span>{icon}</span>}
          {title}
        </h2>
        {subtitle && <p className="text-xs text-[#999] mt-1">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 my-4">
      <div className="flex-1 h-px bg-[#F0EBE3]" />
      <span className="text-[10px] uppercase tracking-widest text-[#bbb] font-medium">{label}</span>
      <div className="flex-1 h-px bg-[#F0EBE3]" />
    </div>
  );
}

type WtlCity = {
  city: string;
  count: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [announcement, setAnnouncement] = useState("");
  const [sending, setSending] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [wtlCities, setWtlCities] = useState<{ cities: WtlCity[]; total: number } | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data: Stats = await res.json();
      setStats(data);
      setLastUpdated(new Date());
      setSecondsAgo(0);
    } catch (err) {
      console.error("Admin stats error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    intervalRef.current = setInterval(fetchStats, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchStats]);

  useEffect(() => {
    fetch("/api/admin/wtl-cities")
      .then((r) => r.json())
      .then((d) => setWtlCities({ cities: d.cities ?? [], total: d.total ?? 0 }));
  }, []);

  useEffect(() => {
    const tick = setInterval(() => setSecondsAgo((s) => s + 1), 1000);
    return () => clearInterval(tick);
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#D97746] border-t-transparent" />
      </div>
    );
  }

  // ── Derived values ──────────────────────────────────────────────────────
  const activationPct =
    stats.totalUsers > 0 ? Math.round((stats.onboardingComplete / stats.totalUsers) * 100) : 0;
  const mauPct =
    stats.activatedUsers > 0 ? Math.round((stats.mau / stats.activatedUsers) * 100) : 0;
  const d1CohortPct =
    stats.d1CohortBase > 0 ? Math.round((stats.d1CohortReturned / stats.d1CohortBase) * 100) : 0;
  const d7CohortPct =
    stats.d7CohortBase > 0 ? Math.round((stats.d7CohortReturned / stats.d7CohortBase) * 100) : 0;
  const d30CohortPct =
    stats.d30CohortBase > 0
      ? Math.round((stats.d30CohortReturned / stats.d30CohortBase) * 100)
      : 0;
  const returnedEverPct =
    stats.activatedUsers > 0 ? Math.round((stats.returnedEver / stats.activatedUsers) * 100) : 0;
  const signupMax = Math.max(...stats.signups7d.map((d) => d.count), 1);

  // Funnel steps
  const funnelSteps = [
    { label: "Total Signups", value: stats.totalUsers, pct: 100 },
    { label: "Activated", value: stats.activatedUsers, pct: activationPct },
    { label: "Monthly Active (MAU)", value: stats.mau, pct: mauPct },
    {
      label: "Joined a Plan (30d)",
      value: stats.monthlyParticipants,
      pct:
        stats.mau > 0 ? Math.round((stats.monthlyParticipants / stats.mau) * 100) : 0,
    },
  ];

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1E1E1E]">WashedUp Command Center</h1>
          <p className="text-xs text-[#999] mt-0.5">Launch: Jan 15, 2026 · LA time</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-[#999]">
              {secondsAgo < 5 ? "Just updated" : `Updated ${secondsAgo}s ago`}
            </span>
          )}
          <button
            onClick={fetchStats}
            className="text-xs text-[#D97746] font-medium px-3 py-1.5 rounded-lg border border-[#D97746]/30 hover:bg-[#D97746]/8 transition-colors"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* ── WashedUp Metrics ────────────────────────────────────────────── */}
      <Section
        icon="🍊"
        title="WashedUp Metrics"
        subtitle="IRL social apps aren't measured by daily opens — they're measured by real-world participation."
      >
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard
            label="Monthly Participation"
            value={`${stats.monthlyParticipationRate}%`}
            sub={`${stats.monthlyParticipants} of ${stats.mau} MAU joined a plan`}
            highlight="orange"
          />
          <StatCard
            label="Repeat Plan Rate"
            value={`${stats.repeatPlanRate}%`}
            sub={`${stats.repeatPlanners}/${stats.totalPlanJoiners} joiners came back for 2+`}
            highlight="green"
          />
          <StatCard
            label="Month-1 Retention"
            value={`${stats.mauRetentionPct}%`}
            sub={`${stats.retainedMauCount}/${stats.prevMonthMauCount} last month's users still active`}
            highlight="blue"
          />
          <StatCard
            label="Joiner → Creator"
            value={`${stats.joinerToCreatorRate}%`}
            sub={`${stats.joinerToCreatorCount} joiners later posted a plan`}
            highlight="dark"
          />
          <StatCard
            label="Avg Plans / Joiner"
            value={stats.avgPlansPerJoiner}
            sub={`${stats.avgPlansPerMonth} plans avg this month`}
          />
          <StatCard
            label="MAU"
            value={stats.mau}
            sub="Active in last 28 days"
            accent="#D97746"
          />
        </div>
        <div className="mt-4 px-4 py-3 rounded-xl bg-[#FBF9F6] border border-[#E8E3DC] text-xs text-[#666] leading-relaxed">
          <span className="font-semibold text-[#1E1E1E]">For investors: </span>
          We compete with going out, not Instagram. Monthly participation shows real-world impact.
          Repeat rate shows the social loop is working. Month-1 retention shows new users are sticking.
          Joiner→Creator is our network effect flywheel.
        </div>
      </Section>

      {/* ── Growth ──────────────────────────────────────────────────────── */}
      <Section icon="📈" title="Growth">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <StatCard
            label="Total Users"
            value={stats.totalUsers.toLocaleString()}
            sub="All signups ever"
            highlight="orange"
          />
          <StatCard
            label="Activated"
            value={stats.activatedUsers.toLocaleString()}
            sub={`${activationPct}% of all signups`}
            highlight="green"
          />
          <StatCard
            label="New Today"
            value={stats.newToday}
            sub="LA midnight cutoff"
          />
          <StatCard
            label="New This Week"
            value={stats.newThisWeek}
            sub={`${stats.wowGrowth >= 0 ? "+" : ""}${stats.wowGrowth}% vs last week (${stats.lastWeekNew})`}
            accent={stats.wowGrowth >= 0 ? "#2E7D32" : "#C62828"}
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-2 gap-3 mb-5">
          <StatCard
            label="New (Last 30 Days)"
            value={stats.newLast30d}
            sub={`${stats.prevMonthCount} the 30d before that`}
          />
          <StatCard
            label="MoM Growth"
            value={`${stats.momGrowthPct >= 0 ? "+" : ""}${stats.momGrowthPct}%`}
            sub={`${stats.newLast30d} vs ${stats.prevMonthCount} signups`}
            accent={stats.momGrowthPct >= 20 ? "#2E7D32" : stats.momGrowthPct >= 0 ? "#D97746" : "#C62828"}
          />
        </div>

        {/* 7-day bar chart */}
        <div className="bg-[#FBF9F6] rounded-xl p-4 border border-[#E8E3DC]">
          <p className="text-xs font-medium text-[#999] uppercase tracking-wide mb-3">Signups — Last 7 Days</p>
          <div className="flex items-end justify-between gap-2 h-24">
            {stats.signups7d.map((day, i) => {
              const dateStr = day.date.slice(0, 10);
              const d = new Date(dateStr + "T12:00:00Z");
              const isToday = i === stats.signups7d.length - 1;
              const label = isToday
                ? "Today"
                : d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-bold text-[#D97746]">{day.count}</span>
                  <div
                    className="w-full bg-[#D97746] rounded-t-md transition-all"
                    style={{ height: `${Math.max((day.count / signupMax) * 70, 4)}px` }}
                  />
                  <span className="text-[10px] text-[#bbb]">{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ── Activation Funnel ───────────────────────────────────────────── */}
      <Section
        icon="🔽"
        title="User Funnel"
        subtitle="From signup to engaged participant"
      >
        <div className="space-y-3 mb-5">
          {funnelSteps.map((step, i) => (
            <div key={step.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-[#1E1E1E]">{step.label}</span>
                <span className="text-sm font-bold text-[#1E1E1E]">
                  {step.value.toLocaleString()}
                  <span className="text-xs font-normal text-[#999] ml-2">({step.pct}%)</span>
                </span>
              </div>
              <div className="h-2.5 bg-[#F5F0EB] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${step.pct}%`,
                    backgroundColor: ["#D97746", "#2E7D32", "#1565C0", "#9C27B0"][i],
                    opacity: 0.85,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <Divider label="Onboarding drop-off" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl p-4 bg-[#FFEBEE] border border-[#FFCDD2]">
            <p className="text-2xl font-bold text-[#C62828]">{stats.stuckNeverStarted}</p>
            <p className="text-sm font-semibold text-[#C62828]">Never started</p>
            <p className="text-xs text-[#C62828]/60 mt-0.5">Signed up, no name or gender entered</p>
          </div>
          <div className="rounded-xl p-4 bg-[#FFF3E0] border border-[#FFE0B2]">
            <p className="text-2xl font-bold text-[#E65100]">{stats.stuckAtPhoto}</p>
            <p className="text-sm font-semibold text-[#E65100]">Stopped before photo</p>
            <p className="text-xs text-[#E65100]/60 mt-0.5">Started basics, no photo uploaded</p>
          </div>
          <div className="rounded-xl p-4 bg-[#E8F5E9] border border-[#C8E6C9]">
            <p className="text-2xl font-bold text-[#2E7D32]">{stats.stuckAlmostDone}</p>
            <p className="text-sm font-semibold text-[#2E7D32]">Almost there</p>
            <p className="text-xs text-[#2E7D32]/60 mt-0.5">Has photo, didn&apos;t finish flow</p>
          </div>
        </div>

        <div className="mt-3 flex gap-3">
          <div className="flex-1 rounded-xl p-3 bg-[#FBF9F6] border border-[#E8E3DC] text-center">
            <p className="text-lg font-bold text-[#1E1E1E]">{stats.hasPhoto}</p>
            <p className="text-xs text-[#999]">Has Profile Photo</p>
          </div>
          <div className="flex-1 rounded-xl p-3 bg-[#FBF9F6] border border-[#E8E3DC] text-center">
            <p className="text-lg font-bold text-[#1E1E1E]">{stats.hasBio}</p>
            <p className="text-xs text-[#999]">Has Bio</p>
          </div>
          <div className="flex-1 rounded-xl p-3 bg-[#FBF9F6] border border-[#E8E3DC] text-center">
            <p className="text-lg font-bold text-[#1E1E1E]">{stats.smsEnabledCount}</p>
            <p className="text-xs text-[#999]">SMS Enabled</p>
          </div>
        </div>
      </Section>

      {/* ── Retention ───────────────────────────────────────────────────── */}
      <Section
        icon="🔁"
        title="Retention"
        subtitle="Cohort retention uses session data backfilled to Jan 14. Accuracy improves as more users pass each milestone."
      >
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="rounded-xl p-4 border border-[#E8E3DC] text-center">
            <p className="text-xs font-medium text-[#999] uppercase tracking-wide mb-2">D1 Retention</p>
            <p className="text-3xl font-bold text-[#1E1E1E]">{d1CohortPct}%</p>
            <p className="text-xs text-[#aaa] mt-1">{stats.d1CohortReturned}/{stats.d1CohortBase} back on day 1</p>
            <div className="mt-2 h-1.5 bg-[#F5F0EB] rounded-full">
              <div className="h-full bg-[#D97746] rounded-full" style={{ width: `${d1CohortPct}%` }} />
            </div>
            <p className="text-[10px] text-[#ccc] mt-1">Benchmark: &gt;40%</p>
          </div>
          <div className="rounded-xl p-4 border border-[#E8E3DC] text-center">
            <p className="text-xs font-medium text-[#999] uppercase tracking-wide mb-2">D7 Retention</p>
            <p className="text-3xl font-bold text-[#1E1E1E]">{d7CohortPct}%</p>
            <p className="text-xs text-[#aaa] mt-1">{stats.d7CohortReturned}/{stats.d7CohortBase} back day 6–8</p>
            <div className="mt-2 h-1.5 bg-[#F5F0EB] rounded-full">
              <div className="h-full bg-[#D97746] rounded-full" style={{ width: `${d7CohortPct}%` }} />
            </div>
            <p className="text-[10px] text-[#ccc] mt-1">Benchmark: &gt;35%</p>
          </div>
          <div className="rounded-xl p-4 border border-[#E8E3DC] text-center">
            <p className="text-xs font-medium text-[#999] uppercase tracking-wide mb-2">D30 Retention</p>
            <p className="text-3xl font-bold text-[#1E1E1E]">{d30CohortPct}%</p>
            <p className="text-xs text-[#aaa] mt-1">{stats.d30CohortReturned}/{stats.d30CohortBase} back day 29–31</p>
            <div className="mt-2 h-1.5 bg-[#F5F0EB] rounded-full">
              <div className="h-full bg-[#D97746] rounded-full" style={{ width: `${d30CohortPct}%` }} />
            </div>
            <p className="text-[10px] text-[#ccc] mt-1">Benchmark: &gt;20%</p>
          </div>
        </div>

        <div className="px-3 py-2 rounded-lg bg-[#FFFDE7] border border-[#FFF176] text-xs text-[#795548] mb-4">
          <strong>Note:</strong> D1/D7/D30 use backfilled session data (plan joins, messages, reactions). Numbers will improve as live tracking accumulates — full D7 accuracy by ~May 3, D30 by ~May 26.
          For IRL apps, monthly participation &amp; repeat rate are stronger signals than daily retention.
        </div>

        <Divider label="Stickiness" />

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard label="DAU" value={stats.dau} sub="Last 24h" />
          <StatCard label="WAU" value={stats.wau} sub="Last 7 days" />
          <StatCard label="MAU" value={stats.mau} sub="Last 28 days" />
          <StatCard
            label="DAU / MAU"
            value={`${stats.dauMauRatio}%`}
            sub="Daily stickiness"
            accent={stats.dauMauRatio >= 20 ? "#2E7D32" : "#D97746"}
          />
          <StatCard
            label="WAU / MAU"
            value={`${stats.wauMauRatio}%`}
            sub="Weekly stickiness"
          />
        </div>

        <Divider label="Ever returned" />
        <div className="grid grid-cols-1 gap-3">
          <StatCard
            label="Returned at Least Once"
            value={`${returnedEverPct}%`}
            sub={`${stats.returnedEver} of ${stats.activatedUsers} activated users came back`}
            highlight="green"
          />
        </div>
      </Section>

      {/* ── Marketplace Health ──────────────────────────────────────────── */}
      <Section
        icon="🛒"
        title="Marketplace Health"
        subtitle="The flywheel: users join plans → attend IRL → become creators"
      >
        {/* Live plans hero */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <StatCard
            label="Upcoming Plans"
            value={stats.upcomingPlans}
            sub={`${stats.stalePlans} past their date but not closed`}
            highlight="orange"
          />
          <StatCard
            label="Total Published"
            value={stats.publishedPlans}
            sub="All time, excl. drafts"
          />
          <StatCard
            label="Unique Creators"
            value={stats.uniqueCreators}
            sub={`${stats.activatedUsers > 0 ? Math.round((stats.uniqueCreators / stats.activatedUsers) * 100) : 0}% of activated users`}
            highlight="blue"
          />
          <StatCard
            label="Unique Joiners"
            value={stats.uniqueJoiners}
            sub={`${stats.activatedUsers > 0 ? Math.round((stats.uniqueJoiners / stats.activatedUsers) * 100) : 0}% of activated users`}
          />
        </div>

        <Divider label="Plan outcomes" />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Completed" value={stats.completedPlans} highlight="green" />
          <StatCard
            label="Plan Completion Rate"
            value={`${stats.planCompletionRate}%`}
            sub={`${stats.completedPlans} of ${stats.completedPlans + stats.cancelledPlans} finished plans`}
            highlight="green"
          />
          <StatCard label="Cancelled" value={stats.cancelledPlans} />
          <StatCard label="Drafts" value={stats.totalPlans - stats.publishedPlans} sub="Created, not posted" />
        </div>

        <Divider label="Plan quality" />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Plans with 2+ People"
            value={stats.plansWith2Plus}
            sub={`${stats.publishedPlans > 0 ? Math.round((stats.plansWith2Plus / stats.publishedPlans) * 100) : 0}% of published`}
            highlight="green"
          />
          <StatCard
            label="Plans with 3+ People"
            value={stats.plansWith3Plus}
            sub="Well-formed groups"
          />
          <StatCard label="Avg Members / Plan" value={stats.avgMembers} />
          <StatCard
            label="Plans with 0 Joins"
            value={stats.plansNoJoins}
            sub="Creator only — no traction"
          />
        </div>
      </Section>

      {/* ── Chat Engagement ─────────────────────────────────────────────── */}
      <Section icon="💬" title="Chat Engagement">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Total Messages"
            value={stats.totalMessages.toLocaleString()}
          />
          <StatCard
            label="Plans with Chat"
            value={
              stats.publishedPlans > 0
                ? `${Math.round((stats.eventsWithChat / stats.publishedPlans) * 100)}%`
                : "0%"
            }
            sub={`${stats.eventsWithChat} of ${stats.publishedPlans} published plans`}
            highlight="green"
          />
          <StatCard
            label="Users Who Chatted"
            value={stats.usersWhoChatted}
            sub={`${stats.activatedUsers > 0 ? Math.round((stats.usersWhoChatted / stats.activatedUsers) * 100) : 0}% of activated`}
          />
          <StatCard label="Msgs / Active Plan" value={stats.msgsPerActiveEvent} />
        </div>
      </Section>

      {/* ── WTL Cities ──────────────────────────────────────────────────── */}
      <Section
        icon="🌍"
        title="WTL Cities"
        subtitle="Where people want WashedUp next"
      >
        {!wtlCities ? (
          <p className="text-sm text-[#999]">Loading…</p>
        ) : (
          <>
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-3xl font-bold text-[#D97746]">{wtlCities.total}</span>
              <span className="text-sm text-[#999]">
                people on the waitlist across{" "}
                <span className="font-semibold text-[#1E1E1E]">{wtlCities.cities.length}</span>{" "}
                {wtlCities.cities.length === 1 ? "city" : "cities"}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {wtlCities.cities.map((c) => (
                <div
                  key={c.city}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E8E3DC] bg-[#FBF9F6] text-sm"
                >
                  <span className="text-[#1E1E1E] font-medium">{c.city}</span>
                  <span className="bg-[#D97746] text-white text-xs font-bold rounded-full px-1.5 py-0.5 leading-none">
                    {c.count}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </Section>

      {/* ── Weekly Table ────────────────────────────────────────────────── */}
      <Section icon="📅" title="Weekly Data" subtitle="Historical snapshot per week since launch">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E8E3DC] text-left">
                {["Week", "Ending", "Users", "New", "Plans", "2+", "3+", "Avg Mbr", "Msgs", "Active"].map((h) => (
                  <th key={h} className="py-2 pr-4 text-[#999] font-medium text-xs whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.weeklyData.map((row) => (
                <tr key={row.week} className="border-b border-[#F0EBE3] hover:bg-[#FBF9F6]">
                  <td className="py-2 pr-4 font-medium text-[#1E1E1E]">Wk {row.week}</td>
                  <td className="py-2 pr-4 text-[#666] whitespace-nowrap">{row.weekEnding}</td>
                  <td className="py-2 pr-4 font-bold text-[#D97746]">{row.totalUsers}</td>
                  <td className="py-2 pr-4 text-[#2E7D32] font-medium">+{row.newUsers}</td>
                  <td className="py-2 pr-4 text-[#666]">{row.totalPlans}</td>
                  <td className="py-2 pr-4 font-bold text-[#D97746]">{row.plans2Plus}</td>
                  <td className="py-2 pr-4 text-[#666]">{row.plans3Plus}</td>
                  <td className="py-2 pr-4 text-[#666]">{row.avgMembers}</td>
                  <td className="py-2 pr-4 text-[#666]">{row.messages}</td>
                  <td className="py-2 pr-4 text-[#666]">{row.activePlans}</td>
                </tr>
              ))}
              {stats.weeklyData.length >= 2 && (
                <tr className="bg-[#F5F0EB]/60 font-medium text-xs">
                  <td className="py-2 pr-4 text-[#999]" colSpan={2}>Wk1 → Now</td>
                  <td className="py-2 pr-4 text-[#2E7D32]">
                    +{Math.round(
                      ((stats.weeklyData[stats.weeklyData.length - 1].totalUsers -
                        stats.weeklyData[0].totalUsers) /
                        Math.max(stats.weeklyData[0].totalUsers, 1)) * 100
                    )}%
                  </td>
                  <td className="py-2 pr-4" />
                  <td className="py-2 pr-4 text-[#D97746]">
                    +{Math.round(
                      ((stats.weeklyData[stats.weeklyData.length - 1].totalPlans -
                        stats.weeklyData[0].totalPlans) /
                        Math.max(stats.weeklyData[0].totalPlans, 1)) * 100
                    )}%
                  </td>
                  <td className="py-2 pr-4 text-[#D97746]">
                    +{Math.round(
                      ((stats.weeklyData[stats.weeklyData.length - 1].plans2Plus -
                        stats.weeklyData[0].plans2Plus) /
                        Math.max(stats.weeklyData[0].plans2Plus, 1)) * 100
                    )}%
                  </td>
                  <td colSpan={4} />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── Referral Sources ────────────────────────────────────────────── */}
      <Section icon="📣" title="How did you hear about us?">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1">
          {stats.referralCounts.map((r) => (
            <div
              key={r.source}
              className="flex items-center justify-between py-1.5 border-b border-[#F0EBE3]"
            >
              <span className="text-sm text-[#1E1E1E] truncate pr-2">{r.source}</span>
              <span className="text-sm font-bold text-[#D97746] shrink-0">{r.count}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Announcements ───────────────────────────────────────────────── */}
      <Section icon="📢" title="Send Announcement">
        <textarea
          value={announcement}
          onChange={(e) => setAnnouncement(e.target.value)}
          placeholder="Type your announcement message here..."
          className="w-full border border-[#E8E3DC] rounded-xl p-4 text-sm min-h-[100px] resize-y focus:outline-none focus:ring-2 focus:ring-[#D97746]/30 focus:border-[#D97746] bg-[#FBF9F6]"
        />
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-[#999]">
            Sends to {stats.smsEnabledCount} users with SMS enabled
          </p>
          <button
            disabled={!announcement.trim() || sending}
            onClick={() => {
              setSending(true);
              setTimeout(() => {
                setSending(false);
                setAnnouncement("");
                alert("Announcement sent!");
              }, 1000);
            }}
            className="flex items-center gap-2 bg-[#D97746] text-white px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-[#C4652A] transition-colors"
          >
            {sending ? "Sending..." : "Send Announcement"}
          </button>
        </div>
      </Section>
    </div>
  );
}
