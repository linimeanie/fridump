import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { isSubmissionOpen } from "@/lib/utils";
import { EmojiScore, SubmitPayload } from "@/lib/types";

// POST /api/submit — anonymous submission
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as SubmitPayload | null;

  if (!body || !body.session_id) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const db = createServiceClient();

  // Verify session exists and is still open
  const { data: session, error: sessionErr } = await db
    .from("sessions")
    .select("id, is_active, closes_at")
    .eq("id", body.session_id)
    .single();

  if (sessionErr || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  if (!session.is_active || !isSubmissionOpen(session.closes_at)) {
    return NextResponse.json(
      { error: "Submission window is closed" },
      { status: 403 }
    );
  }

  // Validate scores
  const scores: (keyof SubmitPayload)[] = ["mood", "workload", "learning", "vibe"];
  for (const key of scores) {
    const val = body[key] as number;
    if (!Number.isInteger(val) || val < 1 || val > 5) {
      return NextResponse.json(
        { error: `Invalid value for ${key}` },
        { status: 400 }
      );
    }
  }

  const { error: insertErr } = await db.from("submissions").insert({
    session_id: body.session_id,
    mood: body.mood as EmojiScore,
    workload: body.workload as EmojiScore,
    learning: body.learning as EmojiScore,
    vibe: body.vibe as EmojiScore,
    chest_text: body.chest_text?.trim() || null,
    improve_text: body.improve_text?.trim() || null,
    chest_public: !!body.chest_public,
  });

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
