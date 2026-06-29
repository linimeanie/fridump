import { createServiceClient } from "@/lib/supabase/server";
import { isSubmissionOpen } from "@/lib/utils";
import SubmitForm from "@/components/SubmitForm";

export const dynamic = "force-dynamic";

export default async function SubmitPage() {
  const db = createServiceClient();
  const { data: session } = await db
    .from("sessions")
    .select("id, week_label, is_active, closes_at, questions")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const open = session ? isSubmissionOpen(session.closes_at) : false;

  if (!session || !open) {
    return (
      <main className="flex items-center justify-center min-h-screen p-8">
        <div className="text-center space-y-4">
          <p className="text-5xl">🔒</p>
          <h1 className="text-2xl font-bold">Submissions are closed</h1>
          <p className="text-[var(--muted)]">
            {session
              ? "The window for this week has passed. See you next Friday!"
              : "No active session. Ask your organiser to start one."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center min-h-screen py-16 px-4">
      <div className="w-full max-w-xl space-y-10">
        <div className="text-center space-y-2">
          <p className="text-[var(--muted)] text-sm uppercase tracking-widest font-medium">
            Week {session.week_label}
          </p>
          <h1 className="text-4xl font-bold">How was your week?</h1>
          <p className="text-[var(--muted)]">
            Anonymous — your name is never stored.
          </p>
        </div>
        <SubmitForm session={session} />
      </div>
    </main>
  );
}
