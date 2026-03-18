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

  const [profiles, events, allMessages, eventMembers] = await Promise.all([
    fetchAll(
      "profiles",
      "id, created_at, onboarding_status, profile_photo_url, bio, gender, first_name_display, referral_source, phone_number, phone_verified, last_active_at, first_return_at"
    ),
    fetchAll("events", "id, created_at, member_count, status, start_time, creator_user_id"),
    fetchAll("messages", "id, event_id, user_id, created_at, message_type"),
    fetchAll("event_members", "user_id, event_id, role, status, joined_at"),
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

  const newToday = ptStats?.new_today ?? 0;
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
  const activePlans = events.filter((e) =>
    liveStatuses.includes(e.status)
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
  const planCompletionRate = publishedEvents.length > 0
    ? Math.round((completedPlans / publishedEvents.length) * 100)
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

  const weeklyData = (snapshots ?? []).map((s) => ({
    week: s.week_number,
    weekEnding: new Date(s.week_end + "T12:00:00Z").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "America/Los_Angeles",
    }),
    totalUsers: s.total_users,
    newUsers: s.new_users,
    totalPlans: s.total_plans,
    plans2Plus: s.plans_two_plus,
    plans3Plus: s.plans_three_plus,
    avgMembers: parseFloat(s.avg_members_per_plan) || 0,
    messages: s.total_messages,
    activePlans: s.active_plans,
  }));

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
    returnedEver,
    returned7d,
    retentionBase,
    returned30d,
    d30RetentionBase,
    weeklyData,
    referralCounts,
    signups7d,
    uniqueCreators,
    uniqueJoiners,
    completedPlans,
    planCompletionRate,
    joinerToCreatorCount,
    joinerToCreatorRate,
  });
}
