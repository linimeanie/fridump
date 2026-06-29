import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { buildSessionInsert } from "@/lib/utils";
import { DEFAULT_QUESTIONS, Question } from "@/lib/types";

// GET /api/session — returns the current active session (public info only)
export async function GET() {
  const db = createServiceClient();
  const { data, error } = await db
    .from("sessions")
    .select("id, week_label, is_active, closes_at, questions, presenter_token")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return NextResponse.json({ session: null });
  }
  return NextResponse.json({ session: data });
}

// POST /api/session — create a new session (admin only)
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const questions: Question[] = body.questions ?? DEFAULT_QUESTIONS;

  const db = createServiceClient();

  // Deactivate any existing active sessions
  await db.from("sessions").update({ is_active: false }).eq("is_active", true);

  const { data, error } = await db
    .from("sessions")
    .insert(buildSessionInsert(questions))
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ session: data }, { status: 201 });
}

// PATCH /api/session — update questions on the active session (admin only)
export async function PATCH(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { questions } = body as { questions?: Question[] };
  if (!questions || !Array.isArray(questions)) {
    return NextResponse.json({ error: "questions array required" }, { status: 400 });
  }

  const db = createServiceClient();
  const { data, error } = await db
    .from("sessions")
    .update({ questions })
    .eq("is_active", true)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ session: data });
}
