import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function GET() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json({ error: "Service role key not configured" }, { status: 500 });
  }

  const admin = createServiceClient(supabaseUrl, serviceKey);

  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, city, created_at")
    .eq("onboarding_status", "waitlisted")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Group by city server-side
  const cityMap: Record<string, number> = {};
  for (const p of profiles ?? []) {
    const key = (p.city || "Unknown").trim();
    cityMap[key] = (cityMap[key] || 0) + 1;
  }

  const cities = Object.entries(cityMap)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({
    cities,
    total: (profiles ?? []).length,
  });
}
