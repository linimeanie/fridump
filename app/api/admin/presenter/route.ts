import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// POST /api/admin/presenter — randomly pick a presenter token and return the link
// In practice you'd pick from a list of team members; here we just return the token.
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createServiceClient();
  const { data: session } = await db
    .from("sessions")
    .select("presenter_token")
    .eq("is_active", true)
    .single();

  if (!session?.presenter_token) {
    return NextResponse.json({ error: "No active session" }, { status: 404 });
  }

  return NextResponse.json({ presenter_token: session.presenter_token });
}
