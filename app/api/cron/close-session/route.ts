import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/cron/close-session
 *
 * Called by a Vercel Cron job once daily (see vercel.json).
 * Marks any session past its closes_at timestamp as inactive.
 */
export async function GET(req: NextRequest) {
  // Protect with CRON_SECRET on Vercel, or ADMIN_SECRET in dev
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET ?? process.env.ADMIN_SECRET;
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createServiceClient();
  const now = new Date().toISOString();

  const { data, error } = await db
    .from("sessions")
    .update({ is_active: false })
    .eq("is_active", true)
    .lt("closes_at", now)
    .select("id, week_label");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    closed: data?.length ?? 0,
    sessions: data?.map((s: { id: string; week_label: string }) => s.week_label) ?? [],
  });
}
