import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { medianScore, scoreDistribution } from "@/lib/utils";
import { EmojiScore, QuestionResult, SessionResults, Submission } from "@/lib/types";

// GET /api/results?token=<presenter_token>
// Returns aggregated results for the active session.
// Requires the presenter token so only the designated presenter can access live results.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "token required" }, { status: 400 });
  }

  const db = createServiceClient();

  // Find the session by presenter_token
  const { data: session, error: sessionErr } = await db
    .from("sessions")
    .select("*")
    .eq("presenter_token", token)
    .single();

  if (sessionErr || !session) {
    return NextResponse.json({ error: "Invalid token" }, { status: 404 });
  }

  // Fetch all submissions for this session
  const { data: submissions, error: subErr } = await db
    .from("submissions")
    .select("*")
    .eq("session_id", session.id);

  if (subErr) {
    return NextResponse.json({ error: subErr.message }, { status: 500 });
  }

  const subs = (submissions ?? []) as Submission[];

  // Build per-question results
  const questionKeys = ["mood", "workload", "learning", "vibe"] as const;
  const question_results: QuestionResult[] = session.questions.map(
    (q: { id: string; label: string }) => {
      const key = q.id as (typeof questionKeys)[number];
      const scores = subs.map((s) => s[key] as EmojiScore);
      return {
        question: q,
        scores,
        median: medianScore(scores),
        distribution: scoreDistribution(scores),
      };
    }
  );

  // Public free-text responses only (chest_public gates both open answers)
  const public_texts = subs
    .filter((s) => s.chest_public && s.chest_text)
    .map((s) => s.chest_text as string);

  const public_improvements = subs
    .filter((s) => s.chest_public && s.improve_text)
    .map((s) => s.improve_text as string);

  const result: SessionResults = {
    session,
    question_results,
    public_texts,
    public_improvements,
    total_submissions: subs.length,
  };

  return NextResponse.json(result);
}
