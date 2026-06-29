import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { buildSessionInsert } from "@/lib/utils";
import { DEFAULT_QUESTIONS } from "@/lib/types";

/**
 * GET /api/cron/open-session
 *
 * Called by a Vercel Cron job every Monday morning (see vercel.json).
 * Archives the current active session and opens a fresh one for the new week,
 * carrying over the previous session's questions so admin edits persist.
 */
export async function GET(req: NextRequest) {
  // Protect with CRON_SECRET on Vercel, or ADMIN_SECRET in dev
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET ?? process.env.ADMIN_SECRET;
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createServiceClient();

  // Carry over the most recent session's questions
  const { data: prev } = await db
    .from("sessions")
    .select("questions")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const questions = prev?.questions ?? DEFAULT_QUESTIONS;

  // Archive any active session, then open the new week
  await db.from("sessions").update({ is_active: false }).eq("is_active", true);

  const { data, error } = await db
    .from("sessions")
    .insert(buildSessionInsert(questions))
    .select("id, week_label, closes_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ opened: data });
}
