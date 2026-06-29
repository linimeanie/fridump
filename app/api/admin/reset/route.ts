import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// DELETE /api/admin/reset — wipe all submissions for the active session
export async function DELETE(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createServiceClient();

  const { data: session } = await db
    .from("sessions")
    .select("id")
    .eq("is_active", true)
    .single();

  if (!session) {
    return NextResponse.json({ error: "No active session" }, { status: 404 });
  }

  const { error } = await db
    .from("submissions")
    .delete()
    .eq("session_id", session.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
