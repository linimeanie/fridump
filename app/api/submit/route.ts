import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { isSubmissionOpen } from "@/lib/utils";
import { mirrorSubmissionToNotion } from "@/lib/notion";
import { SubmitPayload } from "@/lib/types";

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

  // All ratings are optional. When present, validate against the scale's max
  // (learning is a 1–10 scale; the rest are 1–5).
  const MAX: Record<string, number> = { mood: 5, workload: 5, vibe: 5, learning: 10 };
  const ratings: Record<"mood" | "workload" | "learning" | "vibe", number | null> = {
    mood: null,
    workload: null,
    learning: null,
    vibe: null,
  };
  for (const key of ["mood", "workload", "learning", "vibe"] as const) {
    const val = body[key];
    if (val === undefined || val === null) continue;
    if (!Number.isInteger(val) || val < 1 || val > MAX[key]) {
      return NextResponse.json(
        { error: `Invalid value for ${key}` },
        { status: 400 }
      );
    }
    ratings[key] = val;
  }

  const chestText = body.chest_text?.trim() || null;
  const improveText = body.improve_text?.trim() || null;
  const chestPublic = !!body.chest_public;

  // Require at least one answer of any kind — no empty submissions.
  const hasAnything =
    ratings.mood != null ||
    ratings.workload != null ||
    ratings.learning != null ||
    ratings.vibe != null ||
    !!chestText ||
    !!improveText;
  if (!hasAnything) {
    return NextResponse.json({ error: "Nothing to submit" }, { status: 400 });
  }

  const { error: insertErr } = await db.from("submissions").insert({
    session_id: body.session_id,
    mood: ratings.mood,
    workload: ratings.workload,
    learning: ratings.learning,
    vibe: ratings.vibe,
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
    mood: ratings.mood,
    workload: ratings.workload,
    learning: ratings.learning,
    vibe: ratings.vibe,
    chest_text: chestText,
    improve_text: improveText,
    chest_public: chestPublic,
    created_at: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
