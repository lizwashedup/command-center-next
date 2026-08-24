import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json({ error: "Service role key not configured" }, { status: 500 });
  }
  const admin = createServiceClient(supabaseUrl, serviceKey);

  const body = await request.json();
  const { name, category, cost, billing, url, notes } = body ?? {};
  if (!name || !String(name).trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const { data, error } = await admin
    .from("tools")
    .insert({
      name: String(name).trim(),
      category,
      cost: parseFloat(String(cost)) || 0,
      billing,
      url: url ? String(url).trim() : "",
      notes: notes ? String(notes).trim() : "",
      active: true,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tool: data });
}
