import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Friendly labels for the /trips signup buttons (trip_waitlist.source).
const SOURCE_LABELS: Record<string, string> = {
  nav: "Top nav",
  "how-it-works": "How it works",
  "santa-barbara": "Santa Barbara",
  trips: "Trips page",
};

export async function GET() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json({ error: "Service role key not configured" }, { status: 500 });
  }

  const admin = createServiceClient(supabaseUrl, serviceKey);

  const { data: rows, error } = await admin
    .from("trip_waitlist")
    .select("id, first_name, last_name, email, source, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const entries = (rows ?? []).map((r) => ({
    ...r,
    source_label: SOURCE_LABELS[r.source] ?? r.source,
  }));

  // Count signups per source
  const sourceMap: Record<string, { source: string; label: string; count: number }> = {};
  for (const r of entries) {
    if (!sourceMap[r.source]) {
      sourceMap[r.source] = { source: r.source, label: r.source_label, count: 0 };
    }
    sourceMap[r.source].count++;
  }
  const sources = Object.values(sourceMap).sort((a, b) => b.count - a.count);

  // Unique people by email (someone may sign up from more than one button)
  const uniqueEmails = new Set(entries.map((e) => e.email.toLowerCase()));

  return NextResponse.json({
    entries,
    total: entries.length,
    uniquePeople: uniqueEmails.size,
    sources,
  });
}
