import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

type EventRow = {
  id: string;
  title: string;
  status: string;
  start_time: string | null;
  member_count: number | null;
  primary_vibe: string | null;
  neighborhood: string | null;
  creator_user_id: string;
};

type FeedbackRow = {
  id: string;
  event_id: string;
  user_id: string;
  attended: boolean | null;
  rating: string | null;
  comment: string | null;
  created_at: string;
};

type ProfileRow = {
  id: string;
  first_name_display: string | null;
  avatar_url: string | null;
};

type EventMemberRow = {
  event_id: string;
  user_id: string;
  status: string | null;
};

async function fetchAll<T>(
  query: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>
): Promise<T[]> {
  const PAGE = 1000;
  let out: T[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await query(from, from + PAGE - 1);
    if (error || !data) break;
    out = out.concat(data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return out;
}

export async function GET() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json({ error: "Service role key not configured" }, { status: 500 });
  }

  const admin = createServiceClient(supabaseUrl, serviceKey);

  const completedEvents = await fetchAll<EventRow>((from, to) =>
    admin
      .from("events")
      .select("id, title, status, start_time, member_count, primary_vibe, neighborhood, creator_user_id")
      .eq("status", "completed")
      .order("start_time", { ascending: false })
      .range(from, to)
  );

  const eventIds = completedEvents.map((e) => e.id);

  const feedback = eventIds.length
    ? await fetchAll<FeedbackRow>((from, to) =>
        admin
          .from("plan_feedback")
          .select("id, event_id, user_id, attended, rating, comment, created_at")
          .in("event_id", eventIds)
          .range(from, to)
      )
    : [];

  const members = eventIds.length
    ? await fetchAll<EventMemberRow>((from, to) =>
        admin
          .from("event_members")
          .select("event_id, user_id, status")
          .in("event_id", eventIds)
          .range(from, to)
      )
    : [];

  const allNoShowFeedback = await fetchAll<{ user_id: string }>((from, to) =>
    admin
      .from("plan_feedback")
      .select("user_id")
      .eq("attended", false)
      .range(from, to)
  );
  const globalNoShowCount: Record<string, number> = {};
  for (const row of allNoShowFeedback) {
    globalNoShowCount[row.user_id] = (globalNoShowCount[row.user_id] || 0) + 1;
  }

  const profileIdSet = new Set<string>();
  completedEvents.forEach((e) => profileIdSet.add(e.creator_user_id));
  feedback.forEach((f) => profileIdSet.add(f.user_id));
  const profileIds = [...profileIdSet].filter(Boolean);

  const profiles = profileIds.length
    ? await fetchAll<ProfileRow>((from, to) =>
        admin
          .from("profiles")
          .select("id, first_name_display, avatar_url")
          .in("id", profileIds)
          .range(from, to)
      )
    : [];
  const profileMap: Record<string, ProfileRow> = {};
  profiles.forEach((p) => (profileMap[p.id] = p));

  const feedbackByEvent: Record<string, FeedbackRow[]> = {};
  feedback.forEach((f) => {
    (feedbackByEvent[f.event_id] ||= []).push(f);
  });

  const membersByEvent: Record<string, EventMemberRow[]> = {};
  members.forEach((m) => {
    (membersByEvent[m.event_id] ||= []).push(m);
  });

  const events = completedEvents.map((e) => {
    const fbs = feedbackByEvent[e.id] || [];
    const attendedCount = fbs.filter((f) => f.attended === true).length;
    const noShowCount = fbs.filter((f) => f.attended === false).length;
    const thumbsUpCount = fbs.filter((f) => f.rating === "thumbs_up").length;
    const thumbsDownCount = fbs.filter((f) => f.rating != null && f.rating !== "thumbs_up").length;
    const commentCount = fbs.filter((f) => f.comment && f.comment.trim().length > 0).length;
    const creator = profileMap[e.creator_user_id];

    return {
      id: e.id,
      title: e.title,
      start_time: e.start_time,
      primary_vibe: e.primary_vibe,
      neighborhood: e.neighborhood,
      member_count: e.member_count,
      creator_user_id: e.creator_user_id,
      creator_name: creator?.first_name_display || "Unknown",
      creator_avatar: creator?.avatar_url || null,
      total_members: (membersByEvent[e.id] || []).length,
      feedback_count: fbs.length,
      attended_count: attendedCount,
      no_show_count: noShowCount,
      thumbs_up_count: thumbsUpCount,
      thumbs_down_count: thumbsDownCount,
      comment_count: commentCount,
      feedback: fbs.map((f) => {
        const p = profileMap[f.user_id];
        return {
          id: f.id,
          user_id: f.user_id,
          first_name: p?.first_name_display || "Unknown",
          avatar_url: p?.avatar_url || null,
          attended: f.attended,
          rating: f.rating,
          comment: f.comment,
          created_at: f.created_at,
          user_total_no_shows: globalNoShowCount[f.user_id] || 0,
        };
      }),
    };
  });

  const totalCompleted = completedEvents.length;
  const totalFeedback = feedback.length;
  const totalMembersAcrossCompleted = members.length;
  const responseRate =
    totalMembersAcrossCompleted > 0 ? (totalFeedback / totalMembersAcrossCompleted) * 100 : 0;
  const ratedFeedback = feedback.filter((f) => f.rating != null);
  const thumbsUp = feedback.filter((f) => f.rating === "thumbs_up").length;
  const thumbsUpRate = ratedFeedback.length > 0 ? (thumbsUp / ratedFeedback.length) * 100 : 0;
  const noShowTotal = feedback.filter((f) => f.attended === false).length;
  const noShowRate = totalFeedback > 0 ? (noShowTotal / totalFeedback) * 100 : 0;

  return NextResponse.json({
    stats: {
      total_completed: totalCompleted,
      response_rate: responseRate,
      thumbs_up_rate: thumbsUpRate,
      no_show_rate: noShowRate,
      total_feedback: totalFeedback,
    },
    events,
  });
}
