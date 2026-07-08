import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { isSubmissionOpen } from "@/lib/utils";
import { mirrorSubmissionToNotion } from "@/lib/notion";
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
    .select("id, is_active, closes_at, week_label")
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

  // Validate scores. mood/workload/learning are required; vibe is optional
  // (kept for older sessions that still ask it).
  const required: (keyof SubmitPayload)[] = ["mood", "workload", "learning"];
  for (const key of [...required, "vibe" as const]) {
    const val = body[key];
    if (key === "vibe" && (val === undefined || val === null)) continue;
    if (!Number.isInteger(val) || (val as number) < 1 || (val as number) > 5) {
      return NextResponse.json(
        { error: `Invalid value for ${key}` },
        { status: 400 }
      );
    }
  }

  const chestText = body.chest_text?.trim() || null;
  const improveText = body.improve_text?.trim() || null;
  const chestPublic = !!body.chest_public;

  const { error: insertErr } = await db.from("submissions").insert({
    session_id: body.session_id,
    mood: body.mood as EmojiScore,
    workload: body.workload as EmojiScore,
    learning: body.learning as EmojiScore,
    vibe: (body.vibe as EmojiScore) ?? null,
    chest_text: chestText,
    improve_text: improveText,
    chest_public: chestPublic,
  });

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  // Best-effort mirror to Notion (never blocks or fails the submission)
  await mirrorSubmissionToNotion({
    week_label: session.week_label,
    mood: body.mood,
    workload: body.workload,
    learning: body.learning,
    vibe: body.vibe ?? null,
    chest_text: chestText,
    improve_text: improveText,
    chest_public: chestPublic,
    created_at: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
