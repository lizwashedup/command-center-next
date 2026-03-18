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
  let allProfiles: any[] = [];
  let from = 0;
  let hasMore = true;
  while (hasMore) {
    const { data, error } = await admin
      .from("profiles")
      .select("id, created_at, first_name_display, profile_photo_url, bio, gender, onboarding_status, last_active_at, referral_source, phone_number, phone_verified")
      .order("created_at", { ascending: false })
      .range(from, from + PAGE - 1);
    if (error || !data) break;
    allProfiles = allProfiles.concat(data);
    hasMore = data.length === PAGE;
    from += PAGE;
  }

  return NextResponse.json({ users: allProfiles });
}
