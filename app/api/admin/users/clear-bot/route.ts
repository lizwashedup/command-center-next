import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const { userId } = await request.json();
  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !supabaseUrl) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const admin = createServiceClient(supabaseUrl, serviceKey);
  const { error } = await admin.from("bot_watch_cleared").insert({ user_id: userId });

  if (error) {
    console.error("[clear-bot] Error:", error.message);
    return NextResponse.json({ error: "Failed to clear user" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
