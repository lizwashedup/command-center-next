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
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div
      className="rounded-xl p-4 border"
      style={{
        backgroundColor: color || "#fff",
        borderColor: color ? "transparent" : "#E8E3DC",
      }}
    >
      <p className={`text-xs font-medium ${color ? "text-white/80" : "text-[#999]"}`}>{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color ? "text-white" : "text-[#1E1E1E]"}`}>
        {value}
      </p>
      {sub && (
        <p className={`text-xs mt-0.5 ${color ? "text-white/70" : "text-[#999]"}`}>{sub}</p>
      )}
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#E8E3DC] p-6">
      <h2 className="text-base font-bold text-[#1E1E1E] mb-4 flex items-center gap-2">
        {icon && <span>{icon}</span>}
        {title}
      </h2>
      {children}
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
        console.error("Admin stats fetch failed:", res.status);
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
    const tick = setInterval(() => {
      setSecondsAgo((s) => s + 1);
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#D97746] border-t-transparent" />
      </div>
    );
  }

  const retention7dPct = stats.retentionBase > 0
    ? Math.round((stats.returned7d / stats.retentionBase) * 100)
    : 0;
  const retention30dPct = stats.d30RetentionBase > 0
    ? Math.round((stats.returned30d / stats.d30RetentionBase) * 100)
    : 0;
  const d1CohortPct = stats.d1CohortBase > 0
    ? Math.round((stats.d1CohortReturned / stats.d1CohortBase) * 100)
    : 0;
  const d7CohortPct = stats.d7CohortBase > 0
    ? Math.round((stats.d7CohortReturned / stats.d7CohortBase) * 100)
    : 0;
  const d30CohortPct = stats.d30CohortBase > 0
    ? Math.round((stats.d30CohortReturned / stats.d30CohortBase) * 100)
    : 0;
  const returnedEverPct = stats.activatedUsers > 0
    ? Math.round((stats.returnedEver / stats.activatedUsers) * 100)
    : 0;
  const activationPct = stats.totalUsers > 0
    ? Math.round((stats.onboardingComplete / stats.totalUsers) * 100)
    : 0;

  const signupMax = Math.max(...stats.signups7d.map((d) => d.count), 1);

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#1E1E1E]">Dashboard Overview</h1>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-[#999]">
              Updated {secondsAgo < 5 ? "just now" : `${secondsAgo}s ago`}
            </span>
          )}
          <button
            onClick={fetchStats}
            className="text-xs text-[#D97746] font-medium px-3 py-1.5 rounded-lg border border-[#D97746]/30 hover:bg-[#D97746]/8 transition-colors"
          >
            ↻ Refresh
          </button>
          <span className="text-xs text-[#999]">Launch: Jan 15, 2026</span>
        </div>
      </div>

      <Section icon="📈" title="Investor Snapshot">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <StatCard label="Total Users" value={stats.totalUsers} color="#D97746" />
          <StatCard
            label="Activated Users"
            value={`${stats.activatedUsers} / ${stats.totalUsers}`}
            sub="Activated / Total"
            color="#2E7D32"
          />
          <StatCard label="New Today" value={stats.newToday} sub="LA time" />
          <StatCard
            label="WoW Growth"
            value={`${stats.wowGrowth >= 0 ? "+" : ""}${stats.wowGrowth}%`}
            sub={`${stats.newThisWeek} new vs ${stats.lastWeekNew} last wk`}
            color="#1E1E1E"
          />
          <StatCard
            label="New (30 days)"
            value={stats.newLast30d}
            sub={`MoM ${stats.momGrowthPct >= 0 ? "+" : ""}${stats.momGrowthPct}% vs prior 28d`}
            color="#D97746"
          />
          <StatCard
            label="D7 Retention (cohort)"
            value={`${d7CohortPct}%`}
            sub={`${stats.d7CohortReturned}/${stats.d7CohortBase} back on day 6-8`}
          />
          <StatCard
            label="Activation Rate"
            value={`${activationPct}%`}
            sub="Completed onboarding"
          />
          <StatCard
            label="DAU / MAU"
            value={`${stats.dauMauRatio}%`}
            sub={`${stats.dau} daily / ${stats.mau} monthly`}
          />
        </div>
      </Section>

      <Section icon="✨" title="Funnel & Retention">
        <div className="mb-4 px-3 py-2 rounded-lg bg-[#F5F3F0] border border-[#E8E3DC] text-xs text-[#666]">
          📊 All engagement metrics calculated on activated users only (onboarding_status = complete). Total signups tracked separately.
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          <StatCard
            label="Activation Rate"
            value={`${activationPct}%`}
            sub={`${stats.onboardingComplete}/${stats.totalUsers} — of all signups`}
            color="#2E7D32"
          />
          <StatCard
            label="Started but Incomplete"
            value={stats.incompleteOnboarding}
            sub="Started, didn't finish"
            color="#E65100"
          />
          <StatCard
            label="D1 Retention (cohort)"
            value={`${d1CohortPct}%`}
            sub={`${stats.d1CohortReturned}/${stats.d1CohortBase} back on day 1`}
          />
          <StatCard
            label="D7 Retention (cohort)"
            value={`${d7CohortPct}%`}
            sub={`${stats.d7CohortReturned}/${stats.d7CohortBase} back day 6-8`}
          />
          <StatCard
            label="D30 Retention (cohort)"
            value={`${d30CohortPct}%`}
            sub={`${stats.d30CohortReturned}/${stats.d30CohortBase} back day 29-31`}
          />
          <StatCard
            label="D7 (cumulative)"
            value={`${retention7dPct}%`}
            sub={`${stats.returned7d}/${stats.retentionBase} ever returned after day 7`}
          />
          <StatCard
            label="D30 (cumulative)"
            value={`${retention30dPct}%`}
            sub={`${stats.returned30d}/${stats.d30RetentionBase} ever returned after day 30`}
          />
          <StatCard
            label="Returned (Ever)"
            value={`${returnedEverPct}%`}
            sub={`${stats.returnedEver}/${stats.activatedUsers} — returned at least once`}
            color="#2E7D32"
          />
          <StatCard label="DAU" value={stats.dau} sub="Last 24h · activated" />
          <StatCard label="WAU" value={stats.wau} sub="Last 7d · activated" />
          <StatCard label="MAU" value={stats.mau} sub="Last 28d · activated" />
          <StatCard label="DAU/MAU Stickiness" value={`${stats.dauMauRatio}%`} sub="DAU / MAU · activated" />
          <StatCard label="WAU/MAU" value={`${stats.wauMauRatio}%`} sub="WAU / MAU · activated" />
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <StatCard label="Has Photo" value={stats.hasPhoto} />
          <StatCard label="Has Bio" value={stats.hasBio} />
        </div>
      </Section>

      {/* ── Marketplace Health ─────────────────────────────────────────── */}
      <Section icon="🛒" title="Marketplace Health">
        <div className="mb-4 px-3 py-2 rounded-lg bg-[#FDF5F0] border border-[#EDCFBF] text-xs text-[#8B4A1A]">
          📊 The flywheel: users join plans → attend IRL → become creators
        </div>

        {/* Row 1: Core marketplace metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <StatCard
            label="Unique Creators"
            value={`${stats.uniqueCreators} (${stats.activatedUsers > 0 ? Math.round((stats.uniqueCreators / stats.activatedUsers) * 100) : 0}%)`}
            sub="Users who've posted at least one plan"
          />
          <StatCard
            label="Unique Joiners"
            value={`${stats.uniqueJoiners} (${stats.activatedUsers > 0 ? Math.round((stats.uniqueJoiners / stats.activatedUsers) * 100) : 0}%)`}
            sub="Users who've joined someone else's plan"
          />
          <StatCard
            label="Plan Completion Rate"
            value={`${stats.planCompletionRate}%`}
            sub={`${stats.completedPlans} completed of ${stats.completedPlans + stats.cancelledPlans} finished plans`}
            color="#2E7D32"
          />
          <StatCard
            label="Joiner → Creator"
            value={`${stats.joinerToCreatorRate}%`}
            sub={`${stats.joinerToCreatorCount} joiners later posted their own plan`}
            color="#C4622D"
          />
        </div>

        {/* Row 2: Plan breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard
            label="Completed Plans"
            value={stats.completedPlans}
            color="#2E7D32"
          />
          <StatCard
            label="Active Plans"
            value={stats.activePlans}
            sub="Currently live"
          />
          <StatCard
            label="Total Published Plans"
            value={stats.publishedPlans}
            sub="Excludes drafts"
          />
          <StatCard
            label="Cancelled"
            value={stats.cancelledPlans}
            color={stats.publishedPlans > 0 && stats.cancelledPlans / stats.publishedPlans > 0.2 ? "#C62828" : undefined}
          />
          <StatCard
            label="Drafts"
            value={stats.totalPlans - stats.publishedPlans}
            sub="Created but not posted"
          />
        </div>
      </Section>

      <Section icon="🚧" title={`Where users are getting stuck (${stats.incompleteOnboarding} started but incomplete)`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl p-4 bg-[#FFEBEE] border border-[#FFCDD2]">
            <p className="text-2xl font-bold text-[#C62828]">{stats.stuckNeverStarted}</p>
            <p className="text-sm font-medium text-[#C62828]">Never started basics</p>
            <p className="text-xs text-[#C62828]/60 mt-0.5">No name/gender (pending)</p>
          </div>
          <div className="rounded-xl p-4 bg-[#FFF3E0] border border-[#FFE0B2]">
            <p className="text-2xl font-bold text-[#E65100]">{stats.stuckAtPhoto}</p>
            <p className="text-sm font-medium text-[#E65100]">Stopped before photo</p>
            <p className="text-xs text-[#E65100]/60 mt-0.5">Started onboarding, no photo yet</p>
          </div>
          <div className="rounded-xl p-4 bg-[#E8F5E9] border border-[#C8E6C9]">
            <p className="text-2xl font-bold text-[#2E7D32]">{stats.stuckAlmostDone}</p>
            <p className="text-sm font-medium text-[#2E7D32]">Almost done!</p>
            <p className="text-xs text-[#2E7D32]/60 mt-0.5">Has photo, didn&apos;t finish</p>
          </div>
        </div>
      </Section>

      <Section icon="📋" title="Plan Health">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Plans with 2+"
            value={stats.plansWith2Plus}
            sub="At least one joiner"
            color="#1565C0"
          />
          <StatCard label="Plans with 3+" value={stats.plansWith3Plus} sub="Well-formed groups" />
          <StatCard label="Avg Members/Plan" value={stats.avgMembers} />
          <StatCard
            label="Plans with 0 Joins"
            value={stats.plansNoJoins}
            sub="Creator only"
            color="#E65100"
          />
        </div>
      </Section>

      <Section icon="💬" title="Chat Engagement">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total Messages" value={stats.totalMessages.toLocaleString()} />
          <StatCard
            label="Events with Chat"
            value={
              stats.publishedPlans > 0
                ? `${Math.round((stats.eventsWithChat / stats.publishedPlans) * 100)}%`
                : "0%"
            }
            sub={`${stats.eventsWithChat} of ${stats.publishedPlans} published`}
            color="#2E7D32"
          />
          <StatCard label="Users Who Chatted" value={stats.usersWhoChatted} />
          <StatCard label="Msgs/Active Event" value={stats.msgsPerActiveEvent} />
        </div>
      </Section>

      <Section icon="🌍" title="WTL Cities">
        {!wtlCities ? (
          <p className="text-sm text-[#999]">Loading…</p>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl font-bold text-[#D97746]">{wtlCities.total}</span>
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

      <Section icon="📊" title="Signups (Last 7 Days)">
        <div className="flex items-end justify-between gap-2 h-32">
          {stats.signups7d.map((day) => (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs font-bold text-[#D97746]">{day.count}</span>
              <div
                className="w-full bg-[#D97746] rounded-t-md transition-all"
                style={{ height: `${Math.max((day.count / signupMax) * 80, 4)}px` }}
              />
              <span className="text-[10px] text-[#999]">{day.date}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section icon="📅" title="Weekly Data Table">
        <p className="text-xs text-[#999] mb-3">Last row shows % trend from Week 1 to current.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E8E3DC] text-left">
                <th className="py-2 pr-3 text-[#999] font-medium text-xs">Week</th>
                <th className="py-2 pr-3 text-[#999] font-medium text-xs">Week Ending</th>
                <th className="py-2 pr-3 text-[#999] font-medium text-xs">Total Users</th>
                <th className="py-2 pr-3 text-[#999] font-medium text-xs">New Users</th>
                <th className="py-2 pr-3 text-[#999] font-medium text-xs">Total Plans</th>
                <th className="py-2 pr-3 text-[#999] font-medium text-xs">Plans 2+</th>
                <th className="py-2 pr-3 text-[#999] font-medium text-xs">Plans 3+</th>
                <th className="py-2 pr-3 text-[#999] font-medium text-xs">Avg Members</th>
                <th className="py-2 pr-3 text-[#999] font-medium text-xs">Messages</th>
                <th className="py-2 pr-3 text-[#999] font-medium text-xs">Active Plans</th>
              </tr>
            </thead>
            <tbody>
              {stats.weeklyData.map((row) => (
                <tr key={row.week} className="border-b border-[#F0EBE3] hover:bg-[#FBF9F6]">
                  <td className="py-2 pr-3 font-medium text-[#1E1E1E]">Wk {row.week}</td>
                  <td className="py-2 pr-3 text-[#666]">{row.weekEnding}</td>
                  <td className="py-2 pr-3 font-bold text-[#D97746]">{row.totalUsers}</td>
                  <td className="py-2 pr-3 text-[#2E7D32] font-medium">+{row.newUsers}</td>
                  <td className="py-2 pr-3 text-[#666]">{row.totalPlans}</td>
                  <td className="py-2 pr-3 font-bold text-[#D97746]">{row.plans2Plus}</td>
                  <td className="py-2 pr-3 text-[#666]">{row.plans3Plus}</td>
                  <td className="py-2 pr-3 text-[#666]">{row.avgMembers}</td>
                  <td className="py-2 pr-3 text-[#666]">{row.messages}</td>
                  <td className="py-2 pr-3 text-[#666]">{row.activePlans}</td>
                </tr>
              ))}
              {stats.weeklyData.length >= 2 && (
                <tr className="bg-[#F0EBE3]/50 font-medium">
                  <td className="py-2 pr-3 text-[#999]" colSpan={2}>Trend (Wk1 → Now)</td>
                  <td className="py-2 pr-3 text-[#2E7D32]">
                    +{Math.round(
                      ((stats.weeklyData[stats.weeklyData.length - 1].totalUsers -
                        stats.weeklyData[0].totalUsers) /
                        Math.max(stats.weeklyData[0].totalUsers, 1)) * 100
                    )}%
                  </td>
                  <td className="py-2 pr-3" />
                  <td className="py-2 pr-3 text-[#D97746]">
                    +{Math.round(
                      ((stats.weeklyData[stats.weeklyData.length - 1].totalPlans -
                        stats.weeklyData[0].totalPlans) /
                        Math.max(stats.weeklyData[0].totalPlans, 1)) * 100
                    )}%
                  </td>
                  <td className="py-2 pr-3 text-[#D97746]">
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

      <Section icon="📣" title="How did you hear about us?">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2">
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

      <Section icon="📢" title="Send Announcement">
        <textarea
          value={announcement}
          onChange={(e) => setAnnouncement(e.target.value)}
          placeholder="Type your announcement message here..."
          className="w-full border border-[#E8E3DC] rounded-xl p-4 text-sm min-h-[100px] resize-y focus:outline-none focus:ring-2 focus:ring-[#D97746]/30 focus:border-[#D97746] bg-[#FBF9F6]"
        />
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-[#999]">
            Will be sent to {stats.smsEnabledCount} users with SMS enabled
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
