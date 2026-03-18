import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function GET() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json({ error: "Service role key not configured" }, { status: 500 });
  }

  const admin = createServiceClient(supabaseUrl, serviceKey);

  const PAGE = 1000;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let allEvents: any[] = [];
  let from = 0;
  let hasMore = true;
  while (hasMore) {
    const { data, error } = await admin
      .from("events")
      .select("id, created_at, title, description, location_text, start_time, status, member_count, max_invites, primary_vibe, gender_rule, creator_user_id")
      .order("created_at", { ascending: false })
      .range(from, from + PAGE - 1);
    if (error || !data) break;
    allEvents = allEvents.concat(data);
    hasMore = data.length === PAGE;
    from += PAGE;
  }

  const creatorIds = [...new Set(allEvents.map((e) => e.creator_user_id).filter(Boolean))];
  const creatorMap: Record<string, string> = {};
  if (creatorIds.length > 0) {
    const { data: creators } = await admin
      .from("profiles")
      .select("id, first_name_display")
      .in("id", creatorIds);
    if (creators) {
      creators.forEach((c) => {
        creatorMap[c.id] = c.first_name_display || "Unknown";
      });
    }
  }

  const events = allEvents.map((e) => ({
    ...e,
    creator_name: creatorMap[e.creator_user_id] || "Unknown",
  }));

  return NextResponse.json({ plans: events });
}
