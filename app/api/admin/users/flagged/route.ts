import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function GET() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json({ error: "Service role key not configured" }, { status: 500 });
  }

  const admin = createServiceClient(supabaseUrl, serviceKey);

  const { data, error } = await admin.rpc("get_suspicious_accounts");

  if (error) {
    console.error("[admin-flagged-users] Error:", error.message);
    return NextResponse.json({ error: "Failed to fetch flagged users" }, { status: 500 });
  }

  return NextResponse.json({ users: data ?? [] });
}
