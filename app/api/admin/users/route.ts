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
  async function fetchAll(table: string, columns: string, order?: { column: string; ascending: boolean }): Promise<any[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let all: any[] = [];
    let from = 0;
    let hasMore = true;
    while (hasMore) {
      let q = admin.from(table).select(columns);
      if (order) q = q.order(order.column, { ascending: order.ascending });
      const { data, error } = await q.range(from, from + PAGE - 1);
      if (error || !data) break;
      all = all.concat(data);
      hasMore = data.length === PAGE;
      from += PAGE;
    }
    return all;
  }

  const [allProfiles, events, eventMembers] = await Promise.all([
    fetchAll(
      "profiles",
      "id, created_at, first_name_display, profile_photo_url, bio, gender, onboarding_status, last_active_at, referral_source, phone_number, phone_verified",
      { column: "created_at", ascending: false }
    ),
    fetchAll("events", "id, creator_user_id, status"),
    fetchAll("event_members", "user_id, event_id, role, status"),
  ]);

  // Plans created per user (exclude drafts so "Creator" reflects published intent)
  const createdByUser = new Map<string, number>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const creatorByEvent = new Map<string, string>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  events.forEach((e: any) => {
    if (!e.creator_user_id) return;
    creatorByEvent.set(e.id, e.creator_user_id);
    if (e.status === "draft") return;
    createdByUser.set(e.creator_user_id, (createdByUser.get(e.creator_user_id) || 0) + 1);
  });

  // Plans joined per user — guest+joined, excluding plans they created themselves
  const joinedByUser = new Map<string, number>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  eventMembers.forEach((em: any) => {
    if (em.role !== "guest" || em.status !== "joined") return;
    if (creatorByEvent.get(em.event_id) === em.user_id) return;
    joinedByUser.set(em.user_id, (joinedByUser.get(em.user_id) || 0) + 1);
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const users = allProfiles.map((p: any) => ({
    ...p,
    plans_created: createdByUser.get(p.id) || 0,
    plans_joined: joinedByUser.get(p.id) || 0,
  }));

  return NextResponse.json({ users });
}
