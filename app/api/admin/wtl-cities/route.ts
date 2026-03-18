import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function GET() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json({ error: "Service role key not configured" }, { status: 500 });
  }

  const admin = createServiceClient(supabaseUrl, serviceKey);

  const { data: rows, error } = await admin
    .from("city_requests")
    .select("id, city_name, user_email, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Group by normalized city name (case-insensitive)
  const cityMap: Record<string, { city: string; count: number }> = {};
  for (const r of rows ?? []) {
    const key = r.city_name.trim().toLowerCase();
    if (!cityMap[key]) {
      cityMap[key] = { city: r.city_name.trim(), count: 0 };
    }
    cityMap[key].count++;
  }

  const cities = Object.values(cityMap).sort((a, b) => b.count - a.count);

  return NextResponse.json({
    cities,
    total: (rows ?? []).length,
    entries: rows ?? [],
  });
}
