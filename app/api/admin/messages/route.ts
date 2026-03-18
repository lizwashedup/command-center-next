import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function GET() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json({ error: "Service role key not configured" }, { status: 500 });
  }

  const admin = createServiceClient(supabaseUrl, serviceKey);

  const { data: messages } = await admin
    .from("messages")
    .select("id, event_id, user_id, content, created_at, message_type")
    .eq("message_type", "user")
    .order("created_at", { ascending: false })
    .limit(500);

  const eventIds = [...new Set((messages ?? []).map((m) => m.event_id).filter(Boolean))];
  const eventMap: Record<string, string> = {};
  if (eventIds.length > 0) {
    const { data: events } = await admin
      .from("events")
      .select("id, title")
      .in("id", eventIds);
    if (events) events.forEach((e) => { eventMap[e.id] = e.title; });
  }

  const userIds = [...new Set((messages ?? []).map((m) => m.user_id).filter(Boolean))];
  const userMap: Record<string, string> = {};
  if (userIds.length > 0) {
    const { data: users } = await admin
      .from("profiles")
      .select("id, first_name_display")
      .in("id", userIds);
    if (users) users.forEach((u) => { userMap[u.id] = u.first_name_display || "User"; });
  }

  const enriched = (messages ?? []).map((m) => ({
    ...m,
    event_title: eventMap[m.event_id] || "Unknown Plan",
    user_name: userMap[m.user_id] || "Unknown",
  }));

  return NextResponse.json({ messages: enriched });
}
