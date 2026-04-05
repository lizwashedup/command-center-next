import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json(
      { error: "Service role key not configured" },
      { status: 500 }
    );
  }

  const admin = createServiceClient(supabaseUrl, serviceKey);
  const now = new Date();
  // PT midnight for DAU: get current PT date, compute UTC equivalent of midnight PT
  const ptDateStr = now.toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" }); // "YYYY-MM-DD"
  const ptWall = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  const ptOffsetMs = now.getTime() - ptWall.getTime(); // ms PT is behind UTC (e.g. 7h for PDT)
  const dayAgo = new Date(new Date(ptDateStr + "T00:00:00Z").getTime() + ptOffsetMs);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const oneDayAgoMs = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
  const thirtyOneDaysAgo = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000);
  const thirtySevenDaysAgo = new Date(now.getTime() - 37 * 24 * 60 * 60 * 1000);
  const twoMonthsAgo = new Date(now.getTime() - 56 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function fetchAll(table: string, columns: string): Promise<any[]> {
    const PAGE = 1000;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let allData: any[] = [];
    let from = 0;
    let hasMore = true;
    while (hasMore) {
      const { data, error } = await admin
        .from(table)
        .select(columns)
        .range(from, from + PAGE - 1);
      if (error || !data) {
        console.error(`[admin-stats] fetchAll ${table} error:`, error?.message);
        break;
      }
      allData = allData.concat(data);
      hasMore = data.length === PAGE;
      from += PAGE;
    }
    return allData;
  }

  // Call the PT-anchored RPC for signup counts
  const { data: ptStats, error: ptError } = await supabase.rpc(
    "get_pt_dashboard_stats"
  );

  if (ptError) {
    console.error("[admin-stats] get_pt_dashboard_stats error:", ptError.message);
  }

  // Fetch weekly snapshots
  const { data: snapshots, error: snapError } = await admin
    .from("weekly_snapshots")
    .select("*")
    .order("week_number", { ascending: true });

  if (snapError) {
    console.error("[admin-stats] weekly_snapshots error:", snapError.message);
  }

  const [profiles, events, allMessages, eventMembers, userSessionsData] = await Promise.all([
    fetchAll(
      "profiles",
      "id, created_at, onboarding_status, profile_photo_url, bio, gender, first_name_display, referral_source, phone_number, phone_verified, last_active_at, first_return_at"
    ),
    fetchAll("events", "id, created_at, member_count, status, start_time, creator_user_id"),
    fetchAll("messages", "id, event_id, user_id, created_at, message_type"),
    fetchAll("event_members", "user_id, event_id, role, status, joined_at"),
    fetchAll("user_sessions", "user_id, session_date"),
  ]);

  console.log(
    "[admin-stats] rows fetched — profiles:",
    profiles.length,
    "events:",
    events.length,
    "messages:",
    allMessages.length,
    "event_members:",
    eventMembers.length
  );

  const messages = allMessages.filter((m) => m.message_type === "user");

  // ── User counts ──────────────────────────────────────────────────────────
  const totalUsers = profiles.length;

  const newToday = profiles.filter((p) => new Date(p.created_at) >= dayAgo).length;
  const newThisWeek = ptStats?.new_this_week ?? 0;
  const lastWeekNew = ptStats?.prev_week_count ?? 0;
  const newLast30d = ptStats?.new_this_month ?? 0;
  const signups7d: { date: string; count: number }[] =
    ptStats?.signups_by_day ?? [];
  const wowGrowth =
    lastWeekNew > 0
      ? Math.round(((newThisWeek - lastWeekNew) / lastWeekNew) * 100)
      : 0;

  // ── Activation ───────────────────────────────────────────────────────────
  const activatedProfiles = profiles.filter(
    (p) => p.onboarding_status === "complete"
  );
  const activatedUsers = activatedProfiles.length;
  const onboardingComplete = activatedUsers; // alias kept for compatibility

  // Started but not completed (excludes 'pending' = never started)
  const incompleteOnboarding = profiles.filter((p) =>
    ["la_check", "photo", "vibes"].includes(p.onboarding_status)
  ).length;

  const hasPhoto = profiles.filter((p) => p.profile_photo_url).length;
  const hasBio = profiles.filter((p) => p.bio).length;

  // Stuck breakdown (all non-complete profiles)
  const incomplete = profiles.filter(
    (p) => p.onboarding_status !== "complete"
  );
  const stuckNeverStarted = incomplete.filter(
    (p) => !p.first_name_display && !p.gender && !p.profile_photo_url
  ).length;
  const stuckAtPhoto = incomplete.filter(
    (p) => (p.first_name_display || p.gender) && !p.profile_photo_url
  ).length;
  const stuckAlmostDone = incomplete.filter(
    (p) => p.profile_photo_url
  ).length;

  // ── Plan stats ───────────────────────────────────────────────────────────
  const liveStatuses = ["forming", "active", "full"];
  const publishedEvents = events.filter((e) => e.status !== "draft");
  const liveEvents = events.filter((e) => liveStatuses.includes(e.status));
  const activePlans = liveEvents.length;
  // Plans that are "live" but start_time has already passed — creators forgot to close them
  const stalePlans = liveEvents.filter(
    (e) => e.start_time && new Date(e.start_time) < now
  ).length;
  // Truly upcoming plans (start_time in the future or no date set)
  const upcomingPlans = liveEvents.filter(
    (e) => !e.start_time || new Date(e.start_time) >= now
  ).length;
  const plansWith2Plus = publishedEvents.filter((e) => e.member_count >= 2).length;
  const plansWith3Plus = publishedEvents.filter((e) => e.member_count >= 3).length;
  const plansNoJoins = publishedEvents.filter((e) => e.member_count <= 1).length;
  const cancelledPlans = events.filter(
    (e) => e.status === "cancelled"
  ).length;
  const avgMembers =
    publishedEvents.length > 0
      ? Math.round(
          (publishedEvents.reduce((s, e) => s + (e.member_count || 0), 0) /
            publishedEvents.length) *
            10
        ) / 10
      : 0;

  // ── Chat stats ───────────────────────────────────────────────────────────
  const totalMessages = messages.length;
  const eventIdsWithChat = new Set(messages.map((m) => m.event_id));
  const eventsWithChat = eventIdsWithChat.size;
  const usersWhoChatted = new Set(
    messages.filter((m) => m.user_id).map((m) => m.user_id)
  ).size;
  const activeEventIds = new Set(
    events.filter((e) => liveStatuses.includes(e.status)).map((e) => e.id)
  );
  const activeEventMessages = messages.filter((m) => activeEventIds.has(m.event_id)).length;
  const msgsPerActiveEvent =
    activePlans > 0
      ? Math.round((activeEventMessages / activePlans) * 10) / 10
      : 0;

  const smsEnabledCount = profiles.filter(
    (p) => p.phone_number && p.phone_verified
  ).length;

  // ── Engagement — activated users only ────────────────────────────────────
  const dau = activatedProfiles.filter(
    (p) => p.last_active_at && new Date(p.last_active_at) >= dayAgo
  ).length;
  const wau = activatedProfiles.filter(
    (p) => p.last_active_at && new Date(p.last_active_at) >= weekAgo
  ).length;
  const mau = activatedProfiles.filter(
    (p) => p.last_active_at && new Date(p.last_active_at) >= monthAgo
  ).length;
  const wauMauRatio = mau > 0 ? Math.round((wau / mau) * 100) : 0;
  const dauMauRatio = mau > 0 ? Math.round((dau / mau) * 100) : 0;

  // ── MoM Growth — compare last 28d signups vs prior 28d ───────────────────
  const prevMonthCount = profiles.filter((p) => {
    const c = new Date(p.created_at);
    return c >= twoMonthsAgo && c < monthAgo;
  }).length;
  const newLast28d = profiles.filter((p) => new Date(p.created_at) >= monthAgo).length;
  const momGrowthPct =
    prevMonthCount > 0
      ? Math.round(((newLast28d - prevMonthCount) / prevMonthCount) * 100)
      : 0;

  // ── D7 Retention — activated users created 7+ days ago ───────────────────
  const d7Eligible = activatedProfiles.filter(
    (p) => new Date(p.created_at) <= sevenDaysAgo
  );
  const retentionBase = d7Eligible.length;
  const returned7d = d7Eligible.filter((p) => {
    if (!p.last_active_at) return false;
    const createdMs = new Date(p.created_at).getTime();
    return new Date(p.last_active_at).getTime() >= createdMs + 7 * 24 * 60 * 60 * 1000;
  }).length;

  // ── D30 Retention — activated users created 30+ days ago ─────────────────
  const d30Eligible = activatedProfiles.filter(
    (p) => new Date(p.created_at) <= thirtyDaysAgo
  );
  const d30RetentionBase = d30Eligible.length;
  const returned30d = d30Eligible.filter((p) => {
    if (!p.last_active_at) return false;
    const createdMs = new Date(p.created_at).getTime();
    return new Date(p.last_active_at).getTime() >= createdMs + 30 * 24 * 60 * 60 * 1000;
  }).length;

  // ── Cohort Retention (true point-in-time, using user_sessions) ───────────
  // Build map: user_id -> Set<"YYYY-MM-DD"> of days they were active
  const sessionsByUser = new Map<string, Set<string>>();
  userSessionsData.forEach((s: { user_id: string; session_date: string }) => {
    if (!sessionsByUser.has(s.user_id)) sessionsByUser.set(s.user_id, new Set());
    sessionsByUser.get(s.user_id)!.add(s.session_date.slice(0, 10));
  });

  function getSignupDatePT(createdAt: string): string {
    return new Date(createdAt).toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
  }

  function addDays(dateStr: string, days: number): string {
    const d = new Date(dateStr + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  }

  function hadSessionInRange(userId: string, signupDate: string, startDay: number, endDay: number): boolean {
    const sessions = sessionsByUser.get(userId);
    if (!sessions) return false;
    for (let day = startDay; day <= endDay; day++) {
      if (sessions.has(addDays(signupDate, day))) return true;
    }
    return false;
  }

  // D1 cohort: activated users created 1–31 days ago
  // Combines user_sessions (day 1 row) OR first_return_at within 24h of signup
  const d1CohortProfiles = activatedProfiles.filter((p) => {
    const c = new Date(p.created_at);
    return c <= oneDayAgoMs && c >= thirtyOneDaysAgo;
  });
  const d1CohortBase = d1CohortProfiles.length;
  const d1CohortReturned = d1CohortProfiles.filter((p) => {
    const hadSession = hadSessionInRange(p.id, getSignupDatePT(p.created_at), 1, 1);
    const hadEarlyReturn =
      !!p.first_return_at &&
      new Date(p.first_return_at).getTime() <= new Date(p.created_at).getTime() + 24 * 60 * 60 * 1000;
    return hadSession || hadEarlyReturn;
  }).length;

  // D7 cohort: activated users created 7–37 days ago; check session on days 6-8
  const d7CohortProfiles = activatedProfiles.filter((p) => {
    const c = new Date(p.created_at);
    return c <= sevenDaysAgo && c >= thirtySevenDaysAgo;
  });
  const d7CohortBase = d7CohortProfiles.length;
  const d7CohortReturned = d7CohortProfiles.filter((p) =>
    hadSessionInRange(p.id, getSignupDatePT(p.created_at), 6, 8)
  ).length;

  // D30 cohort: activated users created 30–60 days ago; check session on days 29-31
  const d30CohortProfiles = activatedProfiles.filter((p) => {
    const c = new Date(p.created_at);
    return c <= thirtyDaysAgo && c >= sixtyDaysAgo;
  });
  const d30CohortBase = d30CohortProfiles.length;
  const d30CohortReturned = d30CohortProfiles.filter((p) =>
    hadSessionInRange(p.id, getSignupDatePT(p.created_at), 29, 31)
  ).length;

  // ── WashedUp IRL Metrics ─────────────────────────────────────────────────

  // Helper: YYYY-MM-DD string in PT for boundary comparisons
  const toDateStrPT = (d: Date) =>
    d.toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });

  const activatedIds = new Set(activatedProfiles.map((p) => p.id));

  // Monthly participation: % of MAU who joined ≥1 plan in last 28d
  const mauUserIds = new Set(
    activatedProfiles
      .filter((p) => p.last_active_at && new Date(p.last_active_at) >= monthAgo)
      .map((p) => p.id)
  );
  const mauPlanJoinersSet = new Set(
    eventMembers
      .filter(
        (em) =>
          em.role === "guest" &&
          em.status === "joined" &&
          em.joined_at &&
          new Date(em.joined_at) >= monthAgo &&
          mauUserIds.has(em.user_id)
      )
      .map((em) => em.user_id)
  );
  const monthlyParticipants = mauPlanJoinersSet.size;
  const monthlyParticipationRate =
    mau > 0 ? Math.round((monthlyParticipants / mau) * 100) : 0;

  // Repeat plan rate: all-time joiners who joined 2+ plans
  const joinCountByUser = new Map<string, number>();
  eventMembers
    .filter((em) => em.role === "guest" && em.status === "joined")
    .forEach((em) => {
      joinCountByUser.set(em.user_id, (joinCountByUser.get(em.user_id) || 0) + 1);
    });
  const totalPlanJoiners = joinCountByUser.size;
  const repeatPlanners = Array.from(joinCountByUser.values()).filter((c) => c >= 2).length;
  const repeatPlanRate =
    totalPlanJoiners > 0 ? Math.round((repeatPlanners / totalPlanJoiners) * 100) : 0;
  const avgPlansPerJoiner =
    totalPlanJoiners > 0
      ? Math.round(
          (Array.from(joinCountByUser.values()).reduce((a, b) => a + b, 0) /
            totalPlanJoiners) *
            10
        ) / 10
      : 0;

  // Avg plans joined per month (last 28d, among MAU joiners)
  const monthlyJoinerMap = new Map<string, number>();
  eventMembers
    .filter(
      (em) =>
        em.role === "guest" &&
        em.status === "joined" &&
        em.joined_at &&
        new Date(em.joined_at) >= monthAgo &&
        mauUserIds.has(em.user_id)
    )
    .forEach((em) => {
      monthlyJoinerMap.set(em.user_id, (monthlyJoinerMap.get(em.user_id) || 0) + 1);
    });
  const avgPlansPerMonth =
    monthlyJoinerMap.size > 0
      ? Math.round(
          (Array.from(monthlyJoinerMap.values()).reduce((a, b) => a + b, 0) /
            monthlyJoinerMap.size) *
            10
        ) / 10
      : 0;

  // Month-1 Retention: of activated users who signed up 28–56 days ago,
  // did they return at least once within their first 30 days?
  // Combines first_return_at (set by middleware on genuine returns) + user_sessions.
  // Sessions are sparse until May 26 fix; first_return_at is the primary signal.
  const newCohortProfiles = activatedProfiles.filter((p) => {
    const c = new Date(p.created_at);
    return c >= twoMonthsAgo && c < monthAgo;
  });
  const prevMonthMauCount = newCohortProfiles.length; // "last month's new users"
  const retainedMauCount = newCohortProfiles.filter((p) =>
    !!p.first_return_at || hadSessionInRange(p.id, getSignupDatePT(p.created_at), 1, 30)
  ).length;
  const mauRetentionPct =
    prevMonthMauCount > 0 ? Math.round((retainedMauCount / prevMonthMauCount) * 100) : 0;

  // ── Ever Returned — activated users base ─────────────────────────────────
  const returnedEver = activatedProfiles.filter((p) => !!p.first_return_at).length;

  // ── Marketplace Health ────────────────────────────────────────────────────
  // Map event_id → creator_user_id
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const creatorByEvent = new Map<string, string>(events.map((e: any) => [e.id, e.creator_user_id]));

  // Unique creators (all time, any event)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const uniqueCreators = new Set(events.map((e: any) => e.creator_user_id).filter(Boolean)).size;

  // Guest joins: role=guest, status=joined, not the creator of that event
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const guestJoins = eventMembers.filter((em: any) =>
    em.role === "guest" &&
    em.status === "joined" &&
    em.user_id !== creatorByEvent.get(em.event_id)
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const uniqueJoinerSet = new Set(guestJoins.map((em: any) => em.user_id));
  const uniqueJoiners = uniqueJoinerSet.size;

  // Completed plans & completion rate
  const completedPlans = events.filter((e: any) => e.status === "completed").length; // eslint-disable-line @typescript-eslint/no-explicit-any
  // Use only terminal-state plans (completed + cancelled) as denominator so live plans don't dilute the rate
  const terminalPlans = completedPlans + cancelledPlans;
  const planCompletionRate = terminalPlans > 0
    ? Math.round((completedPlans / terminalPlans) * 100)
    : 0;

  // Joiner → Creator: users who first joined, then later posted their own plan
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const firstJoinByUser = new Map<string, number>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  guestJoins.forEach((em: any) => {
    const t = em.joined_at ? new Date(em.joined_at).getTime() : 0;
    const existing = firstJoinByUser.get(em.user_id);
    if (existing === undefined || t < existing) firstJoinByUser.set(em.user_id, t);
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const firstCreateByUser = new Map<string, number>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  events.forEach((e: any) => {
    if (!e.creator_user_id) return;
    const t = new Date(e.created_at).getTime();
    const existing = firstCreateByUser.get(e.creator_user_id);
    if (existing === undefined || t < existing) firstCreateByUser.set(e.creator_user_id, t);
  });
  let joinerToCreatorCount = 0;
  firstJoinByUser.forEach((firstJoin, userId) => {
    const firstCreate = firstCreateByUser.get(userId);
    if (firstCreate !== undefined && firstCreate > firstJoin) joinerToCreatorCount++;
  });
  const joinerToCreatorRate = uniqueJoiners > 0
    ? Math.round((joinerToCreatorCount / uniqueJoiners) * 100)
    : 0;

  // ── Referral source breakdown ─────────────────────────────────────────────
  const referralMap: Record<string, number> = {};
  profiles.forEach((p) => {
    const src = (p.referral_source as string) || "Unknown";
    referralMap[src] = (referralMap[src] || 0) + 1;
  });
  const referralCounts = Object.entries(referralMap)
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);

  // Weekly Plans Made (WPM): plans created during each week that are currently active
  const liveStatusSet = new Set(["forming", "active", "full"]);

  const weeklyData = (snapshots ?? []).map((s) => {
    const weekEnd = new Date(s.week_end + "T23:59:59Z");
    const weekStart = new Date(weekEnd.getTime() - 6 * 24 * 60 * 60 * 1000);
    weekStart.setUTCHours(0, 0, 0, 0);

    // WPM = all non-draft plans created this week (regardless of current status)
    const wpm = events.filter((e) => {
      const created = new Date(e.created_at);
      return created >= weekStart && created <= weekEnd && e.status !== "draft";
    }).length;

    return {
      week: s.week_number,
      weekEnding: new Date(s.week_end + "T12:00:00Z").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "America/Los_Angeles",
      }),
      totalUsers: s.total_users,
      newUsers: s.new_users,
      wpm,
      plans2Plus: s.plans_two_plus,
      plans3Plus: s.plans_three_plus,
      avgMembers: parseFloat(s.avg_members_per_plan) || 0,
      messages: s.total_messages,
      activePlans: s.active_plans,
      isLive: false,
    };
  });

  // ── Live Week 12 row (current week, always up-to-date) ────────────────────
  // Week 12 started Mar 30 PT; derive dynamically so it works for any current week
  const lastSnapshot = snapshots && snapshots.length > 0
    ? snapshots[snapshots.length - 1]
    : null;
  const lastSnapshotWeekEnd = lastSnapshot
    ? new Date(lastSnapshot.week_end + "T23:59:59Z")
    : null;
  const currentWeekStart = lastSnapshotWeekEnd
    ? new Date(lastSnapshotWeekEnd.getTime() + 1000) // 1 sec after last week ended
    : null;

  if (currentWeekStart && currentWeekStart <= now) {
    const currentWeekNumber = lastSnapshot ? lastSnapshot.week_number + 1 : 1;

    const newUsersThisWeek = profiles.filter(
      (p) => new Date(p.created_at) >= currentWeekStart
    ).length;

    const wpmThisWeek = events.filter((e) => {
      const created = new Date(e.created_at);
      return created >= currentWeekStart && e.status !== "draft";
    }).length;

    const publishedThisWeek = events.filter(
      (e) => e.status !== "draft" && new Date(e.created_at) >= currentWeekStart
    );

    const liveThisWeek = events.filter(
      (e) => liveStatusSet.has(e.status) && new Date(e.created_at) >= currentWeekStart
    ).length;

    const messagesThisWeek = messages.filter(
      (m) => new Date(m.created_at) >= currentWeekStart
    ).length;

    weeklyData.push({
      week: currentWeekNumber,
      weekEnding: "Live",
      totalUsers: profiles.length,
      newUsers: newUsersThisWeek,
      wpm: wpmThisWeek,
      plans2Plus: publishedThisWeek.filter((e) => e.member_count >= 2).length,
      plans3Plus: publishedThisWeek.filter((e) => e.member_count >= 3).length,
      avgMembers:
        publishedThisWeek.length > 0
          ? Math.round(
              (publishedThisWeek.reduce((s, e) => s + (e.member_count || 0), 0) /
                publishedThisWeek.length) * 10
            ) / 10
          : 0,
      messages: messagesThisWeek,
      activePlans: liveThisWeek,
      isLive: true,
    });
  }

  return NextResponse.json({
    totalUsers,
    activatedUsers,
    newToday,
    newThisWeek,
    lastWeekNew,
    newLast30d,
    wowGrowth,
    totalPlans: events.length,
    publishedPlans: publishedEvents.length,
    plansWith2Plus,
    plansWith3Plus,
    avgMembers,
    plansNoJoins,
    cancelledPlans,
    activePlans,
    upcomingPlans,
    stalePlans,
    onboardingComplete,
    incompleteOnboarding,
    hasPhoto,
    hasBio,
    stuckNeverStarted,
    stuckAtPhoto,
    stuckAlmostDone,
    totalMessages,
    eventsWithChat,
    usersWhoChatted,
    msgsPerActiveEvent,
    smsEnabledCount,
    dau,
    wau,
    mau,
    wauMauRatio,
    dauMauRatio,
    momGrowthPct,
    prevMonthCount,
    returnedEver,
    returned7d,
    retentionBase,
    returned30d,
    d30RetentionBase,
    d1CohortBase,
    d1CohortReturned,
    d7CohortBase,
    d7CohortReturned,
    d30CohortBase,
    d30CohortReturned,
    weeklyData,
    referralCounts,
    signups7d,
    uniqueCreators,
    uniqueJoiners,
    completedPlans,
    planCompletionRate,
    joinerToCreatorCount,
    joinerToCreatorRate,
    monthlyParticipants,
    monthlyParticipationRate,
    totalPlanJoiners,
    repeatPlanners,
    repeatPlanRate,
    avgPlansPerJoiner,
    avgPlansPerMonth,
    prevMonthMauCount,
    retainedMauCount,
    mauRetentionPct,
  });
}
