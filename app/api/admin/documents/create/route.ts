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
  const { title, folder } = body ?? {};
  if (!title || !String(title).trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const { data, error } = await admin
    .from("documents")
    .insert({ title: String(title).trim(), folder, content: "", word_count: 0 })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ document: data });
}
