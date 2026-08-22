import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const UPDATABLE_FIELDS = ["title", "category", "last_action", "next_step", "due_date", "status"] as const;

export async function POST(request: Request) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json({ error: "Service role key not configured" }, { status: 500 });
  }
  const admin = createServiceClient(supabaseUrl, serviceKey);

  const body = await request.json();
  const { id } = body ?? {};
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  for (const field of UPDATABLE_FIELDS) {
    if (field in (body ?? {})) updates[field] = body[field];
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "no updatable fields provided" }, { status: 400 });
  }

  const { error } = await admin.from("growth_cards").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
