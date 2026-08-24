import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const UPDATABLE_FIELDS = ["title", "content", "word_count"] as const;

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

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const field of UPDATABLE_FIELDS) {
    if (field in (body ?? {})) updates[field] = body[field];
  }

  const { error } = await admin.from("documents").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
