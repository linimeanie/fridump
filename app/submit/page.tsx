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
        <div className="text-center space-y-4 bg-surface-bright shadow-soft rounded-3xl px-10 py-12 max-w-sm">
          <p className="text-6xl">🔒</p>
          <h1 className="text-2xl font-extrabold text-ink">Submissions are closed</h1>
          <p className="text-muted font-medium">
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
        <div className="text-center space-y-3">
          <span className="inline-block rounded-full bg-primary-container px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-widest text-on-primary-container">
            {session.week_label}
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-ink">
            How was your week?
          </h1>
          <p className="text-muted font-medium">
            Anonymous — your name is never stored.
          </p>
        </div>
        <SubmitForm session={session} />
      </div>
    </main>
  );
}
