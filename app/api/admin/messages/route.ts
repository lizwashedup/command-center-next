import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json({ error: "Service role key not configured" }, { status: 500 });
  }

  const admin = createServiceClient(supabaseUrl, serviceKey);
  const { searchParams } = new URL(request.url);
  const planId = searchParams.get("plan");

  // If a plan ID is provided, return all messages for that plan
  if (planId) {
    const { data: messages } = await admin
      .from("messages")
      .select("id, event_id, user_id, content, created_at, message_type")
      .eq("event_id", planId)
      .order("created_at", { ascending: true });

    const userIds = [...new Set((messages ?? []).map((m) => m.user_id).filter(Boolean))];
    const userMap: Record<string, { name: string; photo: string | null }> = {};
    if (userIds.length > 0) {
      const { data: users } = await admin
        .from("profiles")
        .select("id, first_name_display, profile_photo_url")
        .in("id", userIds);
      if (users) users.forEach((u) => {
        userMap[u.id] = { name: u.first_name_display || "User", photo: u.profile_photo_url };
      });
    }

    const enriched = (messages ?? []).map((m) => ({
      ...m,
      user_name: userMap[m.user_id]?.name || "Unknown",
      profile_photo_url: userMap[m.user_id]?.photo || null,
    }));

    return NextResponse.json({ messages: enriched });
  }

  // Otherwise return plan list with chat stats
  const { data: chatStats } = await admin.rpc("get_plan_chat_stats");

  if (chatStats) {
    return NextResponse.json({ plans: chatStats });
  }

  // Fallback: compute from messages table directly
  const { data: messages } = await admin
    .from("messages")
    .select("event_id, created_at")
    .eq("message_type", "user")
    .order("created_at", { ascending: false });

  const planMap = new Map<string, { count: number; lastMsg: string }>();
  (messages ?? []).forEach((m) => {
    const existing = planMap.get(m.event_id);
    if (!existing) {
      planMap.set(m.event_id, { count: 1, lastMsg: m.created_at });
    } else {
      existing.count++;
    }
  });

  const eventIds = [...planMap.keys()];
  const eventMap: Record<string, { title: string; member_count: number; status: string }> = {};
  if (eventIds.length > 0) {
    const { data: events } = await admin
      .from("events")
      .select("id, title, member_count, status")
      .in("id", eventIds);
    if (events) events.forEach((e) => {
      eventMap[e.id] = { title: e.title, member_count: e.member_count, status: e.status };
    });
  }

  const plans = eventIds
    .map((id) => ({
      event_id: id,
      event_title: eventMap[id]?.title || "Unknown Plan",
      message_count: planMap.get(id)!.count,
      last_message_at: planMap.get(id)!.lastMsg,
      member_count: eventMap[id]?.member_count || 0,
      status: eventMap[id]?.status || "unknown",
    }))
    .sort((a, b) => b.message_count - a.message_count);

  return NextResponse.json({ plans });
}
